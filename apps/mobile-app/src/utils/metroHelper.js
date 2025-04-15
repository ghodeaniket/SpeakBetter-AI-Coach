/**
 * Metro Resolver Helper
 * 
 * This utility helps diagnose module resolution issues in the Metro bundler.
 * It can be imported in development mode to log module resolution information.
 */

// Debug flag - set to true to enable debugging
const DEBUG = false;

/**
 * Log module resolution information
 * @param {string} moduleName - The name of the module being imported
 * @param {string} importingFile - The file importing the module
 */
export const logModuleResolution = (moduleName, importingFile) => {
  if (!DEBUG) return;
  
  console.log(`[Metro] Resolving module: ${moduleName}`);
  console.log(`[Metro] Imported from: ${importingFile}`);
  
  try {
    // Try to resolve the module using Node's require.resolve
    const resolved = require.resolve(moduleName, { paths: [importingFile] });
    console.log(`[Metro] Resolved to: ${resolved}`);
  } catch (error) {
    console.error(`[Metro] Failed to resolve: ${moduleName}`);
    console.error(error.message);
  }
};

/**
 * Verify that a module can be imported
 * @param {string} moduleName - The name of the module to verify
 * @returns {boolean} - Whether the module can be imported
 */
export const verifyModule = (moduleName) => {
  try {
    require(moduleName);
    return true;
  } catch (error) {
    if (DEBUG) {
      console.error(`[Metro] Module verification failed for: ${moduleName}`);
      console.error(error.message);
    }
    return false;
  }
};

/**
 * Get the package.json of a module
 * @param {string} moduleName - The name of the module
 * @returns {Object|null} - The package.json contents or null if not found
 */
export const getModulePackageJson = (moduleName) => {
  try {
    return require(`${moduleName}/package.json`);
  } catch (error) {
    if (DEBUG) {
      console.error(`[Metro] Failed to get package.json for: ${moduleName}`);
    }
    return null;
  }
};

export default {
  logModuleResolution,
  verifyModule,
  getModulePackageJson,
};