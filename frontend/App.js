import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import HomeScreen from './screens/HomeScreen';
import GameScreen from './screens/GameScreen';
import SettingsScreen from './screens/SettingsScreen';
import SecretVaultScreen from './screens/SecretVaultScreen';
import SecretLoginScreen from './screens/SecretLoginScreen';
import SecretChatScreen from './screens/SecretChatScreen';

const Stack = createNativeStackNavigator();
const API_BASE_URL = 'https://sudokuplay-six.vercel.app/api';

// Disguised notification messages (look like normal game alerts)
const DISGUISED_MESSAGES = [
  { title: '🧩 Sudoku Play', body: 'New daily puzzle ready!' },
  { title: '🧩 Sudoku Play', body: 'Hint restored! Try again.' },
  { title: '🧩 Sudoku Play', body: 'Challenge available — play now!' },
  { title: '🧩 Sudoku Play', body: 'Your streak is waiting!' },
  { title: '🧩 Sudoku Play', body: 'Brain training time! New puzzle unlocked.' },
];

// Configure notification display
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const appState = useRef(AppState.currentState);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    // Request notification permissions
    requestPermissions();

    // PRD UX Rule: notification tap ONLY opens game/home, never chat
    const tapSub = Notifications.addNotificationResponseReceivedListener(() => {
      // App opens to Home screen automatically (it's the initial route)
    });

    // Start background polling when app goes to background
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (appState.current === 'active' && nextState.match(/inactive|background/)) {
        // App going to background — start polling
        startBackgroundPoll();
      } else if (nextState === 'active') {
        // App coming to foreground — stop polling
        stopBackgroundPoll();
      }
      appState.current = nextState;
    });

    // Also poll while app is active (less frequently)
    startForegroundPoll();

    return () => {
      tapSub.remove();
      appStateSub.remove();
      stopBackgroundPoll();
    };
  }, []);

  const requestPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  };

  const checkForNewMessages = async () => {
    try {
      const chatUserId = await AsyncStorage.getItem('chatUserId');
      if (!chatUserId) return; // User hasn't logged into chat yet

      const res = await axios.get(`${API_BASE_URL}/notifications`, {
        params: { userId: chatUserId }
      });

      if (res.data && res.data.hasNotifications) {
        // Pick a random disguised message
        const msg = DISGUISED_MESSAGES[Math.floor(Math.random() * DISGUISED_MESSAGES.length)];

        await Notifications.scheduleNotificationAsync({
          content: {
            title: msg.title,
            body: msg.body,
            data: { type: 'game_update' }, // Looks like a game notification
          },
          trigger: null, // Show immediately
        });
      }
    } catch (error) {
      // Silent fail — don't crash the app for notification polling
    }
  };

  const startBackgroundPoll = () => {
    if (pollIntervalRef.current) return;
    pollIntervalRef.current = setInterval(checkForNewMessages, 60000); // Every 60s
  };

  const startForegroundPoll = () => {
    // Check every 2 minutes while app is in foreground
    setInterval(checkForNewMessages, 120000);
  };

  const stopBackgroundPoll = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="SecretVault" component={SecretVaultScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="SecretLogin" component={SecretLoginScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="SecretChat" component={SecretChatScreen} options={{ animation: 'fade' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
