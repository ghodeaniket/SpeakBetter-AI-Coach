/**
 * Metro Bundler Diagnostics Script
 * 
 * This script helps diagnose module resolution issues in the Metro bundler.
 * It attempts to resolve key dependencies and logs their resolved paths.
 * 
 * Usage: node scripts/metro-diagnostics.js
 */

const path = require('path');
const fs = require('fs');

// Define key paths
const projectRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(projectRoot, '../..');
const packagesDir = path.resolve(workspaceRoot, 'packages');

console.log('\n=== Metro Bundler Diagnostics ===\n');

// Check if packages directory exists
console.log('Checking packages directory...');
if (fs.existsSync(packagesDir)) {
  console.log(`✅ Packages directory found at: ${packagesDir}`);
  
  // List all packages
  const packages = fs.readdirSync(packagesDir)
    .filter(dir => fs.statSync(path.join(packagesDir, dir)).isDirectory());
  
  console.log(`\nFound ${packages.length} packages: ${packages.join(', ')}`);
  
  // Check each package
  packages.forEach(pkg => {
    const pkgPath = path.join(packagesDir, pkg);
    const pkgJsonPath = path.join(pkgPath, 'package.json');
    
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        const entry = pkgJson.main || 'src/index.js';
        const entryPath = path.join(pkgPath, entry);
        
        console.log(`\n📦 Package: @speakbetter/${pkg}`);
        console.log(`   - Path: ${pkgPath}`);
        console.log(`   - Main: ${entry}`);
        console.log(`   - Entry exists: ${fs.existsSync(entryPath) ? '✅' : '❌'}`);
      } catch (err) {
        console.log(`\n❌ Error reading package.json for ${pkg}: ${err.message}`);
      }
    } else {
      console.log(`\n❌ No package.json found for ${pkg}`);
    }
  });
} else {
  console.log(`❌ Packages directory not found at: ${packagesDir}`);
}

// Check node_modules paths
console.log('\nChecking node_modules paths...');
const projectNodeModules = path.join(projectRoot, 'node_modules');
const workspaceNodeModules = path.join(workspaceRoot, 'node_modules');

console.log(`Project node_modules exists: ${fs.existsSync(projectNodeModules) ? '✅' : '❌'}`);
console.log(`Workspace node_modules exists: ${fs.existsSync(workspaceNodeModules) ? '✅' : '❌'}`);

// Check for key dependencies
const keyDependencies = [
  'react',
  'react-native',
  'react-native-config',
  'metro-config'
];

console.log('\nChecking key dependencies...');
keyDependencies.forEach(dep => {
  const projectDepPath = path.join(projectNodeModules, dep);
  const workspaceDepPath = path.join(workspaceNodeModules, dep);
  
  console.log(`\n🔍 Dependency: ${dep}`);
  console.log(`   - In project: ${fs.existsSync(projectDepPath) ? '✅' : '❌'}`);
  console.log(`   - In workspace: ${fs.existsSync(workspaceDepPath) ? '✅' : '❌'}`);
  
  if (fs.existsSync(projectDepPath) && fs.existsSync(workspaceDepPath)) {
    try {
      const projectPkg = JSON.parse(fs.readFileSync(path.join(projectDepPath, 'package.json'), 'utf8'));
      const workspacePkg = JSON.parse(fs.readFileSync(path.join(workspaceDepPath, 'package.json'), 'utf8'));
      
      if (projectPkg.version !== workspacePkg.version) {
        console.log(`   ⚠️ Version mismatch! Project: ${projectPkg.version}, Workspace: ${workspacePkg.version}`);
      } else {
        console.log(`   - Same version: ${projectPkg.version} ✅`);
      }
    } catch (err) {
      console.log(`   ❌ Error comparing versions: ${err.message}`);
    }
  }
});

// Try to resolve a few key imports as Metro would
console.log('\nAttempting to simulate Metro resolution for key imports...');

function resolveModule(request) {
  try {
    // This is a simplified version of what Metro does
    // In reality, Metro has a more complex resolution algorithm
    
    // First check if it's a workspace package
    if (request.startsWith('@speakbetter/')) {
      const pkgName = request.split('/')[1];
      const pkgPath = path.join(packagesDir, pkgName);
      
      if (fs.existsSync(pkgPath)) {
        const pkgJsonPath = path.join(pkgPath, 'package.json');
        if (fs.existsSync(pkgJsonPath)) {
          const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
          const entry = pkgJson.main || 'src/index.js';
          return path.join(pkgPath, entry);
        }
      }
    }
    
    // Then check in project node_modules
    const projectResolved = path.join(projectNodeModules, request);
    if (fs.existsSync(projectResolved)) {
      return projectResolved;
    }
    
    // Finally check in workspace node_modules
    const workspaceResolved = path.join(workspaceNodeModules, request);
    if (fs.existsSync(workspaceResolved)) {
      return workspaceResolved;
    }
    
    return null;
  } catch (err) {
    return `Error: ${err.message}`;
  }
}

const testImports = [
  'react',
  'react-native',
  'react-native-config',
  '@speakbetter/core',
  '@speakbetter/mobile',
  '@speakbetter/api',
  '@speakbetter/ui',
  '@speakbetter/state'
];

testImports.forEach(imp => {
  const resolved = resolveModule(imp);
  console.log(`${imp}: ${resolved ? '✅ ' + resolved : '❌ Not found'}`);
});

console.log('\n=== Diagnostics Complete ===\n');
console.log('Recommendation: If you see missing packages or version mismatches,');
console.log('try running "npm install" at the workspace root and then "npm run metro:clean"');
console.log('followed by "npm run start:reset" to restart the Metro bundler.');
