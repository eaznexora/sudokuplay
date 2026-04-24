import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sudoku Play</Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Game', { difficulty: 'Easy' })}
        >
          <Text style={styles.buttonText}>Easy Game</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Game', { difficulty: 'Medium' })}
        >
          <Text style={styles.buttonText}>Medium Game</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Game', { difficulty: 'Hard' })}
        >
          <Text style={styles.buttonText}>Hard Game</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.settingsButton]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 60,
  },
  button: {
    width: '80%',
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: '#E5E5EA',
    marginTop: 20,
  },
  settingsText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  }
});
