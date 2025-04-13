/** @type {import('jest').Config} */
const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  displayName: 'mobile',
  rootDir: './',
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-*|@react-navigation)/)',
  ],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
  },
};