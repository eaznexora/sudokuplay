import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform,
  TextInput, FlatList, ActivityIndicator, AppState
} from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'https://sudokuplay-six.vercel.app/api';
const PAGE_SIZE = 30;

export default function SecretChatScreen({ route, navigation }) {
  const { userId, username } = route.params || {};

  // --- State ---
  const [messages, setMessages] = useState([]);       // newest-first for inverted FlatList
  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // --- Refs to avoid stale closures in intervals ---
  const messagesRef = useRef([]);
  const otherUserRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const flatListRef = useRef();

  // Keep refs in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    otherUserRef.current = otherUser;
  }, [otherUser]);

  // --- FIX #5: Auto-hide chat when app goes to background ---
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        // Reset navigation stack to Home so chat is hidden
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    });
    return () => sub.remove();
  }, [navigation]);

  // --- Find the other user ---
  useEffect(() => {
    findOtherUser();
  }, []);

  // --- Start polling after we have the other user ---
  useEffect(() => {
    if (!otherUser) return;

    // Load initial page (newest 30 messages)
    loadMessages(1);

    // Start polling for new messages every 3 seconds
    pollIntervalRef.current = setInterval(pollNewMessages, 3000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [otherUser]);

  const findOtherUser = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users`, {
        params: { excludeId: userId }
      });
      if (res.data && res.data.user) {
        setOtherUser(res.data.user);
      } else {
        setInitialLoad(false);
      }
    } catch (error) {
      console.log('Error finding other user:', error.message);
      setInitialLoad(false);
    }
  };

  // --- FIX #4: Paginated loading (inverted FlatList approach) ---
  // Data is stored newest-first. Inverted FlatList renders index 0 at BOTTOM.
  // onEndReached fires when user scrolls UP (to see older messages).
  const loadMessages = async (pageNum) => {
    if (!otherUserRef.current) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/messages`, {
        params: { userId, otherId: otherUserRef.current._id, page: pageNum, limit: PAGE_SIZE }
      });

      if (res.data) {
        const newMsgs = res.data.messages || [];

        if (pageNum === 1) {
          // Initial load — set messages directly
          setMessages(newMsgs);
        } else {
          // Loading older messages — append to END (they appear at TOP in inverted list)
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m._id));
            const unique = newMsgs.filter(m => !existingIds.has(m._id));
            return [...prev, ...unique];
          });
        }

        setHasMore(res.data.hasMore || false);
        setPage(pageNum);
      }
    } catch (error) {
      console.log('Error loading messages:', error.message);
    } finally {
      setInitialLoad(false);
      setLoadingMore(false);
    }
  };

  // --- FIX #1: Polling uses refs (no stale closures) + deduplication ---
  const pollNewMessages = async () => {
    const other = otherUserRef.current;
    const currentMsgs = messagesRef.current;
    if (!other) return;

    try {
      // Get the timestamp of the newest message (index 0 = newest in our array)
      const newestMsg = currentMsgs.length > 0 ? currentMsgs[0] : null;
      const afterDate = newestMsg?.createdAt || new Date(0).toISOString();

      const res = await axios.get(`${API_BASE_URL}/messages`, {
        params: { userId, otherId: other._id, after: afterDate }
      });

      if (res.data && res.data.messages && res.data.messages.length > 0) {
        const newMsgs = res.data.messages; // newest-first from backend

        // Deduplicate: filter out any messages we already have
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m._id));
          const unique = newMsgs.filter(m => !existingIds.has(m._id));
          if (unique.length === 0) return prev; // No change — prevent re-render
          return [...unique, ...prev]; // Prepend newest (they appear at BOTTOM in inverted list)
        });

        // Mark as seen
        axios.post(`${API_BASE_URL}/messages/seen`, {
          receiverId: userId,
          senderId: other._id
        }).catch(() => {});
      }
    } catch (error) {
      // Silent fail for polling
    }
  };

  // Load older messages when scrolling up (onEndReached in inverted list)
  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || initialLoad) return;
    setLoadingMore(true);
    loadMessages(page + 1);
  }, [loadingMore, hasMore, page, initialLoad]);

  const handleSend = async () => {
    if (!inputText.trim() || !otherUser) return;

    const msgText = inputText.trim();
    const newMessage = {
      senderId: userId,
      receiverId: otherUser._id,
      message: msgText
    };

    // Optimistic UI: prepend (index 0 = newest = bottom of inverted list)
    const tempId = `temp_${Date.now()}`;
    setMessages(prev => [{ _id: tempId, ...newMessage, createdAt: new Date().toISOString() }, ...prev]);
    setInputText('');

    try {
      await axios.post(`${API_BASE_URL}/messages`, newMessage);
      // Don't manually fetch — polling will pick up the confirmed message
      // But remove the temp message and let polling replace it
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

  const ListFooter = () => {
    if (loadingMore) {
      return <View style={styles.loaderWrap}><ActivityIndicator size="small" color="#0A84FF" /></View>;
    }
    if (!hasMore && messages.length > 0) {
      return <View style={styles.loaderWrap}><Text style={styles.endText}>— Beginning of conversation —</Text></View>;
    }
    return null;
  };

  // --- RENDER ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Header */}
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

      {/* Chat body — NO KeyboardAvoidingView on Android (resize mode handles it) */}
      {!otherUser && !initialLoad ? (
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
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.chatContainer}
          inverted={true}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={ListFooter}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />
      )}

      {/* Input bar */}
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
