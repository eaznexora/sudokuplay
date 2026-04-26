import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform,
  TextInput, FlatList, ActivityIndicator, AppState, Keyboard
} from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'https://sudokuplay-six.vercel.app/api';
const PAGE_SIZE = 30;
const POLL_INTERVAL = 3000;

export default function SecretChatScreen({ route, navigation }) {
  const { userId, username } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const lastPollTimestampRef = useRef(null);
  const otherUserRef = useRef(null);
  const pollRef = useRef(null);
  const initialLoadDoneRef = useRef(false);
  const flatListRef = useRef();

  useEffect(() => { otherUserRef.current = otherUser; }, [otherUser]);

  // --- KEYBOARD FIX: Manual keyboard height tracking for Android ---
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // --- AUTO-HIDE: Navigate to Game screen when app goes background ---
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        if (pollRef.current) clearInterval(pollRef.current);
        navigation.reset({
          index: 1,
          routes: [
            { name: 'Home' },
            { name: 'Game', params: { difficulty: 'Medium' } },
          ],
        });
      }
    });
    return () => sub.remove();
  }, [navigation]);

  // --- Find other user ---
  useEffect(() => { findOtherUser(); }, []);

  // --- After finding other user, load messages then start polling ---
  useEffect(() => {
    if (!otherUser) return;
    loadInitialMessages();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [otherUser]);

  const findOtherUser = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users`, { params: { excludeId: userId } });
      if (res.data?.user) setOtherUser(res.data.user);
      else setInitialLoad(false);
    } catch (e) {
      setInitialLoad(false);
    }
  };

  // --- Load first page, THEN start polling ---
  const loadInitialMessages = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/messages`, {
        params: { userId, otherId: otherUserRef.current._id, page: 1, limit: PAGE_SIZE }
      });
      if (res.data) {
        const msgs = res.data.messages || [];
        setMessages(msgs);
        setHasMore(res.data.hasMore || false);
        setPage(1);
        if (msgs.length > 0) {
          lastPollTimestampRef.current = msgs[0].createdAt;
        }
      }
    } catch (e) {
      console.log('Initial load error:', e.message);
    } finally {
      setInitialLoad(false);
      initialLoadDoneRef.current = true;
      // Start polling ONLY after initial load completes
      pollRef.current = setInterval(pollNewMessages, POLL_INTERVAL);
    }
  };

  // --- POLL: Uses refs only, no stale closures. Deduplicates by _id ---
  const pollNewMessages = async () => {
    const other = otherUserRef.current;
    if (!other || !initialLoadDoneRef.current) return;

    const afterDate = lastPollTimestampRef.current || new Date(0).toISOString();

    try {
      const res = await axios.get(`${API_BASE_URL}/messages`, {
        params: { userId, otherId: other._id, after: afterDate }
      });

      const newMsgs = res.data?.messages;
      if (!newMsgs || newMsgs.length === 0) return;

      // Update the poll timestamp to the newest message
      lastPollTimestampRef.current = newMsgs[0].createdAt;

      // Deduplicate and prepend
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m._id));
        const unique = newMsgs.filter(m => !existingIds.has(m._id));
        if (unique.length === 0) return prev;
        return [...unique, ...prev];
      });

      // Mark as seen
      axios.post(`${API_BASE_URL}/messages/seen`, {
        receiverId: userId, senderId: other._id
      }).catch(() => {});
    } catch (e) { /* silent */ }
  };

  // --- Load older messages (scroll up in inverted list = onEndReached) ---
  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || initialLoad) return;
    setLoadingMore(true);

    const nextPage = page + 1;
    axios.get(`${API_BASE_URL}/messages`, {
      params: { userId, otherId: otherUserRef.current?._id, page: nextPage, limit: PAGE_SIZE }
    }).then(res => {
      if (res.data) {
        const older = res.data.messages || [];
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m._id));
          const unique = older.filter(m => !existingIds.has(m._id));
          return [...prev, ...unique];
        });
        setHasMore(res.data.hasMore || false);
        setPage(nextPage);
      }
    }).catch(() => {}).finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, page, initialLoad, userId]);

  // --- SEND: No optimistic updates. Just send and let polling pick it up ---
  const handleSend = async () => {
    if (!inputText.trim() || !otherUser) return;
    const msgText = inputText.trim();
    setInputText('');

    try {
      const res = await axios.post(`${API_BASE_URL}/messages`, {
        senderId: userId, receiverId: otherUser._id, message: msgText
      });
      // Immediately add the confirmed message (no temp IDs)
      if (res.data?.message) {
        const confirmed = res.data.message;
        lastPollTimestampRef.current = confirmed.createdAt;
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m._id));
          if (existingIds.has(confirmed._id)) return prev;
          return [confirmed, ...prev];
        });
      }
    } catch (e) {
      console.log('Send error:', e.message);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }) => {
    const isMe = item.senderId === userId;
    return (
      <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
        <Text style={styles.msgText}>{item.message}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          {isMe && item.seen && <Text style={styles.seenText}>✓✓</Text>}
        </View>
      </View>
    );
  };

  const ListFooter = () => {
    if (loadingMore) return <View style={styles.loader}><ActivityIndicator size="small" color="#0A84FF" /></View>;
    if (!hasMore && messages.length > 0) return <View style={styles.loader}><Text style={styles.endText}>— Beginning of conversation —</Text></View>;
    return null;
  };

  return (
    <View style={[styles.container, Platform.OS === 'android' && keyboardHeight > 0 && { paddingBottom: keyboardHeight }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Text style={styles.exitText}>← Exit</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{otherUser ? otherUser.username : 'Waiting...'}</Text>
          <Text style={styles.headerSub}>{otherUser ? 'Encrypted' : 'No partner yet'}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {!otherUser && !initialLoad ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔗</Text>
          <Text style={styles.emptyTitle}>No partner yet</Text>
          <Text style={styles.emptyText}>Your friend needs to install the app,{'\n'}go to Settings → About → tap Version 7 times,{'\n'}enter the vault PIN, then login.</Text>
        </View>
      ) : initialLoad ? (
        <View style={styles.empty}><ActivityIndicator size="large" color="#0A84FF" /></View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          inverted={true}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={ListFooter}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />
      )}

      <View style={styles.inputBar}>
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
          style={[styles.sendBtn, (!otherUser || !inputText.trim()) && styles.sendOff]}
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
  container: { flex: 1, backgroundColor: '#0A0A0A', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  exitText: { fontSize: 15, color: '#FF453A', fontWeight: '600' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 11, color: '#0A84FF', marginTop: 2 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
  list: { flex: 1 },
  listContent: { padding: 12, paddingBottom: 8 },
  loader: { alignItems: 'center', paddingVertical: 16 },
  endText: { fontSize: 12, color: '#555' },
  bubble: { maxWidth: '78%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18, marginBottom: 6 },
  myBubble: { backgroundColor: '#0A84FF', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#1C1C1E', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  msgText: { color: '#FFF', fontSize: 16, lineHeight: 22 },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4, gap: 4 },
  timeText: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  seenText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  inputBar: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#222', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#1C1C1E', color: '#FFF', borderRadius: 22, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, minHeight: 42, maxHeight: 100, fontSize: 16, borderWidth: 1, borderColor: '#333' },
  sendBtn: { marginLeft: 8, backgroundColor: '#0A84FF', width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  sendOff: { opacity: 0.4 },
  sendText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
