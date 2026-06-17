import { registerRootComponent } from 'expo';
import { enableScreens } from 'react-native-screens';

// Disable native screens — react-native-screens v4 + Fabric has a prop type
// mismatch on physical devices running Expo Go's new architecture container.
enableScreens(false);

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
