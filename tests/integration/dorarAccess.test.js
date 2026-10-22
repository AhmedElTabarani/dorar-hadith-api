const http = require('node:http');
const https = require('node:https');
const net = require('node:net');
const tls = require('node:tls');
const fs = require('node:fs');
const path = require('node:path');
const request = require('supertest');

const html = `
  <a aria-controls="home">لغير المتخصص (39)</a>
  <a aria-controls="specialist">للمتخصص (125)</a>
  <div id="home"><div class="border-bottom">
    <article><h5>1 - إنما الأعمال بالنيات</h5></article>
    <div>
      <strong>الراوي : <span>عمر بن الخطاب</span></strong>
      <strong>المحدث : <a view-card="mhd" card-link="/hadith/mhd/256"><span>البخاري</span></a></strong>
      <strong>المصدر : <a view-card="book" card-link="/hadith/book-card/6216"><span>صحيح البخاري</span></a></strong>
      <strong>الصفحة أو الرقم : <span>1</span></strong>
      <strong>خلاصة حكم المحدث : <span>صحيح</span></strong>
      <a href="/hadith-category/cat/0557c2acef">نية - النية في العبادات</a>
      <a href="/h/test123?sims=1">أحاديث مشابهة</a>
      <a tag="test123" href="https://dorar.net/h/test123"></a>
    </div>
  </div></div>`;

const listen = (server) =>
  new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

describe('Dorar access through an outbound proxy', () => {
  let origin;
  let proxy;
  let fetchWithTimeout;
  let config;
  let app;
  let fetchSpy;
  const realFetch = global.fetch;
  const dispatchers = new Set();
  const tunnels = [];
  const originRequests = [];
  const previousProxy = process.env.DORAR_PROXY_URL;
  const previousMode = process.env.DORAR_FETCH_MODE;
  const previousCertificates = tls.getCACertificates('default');

  beforeAll(async () => {
    const cert = fs.readFileSync(
      path.join(__dirname, '../fixtures/dorar.invalid-cert.pem'),
      'utf8',
    );
    tls.setDefaultCACertificates([...previousCertificates, cert]);
    origin = https.createServer(
      {
        cert,
        key: fs.readFileSync(
          path.join(__dirname, '../fixtures/dorar.invalid-key.pem'),
        ),
      },
      (req, res) => {
        originRequests.push({ url: req.url, headers: req.headers });
        const query = new URL(req.url, 'https://dorar.invalid')
          .searchParams;
        if (
          req.url === '/forbidden' ||
          query.get('q') === 'blocked'
        ) {
          res.writeHead(403).end('Sorry, you have been blocked');
        } else if (req.url === '/missing') {
          res.writeHead(404).end('Not Found');
        } else if (req.url === '/hang') {
          return;
        } else if (req.url === '/disconnect') {
          req.socket.destroy();
        } else {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
        }
      },
    );
    await listen(origin);

    proxy = http.createServer();
    proxy.on('connect', (req, socket, head) => {
      tunnels.push({
        target: req.url,
        auth: req.headers['proxy-authorization'],
      });
      const upstream = net.connect(
        origin.address().port,
        '127.0.0.1',
        () => {
          socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
          upstream.write(head);
          socket.pipe(upstream);
          upstream.pipe(socket);
        },
      );
      socket.on('error', () => upstream.destroy());
      socket.on('close', () => upstream.destroy());
      upstream.on('error', () => socket.destroy());
    });
    await listen(proxy);
    process.env.DORAR_PROXY_URL = `http://proxy-user:proxy-password@127.0.0.1:${proxy.address().port}`;
    process.env.DORAR_FETCH_MODE = 'http';

    jest.resetModules();
    config = require('../../config/config');
    fetchWithTimeout = require('../../utils/fetchWithTimeout');
    app = require('../../app');
    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation((input, options) => {
        if (options.dispatcher) dispatchers.add(options.dispatcher);
        // The fake hostname forces resolution through the proxy. HTTPS and
        // certificate verification still use the production transport.
        const url = new URL(input);
        url.hostname = 'dorar.invalid';
        return realFetch(url, options);
      });
  });

  afterAll(async () => {
    fetchSpy?.mockRestore();
    if (previousProxy === undefined)
      delete process.env.DORAR_PROXY_URL;
    else process.env.DORAR_PROXY_URL = previousProxy;
    if (previousMode === undefined)
      delete process.env.DORAR_FETCH_MODE;
    else process.env.DORAR_FETCH_MODE = previousMode;
    await Promise.all(
      [...dispatchers].map((dispatcher) => dispatcher.destroy()),
    );
    tls.setDefaultCACertificates(previousCertificates);
    origin?.closeAllConnections();
    await Promise.all(
      [origin, proxy]
        .filter(Boolean)
        .map(
          (server) => new Promise((resolve) => server.close(resolve)),
        ),
    );
  });

  test('search returns the site response with its metadata through the proxy', async () => {
    const response = await request(app)
      .get('/v1/site/hadith/search')
      .query({ value: 'إنما الأعمال', page: 2 });

    expect(response.status).toBe(200);
    expect(response.body.metadata).toMatchObject({
      length: 1,
      page: 2,
      total: 39,
      totalPages: 2,
      hasNextPage: false,
      hasPrevPage: true,
      isCached: false,
    });
    expect(response.body.data[0]).toMatchObject({
      hadith: 'إنما الأعمال بالنيات',
      rawi: 'عمر بن الخطاب',
      mohdithId: '256',
      bookId: '6216',
      grade: 'صحيح',
      categories: [
        { id: '0557c2acef', name: 'نية - النية في العبادات' },
      ],
    });
    expect(tunnels[0]).toMatchObject({
      target: 'dorar.invalid:443',
      auth: `Basic ${Buffer.from('proxy-user:proxy-password').toString('base64')}`,
    });
    expect(
      new URL(
        originRequests[0].url,
        'http://dorar.invalid',
      ).searchParams.get('page'),
    ).toBe('2');
    expect(
      originRequests[0].headers['proxy-authorization'],
    ).toBeUndefined();
  });

  test('caller headers survive the default request headers', async () => {
    const response = await fetchWithTimeout(
      'https://dorar.net/headers',
      {
        headers: {
          Accept: 'text/html',
          'X-Request-ID': 'proxy-test',
        },
      },
    );
    await response.text();
    const headers = originRequests.at(-1).headers;
    expect(headers.accept).toBe('text/html');
    expect(headers['x-request-id']).toBe('proxy-test');
  });

  test('upstream blocking is a gateway failure rather than a client authorization failure', async () => {
    await expect(
      fetchWithTimeout('https://dorar.net/forbidden'),
    ).rejects.toMatchObject({
      statusCode: 502,
      message: expect.stringContaining('DORAR_PROXY_URL'),
    });
  });

  test('the API exposes a useful upstream error in production', async () => {
    const response = await request(app)
      .get('/v1/site/hadith/search')
      .query({ value: 'blocked' });
    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      status: 'error',
      message:
        'Dorar denied upstream access (HTTP 403). Configure DORAR_PROXY_URL with an authorized proxy or ask Dorar to allow this server.',
    });
  });

  test('missing upstream resources still return 404', async () => {
    await expect(
      fetchWithTimeout('https://dorar.net/missing'),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  test('connection failures return a gateway error without proxy credentials', async () => {
    await expect(
      fetchWithTimeout('https://dorar.net/disconnect'),
    ).rejects.toMatchObject({
      statusCode: 502,
      message:
        'Unable to reach Dorar. Check outbound access and DORAR_PROXY_URL.',
    });
  });

  test('a stalled proxy request respects FETCH_TIMEOUT', async () => {
    const previousTimeout = config.fetchTimeout;
    config.fetchTimeout = 100;
    try {
      await expect(
        fetchWithTimeout('https://dorar.net/hang'),
      ).rejects.toMatchObject({
        statusCode: 408,
      });
    } finally {
      config.fetchTimeout = previousTimeout;
    }
  });
});
