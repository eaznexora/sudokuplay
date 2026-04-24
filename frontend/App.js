import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import HomeScreen from './screens/HomeScreen';
import GameScreen from './screens/GameScreen';
import SettingsScreen from './screens/SettingsScreen';
import SecretVaultScreen from './screens/SecretVaultScreen';
import SecretChatScreen from './screens/SecretChatScreen';

const Stack = createNativeStackNavigator();

// Configure local notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  
  useEffect(() => {
    // Background polling for notifications could be set up here
    // For now we just configure how taps are handled
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      // PRD UX Rule: When notification is tapped, open app home/game screen only.
      // Navigation state handling can be complex, but tapping basically opens the app.
      // We do not directly open chat.
    });
    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="SecretVault" component={SecretVaultScreen} />
        <Stack.Screen name="SecretChat" component={SecretChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
