/** @type {import('jest').Config} */
const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  displayName: 'state',
  rootDir: './',
};