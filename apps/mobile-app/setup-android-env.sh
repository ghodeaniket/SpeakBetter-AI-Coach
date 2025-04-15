#!/bin/bash
# Script to ensure react-native-config is properly set up for Android

echo "Configuring react-native-config for Android..."

# Check if app/build.gradle exists
if [ -f "./android/app/build.gradle" ]; then
    # Check if apply from is already in the file
    if ! grep -q "apply from: project(':react-native-config').projectDir.getPath() + '/dotenv.gradle'" "./android/app/build.gradle"; then
        # Add the apply from line after the apply plugin line
        sed -i '' '/apply plugin: "com.android.application"/a\
apply from: project(":react-native-config").projectDir.getPath() + "/dotenv.gradle"' "./android/app/build.gradle"
        echo "Updated app/build.gradle to include react-native-config"
    else
        echo "app/build.gradle already configured for react-native-config"
    fi
else
    echo "Warning: app/build.gradle not found. Please configure manually."
fi

# Create a placeholder for the android/app/src/main/assets directory if it doesn't exist
mkdir -p "./android/app/src/main/assets"

echo "Android configuration for react-native-config completed!"
