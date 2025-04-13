import baseConfig from '../../jest.config.base.js';

export default {
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