module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/fixtures/',
    '/tests/helpers/'
  ],
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 20000
};
