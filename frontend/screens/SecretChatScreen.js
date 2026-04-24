import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';

// Set this to your local IP for testing, or Vercel URL for production
const API_BASE_URL = 'https://sudokuplay-six.vercel.app/api';

// Hardcoded for the two trusted users for MVP
const MY_USER_ID = 'user1'; // Mock user ID 1
const OTHER_USER_ID = 'user2'; // Mock user ID 2

export default function SecretChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef();

  useEffect(() => {
    // Initial fetch
    fetchMessages();

    // Polling every 3 seconds
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      // In a real app, you'd have real user IDs from your DB after login
      const res = await axios.get(`${API_BASE_URL}/messages`, {
        params: { userId: MY_USER_ID, otherId: OTHER_USER_ID }
      });
      
      // Update if there's new data
      if (res.data && res.data.messages) {
        setMessages(res.data.messages);
      }
    } catch (error) {
      console.log('Error fetching messages:', error.message);
      // Fallback local UI testing mode
      if (messages.length === 0) {
        setMessages([
          { _id: '1', senderId: OTHER_USER_ID, message: 'Vault secured.' },
          { _id: '2', senderId: MY_USER_ID, message: 'System active.' }
        ]);
      }
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const newMessage = {
      senderId: MY_USER_ID,
      receiverId: OTHER_USER_ID,
      message: inputText.trim()
    };
    
    // Optimistic UI update
    const tempId = Date.now().toString();
    setMessages(prev => [...prev, { _id: tempId, ...newMessage }]);
    setInputText('');
    
    try {
      await axios.post(`${API_BASE_URL}/messages`, newMessage);
      fetchMessages(); // Refresh to get DB confirmed message
    } catch (error) {
      console.log('Error sending message:', error.message);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.senderId === MY_USER_ID;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
        <Text style={styles.messageText}>{item.message}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.headerButton}>← Leave</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Encrypted Channel</Text>
          <View style={{ width: 50 }} />
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Secure message..."
            placeholderTextColor="#666"
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' }, // Dark theme for secret chat
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#333' },
  headerButton: { fontSize: 16, color: '#FF453A' }, // Red for leave
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  chatContainer: { padding: 15, paddingBottom: 20 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 10 },
  myBubble: { backgroundColor: '#0A84FF', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#333', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageText: { color: '#FFF', fontSize: 16 },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#333', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#222', color: '#FFF', borderRadius: 20, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 12, minHeight: 40, maxHeight: 100, fontSize: 16 },
  sendButton: { marginLeft: 10, backgroundColor: '#0A84FF', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 15 },
  sendText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
