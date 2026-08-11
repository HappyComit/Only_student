import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
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

  // ── "New messages" banner state ───────────────────────────────────
  const [newMsgCount, setNewMsgCount] = useState(0);
  const isNearBottom = useRef(true);
  const bannerAnim = useRef(new Animated.Value(0)).current; // 0 = hidden, 1 = visible

  // Animate banner in/out when count changes
  useEffect(() => {
    Animated.spring(bannerAnim, {
      toValue: newMsgCount > 0 ? 1 : 0,
      useNativeDriver: true,
      tension: 120,
      friction: 14,
    }).start();
  }, [newMsgCount]);

  // Track scroll position — auto-dismiss banner when user scrolls to bottom
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      isNearBottom.current = distanceFromBottom < 150;
      if (isNearBottom.current && newMsgCount > 0) {
        setNewMsgCount(0);
      }
    },
    [newMsgCount],
  );

  // Tap banner → scroll to bottom & dismiss
  const handleBannerPress = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setNewMsgCount(0);
  }, []);

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

    // Mark all messages from this partner as read when conversation is opened
    if (partnerId && partnerId !== 'undefined') {
      apiFetch(`/messages/${partnerId}/read`, { method: 'PUT' }).catch(() => {
        // Silently ignore — marking as read is best-effort
      });
    }
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

        // If user is scrolled up and message is from the partner, increment banner count
        if (!isNearBottom.current && msg.senderId === partnerId) {
          setNewMsgCount((prev) => prev + 1);
        } else {
          // Auto-scroll to bottom when near the bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      };

      // Listen for real-time chat unlock after payment succeeds
      const handleChatUnlocked = (data: { buyerId: string; sellerId: string }) => {
        const isRelevant =
          data.buyerId === partnerId || data.sellerId === partnerId;
        if (isRelevant) {
          setIsLocked(false);
        }
      };

      sock.on('new_message', handleNewMessage);
      sock.on('chat_unlocked', handleChatUnlocked);

      // Cleanup listeners on unmount
      return () => {
        sock.off('new_message', handleNewMessage);
        sock.off('chat_unlocked', handleChatUnlocked);
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
    if (isLocked) return; // Input is already disabled; this is a safety guard

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

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ ...Typography.bodySmall, color: Colors.textSecondary, marginTop: Spacing.sm }}>Loading messages...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={100}
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

          {/* ── "New messages" floating banner ──────────────────────── */}
          {newMsgCount > 0 && (
            <Animated.View
              style={[
                styles.newMsgBanner,
                {
                  opacity: bannerAnim,
                  transform: [
                    {
                      translateY: bannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.newMsgBannerButton}
                activeOpacity={0.86}
                onPress={handleBannerPress}
              >
                <MaterialCommunityIcons name="chevron-down" size={18} color={Colors.white} />
                <Text style={styles.newMsgBannerText}>
                  {newMsgCount} new message{newMsgCount !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      )}

      {isLocked && (
        <View style={styles.lockedBanner}>
          <View style={styles.lockedBannerContent}>
            <MaterialCommunityIcons name="lock-outline" size={22} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={styles.lockedBannerTitle}>🔒 Chat Locked</Text>
              <Text style={styles.lockedBannerText}>
                Please complete the ₹6 booking fee to start chatting with this freelancer.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.lockedHireButton}
            activeOpacity={0.86}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/marketplace');
              }
            }}
          >
            <MaterialCommunityIcons name="briefcase-check-outline" size={14} color="#fff" />
            <Text style={styles.lockedHireButtonText}>Go to Hire</Text>
          </TouchableOpacity>
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
  newMsgBanner: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    zIndex: 10,
  },
  newMsgBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  newMsgBannerText: {
    ...Typography.bodySmall,
    color: Colors.white,
    fontWeight: '700',
  },
  lockedBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  lockedBannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  lockedBannerTitle: {
    ...Typography.body,
    color: '#92400E',
    fontWeight: '800',
    marginBottom: 2,
  },
  lockedBannerText: {
    ...Typography.bodySmall,
    color: '#92400E',
    fontWeight: '600',
    lineHeight: 18,
  },
  lockedHireButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#D97706',
    borderRadius: BorderRadius.full,
    paddingVertical: 9,
    paddingHorizontal: Spacing.base,
  },
  lockedHireButtonText: {
    ...Typography.bodySmall,
    color: '#fff',
    fontWeight: '800',
  },
});
