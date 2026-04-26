import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform, TextInput, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SecretVaultScreen({ navigation }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  const CORRECT_PIN = '2007';

  // FIX #3: Check if user already has a saved session
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const savedUserId = await AsyncStorage.getItem('chatUserId');
      const savedUsername = await AsyncStorage.getItem('chatUsername');
      if (savedUserId && savedUsername) {
        // Session exists — skip login, go directly to chat
        navigation.replace('SecretChat', {
          userId: savedUserId,
          username: savedUsername,
        });
        return;
      }
    } catch (error) {
      console.log('Session check error:', error.message);
    }
    setCheckingSession(false);
  };

  const handleUnlock = () => {
    if (pin === CORRECT_PIN) {
      setError('');
      setPin('');
      navigation.replace('SecretLogin');
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  // Show loading while checking session
  if (checkingSession) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <ActivityIndicator size="large" color="#0A84FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vault</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.title}>Enter PIN</Text>

        <TextInput
          style={styles.input}
          keyboardType="numeric"
          secureTextEntry
          maxLength={4}
          value={pin}
          onChangeText={(text) => {
            setPin(text);
            if (error) setError('');
          }}
          autoFocus
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock} activeOpacity={0.8}>
          <Text style={styles.unlockText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#111',
  },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { fontSize: 16, color: '#0A84FF', fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lockIcon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#FFF', marginBottom: 24 },
  input: {
    width: 200,
    height: 56,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    color: '#FFF',
    fontSize: 28,
    textAlign: 'center',
    letterSpacing: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  unlockButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginTop: 8,
  },
  unlockText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  errorText: { color: '#FF453A', marginBottom: 12, fontSize: 15, fontWeight: '500' },
});
