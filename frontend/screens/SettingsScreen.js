import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkTheme, setDarkTheme] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  const handleSoundToggle = async (value) => {
    setSoundEnabled(value);
    await AsyncStorage.setItem('soundEnabled', JSON.stringify(value));
  };

  const handleThemeToggle = async (value) => {
    setDarkTheme(value);
    await AsyncStorage.setItem('darkTheme', JSON.stringify(value));
  };

  const handleVersionTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount === 7) {
      setTapCount(0);
      navigation.navigate('SecretVault');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔊</Text>
              <Text style={styles.settingText}>Sound</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={handleSoundToggle}
              trackColor={{ false: '#D1D1D6', true: '#34C75980' }}
              thumbColor={soundEnabled ? '#34C759' : '#F4F3F4'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🌙</Text>
              <Text style={styles.settingText}>Dark Theme</Text>
            </View>
            <Switch
              value={darkTheme}
              onValueChange={handleThemeToggle}
              trackColor={{ false: '#D1D1D6', true: '#007AFF80' }}
              thumbColor={darkTheme ? '#007AFF' : '#F4F3F4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.aboutCard}>
            <Text style={styles.appName}>Sudoku Play</Text>
            <Text style={styles.devName}>Developed by Eaz Nexora</Text>

            <TouchableOpacity onPress={handleVersionTap} activeOpacity={1}>
              <Text style={styles.versionText}>Version 1.3</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { fontSize: 16, color: '#007AFF', fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { fontSize: 20 },
  settingText: { fontSize: 17, color: '#1A1A2E', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginLeft: 52 },
  aboutCard: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  appName: { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  devName: { fontSize: 14, color: '#8E8E93', marginBottom: 16 },
  versionText: { fontSize: 13, color: '#C7C7CC', paddingVertical: 8, paddingHorizontal: 16 },
});
