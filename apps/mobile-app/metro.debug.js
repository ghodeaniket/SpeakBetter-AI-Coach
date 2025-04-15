/**
 * Metro Debug Configuration
 * 
 * This configuration extends the regular metro config with additional debugging features.
 * To use: METRO_CONFIG=metro.debug.js npx react-native start
 */

const baseConfig = require('./metro.config');
const path = require('path');

// Enhanced for debugging
module.exports = {
  ...baseConfig,
  // Enable detailed logging for module resolution
  resolver: {
    ...baseConfig.resolver,
    sourceExts: [...baseConfig.resolver.sourceExts],
    resolveRequest: (context, moduleName, platform) => {
      // Log module resolution attempt (uncomment when needed)
      // console.log(`[Metro Debug] Resolving: ${moduleName} for platform ${platform || 'unknown'}`);
      
      // Use the default resolver
      return context.resolveRequest(context, moduleName, platform);
    }
  },
  // Enhanced transformer for detailed logs
  transformer: {
    ...baseConfig.transformer,
    // Log transform operations (uncomment when needed)
    // transform: ({ filename, src, options }) => {
    //   console.log(`[Metro Debug] Transforming: ${filename}`);
    //   return baseConfig.transformer.transform({ filename, src, options });
    // }
  },
  // Enhanced reporter for more detailed logs
  reporter: {
    update: (event) => {
      if (event.type === 'bundle_build_done') {
        console.log(`[Metro Debug] Bundle built in ${event.buildTime}ms`);
      } else if (event.type === 'bundle_build_failed') {
        console.error('[Metro Debug] Bundle build failed:', event.error);
      } else if (event.type === 'dep_graph_loaded') {
        console.log(`[Metro Debug] Dependency graph loaded in ${event.buildTime}ms`);
      } else if (event.type === 'global_cache_error') {
        console.error('[Metro Debug] Global cache error:', event.error);
      } else if (event.type === 'global_cache_disabled') {
        console.warn('[Metro Debug] Global cache disabled:', event.reason);
      }
    }
  },
  // Additional serializer options for full sourcemaps
  serializer: {
    ...baseConfig.serializer,
    sourceMapUrl: 'index.map',
    sourcemapUseAbsolutePath: true,
  },
};
