const request = require('supertest');
const nock = require('nock');
const app = require('../../app');
const {
  mockSharhResponse,
  mockNotFoundResponse,
  mockMalformedSharhResponse
} = require('../fixtures/mockResponses');

describe('Sharh Search API Integration Tests', () => {
  describe('Input Validation', () => {
    test('should return 400 when sharh ID is invalid', async () => {
      const response = await request(app)
        .get('/v1/site/sharh/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Invalid sharh ID format');
    });

    test('should return 400 when search text is too short', async () => {
      const response = await request(app)
        .get('/v1/site/sharh/text/ab');

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('between 3 and 500 characters');
    });

    test('should return 400 when search text is too long', async () => {
      const longText = 'a'.repeat(501);
      const response = await request(app)
        .get(`/v1/site/sharh/text/${longText}`);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('between 3 and 500 characters');
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 from dorar.net gracefully', async () => {
      nock('https://www.dorar.net')
        .get('/hadith/sharh/123')
        .reply(404, mockNotFoundResponse);

      const response = await request(app)
        .get('/v1/site/sharh/123');

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Sharh not found');
    });

    test('should return 404 when no sharh found for text search', async () => {
      nock('https://www.dorar.net')
        .get('/hadith/search')
        .query(true)
        .reply(200, `
          <div id="home">
            <div class="border-bottom">
              <!-- No xplain attribute -->
            </div>
          </div>
        `);

      const response = await request(app)
        .get('/v1/site/sharh/text/validtext');

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('No sharh found for the given text');
    });

    test('should handle network timeouts', async () => {
      nock('https://www.dorar.net')
        .get('/hadith/sharh/123')
        .delayConnection(16000) // Longer than our 15s timeout
        .reply(200, mockSharhResponse);

      const response = await request(app)
        .get('/v1/site/sharh/123');

      expect(response.status).toBe(408);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('timeout');
    });

    test('should handle malformed responses', async () => {
      nock('https://www.dorar.net')
        .get('/hadith/sharh/123')
        .reply(200, mockMalformedSharhResponse);

      const response = await request(app)
        .get('/v1/site/sharh/123');

      expect(response.status).toBe(502);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Invalid response structure');
    });
  });

  describe('Successful Requests', () => {
    test('should return properly formatted sharh by ID', async () => {
      nock('https://www.dorar.net')
        .get('/hadith/sharh/123')
        .reply(200, mockSharhResponse);

      const response = await request(app)
        .get('/v1/site/sharh/123');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('hadith');
      expect(response.body.data).toHaveProperty('rawi');
      expect(response.body.data).toHaveProperty('mohdith');
      expect(response.body.data).toHaveProperty('book');
      expect(response.body.data.sharhMetadata).toHaveProperty('sharh');
      expect(response.body.data.sharhMetadata).toHaveProperty('isContainSharh', true);
    });

    test('should return properly formatted sharh by text search', async () => {
      // Mock the initial search
      nock('https://www.dorar.net')
        .get('/hadith/search')
        .query(true)
        .reply(200, `
          <div id="home">
            <div class="border-bottom">
              <a xplain="123"></a>
            </div>
          </div>
        `);

      // Mock the sharh fetch
      nock('https://www.dorar.net')
        .get('/hadith/sharh/123')
        .reply(200, mockSharhResponse);

      const response = await request(app)
        .get('/v1/site/sharh/text/validtext');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('hadith');
      expect(response.body.data.sharhMetadata).toHaveProperty('sharh');
    });

    test('should return empty array for search with no results', async () => {
      nock('https://www.dorar.net')
        .get('/hadith/search')
        .query(true)
        .reply(200, `
          <div id="home">
            <div class="border-bottom">
              <!-- No xplain attribute -->
            </div>
          </div>
        `);

      const response = await request(app)
        .get('/v1/site/sharh/search')
        .query({ value: 'test' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual([]);
      expect(response.body.metadata.length).toBe(0);
    });

    test('should handle search with specialist mode', async () => {
      nock('https://www.dorar.net')
        .get('/hadith/search')
        .query(q => q.all !== undefined)
        .reply(200, `
          <div id="specialist">
            <div class="border-bottom">
              <a xplain="123"></a>
            </div>
          </div>
        `);

      nock('https://www.dorar.net')
        .get('/hadith/sharh/123')
        .reply(200, mockSharhResponse);

      const response = await request(app)
        .get('/v1/site/sharh/search')
        .query({ value: 'test', specialist: 'true' });

      expect(response.status).toBe(200);
      expect(response.body.metadata.specialist).toBe(true);
    });
  });

  describe('Caching', () => {
    test('should return cached results on subsequent requests', async () => {
      // First request
      nock('https://www.dorar.net')
        .get('/hadith/sharh/123')
        .reply(200, mockSharhResponse);

      await request(app)
        .get('/v1/site/sharh/123');

      // Second request - should use cache
      const response = await request(app)
        .get('/v1/site/sharh/123');

      expect(response.status).toBe(200);
      expect(response.body.metadata.isCached).toBe(true);
    });
  });
});
