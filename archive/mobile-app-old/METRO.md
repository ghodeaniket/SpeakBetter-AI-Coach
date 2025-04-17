# Metro Bundler Configuration for SpeakBetter

This document explains the Metro bundler configuration used in the SpeakBetter mobile app, part of our monorepo structure.

## Overview

Metro is React Native's JavaScript bundler. In a monorepo structure, it requires special configuration to properly resolve dependencies across packages. Our configuration handles:

- Module resolution across all packages
- Preventing duplicate React and React Native instances
- Optimizing build performance
- Supporting development and testing workflows

## Configuration Files

- `metro.config.js` - Main configuration used for normal development
- `metro.debug.js` - Enhanced configuration with debugging features

## Key Features

### 1. Monorepo Package Resolution

The configuration automatically detects all packages in the `/packages` directory and sets up proper module resolution:

```javascript
// Dynamic package detection
const packages = fs
  .readdirSync(packagesDir)
  .filter((dir) => fs.statSync(path.join(packagesDir, dir)).isDirectory());

// Create watchFolders for all packages
const watchFolders = packages.map((pkg) => path.join(packagesDir, pkg));
```

### 2. Exclusion Lists

We exclude unnecessary files to optimize performance:

```javascript
const blockList = exclusionList([
  // Exclude all node_modules from packages except the ones we need
  ...packages.map(
    (pkg) =>
      new RegExp(
        `${path.join(packagesDir, pkg, "node_modules")}/(?!(react|react-native|@react|@babel)/).*`,
      ),
  ),
  // Exclude all Pods from watchFolders
  /.*\/ios\/Pods\/.*/,
  // Exclude test directories
  /.*\/__tests__\/.*/,
]);
```

### 3. Alternative Entry Files

We support different entry files for testing:

```javascript
const sourceExts =
  process.env.ENTRY_FILE === "index.test.js"
    ? ["test.tsx", "test.ts", ...defaultSourceExts]
    : defaultSourceExts;
```

## Useful Commands

Use these npm scripts to manage Metro:

- `npm run start` - Start Metro normally
- `npm run start:reset` - Start Metro with cache reset
- `npm run metro:reset` - Clear Metro cache
- `npm run metro:diagnostic` - Show Metro configuration details
- `npm run metro:inspect` - Inspect the resolved Metro configuration

For debugging:

```bash
# Use the debug configuration
METRO_CONFIG=metro.debug.js npx react-native start
```

## Troubleshooting

### Common Issues

1. **Module not found errors**

   Check that the package is properly listed in extraNodeModules:

   ```javascript
   console.log(extraNodeModules); // Should include your package
   ```

2. **Duplicate React/React Native errors**

   Ensure metro is resolving to a single instance:

   ```javascript
   // Should point to apps/mobile-app/node_modules/react
   console.log(extraNodeModules.react);
   ```

3. **Slow builds**

   Check watchFolders and blockList to ensure Metro isn't watching unnecessary files.

### Diagnostic Tools

Use the `metroHelper.js` utility to diagnose module resolution issues:

```javascript
import { logModuleResolution } from "./utils/metroHelper";

// In your component
logModuleResolution("@speakbetter/core", __filename);
```

### Resetting Cache

When you make changes to the Metro configuration, always reset the cache:

```bash
npm run metro:reset
```

## Advanced Configuration

For more advanced configuration needs, refer to:

- [Metro Documentation](https://facebook.github.io/metro/docs/configuration)
- [React Native Monorepo Guide](https://medium.com/zur-en/react-native-monorepo-native-dependencies-with-react-native-module-linking-18850e840a26)
