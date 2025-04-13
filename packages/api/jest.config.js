import baseConfig from '../../jest.config.base.js';

/** @type {import('jest').Config} */
const config = {
  ...baseConfig,
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
    }],
  },
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
  },
};

export default config;