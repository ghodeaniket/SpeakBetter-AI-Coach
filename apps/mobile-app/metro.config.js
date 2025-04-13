const { getDefaultConfig } = require('@react-native/metro-config');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  '@speakbetter/mobile': path.resolve(workspaceRoot, 'packages/mobile'),
  '@speakbetter/core': path.resolve(workspaceRoot, 'packages/core'),
  '@speakbetter/api': path.resolve(workspaceRoot, 'packages/api'),
  '@speakbetter/ui': path.resolve(workspaceRoot, 'packages/ui'),
  '@speakbetter/state': path.resolve(workspaceRoot, 'packages/state')
};

// 3. Define custom transformer for shared packages
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;