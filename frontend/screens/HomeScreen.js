import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <View style={styles.content}>
        <View style={styles.titleBlock}>
          <Text style={styles.emoji}>🧩</Text>
          <Text style={styles.title}>Sudoku Play</Text>
          <Text style={styles.subtitle}>Train your brain daily</Text>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.easyBtn]}
            onPress={() => navigation.navigate('Game', { difficulty: 'Easy' })}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Easy</Text>
            <Text style={styles.buttonDesc}>30 blanks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.mediumBtn]}
            onPress={() => navigation.navigate('Game', { difficulty: 'Medium' })}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Medium</Text>
            <Text style={styles.buttonDesc}>45 blanks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.hardBtn]}
            onPress={() => navigation.navigate('Game', { difficulty: 'Hard' })}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Hard</Text>
            <Text style={styles.buttonDesc}>55 blanks</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 50,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 6,
  },
  buttonGroup: {
    width: '100%',
    gap: 14,
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  easyBtn: { backgroundColor: '#34C759' },
  mediumBtn: { backgroundColor: '#007AFF' },
  hardBtn: { backgroundColor: '#FF3B30' },
  buttonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  buttonDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    gap: 8,
  },
  settingsIcon: { fontSize: 18 },
  settingsText: {
    color: '#1A1A2E',
    fontSize: 16,
    fontWeight: '600',
  },
});
