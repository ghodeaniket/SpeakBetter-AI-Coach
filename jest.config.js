/** @type {import('jest').Config} */
module.exports = {
  projects: ['<rootDir>/packages/*/jest.config.js'],
  collectCoverageFrom: [
    '<rootDir>/packages/*/src/**/*.{ts,tsx}',
    '!<rootDir>/packages/*/src/**/*.d.ts',
    '!<rootDir>/packages/*/src/**/*.stories.{ts,tsx}',
    '!<rootDir>/packages/*/src/mocks/**',
  ],
  coverageDirectory: '<rootDir>/coverage/',
};