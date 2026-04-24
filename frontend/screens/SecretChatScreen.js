import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform,
  TextInput, FlatList, KeyboardAvoidingView, ActivityIndicator
} from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'https://sudokuplay-six.vercel.app/api';
const PAGE_SIZE = 30;

export default function SecretChatScreen({ route, navigation }) {
  const { userId, username } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const flatListRef = useRef();

  // Find the other user on mount
  useEffect(() => {
    findOtherUser();
  }, []);

  // Start polling after we have the other user
  useEffect(() => {
    if (!otherUser) return;

    // Load initial page
    loadMessages(1, true);

    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      pollNewMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [otherUser]);

  const findOtherUser = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users`, {
        params: { excludeId: userId }
      });
      if (res.data && res.data.user) {
        setOtherUser(res.data.user);
      }
    } catch (error) {
      console.log('Error finding other user:', error.message);
    }
  };

  // Load a specific page of messages (for initial load and scroll-up)
  const loadMessages = async (pageNum, isInitial = false) => {
    if (!otherUser) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/messages`, {
        params: { userId, otherId: otherUser._id, page: pageNum, limit: PAGE_SIZE }
      });

      if (res.data) {
        if (isInitial) {
          setMessages(res.data.messages || []);
          setInitialLoad(false);
        } else {
          // Prepend older messages
          setMessages(prev => [...(res.data.messages || []), ...prev]);
        }
        setHasMore(res.data.hasMore || false);
        setPage(pageNum);
      }
    } catch (error) {
      console.log('Error loading messages:', error.message);
      setInitialLoad(false);
    }
  };

  // Poll for new messages (only get messages after the last one we have)
  const pollNewMessages = async () => {
    if (!otherUser) return;

    try {
      const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
      const afterDate = lastMsg?.createdAt || new Date(0).toISOString();

      const res = await axios.get(`${API_BASE_URL}/messages`, {
        params: { userId, otherId: otherUser._id, after: afterDate }
      });

      if (res.data && res.data.messages && res.data.messages.length > 0) {
        setMessages(prev => [...prev, ...res.data.messages]);

        // Mark as seen
        axios.post(`${API_BASE_URL}/messages/seen`, {
          receiverId: userId,
          senderId: otherUser._id
        }).catch(() => {});
      }
    } catch (error) {
      // Silent fail for polling
    }
  };

  // Load older messages when scrolling to top
  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    loadMessages(page + 1).finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, page, otherUser]);

  const handleSend = async () => {
    if (!inputText.trim() || !otherUser) return;

    const newMessage = {
      senderId: userId,
      receiverId: otherUser._id,
      message: inputText.trim()
    };

    const tempId = Date.now().toString();
    setMessages(prev => [...prev, { _id: tempId, ...newMessage, createdAt: new Date().toISOString() }]);
    setInputText('');

    try {
      await axios.post(`${API_BASE_URL}/messages`, newMessage);
    } catch (error) {
      console.log('Error sending message:', error.message);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }) => {
    const isMe = item.senderId === userId;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
        <Text style={styles.messageText}>{item.message}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          {isMe && item.seen && <Text style={styles.seenText}>✓✓</Text>}
        </View>
      </View>
    );
  };

  const ListHeader = () => {
    if (loadingMore) {
      return (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color="#0A84FF" />
        </View>
      );
    }
    if (!hasMore && messages.length > 0) {
      return (
        <View style={styles.loaderWrap}>
          <Text style={styles.endText}>— Beginning of conversation —</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Text style={styles.exitText}>← Exit</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {otherUser ? otherUser.username : 'Waiting...'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {otherUser ? 'Encrypted' : 'No partner yet'}
          </Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {!otherUser ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔗</Text>
            <Text style={styles.emptyTitle}>No partner yet</Text>
            <Text style={styles.emptyText}>
              Your friend needs to install the app,{'\n'}
              go to Settings → About → tap Version 7 times,{'\n'}
              enter the vault PIN, then login.
            </Text>
          </View>
        ) : initialLoad ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#0A84FF" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item._id || `msg-${index}`}
            renderItem={renderItem}
            contentContainerStyle={styles.chatContainer}
            onContentSizeChange={() => {
              if (!loadingMore) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            ListHeaderComponent={ListHeader}
            onStartReachedThreshold={0.1}
            onScroll={({ nativeEvent }) => {
              // Load more when scrolled near the top
              if (nativeEvent.contentOffset.y < 50 && hasMore && !loadingMore) {
                handleLoadMore();
              }
            }}
            scrollEventThrottle={200}
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#555"
            multiline
            editable={!!otherUser}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!otherUser || !inputText.trim()) && styles.sendDisabled]}
            onPress={handleSend}
            disabled={!otherUser || !inputText.trim()}
            activeOpacity={0.7}
          >
            <Text style={styles.sendText}>▶</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: 12,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  exitText: { fontSize: 15, color: '#FF453A', fontWeight: '600' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: 11, color: '#0A84FF', marginTop: 2 },
  chatArea: { flex: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
  chatContainer: { padding: 12, paddingBottom: 8 },
  loaderWrap: { alignItems: 'center', paddingVertical: 16 },
  endText: { fontSize: 12, color: '#555' },
  messageBubble: {
    maxWidth: '78%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginBottom: 6,
  },
  myBubble: {
    backgroundColor: '#0A84FF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#1C1C1E',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: { color: '#FFF', fontSize: 16, lineHeight: 22 },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4, gap: 4 },
  timeText: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  seenText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#222',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    color: '#FFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 42,
    maxHeight: 100,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#0A84FF',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
