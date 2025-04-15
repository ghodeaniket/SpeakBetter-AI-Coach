#!/usr/bin/env node

/**
 * Reset Metro Cache Script
 * 
 * This script clears the Metro bundler cache to ensure clean rebuilds.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const rimraf = require('rimraf');

console.log('🧹 Cleaning Metro cache...');

// Clean temp directory
const tmpDir = path.join(os.tmpdir(), 'metro-cache');
if (fs.existsSync(tmpDir)) {
  console.log(`Removing ${tmpDir}...`);
  rimraf.sync(tmpDir);
}

// Clean Watchman cache if available
try {
  console.log('Cleaning Watchman watches...');
  execSync('watchman watch-del-all', { stdio: 'inherit' });
} catch (e) {
  console.log('Watchman not available, skipping watch-del-all');
}

// Clean React Native cache
try {
  console.log('Cleaning React Native cache...');
  
  // For RN >= 0.60
  const reactNativeCacheDir = path.join(os.homedir(), 'Library/Caches/com.facebook.ReactNativeBuild');
  if (fs.existsSync(reactNativeCacheDir)) {
    console.log(`Removing ${reactNativeCacheDir}...`);
    rimraf.sync(reactNativeCacheDir);
  }
  
  // For older RN versions
  const rnCliCacheDir = path.join(os.homedir(), '.rncache');
  if (fs.existsSync(rnCliCacheDir)) {
    console.log(`Removing ${rnCliCacheDir}...`);
    rimraf.sync(rnCliCacheDir);
  }
} catch (e) {
  console.error('Error cleaning React Native cache:', e);
}

// Clean Haste map
const hasteMapDir = path.join(__dirname, '../node_modules/.cache/metro');
if (fs.existsSync(hasteMapDir)) {
  console.log(`Removing ${hasteMapDir}...`);
  rimraf.sync(hasteMapDir);
}

// Clean babel cache
const babelCacheDir = path.join(__dirname, '../node_modules/.cache/babel-loader');
if (fs.existsSync(babelCacheDir)) {
  console.log(`Removing ${babelCacheDir}...`);
  rimraf.sync(babelCacheDir);
}

console.log('✅ Metro cache successfully cleared!');
console.log('');
console.log('Next steps:');
console.log('1. Kill any running Metro processes');
console.log('2. Restart Metro with: npx react-native start --reset-cache');
console.log('');
