/**
 * Babel Plugin for Module Resolution in Monorepo
 * 
 * This plugin helps resolve imports for monorepo packages by transforming
 * import paths at build time. It complements Metro's resolver by handling
 * edge cases and providing better error messages.
 * 
 * Usage: Add to your babel.config.js plugins list.
 */

const path = require('path');
const fs = require('fs');

// Get workspace root
const workspaceRoot = path.resolve(__dirname, '../../..');
const packagesDir = path.resolve(workspaceRoot, 'packages');

// Get all package names in the monorepo
const packageNames = fs.existsSync(packagesDir) 
  ? fs.readdirSync(packagesDir)
      .filter(dir => fs.statSync(path.join(packagesDir, dir)).isDirectory())
  : [];

// Map of package names to their main entry points
const packageEntryPoints = {};

// Initialize package entry points
packageNames.forEach(pkgName => {
  const pkgJsonPath = path.join(packagesDir, pkgName, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      packageEntryPoints[pkgName] = pkgJson.main || 'src/index.js';
    } catch (err) {
      console.warn(`Warning: Could not parse package.json for ${pkgName}: ${err.message}`);
    }
  }
});

/**
 * Babel plugin for resolving monorepo imports
 */
module.exports = function() {
  return {
    name: 'babel-plugin-monorepo-resolver',
    visitor: {
      ImportDeclaration(path, state) {
        resolveImport(path, state);
      },
      ExportNamedDeclaration(path, state) {
        if (path.node.source) {
          resolveImport(path, state);
        }
      },
      ExportAllDeclaration(path, state) {
        resolveImport(path, state);
      },
      CallExpression(path, state) {
        // Handle require() calls
        if (path.node.callee.name === 'require' && 
            path.node.arguments.length === 1 && 
            path.node.arguments[0].type === 'StringLiteral') {
          const sourceValue = path.node.arguments[0].value;
          const resolved = resolveSourceValue(sourceValue, state);
          if (resolved && resolved !== sourceValue) {
            path.node.arguments[0].value = resolved;
          }
        }
      }
    }
  };
};

/**
 * Resolve an import/export declaration
 */
function resolveImport(path, state) {
  if (!path.node.source) return;
  
  const sourceValue = path.node.source.value;
  const resolved = resolveSourceValue(sourceValue, state);
  
  if (resolved && resolved !== sourceValue) {
    path.node.source.value = resolved;
  }
}

/**
 * Resolve a source value string
 */
function resolveSourceValue(sourceValue, state) {
  // Only process @speakbetter imports
  if (!sourceValue.startsWith('@speakbetter/')) return sourceValue;
  
  const [scope, pkgName, ...rest] = sourceValue.split('/');
  const fullPkgName = scope + '/' + pkgName;
  
  // Check if this is a known package
  if (!packageNames.includes(pkgName)) {
    // This is an unknown package, but we'll let Metro handle this
    return sourceValue;
  }
  
  // If there are additional path segments, leave it as-is
  // Metro will handle the resolution
  if (rest.length > 0) {
    return sourceValue;
  }
  
  // If this is a bare import of a package, map it to its main entry
  const mainEntry = packageEntryPoints[pkgName];
  if (mainEntry) {
    // Transform @speakbetter/package to @speakbetter/package/src/index.js
    // or whatever the main entry point is
    const transformedPath = `${fullPkgName}/${mainEntry}`;
    return transformedPath;
  }
  
  // If we couldn't find the main entry, leave it as-is
  return sourceValue;
}
