import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform, TextInput, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://sudokuplay-six.vercel.app/api';

export default function SecretLoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/login`, {
        username: username.trim().toLowerCase(),
        passwordHash: password.trim(),
      });

      if (res.data && res.data.userId) {
        await AsyncStorage.setItem('chatUserId', res.data.userId);
        await AsyncStorage.setItem('chatUsername', res.data.username);

        navigation.replace('SecretChat', {
          userId: res.data.userId,
          username: res.data.username,
        });
      }
    } catch (error) {
      const msg = error.response?.data?.error || 'Could not reach the server.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Login</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.lockIcon}>🔐</Text>
        <Text style={styles.subtitle}>Enter your credentials</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#555"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#555"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.loginText}>Login</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          First login creates your account.{'\n'}
          Only 2 users allowed.
        </Text>
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
    paddingHorizontal: 30,
  },
  lockIcon: { fontSize: 48, marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#8E8E93', marginBottom: 28 },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    color: '#FFF',
    fontSize: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: { opacity: 0.6 },
  loginText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  hint: { color: '#555', fontSize: 13, textAlign: 'center', marginTop: 24, lineHeight: 20 },
});
