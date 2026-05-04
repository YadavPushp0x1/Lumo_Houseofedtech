/** @type {import('jest').Config} */
module.exports = {
  preset: 'detox',
  testMatch: ['**/*.e2e.js'],
  testTimeout: 120000,
  setupFilesAfterEnv: ['<rootDir>/init.js'],
};

