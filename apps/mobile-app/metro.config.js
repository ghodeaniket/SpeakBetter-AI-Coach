// Enhanced metro.config.js for monorepo
const { getDefaultConfig } = require('@react-native/metro-config');
const path = require('path');
const fs = require('fs');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const os = require('os');

// Root directories
const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

// Find all package directories
const packagesDir = path.resolve(workspaceRoot, 'packages');
const packages = fs.readdirSync(packagesDir)
  .filter(dir => fs.statSync(path.join(packagesDir, dir)).isDirectory());

console.log('Found packages:', packages);

// Create watchFolders for all packages
const watchFolders = packages.map(pkg => path.join(packagesDir, pkg));

// Create extraNodeModules mapping for all packages
const extraNodeModules = packages.reduce((acc, pkg) => {
  acc[`@speakbetter/${pkg}`] = path.join(packagesDir, pkg);
  return acc;
}, {
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
});

// Get the default Metro configuration
const config = getDefaultConfig(projectRoot);

// Configure blacklisted paths
const blockList = exclusionList([
  // Exclude all node_modules from packages except the ones we need
  ...packages.map(pkg => 
    new RegExp(`${path.join(packagesDir, pkg, 'node_modules')}/(?!(react|react-native|@react|@babel)/).*`)
  ),
  // Exclude all Pods from watchFolders
  /.*\/ios\/Pods\/.*/,
  // Exclude any potential test directories that could cause issues
  /.*\/__tests__\/.*/,
  /.*\/__fixtures__\/.*/,
  /.*\/\.[a-z]+\/.*/,  // hidden directories like .git
]);

// Support for alternative entry files (testing)
const defaultSourceExts = config.resolver.sourceExts || ['js', 'jsx', 'ts', 'tsx', 'json'];
const sourceExts = process.env.ENTRY_FILE === 'index.test.js'
  ? ['test.tsx', 'test.ts', ...defaultSourceExts]
  : defaultSourceExts;

// Configure Metro
module.exports = {
  ...config,
  projectRoot,
  watchFolders: [workspaceRoot, ...watchFolders],
  transformer: {
    ...config.transformer,
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    // Add any additional transformer options here if needed
  },
  resolver: {
    ...config.resolver,
    blockList,
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    extraNodeModules,
    sourceExts,
    // Enable symlinks for monorepo (React Native 0.71+)
    enableSymlinks: true,
    // Ensure we can resolve asset files properly
    assetExts: [...(config.resolver.assetExts || []), 'pem', 'xcconfig'],
  },
  // Add cache configuration for better performance
  cacheStores: [
    new (require('metro-cache').FileStore)({
      root: path.join(os.tmpdir(), 'metro-cache'),
    }),
  ],
  // Add performance logging for debugging
  reporter: {
    ...config.reporter,
    update: (event) => {
      if (event.type === 'bundle_build_done') {
        console.log(`Bundle built in ${event.buildTime}ms`);
      }
    },
  },
};