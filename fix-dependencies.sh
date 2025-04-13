#!/bin/bash
set -e

echo "🧹 Cleaning up node_modules folders..."
rm -rf node_modules
rm -rf packages/*/node_modules

echo "🔄 Installing root dependencies..."
npm install --no-package-lock

echo "📦 Installing workspace dependencies..."
# Install dependencies for each package
for pkg in api core mobile ui web; do
  echo "Installing dependencies for @speakbetter/$pkg..."
  cd "packages/$pkg"
  npm install --no-package-lock
  cd ../..
done

echo "🔒 Generating lock file for the entire workspace..."
npm install

echo "✅ Dependencies installed and lock file generated!"
echo "Now running a test to verify everything is working..."
npm test
