import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Alert,
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
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
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

      const data = await apiFetch<{ chatPartner: any; isLocked?: boolean; isReadOnly?: boolean; activeOrder?: any; count: number; history: any[] }>(`/messages/${partnerId}`);
      if (data) {
        if (data.chatPartner) {
          setChatPartner(data.chatPartner);
        }
        setIsLocked(Boolean(data.isLocked));
        setIsReadOnly(Boolean(data.isReadOnly));
        if (data.activeOrder) {
          setActiveOrder(data.activeOrder);
        } else {
          setActiveOrder(null);
        }
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

  // ── Initial fetch on mount & current user lookup ──────────────────
  useEffect(() => {
    fetchHistory(true);

    apiFetch<{ user: any }>('/auth/profile')
      .then((res) => {
        if (res?.user?.id) setCurrentUserId(res.user.id);
      })
      .catch(() => {});

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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
          <View style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: Colors.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: Colors.primary + '40',
            marginBottom: Spacing.md,
          }}>
            <MaterialCommunityIcons name="shield-lock-outline" size={36} color={Colors.primary} />
          </View>
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginBottom: Spacing.xs }} />
          <Text style={{ ...Typography.bodySmall, color: Colors.text, fontWeight: '700' }}>
            Securing student connection...
          </Text>
          <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginTop: 4 }}>
            OnlyStudents
          </Text>
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

      {/* ── Interactive Accept/Decline Order Banner Inside Chat ── */}
      {activeOrder && activeOrder.status === 'PENDING_ACCEPTANCE' && (
        <View style={styles.actionBannerWrap}>
          {currentUserId === activeOrder.sellerId ? (
            <View style={styles.actionRequestBanner}>
              <View style={styles.actionBannerHeader}>
                <MaterialCommunityIcons name="bell-ring-outline" size={22} color="#1D4ED8" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionBannerTitle}>🔔 New Hire Request (₹6 Fee Paid)</Text>
                  <Text style={styles.actionBannerSub}>
                    Client wants to hire you for '{displayProjectTitle}'. Please accept or decline to start messaging.
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  activeOpacity={0.86}
                  disabled={actionLoading}
                  onPress={async () => {
                    setActionLoading(true);
                    try {
                      await apiFetch(`/orders/${activeOrder.id}/accept`, { method: 'POST' });
                      setIsLocked(false);
                      setActiveOrder((prev: any) => ({ ...prev, status: 'IN_PROGRESS' }));
                      Alert.alert('Job Accepted! 🎉', 'You have accepted the order. Work is now IN_PROGRESS.');
                    } catch (err: any) {
                      Alert.alert('Error', err.message || 'Failed to accept order.');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                >
                  <MaterialCommunityIcons name="check-circle-outline" size={16} color="#fff" />
                  <Text style={styles.acceptButtonText}>{actionLoading ? 'Accepting...' : 'Accept Job'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.declineButton}
                  activeOpacity={0.86}
                  disabled={actionLoading}
                  onPress={async () => {
                    setActionLoading(true);
                    try {
                      await apiFetch(`/orders/${activeOrder.id}/decline`, { method: 'POST' });
                      setIsLocked(true);
                      setActiveOrder((prev: any) => ({ ...prev, status: 'DECLINED' }));
                      Alert.alert('Job Declined', 'You have declined this job request.');
                    } catch (err: any) {
                      Alert.alert('Error', err.message || 'Failed to decline order.');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                >
                  <MaterialCommunityIcons name="close-circle-outline" size={16} color="#DC2626" />
                  <Text style={styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.buyerPendingBanner}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#D97706" />
              <Text style={styles.buyerPendingText}>
                ⏳ Hire request sent (₹6 fee paid). Waiting for freelancer to accept...
              </Text>
            </View>
          )}
        </View>
      )}

      {activeOrder && activeOrder.status === 'IN_PROGRESS' && (
        <View style={styles.acceptedBanner}>
          <MaterialCommunityIcons name="check-decagram" size={18} color="#059669" />
          <Text style={styles.acceptedBannerText}>Order Accepted — Project Status: IN_PROGRESS</Text>
        </View>
      )}

      {/* ── Read-Only Banner for DELIVERED/COMPLETED orders ── */}
      {isReadOnly && activeOrder && (activeOrder.status === 'DELIVERED' || activeOrder.status === 'COMPLETED') && (
        <View style={styles.readOnlyBanner}>
          <View style={styles.readOnlyBannerContent}>
            <MaterialCommunityIcons name={activeOrder.status === 'COMPLETED' ? 'check-decagram' : 'package-variant-closed'} size={22} color="#6366F1" />
            <View style={{ flex: 1 }}>
              <Text style={styles.readOnlyBannerTitle}>
                {activeOrder.status === 'COMPLETED' ? '✅ Order Completed' : '📦 Work Delivered'}
              </Text>
              <Text style={styles.readOnlyBannerText}>
                This chat is now read-only. To work together again, place a new hire request.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.readOnlyHireButton}
            activeOpacity={0.86}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/marketplace');
              }
            }}
          >
            <MaterialCommunityIcons name="briefcase-plus-outline" size={14} color="#fff" />
            <Text style={styles.readOnlyHireButtonText}>Hire Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLocked && !isReadOnly && !activeOrder?.status?.includes('PENDING') && (
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
        <View style={[styles.composerRow, (isLocked || isReadOnly) && { backgroundColor: '#F3F4F6' }]}>
          <TextInput
            style={styles.composerInput}
            placeholder={
              isReadOnly ? '📋 Chat is read-only — order completed'
              : isLocked ? '🔒 Pay ₹6 booking fee to unlock chat...'
              : isFreelancerMode ? 'Reply to client...'
              : 'Write a message to freelancer...'
            }
            placeholderTextColor={Colors.textSecondary}
            value={draft}
            onChangeText={setDraft}
            editable={!isLocked && !isReadOnly}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[styles.sendButton, (isLocked || isReadOnly || draft.trim().length === 0) && styles.sendButtonDisabled]}
            activeOpacity={0.86}
            onPress={handleSend}
            disabled={isLocked || isReadOnly || draft.trim().length === 0}
          >
            <MaterialCommunityIcons name={isLocked ? "lock" : isReadOnly ? "eye-outline" : "send"} size={16} color={Colors.white} />
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
  actionBannerWrap: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.xs,
  },
  actionRequestBanner: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  actionBannerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actionBannerTitle: {
    ...Typography.body,
    color: '#1E40AF',
    fontWeight: '800',
    marginBottom: 2,
  },
  actionBannerSub: {
    ...Typography.bodySmall,
    color: '#1E3A8A',
    fontWeight: '600',
    lineHeight: 18,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 9,
    paddingHorizontal: Spacing.base,
  },
  acceptButtonText: {
    ...Typography.bodySmall,
    color: '#fff',
    fontWeight: '800',
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingVertical: 9,
    paddingHorizontal: Spacing.base,
  },
  declineButtonText: {
    ...Typography.bodySmall,
    color: '#DC2626',
    fontWeight: '800',
  },
  buyerPendingBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  buyerPendingText: {
    ...Typography.bodySmall,
    color: '#92400E',
    fontWeight: '700',
    flex: 1,
  },
  acceptedBanner: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  acceptedBannerText: {
    ...Typography.bodySmall,
    color: '#065F46',
    fontWeight: '800',
    flex: 1,
  },
  readOnlyBanner: {
    backgroundColor: '#EEF2FF',
    borderColor: '#A5B4FC',
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  readOnlyBannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  readOnlyBannerTitle: {
    ...Typography.body,
    color: '#3730A3',
    fontWeight: '800',
    marginBottom: 2,
  },
  readOnlyBannerText: {
    ...Typography.bodySmall,
    color: '#4338CA',
    fontWeight: '600',
    lineHeight: 18,
  },
  readOnlyHireButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#6366F1',
    borderRadius: BorderRadius.full,
    paddingVertical: 9,
    paddingHorizontal: Spacing.base,
  },
  readOnlyHireButtonText: {
    ...Typography.bodySmall,
    color: '#fff',
    fontWeight: '800',
  },
});
