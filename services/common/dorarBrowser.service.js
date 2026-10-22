const AppError = require('../../utils/AppError');
const config = require('../../config/config');

let executablePromise;
let sharedBrowser;
let poolOperation = Promise.resolve();
let sharedUses = 0;
let activeSharedPages = 0;
let occupiedSlots = 0;
const waiting = [];

const killBrowser = (browser) => {
  try {
    browser.process()?.kill('SIGKILL');
  } catch {}
};

const closeBrowser = async (browser, target = browser) => {
  let timer;
  try {
    await Promise.race([
      target.close().catch(() => killBrowser(browser)),
      new Promise((resolve) => {
        timer = setTimeout(() => {
          killBrowser(browser);
          resolve();
        }, 2000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

// Best-effort resident memory of the browser process, used to recycle
// long-lived instances before they grow without bound.
const browserRssMB = (browser) => {
  try {
    const pid = browser.process().pid;
    const status = require('node:fs').readFileSync(
      `/proc/${pid}/status`,
      'utf8',
    );
    return Number(status.match(/VmRSS:\s+(\d+)/)?.[1] || 0) / 1024;
  } catch {
    return 0;
  }
};

const releaseSlot = () => {
  occupiedSlots--;
  const next = waiting.shift();
  if (next) {
    clearTimeout(next.timer);
    occupiedSlots++;
    next.resolve(releaseSlot);
  }
};

const acquireSlot = (timeout) => {
  if (timeout <= 0)
    return Promise.reject(
      new AppError(
        'Chromium request timeout. Please try again later.',
        408,
      ),
    );
  if (occupiedSlots < 2) {
    occupiedSlots++;
    return Promise.resolve(releaseSlot);
  }
  return new Promise((resolve, reject) => {
    const entry = { resolve };
    entry.timer = setTimeout(() => {
      waiting.splice(waiting.indexOf(entry), 1);
      reject(
        new AppError(
          'Chromium request timeout. Please try again later.',
          408,
        ),
      );
    }, timeout);
    waiting.push(entry);
  });
};

const getSharedBrowser = (launch) => {
  const operation = poolOperation.then(async () => {
    if (sharedBrowser) {
      const existing = await sharedBrowser;
      let healthy = existing.connected;
      if (healthy) {
        let timer;
        try {
          await Promise.race([
            existing.version(),
            new Promise((resolve, reject) => {
              timer = setTimeout(
                () => reject(new Error('Browser stopped responding')),
                2000,
              );
            }),
          ]);
        } catch {
          healthy = false;
          killBrowser(existing);
        } finally {
          clearTimeout(timer);
        }
      }
      if (
        !healthy ||
        (!activeSharedPages &&
          (sharedUses >= 10 || browserRssMB(existing) >= 256))
      ) {
        sharedBrowser = undefined;
        if (healthy) await closeBrowser(existing);
      }
    }
    if (!sharedBrowser) {
      sharedUses = 0;
      sharedBrowser = launch().catch((error) => {
        sharedBrowser = undefined;
        throw error;
      });
    }
    const browser = await sharedBrowser;
    sharedUses++;
    activeSharedPages++;
    return browser;
  });
  poolOperation = operation.catch(() => {});
  return operation;
};

const fetchInBrowser = async (url, options = {}) => {
  const target = new URL(url);
  if (
    target.protocol !== 'https:' ||
    !['dorar.net', 'www.dorar.net'].includes(target.hostname)
  ) {
    throw new AppError('Invalid Dorar browser URL', 502);
  }

  const started = Date.now();
  let browser;
  let page;
  let closing;
  let timedOut = false;
  const reuse = (config.browserStrategy || 'reuse') === 'reuse';
  let release;
  const close = () => {
    if (reuse && !page) return Promise.resolve();
    return (closing ||= closeBrowser(
      browser,
      reuse ? page : browser,
    ));
  };

  const timeoutError = () =>
    new AppError(
      'Chromium request timeout. Please try again later.',
      408,
    );
  let timer;
  const deadline = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      if (browser && reuse && !page) killBrowser(browser);
      reject(timeoutError());
    }, config.browserFetchTimeout);
  });
  const wait = (operation, disposeLate) =>
    Promise.race([
      Promise.resolve(operation).then(async (value) => {
        if (timedOut) {
          if (disposeLate) await disposeLate(value);
          throw timeoutError();
        }
        return value;
      }),
      deadline,
    ]);

  try {
    if (reuse)
      release = await wait(
        acquireSlot(
          config.browserFetchTimeout - (Date.now() - started),
        ),
        (releaseLate) => releaseLate(),
      );
    const [puppeteer, { default: chromium }] = await wait(
      Promise.all([
        import('puppeteer-core'),
        import('@sparticuz/chromium'),
      ]),
    );
    const remaining = () => {
      const time =
        config.browserFetchTimeout - (Date.now() - started);
      if (time <= 0)
        throw new puppeteer.TimeoutError(
          'Chromium request exceeded BROWSER_FETCH_TIMEOUT',
        );
      return time;
    };
    if (!config.chromiumExecutablePath && !executablePromise) {
      executablePromise = chromium.executablePath().catch((error) => {
        executablePromise = undefined;
        throw error;
      });
    }
    const executablePath =
      config.chromiumExecutablePath ||
      (await wait(executablePromise));
    const args = config.chromiumExecutablePath
      ? ['--no-sandbox', '--disable-dev-shm-usage']
      : chromium.args;
    const proxy = config.dorarProxyUrl
      ? new URL(config.dorarProxyUrl)
      : undefined;

    const launch = () =>
      wait(
        puppeteer.launch({
          executablePath,
          headless: config.chromiumExecutablePath ? true : 'shell',
          args: [
            ...args,
            '--disable-blink-features=AutomationControlled',
            ...(proxy ? [`--proxy-server=${proxy.origin}`] : []),
          ],
          ignoreDefaultArgs: ['--enable-automation'],
          timeout: remaining(),
          protocolTimeout: config.browserFetchTimeout,
        }),
        (lateBrowser) => closeBrowser(lateBrowser),
      );

    browser = reuse
      ? await wait(getSharedBrowser(launch), () => {
          activeSharedPages--;
        })
      : await launch();

    page = await wait(browser.newPage(), (latePage) =>
      closeBrowser(browser, latePage),
    );
    remaining();
    await wait(
      page.setUserAgent(
        (await wait(browser.userAgent())).replace(
          'HeadlessChrome',
          'Chrome',
        ),
      ),
    );
    if (proxy?.username || proxy?.password) {
      await wait(
        page.authenticate({
          username: decodeURIComponent(proxy.username),
          password: decodeURIComponent(proxy.password),
        }),
      );
    }
    if (options.headers) {
      await wait(
        page.setExtraHTTPHeaders(
          Object.fromEntries(new Headers(options.headers)),
        ),
      );
    }
    // The API parses hadith content already present in the HTML, so
    // only the main document and its redirects are loaded. Scripts,
    // styles, images, and frames are skipped.
    await wait(page.setRequestInterception(true));
    page.on('request', (request) => {
      const navigation =
        request.isNavigationRequest() &&
        request.frame() === page.mainFrame();
      return (
        navigation ? request.continue() : request.abort()
      ).catch(() => {});
    });
    const response = await wait(
      page.goto(target.href, {
        waitUntil: 'domcontentloaded',
        timeout: remaining(),
      }),
    );
    const body = await wait(response.buffer());
    const headers = new Headers();
    for (const [name, value] of Object.entries(response.headers())) {
      if (
        ['set-cookie', 'content-encoding', 'content-length'].includes(
          name,
        )
      )
        continue;
      headers.set(name, value.replace(/[\r\n]+/g, ', '));
    }
    return new Response(
      [204, 205, 304].includes(response.status()) ? null : body,
      {
        status: response.status(),
        statusText: response.statusText(),
        headers,
      },
    );
  } catch (error) {
    if (
      timedOut ||
      error.name === 'TimeoutError' ||
      error.statusCode === 408
    ) {
      throw new AppError(
        'Chromium request timeout. Please try again later.',
        408,
      );
    }
    throw new AppError(
      'Unable to fetch Dorar with Chromium. Check CHROMIUM_EXECUTABLE_PATH and browser dependencies.',
      502,
    );
  } finally {
    clearTimeout(timer);
    if (browser) await close().catch(() => {});
    if (reuse && browser) activeSharedPages--;
    if (release) release();
  }
};

const closeSharedBrowser = async () => {
  await poolOperation;
  const pending = sharedBrowser;
  sharedBrowser = undefined;
  if (pending) await closeBrowser(await pending);
};

module.exports = { fetchInBrowser, closeSharedBrowser };
