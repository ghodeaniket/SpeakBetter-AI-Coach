/**
 * @format
 */

import {AppRegistry} from 'react-native';
import TestApp from './src/TestApp';
import {name as appName} from './app.json';

// Register the test app
AppRegistry.registerComponent(appName, () => TestApp);