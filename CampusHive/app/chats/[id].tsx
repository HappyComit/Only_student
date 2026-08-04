import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '@/components/ui/Avatar';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useAppMode } from '@/constants/appMode';
import { apiFetch, getToken } from '@/constants/api';
import { connectSocket, getSocket } from '@/constants/socket';

function getNowTimeLabel() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export default function ChatDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { isFreelancerMode } = useAppMode();
  const {
    id,
    freelancerId,
    freelancerName,
    freelancerAvatar,
    projectTitle,
  } = useLocalSearchParams<{
    id: string;
    freelancerId?: string;
    freelancerName?: string;
    freelancerAvatar?: string;
    projectTitle?: string;
  }>();
  const rawId = typeof id === 'string' ? id : '';
  const partnerId = rawId.startsWith('new-') ? (freelancerId || rawId.replace('new-', '')) : rawId;

  const flatListRef = React.useRef<FlatList>(null);

  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [chatPartner, setChatPartner] = useState<any>({
    id: partnerId,
    username: freelancerName || 'Freelancer',
    avatarUrl: freelancerAvatar || '',
  });
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async (isInitial = false) => {
    if (!partnerId || partnerId === 'undefined') {
      if (isInitial) setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        setIsLocked(true);
        if (isInitial) setLoading(false);
        return;
      }

      const data = await apiFetch<{ chatPartner: any; isLocked?: boolean; count: number; history: any[] }>(`/messages/${partnerId}`);
      if (data) {
        if (data.chatPartner) {
          setChatPartner(data.chatPartner);
        }
        setIsLocked(Boolean(data.isLocked));
        if (Array.isArray(data.history)) {
          setMessages((prev) => {
            const localMsgs = prev.filter((m) => String(m.id).startsWith('local-'));
            const serverIds = new Set(data.history.map((m) => m.id));
            const activeLocals = localMsgs.filter((m) => !serverIds.has(m.id));
            return [...data.history, ...activeLocals];
          });
        }
      }
    } catch (e) {
      // Graceful fallback for network delays
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // ── Initial fetch on mount (one-time HTTP load) ──────────────────
  useEffect(() => {
    fetchHistory(true);
  }, [id, partnerId]);

  // ── Real-time updates via Socket.IO ──────────────────────────────
  useEffect(() => {
    let mounted = true;

    const setupSocket = async () => {
      const sock = await connectSocket();
      if (!sock || !mounted) return;

      const handleNewMessage = (msg: any) => {
        // Only handle messages that belong to THIS conversation
        const isRelevant =
          msg.senderId === partnerId || msg.receiverId === partnerId;
        if (!isRelevant) return;

        setMessages((prev) => {
          // If we already have this message (e.g. from optimistic send), replace it
          const existingIdx = prev.findIndex(
            (m) => m.id === msg.id || (String(m.id).startsWith('local-') && m.content === msg.content && m.receiverId === msg.receiverId)
          );
          if (existingIdx !== -1) {
            const updated = [...prev];
            updated[existingIdx] = msg;
            return updated;
          }
          // Otherwise append the new message
          return [...prev, msg];
        });

        // Auto-scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      };

      sock.on('new_message', handleNewMessage);

      // Cleanup listener on unmount
      return () => {
        sock.off('new_message', handleNewMessage);
      };
    };

    const cleanupPromise = setupSocket();

    return () => {
      mounted = false;
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [partnerId]);

  const counterpartName = chatPartner?.name || chatPartner?.username || freelancerName || 'User';
  const counterpartAvatar = chatPartner?.avatarUrl || freelancerAvatar || `https://i.pravatar.cc/150?img=${Math.abs((chatPartner?.username || 'user').charCodeAt(0) % 70) || 12}`;
  const displayProjectTitle = projectTitle || (chatPartner?.isSeller ? 'Freelance Service' : 'Project Hire');

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/chats');
  };

  const handleSend = async () => {
    if (isLocked) {
      Alert.alert(
        'Chat Locked 🔒',
        'You must place a hire request (₹6 platform booking fee) with this seller to unlock direct messaging.'
      );
      return;
    }

    const text = draft.trim();
    if (!text) {
      return;
    }

    const tempId = `local-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      senderId: 'ME',
      receiverId: partnerId,
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setDraft('');
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      const res = await apiFetch<{ message: string; chatMessage: any }>('/messages', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: partnerId,
          content: text,
        }),
      });
      if (res?.chatMessage) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? res.chatMessage : msg))
        );
      }
    } catch (err: any) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      Alert.alert('Send Failed', err.message || 'Could not send message.');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.select({ ios: 90, android: 0 })}
    >
      <View style={[styles.header, { paddingTop: insets.top + Spacing.xs }]}> 
        <TouchableOpacity style={styles.headerBackButton} onPress={handleBack} activeOpacity={0.86}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Avatar uri={counterpartAvatar} size={36} />
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>{counterpartName}</Text>
            <Text style={styles.headerSub}>Project Discussion</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={() => Alert.alert('Info', displayProjectTitle)}
          activeOpacity={0.86}
        >
          <MaterialCommunityIcons name="information-outline" size={20} color={Colors.primaryDark} />
        </TouchableOpacity>
      </View>

      <View style={styles.projectStrip}>
        <MaterialCommunityIcons name="briefcase-outline" size={14} color={Colors.primaryDark} />
        <Text style={styles.projectStripText} numberOfLines={1}>{displayProjectTitle}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const mine = item.senderId !== partnerId;
          const formattedTime = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <View style={[styles.messageRow, mine ? styles.messageRowMine : styles.messageRowOther]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                <Text style={[styles.messageText, mine ? styles.messageTextMine : styles.messageTextOther]}>{item.content}</Text>
                <Text style={[styles.messageTime, mine ? styles.messageTimeMine : styles.messageTimeOther]}>{formattedTime}</Text>
              </View>
            </View>
          );
        }}
      />

      {isLocked && (
        <View style={styles.lockedBanner}>
          <MaterialCommunityIcons name="lock-outline" size={18} color="#D97706" />
          <Text style={styles.lockedBannerText}>
            Chat Locked 🔒 — Place a hire request (₹6 booking fee) to unlock chat.
          </Text>
        </View>
      )}

      <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}> 
        <View style={[styles.composerRow, isLocked && { backgroundColor: '#F3F4F6' }]}>
          <TextInput
            style={styles.composerInput}
            placeholder={isLocked ? '🔒 Pay ₹6 booking fee to unlock chat...' : isFreelancerMode ? 'Reply to client...' : 'Write a message to freelancer...'}
            placeholderTextColor={Colors.textSecondary}
            value={draft}
            onChangeText={setDraft}
            editable={!isLocked}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[styles.sendButton, (isLocked || draft.trim().length === 0) && styles.sendButtonDisabled]}
            activeOpacity={0.86}
            onPress={handleSend}
            disabled={isLocked || draft.trim().length === 0}
          >
            <MaterialCommunityIcons name={isLocked ? "lock" : "send"} size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  notFoundText: {
    ...Typography.h4,
    color: Colors.textSecondary,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '700',
  },
  headerSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  projectStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  projectStripText: {
    ...Typography.caption,
    color: Colors.primaryDark,
    fontWeight: '700',
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
    gap: Spacing.sm,
  },
  messageRow: {
    width: '100%',
    flexDirection: 'row',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 7,
  },
  bubbleMine: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    ...Typography.body,
  },
  messageTextMine: {
    color: Colors.white,
  },
  messageTextOther: {
    color: Colors.text,
  },
  messageTime: {
    ...Typography.caption,
    marginTop: 4,
  },
  messageTimeMine: {
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'right',
  },
  messageTimeOther: {
    color: Colors.textSecondary,
  },
  composerWrap: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  composerRow: {
    minHeight: 48,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: Spacing.md,
    paddingRight: 6,
    paddingVertical: 6,
    gap: Spacing.sm,
  },
  composerInput: {
    flex: 1,
    maxHeight: 120,
    ...Typography.body,
    color: Colors.text,
    paddingTop: 4,
    paddingBottom: 4,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  lockedBannerText: {
    ...Typography.bodySmall,
    color: '#92400E',
    fontWeight: '700',
    flex: 1,
  },
});
