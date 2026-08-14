/**
 * Smart Grocery List & Inventory Manager
 * React Native + TypeScript Mobile Application
 */

import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { store } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar
            barStyle="light-content"
            {...(Platform.OS === 'android' ? { backgroundColor: '#0F172A' } : {})}
          />
          <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
            <RootNavigator />
          </SafeAreaView>
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
