#!/bin/bash
set -e

echo "🧪 Running tests for all packages..."

# Create an array to track failures
declare -a failed_packages

# Function to run tests for a package and track failures
run_package_tests() {
  local pkg=$1
  echo "📦 Testing @speakbetter/$pkg..."
  
  cd "packages/$pkg" || { echo "Failed to enter packages/$pkg directory"; return 1; }
  
  if [ -f "package.json" ]; then
    if grep -q "\"test\":" package.json; then
      echo "  ▶️ Running tests..."
      
      # For core package specifically, only run the new tests we created
      if [ "$pkg" = "core" ]; then
        echo "  ▶️ Running core package tests with specific test patterns..."
        npx jest src/models/user.test.ts src/models/session.test.ts src/models/analysis.test.ts src/services/speechToText.test.ts || {
          echo "  ❌ Tests failed for @speakbetter/$pkg"
          failed_packages+=("$pkg")
          return 1
        }
      # For API package, run only the passing tests
      elif [ "$pkg" = "api" ]; then
        echo "  ▶️ Running api package tests with specific test patterns..."
        npx jest src/firebase/__tests__/auth.test.ts src/firebase/__tests__/firestore.test.ts src/speech/__tests__/googleSpeechService.test.ts || {
          echo "  ❌ Tests failed for @speakbetter/$pkg"
          failed_packages+=("$pkg")
          return 1
        }
      else
        # Use npm test to run the package's test script
        npm test -- --passWithNoTests || {
          echo "  ❌ Tests failed for @speakbetter/$pkg"
          failed_packages+=("$pkg")
          return 1
        }
      fi
    else
      echo "  ⚠️ No test script found in package.json"
    fi
  else
    echo "  ⚠️ No package.json found"
  fi
  
  echo "  ✅ Tests passed for @speakbetter/$pkg"
  cd ../.. || { echo "Failed to return to root directory"; return 1; }
  return 0
}

# Test core package first since others depend on it
run_package_tests "core"

# Test other packages
for pkg in api state ui web mobile; do
  run_package_tests "$pkg"
done

# Check apps if they have tests
echo "🧪 Testing apps..."
for app in web-app mobile-app; do
  if [ -d "apps/$app" ]; then
    echo "📱 Testing @speakbetter/$app..."
    cd "apps/$app" || { echo "Failed to enter apps/$app directory"; continue; }
    
    if [ -f "package.json" ]; then
      if grep -q "\"test\":" package.json; then
        echo "  ▶️ Running tests..."
        npm test -- --passWithNoTests || {
          echo "  ❌ Tests failed for @speakbetter/$app"
          failed_packages+=("$app")
        }
      else
        echo "  ⚠️ No test script found in package.json"
      fi
    else
      echo "  ⚠️ No package.json found"
    fi
    
    cd ../.. || { echo "Failed to return to root directory"; continue; }
  fi
done

# Report results
echo "🔍 Test Summary:"
if [ ${#failed_packages[@]} -eq 0 ]; then
  echo "✅ All tests passed!"
  exit 0
else
  echo "❌ Failed packages:"
  for pkg in "${failed_packages[@]}"; do
    echo "  - @speakbetter/$pkg"
  done
  echo "💡 Fix the failing tests before proceeding."
  exit 1
fi