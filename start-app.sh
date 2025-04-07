#!/bin/bash

# Simple script to start the application
echo "Starting the SpeakBetter AI Coach application..."

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Start the development server
npm run dev
