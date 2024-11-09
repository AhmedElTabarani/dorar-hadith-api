const request = require('supertest');
const nock = require('nock');
const app = require('../../app');
const {
  mockHadithSearchResponse,
  mockNotFoundResponse,
  mockMalformedHadithResponse
} = require('../fixtures/mockResponses');

describe('Hadith Search API Integration Tests', () => {
  describe('Input Validation', () => {
    test('should return 400 when page is invalid', async () => {
      const response = await request(app)
        .get('/v1/api/hadith/search')
        .query({ page: -1 });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Page must be a positive integer');
    });

    test('should return 400 when search value is too long', async () => {
      const longValue = 'a'.repeat(501);
      const response = await request(app)
        .get('/v1/api/hadith/search')
        .query({ value: longValue });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Search value is too long');
    });

    test('should return 400 for invalid removehtml parameter', async () => {
      const response = await request(app)
        .get('/v1/api/hadith/search')
        .query({ removehtml: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('removehtml must be true or false');
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 from dorar.net gracefully', async () => {
      nock('https://dorar.net')
        .get('/dorar_api.json')
        .query(true)
        .reply(404, mockNotFoundResponse);

      const response = await request(app)
        .get('/v1/api/hadith/search')
        .query({ value: 'test' });

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('not found');
    });

    test('should handle network timeouts', async () => {
      nock('https://dorar.net')
        .get('/dorar_api.json')
        .query(true)
        .delayConnection(16000) // Longer than our 15s timeout
        .reply(200, mockHadithSearchResponse);

      const response = await request(app)
        .get('/v1/api/hadith/search')
        .query({ value: 'test' });

      expect(response.status).toBe(408);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('timeout');
    });

    test('should handle malformed responses', async () => {
      nock('https://dorar.net')
        .get('/dorar_api.json')
        .query(true)
        .reply(200, mockMalformedHadithResponse);

      const response = await request(app)
        .get('/v1/api/hadith/search')
        .query({ value: 'test' });

      expect(response.status).toBe(502);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Invalid response from Dorar API');
    });
  });

  describe('Successful Requests', () => {
    test('should return properly formatted response', async () => {
      nock('https://dorar.net')
        .get('/dorar_api.json')
        .query(true)
        .reply(200, mockHadithSearchResponse);

      const response = await request(app)
        .get('/v1/api/hadith/search')
        .query({ value: 'test' });

      expect(response.status).toBe(200);
      expect(response.body).toBeValidHadithResponse();
      expect(response.body.data[0]).toHaveProperty('hadith');
      expect(response.body.data[0]).toHaveProperty('rawi');
      expect(response.body.data[0]).toHaveProperty('mohdith');
      expect(response.body.data[0]).toHaveProperty('book');
      expect(response.body.data[0]).toHaveProperty('numberOrPage');
      expect(response.body.data[0]).toHaveProperty('grade');
    });

    test('should respect removeHTML parameter', async () => {
      nock('https://dorar.net')
        .get('/dorar_api.json')
        .query(true)
        .reply(200, mockHadithSearchResponse);

      const response = await request(app)
        .get('/v1/api/hadith/search')
        .query({ value: 'test', removehtml: 'false' });

      expect(response.status).toBe(200);
      expect(response.body.data[0].hadith).toContain('حديث صحيح');
      expect(response.body.metadata.removeHTML).toBe(false);
    });

    test('should handle pagination correctly', async () => {
      nock('https://dorar.net')
        .get('/dorar_api.json')
        .query(true)
        .reply(200, mockHadithSearchResponse);

      const response = await request(app)
        .get('/v1/api/hadith/search')
        .query({ value: 'test', page: 2 });

      expect(response.status).toBe(200);
      expect(response.body.metadata.page).toBe(2);
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits', async () => {
      // Make more requests than allowed by rate limit
      const requests = Array(101).fill().map(() => 
        request(app)
          .get('/v1/api/hadith/search')
          .query({ value: 'test' })
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      expect(rateLimitedResponses[0].body.message).toContain('Rate limit exceeded');
    });
  });
});
