const { spawnSync } = require('node:child_process');
const path = require('node:path');

test('the app loads and dependencies work without synchronous ESM require support', () => {
  const result = spawnSync(
    process.execPath,
    [
      '--no-experimental-require-module',
      '-e',
      `
        const assert = require('node:assert/strict');
        assert.equal(typeof require('./app'), 'function');
        const { parseHTML } = require('linkedom');
        const { document } = parseHTML('<div class="result"><span>hadith</span></div>');
        assert.equal(document.querySelector('.result > span').textContent, 'hadith');
        Promise.all([import('puppeteer-core'), import('@sparticuz/chromium')])
          .then(([puppeteer, chromium]) => {
            assert.equal(typeof puppeteer.launch, 'function');
            assert.equal(typeof chromium.default.executablePath, 'function');
          })
          .catch(error => { console.error(error); process.exitCode = 1; });
      `,
    ],
    {
      cwd: path.resolve(__dirname, '../..'),
      env: {
        ...process.env,
        DORAR_PROXY_URL: '',
        DORAR_FETCH_MODE: 'auto',
      },
      encoding: 'utf8',
      timeout: 10000,
    },
  );
  expect(result.error).toBeUndefined();
  expect(result.stderr).toBe('');
  expect(result.status).toBe(0);
});
