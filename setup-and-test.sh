#!/bin/bash

# Setup and Test Script for SpeakBetter AI Coach
echo "Setting up SpeakBetter AI Coach for testing..."

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
  echo "Installing Firebase CLI..."
  npm install -g firebase-tools
fi

# Prompt for Firebase login if needed
echo "Please make sure you're logged into Firebase with the correct account."
echo "Would you like to login to Firebase now? (y/n)"
read -r login_response
if [[ "$login_response" =~ ^[Yy]$ ]]; then
  firebase login
fi

# Deploy Firebase configuration
echo "Would you like to deploy the Firebase configuration? (y/n)"
read -r deploy_response
if [[ "$deploy_response" =~ ^[Yy]$ ]]; then
  echo "Deploying Firebase configuration..."
  firebase deploy --only firestore,storage
  
  echo "Would you like to install the Firebase Extensions? (y/n)"
  read -r extensions_response
  if [[ "$extensions_response" =~ ^[Yy]$ ]]; then
    echo "Please install the following extensions in the Firebase Console:"
    echo "1. firebase/speech-to-text@0.1.4 with collection name 'transcriptions'"
    echo "2. firebase/tts-api@0.1.4 with collection name 'tts_requests'"
    echo "Opening Firebase Console..."
    open "https://console.firebase.google.com/project/speakbetter-dev-722cc/extensions"
  fi
fi

# Start the development server
echo "Starting the development server..."
npm run dev
