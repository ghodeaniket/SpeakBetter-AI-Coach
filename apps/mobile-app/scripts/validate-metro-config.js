/**
 * Metro Configuration Validation Script
 * 
 * This script validates the Metro configuration by:
 * 1. Checking if the configuration can be loaded without errors
 * 2. Validating key properties and settings
 * 3. Logging the configuration for inspection
 * 
 * Usage: node scripts/validate-metro-config.js
 */

const path = require('path');
const fs = require('fs');

console.log('\n=== Validating Metro Configuration ===\n');

// Path to the metro.config.js file
const metroConfigPath = path.resolve(__dirname, '../metro.config.js');

console.log(`Checking metro.config.js at: ${metroConfigPath}`);

if (!fs.existsSync(metroConfigPath)) {
  console.error('❌ metro.config.js not found!');
  process.exit(1);
}

console.log('✅ metro.config.js file exists');

try {
  console.log('Loading metro.config.js...');
  // Since the metro config is now an async function, we need to handle it differently
  const metroConfigModule = require(metroConfigPath);
  
  if (typeof metroConfigModule === 'function') {
    console.log('✅ metro.config.js exports a function (expected for async config)');
  } else if (typeof metroConfigModule.then === 'function') {
    console.log('✅ metro.config.js exports a Promise (expected for async config)');
  } else if (typeof metroConfigModule === 'object') {
    console.log('✅ metro.config.js exports an object (valid static config)');
  } else {
    console.error('❌ metro.config.js exports an unexpected type:', typeof metroConfigModule);
    process.exit(1);
  }
  
  // Try to resolve the config
  (async () => {
    try {
      const resolvedConfig = await metroConfigModule;
      
      console.log('\nValidating configuration properties:');
      
      // Check for required properties
      const requiredProps = ['projectRoot', 'watchFolders', 'transformer', 'resolver'];
      for (const prop of requiredProps) {
        if (resolvedConfig[prop]) {
          console.log(`✅ Has "${prop}" property`);
        } else {
          console.error(`❌ Missing "${prop}" property`);
        }
      }
      
      // Check resolver configuration
      if (resolvedConfig.resolver) {
        const resolverProps = ['extraNodeModules', 'sourceExts', 'nodeModulesPaths'];
        for (const prop of resolverProps) {
          if (resolvedConfig.resolver[prop]) {
            console.log(`✅ resolver has "${prop}" property`);
          } else {
            console.warn(`⚠️ resolver is missing "${prop}" property`);
          }
        }
        
        // Check if symlinks are enabled (recommended for monorepos)
        if (resolvedConfig.resolver.enableSymlinks === true) {
          console.log('✅ symlinks are enabled (good for monorepos)');
        } else {
          console.warn('⚠️ symlinks are not explicitly enabled');
        }
        
        // Check for blockList/blackList (depending on Metro version)
        const exclusionListProp = resolvedConfig.resolver.blockList ? 'blockList' : 
                                 resolvedConfig.resolver.blacklistRE ? 'blacklistRE' : null;
        
        if (exclusionListProp) {
          console.log(`✅ resolver has "${exclusionListProp}" for excluding files`);
        } else {
          console.warn('⚠️ resolver does not have exclusion list (blockList/blacklistRE)');
        }
      }
      
      // Print watch folders for inspection
      if (resolvedConfig.watchFolders && Array.isArray(resolvedConfig.watchFolders)) {
        console.log(`\nWatch folders (${resolvedConfig.watchFolders.length}):`);
        resolvedConfig.watchFolders.forEach((folder, i) => {
          console.log(`  ${i + 1}. ${folder}`);
        });
      }
      
      // Print extraNodeModules for inspection
      if (resolvedConfig.resolver && resolvedConfig.resolver.extraNodeModules) {
        console.log('\nExtra Node Modules:');
        Object.entries(resolvedConfig.resolver.extraNodeModules).forEach(([key, value]) => {
          console.log(`  ${key} -> ${value}`);
        });
      }
      
      console.log('\n✅ Metro configuration validated successfully!');
    } catch (error) {
      console.error('\n❌ Error resolving metro.config.js:', error);
      process.exit(1);
    }
  })();
} catch (error) {
  console.error('\n❌ Error loading metro.config.js:', error);
  process.exit(1);
}
