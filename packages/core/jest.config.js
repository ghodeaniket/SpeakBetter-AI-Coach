/** @type {import('jest').Config} */
const baseConfig = require('../../jest.config.base');

const config = {
  ...baseConfig,
  displayName: 'core',
  rootDir: './',
};

module.exports = config;
