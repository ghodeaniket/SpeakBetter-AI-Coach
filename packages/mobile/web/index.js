// This is the web-specific entry point that renders the React Native app
import React from 'react';
import { AppRegistry } from 'react-native';
import App from '../src/App';
import { name as appName } from '../app.json';

// Register the app
AppRegistry.registerComponent(appName, () => App);

// Initialize web rendering
AppRegistry.runApplication(appName, {
  rootTag: document.getElementById('root'),
});
