#!/bin/bash
set -e

echo "🧹 Cleaning up node_modules folders..."
rm -rf node_modules
find packages -name "node_modules" -type d -exec rm -rf {} +
find packages -name "node_modules" -type d -exec rm -rf {}/* \; 2>/dev/null || true

echo "🔍 Checking package.json files for version consistency..."

# First, let's fix the version mismatches - React Native uses React 18.2.0 but web uses 19.0.0
# Update UI package to have compatible peer dependencies
sed -i.bak 's/"react": ">=18.0.0"/"react": ">=18.0.0 <20.0.0"/' packages/ui/package.json
sed -i.bak 's/"react-dom": ">=18.0.0"/"react-dom": ">=18.0.0 <20.0.0"/' packages/ui/package.json

# Update the web package to use React 18.2.0 for compatibility with React Native
sed -i.bak 's/"react": "\^19.0.0"/"react": "^18.2.0"/' packages/web/package.json
sed -i.bak 's/"react-dom": "\^19.0.0"/"react-dom": "^18.2.0"/' packages/web/package.json
sed -i.bak 's/"@types\/react": "\^19.0.10"/"@types\/react": "^18.2.0"/' packages/web/package.json
sed -i.bak 's/"@types\/react-dom": "\^19.0.4"/"@types\/react-dom": "^18.2.0"/' packages/web/package.json

# Also update UI package dev dependencies for React types
sed -i.bak 's/"@types\/react": "\^19.0.10"/"@types\/react": "^18.2.0"/' packages/ui/package.json
sed -i.bak 's/"@types\/react-dom": "\^19.0.4"/"@types\/react-dom": "^18.2.0"/' packages/ui/package.json

# Clean up backup files
find . -name "*.bak" -type f -delete

echo "🔄 Installing dependencies with legacy peer deps support..."
npm install --legacy-peer-deps

echo "✅ Dependencies installed and lock file generated!"
echo "Now running a test to verify everything is working..."
npm test
