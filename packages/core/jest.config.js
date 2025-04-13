/** @type {import('jest').Config} */
import baseConfig from '../../jest.config.base.js';

const config = {
  ...baseConfig,
  displayName: 'core',
  rootDir: './',
};

export default config;
