jest.mock('../../utils/fetchWithTimeout', () => jest.fn());
const fetchWithTimeout = require('../../utils/fetchWithTimeout');
const {
  fetchDocument,
} = require('../../services/common/dorarFetch.service');

test('simultaneous readers fetch and parse one document', async () => {
  let finish;
  fetchWithTimeout.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const requests = [0, 1, 2].map(() =>
    fetchDocument('https://dorar.net/h/shared'),
  );
  finish(new Response('<article>hadith text</article>'));
  const docs = await Promise.all(requests);
  expect(fetchWithTimeout).toHaveBeenCalledTimes(1);
  expect(docs[0]).toBe(docs[1]);
  expect(docs[2].querySelector('article').textContent).toBe(
    'hadith text',
  );
});

test('failed document requests can be retried', async () => {
  fetchWithTimeout.mockRejectedValueOnce(
    new Error('upstream failed'),
  );
  await expect(
    fetchDocument('https://dorar.net/h/retry'),
  ).rejects.toThrow('upstream failed');
  fetchWithTimeout.mockResolvedValueOnce(
    new Response('<article>recovered</article>'),
  );
  expect(
    (await fetchDocument('https://dorar.net/h/retry')).querySelector(
      'article',
    ).textContent,
  ).toBe('recovered');
});
