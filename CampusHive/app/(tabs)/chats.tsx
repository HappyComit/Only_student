import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Avatar from '@/components/ui/Avatar';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAppMode } from '@/constants/appMode';
import { apiFetch } from '@/constants/api';
import { connectSocket, disconnectSocket, getSocket } from '@/constants/socket';

type FilterType = 'all' | 'unread' | 'active' | 'completed';

function formatPreviewTime(value: string) {
  return value;
}

export default function ChatsTabScreen() {
  const { isFreelancerMode } = useAppMode();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchThreads = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await apiFetch<{ count: number; threads: any[] }>('/messages');
      setThreads(data.threads || []);
    } catch (e) {
      console.error('Failed to fetch chat threads:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchThreads(true);
    }, [])
  );

  // ── Real-time updates via Socket.IO ──────────────────────────────
  useEffect(() => {
    let mounted = true;

    const setupSocket = async () => {
      const sock = await connectSocket();
      if (!sock || !mounted) return;

      const handleThreadsUpdated = () => {
        // Silently refresh threads when any conversation gets a new message
        fetchThreads(false);
      };

      sock.on('threads_updated', handleThreadsUpdated);

      return () => {
        sock.off('threads_updated', handleThreadsUpdated);
      };
    };

    const cleanupPromise = setupSocket();

    return () => {
      mounted = false;
      cleanupPromise.then((cleanup) => cleanup?.());
      disconnectSocket();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchThreads(false);
  };

  const decorated = useMemo(
    () =>
      threads.map((thread) => {
        const counterpart = thread.counterpart;
        const latest = thread.latestMessage;

        const name = counterpart.name || counterpart.username;
        const avatar = counterpart.avatarUrl || `https://i.pravatar.cc/150?img=${Math.abs(counterpart.username.charCodeAt(0) % 70) || 12}`;

        const formattedTime = latest
          ? new Date(latest.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '';

        return {
          id: counterpart.id, // Recipient user ID
          counterpartName: name,
          counterpartAvatar: avatar,
          counterpartRole: counterpart.isSeller ? 'Freelancer' : 'Client',
          latestMessage: {
            text: latest ? latest.text : 'Start chatting...',
            time: formattedTime,
          },
          projectTitle: counterpart.isSeller ? 'Freelance Service' : 'Project Hire',
          status: 'in-progress', // Default status for UI badge
          unreadCount: 0,
        };
      }),
    [threads],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return decorated.filter((thread) => {
      if (filter === 'unread' && thread.unreadCount === 0) {
        return false;
      }
      if (filter === 'active' && thread.status !== 'in-progress' && thread.status !== 'inquiry') {
        return false;
      }
      if (filter === 'completed' && thread.status !== 'completed') {
        return false;
      }

      if (!q) {
        return true;
      }

      return (
        thread.counterpartName.toLowerCase().includes(q) ||
        thread.projectTitle.toLowerCase().includes(q) ||
        thread.latestMessage.text.toLowerCase().includes(q)
      );
    });
  }, [decorated, filter, query]);

  const heroTitle = isFreelancerMode ? 'Client Conversations' : 'Freelancer Conversations';
  const heroSub = isFreelancerMode
    ? 'Reply quickly to secure more bookings and keep projects moving.'
    : 'Discuss requirements, delivery timelines, and revisions in one place.';

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.heroCard}>
              <View style={styles.heroOrbA} />
              <View style={styles.heroOrbB} />

              <Text style={styles.heroEyebrow}>{isFreelancerMode ? 'Freelancer Mode' : 'Client Mode'}</Text>
              <Text style={styles.heroTitle}>{heroTitle}</Text>
              <Text style={styles.heroSub}>{heroSub}</Text>

              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatPill}>
                  <Text style={styles.heroStatValue}>{decorated.length}</Text>
                  <Text style={styles.heroStatLabel}>Threads</Text>
                </View>
                <View style={styles.heroStatPill}>
                  <Text style={styles.heroStatValue}>{decorated.filter((item) => item.unreadCount > 0).length}</Text>
                  <Text style={styles.heroStatLabel}>Unread</Text>
                </View>
                <View style={styles.heroStatPill}>
                  <Text style={styles.heroStatValue}>{decorated.filter((item) => item.status === 'in-progress').length}</Text>
                  <Text style={styles.heroStatLabel}>In Progress</Text>
                </View>
              </View>
            </View>

            <View style={styles.searchRow}>
              <MaterialCommunityIcons name="magnify" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by person or project"
                placeholderTextColor={Colors.textSecondary}
                value={query}
                onChangeText={setQuery}
              />
              {query.length > 0 ? (
                <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.85}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'active', label: 'Active' },
                { id: 'completed', label: 'Completed' },
              ].map((item) => {
                const active = filter === (item.id as FilterType);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    activeOpacity={0.85}
                    onPress={() => setFilter(item.id as FilterType)}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{filtered.length} conversations</Text>
              <Text style={styles.sectionSub}>Tap to open</Text>
            </View>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.threadCard}
            activeOpacity={0.86}
            onPress={() => router.push(`/chats/${item.id}`)}
          >
            <View style={styles.threadTopRow}>
              <Avatar uri={item.counterpartAvatar} size={48} />
              <View style={styles.threadTextWrap}>
                <View style={styles.threadNameRow}>
                  <Text style={styles.threadName} numberOfLines={1}>{item.counterpartName}</Text>
                  <View style={styles.rightHeaderGroup}>
                    <Text style={[styles.threadTime, item.unreadCount > 0 && styles.threadTimeUnread]}>
                      {formatPreviewTime(item.latestMessage.time)}
                    </Text>
                    {item.unreadCount > 0 && (
                      <View style={styles.unreadPill}>
                        <Text style={styles.unreadPillText}>{item.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.threadRole}>{item.counterpartRole} • {item.projectTitle}</Text>
                <Text style={[styles.threadPreview, item.unreadCount > 0 && styles.threadPreviewUnread]} numberOfLines={1}>
                  {item.latestMessage.text}
                </Text>
              </View>
            </View>

            <View style={styles.threadFooterRow}>
              <View style={[
                styles.statusPill,
                item.status === 'completed' ? styles.statusCompleted : styles.statusActive,
              ]}>
                <Text style={[
                  styles.statusText,
                  item.status === 'completed' ? styles.statusCompletedText : styles.statusActiveText,
                ]}>
                  {item.status === 'in-progress' ? 'In Progress' : item.status === 'inquiry' ? 'Inquiry' : 'Completed'}
                </Text>
              </View>

              {item.unreadCount === 0 && (
                <MaterialCommunityIcons name="check-all" size={16} color={Colors.textSecondary} />
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          loading && !refreshing ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={[styles.emptyTitle, { marginTop: Spacing.sm }]}>Loading conversations...</Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <MaterialCommunityIcons name="chat-processing-outline" size={34} color={Colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>No conversations found</Text>
              <Text style={styles.emptySub}>Try changing search or filter.</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: 120,
  },
  heroCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  heroOrbA: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    top: -56,
    right: -34,
    opacity: 0.3,
  },
  heroOrbB: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    left: -24,
    bottom: -34,
    opacity: 0.2,
  },
  heroEyebrow: {
    ...Typography.label,
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    ...Typography.h2,
    color: Colors.text,
    lineHeight: 30,
    marginBottom: Spacing.xs,
  },
  heroSub: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: Spacing.base,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  heroStatPill: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  heroStatValue: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '800',
  },
  heroStatLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  searchRow: {
    marginTop: Spacing.base,
    height: 46,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    padding: 0,
  },
  filterContent: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
    paddingRight: Spacing.base,
  },
  filterChip: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  sectionHead: {
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  sectionSub: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  threadCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  threadTopRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  threadTextWrap: {
    flex: 1,
  },
  threadNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    gap: Spacing.xs,
  },
  threadName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '700',
    flex: 1,
  },
  threadTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  threadTimeUnread: {
    color: '#25D366',
    fontWeight: '700',
  },
  rightHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  threadRole: {
    ...Typography.caption,
    color: Colors.primaryDark,
    marginBottom: 2,
    fontWeight: '700',
  },
  threadPreview: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  threadPreviewUnread: {
    color: Colors.text,
    fontWeight: '600',
  },
  threadFooterRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusActive: {
    backgroundColor: Colors.infoLight,
  },
  statusCompleted: {
    backgroundColor: Colors.successLight,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  statusActiveText: {
    color: Colors.info,
  },
  statusCompletedText: {
    color: Colors.success,
  },
  unreadPill: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadPillText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '800',
  },
  emptyCard: {
    marginTop: Spacing.base,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    paddingVertical: 44,
    paddingHorizontal: Spacing.base,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptySub: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
