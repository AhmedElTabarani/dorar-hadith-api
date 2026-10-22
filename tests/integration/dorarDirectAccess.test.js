const http = require('node:http');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const previousProxy = process.env.DORAR_PROXY_URL;
delete process.env.DORAR_PROXY_URL;
const fetchWithTimeout = require('../../utils/fetchWithTimeout');
if (previousProxy !== undefined) {
  process.env.DORAR_PROXY_URL = previousProxy;
}

test('direct access remains available without DORAR_PROXY_URL', async () => {
  const server = http.createServer((req, res) =>
    res.end('direct response'),
  );
  await new Promise((resolve) =>
    server.listen(0, '127.0.0.1', resolve),
  );
  try {
    const response = await fetchWithTimeout(
      `http://127.0.0.1:${server.address().port}/`,
    );
    expect(await response.text()).toBe('direct response');
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

test.each(['not-a-url', 'socks5://user:secret@proxy.example:1080'])(
  'rejects invalid proxy configuration without disclosing its value',
  (proxyUrl) => {
    const result = spawnSync(
      process.execPath,
      ['-e', 'require("./config/config")'],
      {
        cwd: path.resolve(__dirname, '../..'),
        env: { ...process.env, DORAR_PROXY_URL: proxyUrl },
        encoding: 'utf8',
      },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'DORAR_PROXY_URL must be a valid HTTP or HTTPS proxy URL',
    );
    expect(result.stderr).not.toContain(proxyUrl);
    expect(result.stderr).not.toContain('secret');
  },
);

test('invalid transport configuration fails at startup', () => {
  const result = spawnSync(
    process.execPath,
    ['-e', 'require("./config/config")'],
    {
      cwd: path.resolve(__dirname, '../..'),
      env: { ...process.env, DORAR_FETCH_MODE: 'invalid' },
      encoding: 'utf8',
    },
  );
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain(
    'DORAR_FETCH_MODE must be auto, http, or browser',
  );
});
