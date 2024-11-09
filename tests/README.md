# Testing Documentation

## Overview
This project uses Jest and Supertest for integration testing, focusing on testing the API endpoints, error handling, and input validation. The tests ensure that our error handling and validation changes work as expected.

## Current Status (Work in Progress)

### Recently Completed
- [x] Fixed integration tests for hadith and sharh endpoints
- [x] Improved error handling and messages
- [x] Added proper test configuration
- [x] Updated mock responses to match API structure
- [x] Fixed test environment setup

### Current Coverage Status
Current coverage shows several areas needing improvement:
- bookSearch.controller.js (30.76%)
- data.controller.js (42.3%)
- hadithSearch.controller.js (31.66%)
- mohdithSearch.controller.js (30.76%)
- sharhSearch.controller.js (86%)

### Pending Work
- [ ] Improve test coverage for bookSearch controller
- [ ] Improve test coverage for data controller
- [ ] Improve test coverage for hadithSearch controller
- [ ] Improve test coverage for mohdithSearch controller
- [ ] Add unit tests alongside integration tests
- [ ] Add performance tests
- [ ] Add load testing scenarios

## Test Structure

```
tests/
├── fixtures/          # Mock data and responses
├── integration/       # Integration tests
└── setup.js          # Test environment setup
```

## What's Being Tested

### Error Handling
- Input validation errors (400 responses)
- Network timeouts (408 responses)
- External service (dorar.net) errors (404, 502 responses)
- Malformed response handling (502 responses)
- Rate limiting (429 responses)

### Input Validation
- Parameter validation (e.g., page numbers, search values)
- Query string validation (e.g., removehtml, specialist parameters)
- Path parameter validation (e.g., sharh IDs)
- Invalid input handling with appropriate error messages

### Response Format
- Success responses (200 status)
- Error responses with appropriate status codes
- Metadata structure including pagination and cache info
- Cache behavior for subsequent requests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (during development)
npm run test:watch

# Run only integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

## Test Environment

- Tests run in Node.js environment
- Network requests to dorar.net are mocked using `nock`
- Each test runs in isolation with clean state
- Timeouts are set to 20 seconds
- Coverage reports are generated in the `coverage` directory (gitignored)

## Mock Data

Mock responses are stored in `tests/fixtures/mockResponses.js` and include:
- Successful hadith search responses (matching API structure)
- Successful sharh responses (with proper HTML structure)
- Error responses (404, 502, etc.)
- Malformed responses for error testing

## Adding New Tests

When adding new tests:
1. Use appropriate describe/test blocks for organization
2. Mock external requests using nock
3. Test both success and error cases
4. Verify response structure and status codes
5. Add new mock data if needed in fixtures
6. Ensure backward compatibility with API structure

## Best Practices

1. Each test should be independent
2. Clean up after each test
3. Use meaningful test descriptions
4. Test edge cases and error conditions
5. Keep mock data up to date with API changes
6. Maintain backward compatibility
7. Don't commit coverage reports (they're gitignored)

## Coverage Goals

The test suite aims to achieve:
- Minimum 80% coverage for all controllers
- 100% coverage of error handling code
- 100% coverage of input validation
- 100% coverage of response formatting

To view detailed coverage:
1. Run `npm run test:coverage`
2. Open `coverage/lcov-report/index.html` in a browser

## Debugging Tests

For detailed logging during tests:
1. Use `--verbose` flag: `npm test -- --verbose`
2. For specific tests: `npm test -- -t "test name"`
3. Debug mode: `node --inspect-brk node_modules/.bin/jest --runInBand`

## Contributing

When contributing new tests:
1. Check the "Current Status" section above for priority areas
2. Focus on controllers with low coverage first
3. Maintain backward compatibility with API structure
4. Update this README when adding significant changes
