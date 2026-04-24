import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Switch } from 'react-native';

export default function SettingsScreen({ navigation }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkTheme, setDarkTheme] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  const handleVersionTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    
    if (newCount === 7) {
      setTapCount(0);
      navigation.navigate('SecretVault');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Sound</Text>
          <Switch 
            value={soundEnabled} 
            onValueChange={setSoundEnabled} 
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={soundEnabled ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Dark Theme</Text>
          <Switch 
            value={darkTheme} 
            onValueChange={setDarkTheme} 
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={darkTheme ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.aboutTitle}>About</Text>
          <Text style={styles.aboutText}>Sudoku Play</Text>
          <Text style={styles.aboutText}>Developed by Eaz Nexora</Text>
          
          <TouchableOpacity onPress={handleVersionTap} activeOpacity={0.8}>
            <Text style={styles.versionText}>Version: 1.3</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  headerButton: { fontSize: 16, color: '#007AFF' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  settingText: { fontSize: 18, color: '#333' },
  aboutSection: { marginTop: 40, alignItems: 'center' },
  aboutTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  aboutText: { fontSize: 16, color: '#666', marginBottom: 5 },
  versionText: { fontSize: 14, color: '#999', marginTop: 10 }
});
