const nock = require('nock');

// Disable external network connections during tests
beforeAll(() => {
  nock.disableNetConnect();
  // Allow localhost connections for our API tests
  nock.enableNetConnect('127.0.0.1');
});

// Clean up after all tests
afterAll(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

// Clean up after each test
afterEach(() => {
  nock.cleanAll();
});

// Add custom jest matchers if needed
expect.extend({
  toBeValidHadithResponse(received) {
    const hasRequiredFields = received.status === 'success' && 
      Array.isArray(received.data) &&
      typeof received.metadata === 'object';

    return {
      message: () =>
        `expected response to be a valid hadith response`,
      pass: hasRequiredFields
    };
  }
});
