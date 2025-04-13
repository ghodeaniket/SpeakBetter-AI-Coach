const { getDefaultConfig } = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// Let Metro know about the packages in the monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Allow importing from external monorepo packages
config.resolver.extraNodeModules = {
  '@speakbetter/core': path.resolve(workspaceRoot, 'packages/core'),
  '@speakbetter/ui': path.resolve(workspaceRoot, 'packages/ui'),
  '@speakbetter/api': path.resolve(workspaceRoot, 'packages/api'),
};

module.exports = config;
