import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, TextInput } from 'react-native';

export default function SecretVaultScreen({ navigation }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // Hardcoded for MVP, should be stored securely in production
  const CORRECT_PIN = '2007';

  const handleUnlock = () => {
    if (pin === CORRECT_PIN) {
      setError('');
      setPin('');
      navigation.replace('SecretChat');
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vault</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.content}>
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

        <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock}>
          <Text style={styles.unlockText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' }, // Dark theme for vault
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', backgroundColor: '#111' },
  headerButton: { fontSize: 16, color: '#0A84FF' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 20 },
  input: {
    width: 200, height: 60, backgroundColor: '#222', borderRadius: 10,
    color: '#FFF', fontSize: 24, textAlign: 'center', letterSpacing: 10,
    marginBottom: 20
  },
  unlockButton: { backgroundColor: '#0A84FF', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10 },
  unlockText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  errorText: { color: '#FF453A', marginBottom: 20, fontSize: 16 }
});
