import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { apiFetch, getToken } from '@/constants/api';
import { connectSocket } from '@/constants/socket';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

type NotificationType = 'order' | 'community' | 'event' | 'review' | 'payment';
type FilterType = 'all' | 'unread' | 'payments' | 'community';

type NotificationState = {
  id: string;
  unread: boolean;
};

const TYPE_CONFIG: Record<NotificationType, { iconColor: string; pillBg: string; label: string }> = {
  order: {
    iconColor: '#1D4ED8',
    pillBg: '#E8F0FF',
    label: 'Order',
  },
  community: {
    iconColor: '#7E22CE',
    pillBg: '#F2E8FF',
    label: 'Community',
  },
  event: {
    iconColor: '#B45309',
    pillBg: '#FFF3E3',
    label: 'Event',
  },
  review: {
    iconColor: '#0F766E',
    pillBg: '#E6F8F4',
    label: 'Review',
  },
  payment: {
    iconColor: '#0369A1',
    pillBg: '#E8F7FF',
    label: 'Payment',
  },
};
const getStyles = () => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    content: {
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
    heroSubtitle: {
      ...Typography.body,
      color: Colors.textSecondary,
      lineHeight: 21,
      marginBottom: Spacing.base,
      maxWidth: '95%',
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
    controlRow: {
      marginTop: Spacing.base,
      gap: Spacing.sm,
    },
    filterContent: {
      gap: Spacing.sm,
      paddingRight: Spacing.base,
    },
    filterChip: {
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
    },
    filterChipActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    filterChipText: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
      fontWeight: '700',
    },
    filterChipTextActive: {
      color: Colors.white,
    },
    markAllButton: {
      alignSelf: 'flex-start',
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.primaryLight,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    markAllButtonDisabled: {
      backgroundColor: Colors.background,
      borderColor: Colors.border,
    },
    markAllText: {
      ...Typography.bodySmall,
      color: Colors.primaryDark,
      fontWeight: '700',
    },
    markAllTextDisabled: {
      color: Colors.textSecondary,
    },
    sectionHeaderRow: {
      marginTop: Spacing.base,
      marginBottom: Spacing.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      ...Typography.h3,
      color: Colors.text,
    },
    sectionSubTitle: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
      textTransform: 'capitalize',
    },
    notificationCard: {
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      padding: Spacing.md,
      flexDirection: 'row',
      gap: Spacing.sm,
      ...Shadows.sm,
      marginBottom: Spacing.sm,
    },
    notificationCardUnread: {
      borderColor: Colors.border,
      backgroundColor: Colors.primaryLight,
    },
    notificationIconWrap: {
      width: 46,
      height: 46,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notificationTextWrap: {
      flex: 1,
    },
    notificationTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.xs,
      marginBottom: 2,
    },
    notificationTitle: {
      ...Typography.body,
      color: Colors.text,
      fontWeight: '700',
      flex: 1,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Colors.primary,
    },
    notificationBody: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
      lineHeight: 19,
      marginBottom: Spacing.sm,
    },
    notificationBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      flexWrap: 'wrap',
    },
    typePill: {
      borderRadius: BorderRadius.full,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    typePillText: {
      ...Typography.caption,
      fontWeight: '700',
    },
    notificationTime: {
      ...Typography.caption,
      color: Colors.textSecondary,
    },
    markReadButton: {
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    markReadText: {
      ...Typography.caption,
      color: Colors.primaryDark,
      fontWeight: '700',
    },
    emptyCard: {
      marginTop: Spacing.sm,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      alignItems: 'center',
      paddingVertical: 44,
      paddingHorizontal: Spacing.base,
      ...Shadows.sm,
    },
    emptyIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: Colors.successLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
    },
    emptyTitle: {
      ...Typography.h3,
      color: Colors.text,
      marginBottom: Spacing.xs,
    },
    emptySubTitle: {
      ...Typography.body,
      color: Colors.textSecondary,
      textAlign: 'center',
    },
  });
};
function NotificationCard({
  item,
  unread,
  onMarkRead,
  onPress,
  onAccept,
  onDecline,
  onDelete,
  orderStatus,
  styles,
}: {
  item: any;
  unread: boolean;
  onMarkRead: () => void;
  onPress: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onDelete?: () => void;
  orderStatus?: string;
  styles: ReturnType<typeof getStyles>;
}) {
  const tone = TYPE_CONFIG[item?.type as NotificationType] || TYPE_CONFIG.order;
  const status = orderStatus || item?.orderStatus || item?.status || '';

  // For ORDER_REQUEST notifications, check if the order has been acted upon
  const isOrderRequestType =
    item?.rawType === 'ORDER_REQUEST' || item?.rawType === 'PAYMENT_BOOKING';

  const isDeclined =
    item?.rawType === 'ORDER_DECLINED' || status === 'DECLINED';

  const isAccepted =
    item?.rawType === 'ORDER_ACCEPTED' || status === 'IN_PROGRESS' || status === 'ACCEPTED';

  const isCompleted =
    item?.rawType === 'ORDER_COMPLETED' || status === 'COMPLETED';

  // Check if this specific order has already been acted upon (from orderStatusMap or local status)
  const orderAlreadyActedUpon =
    status === 'DECLINED' || status === 'IN_PROGRESS' || status === 'ACCEPTED' || status === 'COMPLETED';

  const isPendingOrderRequest =
    !orderAlreadyActedUpon &&
    (isOrderRequestType || status === 'PENDING_ACCEPTANCE' || status === 'PENDING');

  return (
    <View style={[styles.notificationCard, unread && styles.notificationCardUnread]}>
      <TouchableOpacity
        style={[styles.notificationIconWrap, { backgroundColor: tone.pillBg }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name={item.icon as any} size={22} color={tone.iconColor} />
      </TouchableOpacity>

      <View style={styles.notificationTextWrap}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
          <View style={styles.notificationTopRow}>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {unread ? <View style={styles.unreadDot} /> : null}
          </View>

          <Text style={styles.notificationBody} numberOfLines={3}>
            {item.body}
          </Text>
        </TouchableOpacity>

        {isAccepted ? (
          <View
            style={{
              backgroundColor: '#D1FAE5',
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 8,
              alignSelf: 'flex-start',
              marginTop: 8,
              marginBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MaterialCommunityIcons name="clock-fast" size={16} color="#059669" />
            <Text style={{ color: '#059669', fontWeight: '800', fontSize: 13 }}>IN_PROGRESS</Text>
          </View>
        ) : isDeclined ? (
          <View
            style={{
              backgroundColor: '#FEE2E2',
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 8,
              alignSelf: 'flex-start',
              marginTop: 8,
              marginBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MaterialCommunityIcons name="close-circle-outline" size={16} color="#DC2626" />
            <Text style={{ color: '#DC2626', fontWeight: '800', fontSize: 13 }}>DECLINED</Text>
          </View>
        ) : isCompleted ? (
          <View
            style={{
              backgroundColor: '#DBEAFE',
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 8,
              alignSelf: 'flex-start',
              marginTop: 8,
              marginBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MaterialCommunityIcons name="check-decagram" size={16} color="#2563EB" />
            <Text style={{ color: '#2563EB', fontWeight: '800', fontSize: 13 }}>COMPLETED</Text>
          </View>
        ) : isPendingOrderRequest ? (
          <View
            style={{
              backgroundColor: '#FEF3C7',
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 8,
              alignSelf: 'flex-start',
              marginTop: 8,
              marginBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MaterialCommunityIcons name="clock-outline" size={16} color="#D97706" />
            <Text style={{ color: '#D97706', fontWeight: '800', fontSize: 13 }}>PENDING — Tap to Open Chat</Text>
          </View>
        ) : null}

        <View style={styles.notificationBottomRow}>
          <View style={[styles.typePill, { backgroundColor: tone.pillBg }]}>
            <Text style={[styles.typePillText, { color: tone.iconColor }]}>{tone.label}</Text>
          </View>
          <Text style={styles.notificationTime}>{item.time}</Text>
          {unread ? (
            <TouchableOpacity style={styles.markReadButton} onPress={onMarkRead} activeOpacity={0.85}>
              <Text style={styles.markReadText}>Mark read</Text>
            </TouchableOpacity>
          ) : null}
          {onDelete ? (
            <TouchableOpacity
              style={[styles.markReadButton, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
              onPress={onDelete}
              activeOpacity={0.85}
            >
              <Text style={[styles.markReadText, { color: '#DC2626' }]}>Delete</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

// In-memory cache for instant zero-latency screen loads (Stale-While-Revalidate)
let cachedNotifications: any[] = [];
let cachedOrderStatusMap: Record<string, string> = {};

export default function NotificationsScreen() {
  const styles = getStyles();
  const [filter, setFilter] = useState<FilterType>('all');
  const [liveList, setLiveList] = useState<any[]>(cachedNotifications);
  const [loading, setLoading] = useState<boolean>(cachedNotifications.length === 0);
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  const [orderStatusMap, setOrderStatusMap] = useState<Record<string, string>>(cachedOrderStatusMap);

  const handleAcceptOrder = async (relatedId?: string, notificationId?: string) => {
    try {
      let targetOrderId = relatedId;
      if (!targetOrderId || targetOrderId.startsWith('notif-') || targetOrderId === 'pending-order') {
        const sellerOrders = await apiFetch<{ orders: any[] }>('/orders/seller');
        const pendingOrder = sellerOrders?.orders?.find(
          (o: any) => o.status === 'PENDING_ACCEPTANCE' || o.status === 'PENDING'
        );
        if (pendingOrder) {
          targetOrderId = pendingOrder.id;
        }
      }

      if (!targetOrderId || targetOrderId === 'pending-order') {
        Alert.alert('Notice ℹ️', 'No active pending order found to accept.');
        return;
      }

      await apiFetch(`/orders/${targetOrderId}/accept`, { method: 'POST' });
      setOrderStatusMap((prev) => ({
        ...prev,
        [targetOrderId!]: 'IN_PROGRESS',
        ...(notificationId ? { [notificationId]: 'IN_PROGRESS' } : {}),
      }));
      Alert.alert('Order Accepted! 🎉', 'You have accepted the order request. The project is now IN_PROGRESS.');
      if (notificationId) markRead(notificationId);
      fetchLiveNotifications();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept order.');
    }
  };

  const handleDeclineOrder = async (relatedId?: string, notificationId?: string) => {
    Alert.alert(
      'Decline Order Request',
      'Are you sure you want to decline this job request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              let targetOrderId = relatedId;
              if (!targetOrderId || targetOrderId.startsWith('notif-') || targetOrderId === 'pending-order') {
                const sellerOrders = await apiFetch<{ orders: any[] }>('/orders/seller');
                const pendingOrder = sellerOrders?.orders?.find(
                  (o: any) => o.status === 'PENDING_ACCEPTANCE' || o.status === 'PENDING'
                );
                if (pendingOrder) {
                  targetOrderId = pendingOrder.id;
                }
              }

              if (!targetOrderId || targetOrderId === 'pending-order') {
                Alert.alert('Notice ℹ️', 'No active pending order found to decline.');
                return;
              }

              await apiFetch(`/orders/${targetOrderId}/decline`, { method: 'POST' });
              setOrderStatusMap((prev) => ({
                ...prev,
                [targetOrderId!]: 'DECLINED',
                ...(notificationId ? { [notificationId]: 'DECLINED' } : {}),
              }));
              Alert.alert('Order Declined', 'The order request has been declined.');
              if (notificationId) markRead(notificationId);
              fetchLiveNotifications();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to decline order.');
            }
          },
        },
      ]
    );
  };

  const fetchLiveNotifications = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        setLiveList([]);
        setLoading(false);
        return;
      }

      // Fetch main notifications payload from network
      const res = await apiFetch('/notifications').catch(() => null);

      if (res && Array.isArray(res.notifications)) {
        const mapped = res.notifications.map((n: any) => ({
          id: n.id,
          title: n.title,
          body: n.message,
          rawType: n.type,
          type: n.type?.toLowerCase().includes('order') ? 'order'
            : n.type?.toLowerCase().includes('review') ? 'review'
              : n.type?.toLowerCase().includes('payment') ? 'payment'
                : n.type?.toLowerCase().includes('community') ? 'community'
                  : 'order',
          icon: n.type?.includes('REQUEST') ? 'bell-ring-outline'
            : n.type?.includes('ACCEPTED') ? 'check-circle-outline'
              : n.type?.includes('DECLINED') ? 'close-circle-outline'
                : n.type?.includes('DELIVERED') ? 'package-variant-closed'
                  : n.type?.includes('COMPLETED') ? 'check-decagram'
                    : n.type?.includes('REVIEW') ? 'star-outline'
                      : n.type?.includes('PAYMENT') ? 'cash-multiple'
                        : 'bell-outline',
          time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: !n.isRead,
          relatedId: n.relatedId,
        }));
        cachedNotifications = mapped;
        setLiveList(mapped);
      } else {
        setLiveList([]);
      }

      // Hide loading spinner strictly when real network fetch finishes
      setLoading(false);

      // Background sync for order status updates (non-blocking)
      Promise.all([
        apiFetch<{ orders: any[] }>('/orders/seller').catch(() => null),
        apiFetch<{ orders: any[] }>('/orders/buyer').catch(() => null),
      ]).then(([sellerOrdersRes, buyerOrdersRes]) => {
        const freshStatusMap: Record<string, string> = {};
        if (sellerOrdersRes && Array.isArray(sellerOrdersRes.orders)) {
          sellerOrdersRes.orders.forEach((o: any) => {
            if (o.id) freshStatusMap[o.id] = o.status;
          });
        }
        if (buyerOrdersRes && Array.isArray(buyerOrdersRes.orders)) {
          buyerOrdersRes.orders.forEach((o: any) => {
            if (o.id) freshStatusMap[o.id] = o.status;
          });
        }
        cachedOrderStatusMap = { ...cachedOrderStatusMap, ...freshStatusMap };
        setOrderStatusMap((prev) => ({ ...prev, ...freshStatusMap }));
      });
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const setupSocket = async () => {
      const sock = await connectSocket();
      if (!sock || !mounted) return;

      const handleUpdate = () => {
        fetchLiveNotifications();
      };

      sock.on('new_notification', handleUpdate);
      sock.on('order_updated', handleUpdate);

      return () => {
        sock.off('new_notification', handleUpdate);
        sock.off('order_updated', handleUpdate);
      };
    };

    const cleanupPromise = setupSocket();

    return () => {
      mounted = false;
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLiveNotifications();
    }, [])
  );

  const unreadCount = useMemo(() => liveList.filter((item) => item.unread).length, [liveList]);

  const filteredData = useMemo(() => {
    if (filter === 'unread') {
      return liveList.filter((item) => item.unread);
    }

    if (filter === 'payments') {
      return liveList.filter((item) => item.type === 'payment' || item.type === 'order');
    }

    if (filter === 'community') {
      return liveList.filter((item) => item.type === 'community' || item.type === 'event');
    }

    return liveList;
  }, [liveList, filter]);

  const markRead = async (id: string) => {
    cachedNotifications = cachedNotifications.map((item) => (item.id === id ? { ...item, unread: false } : item));
    setLiveList((prev) => prev.map((item) => (item.id === id ? { ...item, unread: false } : item)));
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
    } catch {
      // Ignore API errors
    }
  };

  const markAllRead = async () => {
    cachedNotifications = cachedNotifications.map((item) => ({ ...item, unread: false }));
    setLiveList((prev) => prev.map((item) => ({ ...item, unread: false })));
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT' });
    } catch {
      // Ignore API errors
    }
  };

  const handleDelete = (id: string) => {
    cachedNotifications = cachedNotifications.filter((item) => item.id !== id);
    setLiveList((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.heroCard}>
          <View style={styles.heroOrbA} />
          <View style={styles.heroOrbB} />

          <Text style={styles.heroEyebrow}>Inbox</Text>
          <Text style={styles.heroTitle}>Notifications</Text>
          <Text style={styles.heroSubtitle}>Track orders, events, payouts, and updates in one clean timeline.</Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatPill}>
              <Text style={styles.heroStatValue}>{unreadCount}</Text>
              <Text style={styles.heroStatLabel}>Unread</Text>
            </View>
            <View style={styles.heroStatPill}>
              <Text style={styles.heroStatValue}>{liveList.length}</Text>
              <Text style={styles.heroStatLabel}>Total</Text>
            </View>
            <View style={styles.heroStatPill}>
              <Text style={styles.heroStatValue}>{liveList.length - unreadCount}</Text>
              <Text style={styles.heroStatLabel}>Read</Text>
            </View>
          </View>
        </View>

        <View style={styles.controlRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'payments', label: 'Payments' },
              { id: 'community', label: 'Community' },
            ].map((item) => {
              const active = filter === (item.id as FilterType);
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setFilter(item.id as FilterType)}
                  activeOpacity={0.85}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={markAllRead}
            activeOpacity={0.85}
            style={[styles.markAllButton, unreadCount === 0 && styles.markAllButtonDisabled]}
            disabled={unreadCount === 0}
          >
            <MaterialCommunityIcons name="check-all" size={14} color={unreadCount === 0 ? '#8A98B2' : Colors.primaryDark} />
            <Text style={[styles.markAllText, unreadCount === 0 && styles.markAllTextDisabled]}>Mark all read</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{filteredData.length} notifications</Text>
          <Text style={styles.sectionSubTitle}>{filter === 'all' ? 'All updates' : filter}</Text>
        </View>

        {loading ? (
          <View style={styles.emptyCard}>
            <View style={[styles.emptyIconWrap, { backgroundColor: Colors.primaryLight }]}>
              <MaterialCommunityIcons name="bell-outline" size={32} color={Colors.primary} />
            </View>
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: Spacing.xs }} />
            <Text style={styles.emptyTitle}>Loading notifications...</Text>
            <Text style={styles.emptySubTitle}>Fetching your latest updates</Text>
          </View>
        ) : filteredData.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="bell-check-outline" size={34} color={Colors.success} />
            </View>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptySubTitle}>No notifications in this filter right now.</Text>
          </View>
        ) : (
          filteredData.map((item) => {
            const currentStatus = orderStatusMap[item.relatedId] || orderStatusMap[item.id] || item.orderStatus;
            return (
              <NotificationCard
                key={item.id}
                item={item}
                unread={item.unread}
                onMarkRead={() => markRead(item.id)}
                onPress={async () => {
                  markRead(item.id);
                  if (item.relatedId && (item.rawType?.includes('ORDER') || item.rawType?.includes('PAYMENT'))) {
                    try {
                      const res = await apiFetch<{ order: any }>(`/orders/${item.relatedId}`);
                      if (res?.order) {
                        const token = await getToken();
                        if (token) {
                          const profileRes = await apiFetch<{ user: any }>('/auth/profile').catch(() => null);
                          const myId = profileRes?.user?.id;
                          const partnerId = res.order.buyerId === myId ? res.order.sellerId : res.order.buyerId;
                          if (partnerId) {
                            router.push({
                              pathname: '/chats/[id]',
                              params: { id: partnerId },
                            });
                            return;
                          }
                        }
                      }
                    } catch { }
                  }
                  setSelectedNotif(item);
                }}
                onAccept={() => handleAcceptOrder(item.relatedId, item.id)}
                onDecline={() => handleDeclineOrder(item.relatedId, item.id)}
                onDelete={() => handleDelete(item.id)}
                orderStatus={currentStatus}
                styles={styles}
              />
            );
          })
        )}
      </ScrollView>

      {selectedNotif && (() => {
        const selectedIsOrderRequest =
          selectedNotif.rawType === 'ORDER_REQUEST' || selectedNotif.rawType === 'PAYMENT_BOOKING';

        const selectedOrderStatus = orderStatusMap[selectedNotif.relatedId] || orderStatusMap[selectedNotif.id] || '';
        const selectedAlreadyActedUpon =
          selectedOrderStatus === 'DECLINED' || selectedOrderStatus === 'IN_PROGRESS' || selectedOrderStatus === 'ACCEPTED' || selectedOrderStatus === 'COMPLETED';

        const isDeclined =
          selectedNotif.rawType === 'ORDER_DECLINED' || selectedOrderStatus === 'DECLINED';

        const isAccepted =
          selectedNotif.rawType === 'ORDER_ACCEPTED' || selectedOrderStatus === 'IN_PROGRESS' || selectedOrderStatus === 'ACCEPTED';

        const isPendingOrderRequest =
          !selectedAlreadyActedUpon &&
          (selectedIsOrderRequest || selectedOrderStatus === 'PENDING_ACCEPTANCE' || selectedOrderStatus === 'PENDING');

        return (
          <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedNotif(null)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 22, ...Shadows.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text, flex: 1 }}>{selectedNotif.title}</Text>
                  <TouchableOpacity onPress={() => setSelectedNotif(null)}>
                    <MaterialCommunityIcons name="close" size={22} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: 20, lineHeight: 22 }}>
                  {selectedNotif.body}
                </Text>

                {isDeclined ? (
                  <View style={{ backgroundColor: '#FEE2E2', padding: 12, borderRadius: 10, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="close-circle-outline" size={20} color="#DC2626" />
                    <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 14 }}>Order Request Declined</Text>
                  </View>
                ) : isAccepted ? (
                  <View style={{ backgroundColor: '#D1FAE5', padding: 12, borderRadius: 10, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="clock-fast" size={20} color="#059669" />
                    <Text style={{ color: '#059669', fontWeight: '700', fontSize: 14 }}>Order Accepted (IN_PROGRESS)</Text>
                  </View>
                ) : isPendingOrderRequest ? (
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                      onPress={() => {
                        const relId = selectedNotif.relatedId;
                        const notifId = selectedNotif.id;
                        setSelectedNotif(null);
                        handleAcceptOrder(relId, notifId);
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Accept Order</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: '#FEE2E2', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                      onPress={() => {
                        const relId = selectedNotif.relatedId;
                        const notifId = selectedNotif.id;
                        setSelectedNotif(null);
                        handleDeclineOrder(relId, notifId);
                      }}
                    >
                      <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 15 }}>Decline Order</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={{ backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 }}
                  onPress={() => setSelectedNotif(null)}
                >
                  <Text style={{ fontWeight: '600', color: Colors.text }}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        );
      })()}
    </View>
  );
}
