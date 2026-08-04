import React, { useMemo, useState, useEffect } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-gifted-charts';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import Badge from '@/components/ui/Badge';
import { useAppMode } from '@/constants/appMode';
import { apiFetch } from '@/constants/api';
import { requireAuthOrPromptGuest } from '@/constants/guestGuard';
import NotificationBell from '@/components/ui/NotificationBell';

const SCREEN_WIDTH = Dimensions.get('window').width;

type RangeType = '3m' | '6m';

const STATUS_MAP: Record<string, 'pending' | 'in-progress' | 'completed'> = {
  pending: 'pending',
  'in-progress': 'in-progress',
  completed: 'completed',
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
      gap: Spacing.base,
      maxWidth: 1100,
      width: '100%',
      alignSelf: 'center',
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
      width: 94,
      height: 94,
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
    },
    heroMainAmountRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 6,
      marginBottom: Spacing.sm,
    },
    heroCurrency: {
      ...Typography.h3,
      color: Colors.text,
      fontWeight: '800',
      marginBottom: 2,
    },
    heroAmount: {
      ...Typography.hero,
      color: Colors.text,
    },
    heroMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    heroMetaPill: {
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      paddingHorizontal: 10,
      paddingVertical: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    heroMetaText: {
      ...Typography.caption,
      color: Colors.text,
      fontWeight: '700',
    },
    kpiRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    kpiCard: {
      flex: 1,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      padding: Spacing.md,
      ...Shadows.sm,
    },
    kpiLabel: {
      ...Typography.caption,
      color: Colors.textSecondary,
      marginBottom: 3,
    },
    kpiValue: {
      ...Typography.h4,
      color: Colors.text,
      fontWeight: '800',
      marginBottom: 2,
    },
    kpiSub: {
      ...Typography.caption,
      color: Colors.textSecondary,
    },
    blockCard: {
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      padding: Spacing.base,
      ...Shadows.sm,
    },
    blockHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    blockTitle: {
      ...Typography.h3,
      color: Colors.text,
    },
    blockSubTitle: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
      marginBottom: Spacing.md,
    },
    rangeSwitchWrap: {
      flexDirection: 'row',
      borderRadius: BorderRadius.full,
      backgroundColor: Colors.background,
      padding: 3,
    },
    rangeButton: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
    },
    rangeButtonActive: {
      backgroundColor: Colors.surface,
    },
    rangeButtonText: {
      ...Typography.caption,
      color: Colors.textSecondary,
      fontWeight: '700',
    },
    rangeButtonTextActive: {
      color: Colors.text,
    },
    blockActionText: {
      ...Typography.bodySmall,
      color: Colors.primary,
      fontWeight: '700',
    },
    orderRow: {
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      paddingVertical: Spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    orderRowLast: {
      paddingBottom: 0,
    },
    orderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flex: 1,
    },
    orderIconWrap: {
      width: 38,
      height: 38,
      borderRadius: BorderRadius.md,
      backgroundColor: Colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    orderTextWrap: {
      flex: 1,
    },
    orderClient: {
      ...Typography.body,
      color: Colors.text,
      fontWeight: '700',
    },
    orderService: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
      marginTop: 1,
    },
    orderTime: {
      ...Typography.caption,
      color: Colors.textSecondary,
      marginTop: 3,
    },
    orderRight: {
      alignItems: 'flex-end',
      gap: Spacing.xs,
    },
    orderAmount: {
      ...Typography.body,
      color: Colors.text,
      fontWeight: '800',
    },
    payoutCard: {
      gap: 0,
    },
    payoutRow: {
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      paddingVertical: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    payoutRowLast: {
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      paddingTop: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    payoutIcon: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    payoutTextWrap: {
      flex: 1,
    },
    payoutLabel: {
      ...Typography.body,
      color: Colors.text,
      fontWeight: '700',
    },
    payoutSubText: {
      ...Typography.caption,
      color: Colors.textSecondary,
      marginTop: 1,
    },
    payoutValue: {
      ...Typography.body,
      color: Colors.text,
      fontWeight: '800',
    },
    reviewBtnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: Colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
      alignSelf: 'flex-start',
      marginTop: 6,
    },
    reviewBtnRowText: {
      ...Typography.caption,
      color: Colors.primary,
      fontWeight: '700',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.base,
      borderWidth: 1,
      borderColor: Colors.border,
      ...Shadows.md,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.base,
    },
    modalTitle: {
      ...Typography.h3,
      color: Colors.text,
      fontWeight: '800',
    },
    modalBody: {
      gap: Spacing.base,
      alignItems: 'center',
    },
    modalOrderTitle: {
      ...Typography.body,
      color: Colors.text,
      textAlign: 'center',
      fontWeight: '600',
    },
    starsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginVertical: Spacing.sm,
    },
    commentInput: {
      width: '100%',
      minHeight: 80,
      maxHeight: 120,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: BorderRadius.lg,
      padding: Spacing.sm,
      color: Colors.text,
      ...Typography.bodySmall,
      textAlignVertical: 'top',
    },
    submitBtn: {
      width: '100%',
      backgroundColor: Colors.primary,
      paddingVertical: 12,
      borderRadius: BorderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitBtnText: {
      ...Typography.bodySmall,
      color: Colors.white,
      fontWeight: '700',
    },
  });
};

export default function EarningsScreen() {
  const { isFreelancerMode } = useAppMode();
  const styles = getStyles();
  const [range, setRange] = useState<RangeType>('6m');

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const endpoint = isFreelancerMode ? '/orders/seller' : '/orders/buyer';
      const data = await apiFetch<{ count: number; orders: any[] }>(endpoint);
      setOrders(data.orders || []);
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isFreelancerMode]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders(false);
  };

  const getMappedStatus = (status: string): 'pending' | 'in-progress' | 'completed' => {
    const s = status.toLowerCase();
    if (s === 'delivered') return 'in-progress';
    if (s === 'pending') return 'pending';
    if (s === 'completed') return 'completed';
    return 'in-progress';
  };

  const processRazorpayPayment = async (order: any, paymentType: 'booking' | 'gig') => {
    try {
      const rzpData = await apiFetch<{
        success: boolean;
        razorpayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
      }>('/payments/razorpay/create-order', {
        method: 'POST',
        body: JSON.stringify({ orderId: order.id, paymentType }),
      });

      if (!rzpData.razorpayOrderId) {
        throw new Error('Failed to create Razorpay order ID');
      }

      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: rzpData.keyId,
          amount: rzpData.amount,
          currency: rzpData.currency,
          name: 'CampusHive',
          description: paymentType === 'booking' ? 'Platform Booking Fee' : 'Freelancer Service Payment',
          order_id: rzpData.razorpayOrderId,
          handler: async (response: any) => {
            try {
              await apiFetch('/payments/razorpay/verify-signature', {
                method: 'POST',
                body: JSON.stringify({
                  orderId: order.id,
                  paymentType,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              Alert.alert('Payment Successful!', `Razorpay payment verified. Order status updated!`);
              fetchOrders(false);
            } catch (err: any) {
              Alert.alert('Verification Failed', err.message || 'Signature verification failed.');
            }
          },
          theme: { color: Colors.primary },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        Alert.alert(
          'Razorpay Gateway',
          `Order ID: ${rzpData.razorpayOrderId}\nAmount: Rs. ${rzpData.amount / 100}\n\nProceed to verify Razorpay checkout transaction?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Complete Razorpay Payment',
              onPress: async () => {
                try {
                  const mockPaymentId = 'pay_rzp_' + Math.floor(Math.random() * 10000000);
                  await apiFetch('/payments/razorpay/verify-signature', {
                    method: 'POST',
                    body: JSON.stringify({
                      orderId: order.id,
                      paymentType,
                      razorpay_order_id: rzpData.razorpayOrderId,
                      razorpay_payment_id: mockPaymentId,
                      razorpay_signature: 'simulated_dev_signature',
                    }),
                  });
                  Alert.alert('Payment Verified!', `Razorpay payment verified (${mockPaymentId}). Status updated!`);
                  fetchOrders(false);
                } catch (err: any) {
                  Alert.alert('Error', err.message || 'Payment update failed.');
                }
              },
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Razorpay Order Error', error.message || 'Failed to initiate Razorpay payment.');
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await apiFetch(`/orders/${orderId}/accept`, { method: 'POST' });
      Alert.alert('Order Accepted! 🎉', 'You have accepted the order request. The project is now IN_PROGRESS.');
      fetchOrders(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept order.');
    }
  };

  const handleDeclineOrder = async (orderId: string) => {
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
              await apiFetch(`/orders/${orderId}/decline`, { method: 'POST' });
              Alert.alert('Order Declined', 'The order request has been declined.');
              fetchOrders(false);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to decline order.');
            }
          },
        },
      ]
    );
  };

  const handleOrderAction = async (order: any) => {
    const authorized = await requireAuthOrPromptGuest('manage or pay for orders');
    if (!authorized) return;

    const isBuyer = !isFreelancerMode;
    const status = order.status.toUpperCase();

    if (!isBuyer && (status === 'PENDING_ACCEPTANCE' || status === 'PENDING')) {
      Alert.alert(
        'Hire Request Received! 🔔',
        `Client ${order.buyer?.name || order.buyer?.username || 'Buyer'} wants to hire you for '${order.gig?.title || 'Freelance Service'}' (Rs. ${order.price}).`,
        [
          { text: 'Decline', style: 'destructive', onPress: () => handleDeclineOrder(order.id) },
          { text: 'Accept Order', onPress: () => handleAcceptOrder(order.id) },
        ]
      );
    } else if (isBuyer && (status === 'PENDING_ACCEPTANCE' || status === 'PENDING')) {
      if (!order.bookingFeePaid) {
        Alert.alert(
          'Pay Platform Booking Fee',
          'To start this project, please pay the ₹6 platform booking fee via Razorpay Gateway (Cards, UPI, Netbanking).',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Pay ₹6 via Razorpay',
              onPress: () => processRazorpayPayment(order, 'booking'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Request Pending Acceptance ⏳',
          `Your order request for '${order.gig?.title}' has been sent! Waiting for ${order.seller?.name || order.seller?.username || 'the freelancer'} to accept.`
        );
      }
    } else if (!isBuyer && status === 'IN_PROGRESS') {
      Alert.alert(
        'Deliver Work',
        'Have you completed and delivered the files for this project to the buyer?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mark as Delivered',
            onPress: async () => {
              try {
                await apiFetch(`/orders/${order.id}/deliver`, { method: 'POST' });
                Alert.alert('Delivered', 'Project marked as delivered. Waiting for final payment from buyer.');
                fetchOrders(false);
              } catch (err: any) {
                Alert.alert('Error', err.message || 'Delivery update failed.');
              }
            }
          }
        ]
      );
    } else if (isBuyer && status === 'DELIVERED') {
      Alert.alert(
        'Complete Project & Pay Seller',
        `The freelancer has delivered the work. Please process the payment of Rs. ${order.price} via Razorpay Gateway.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Pay Rs. ${order.price} via Razorpay`,
            onPress: () => processRazorpayPayment(order, 'gig'),
          },
        ]
      );
    } else {
      Alert.alert(
        'Order Info',
        `Service: ${order.gig?.title || 'Freelance Service'}\nPrice: Rs. ${order.price}\nStatus: ${order.status}\nCreated: ${new Date(order.createdAt).toLocaleDateString()}`
      );
    }
  };

  // Calculate real earnings from completed orders in database for logged-in user
  const totalEarnings = useMemo(() => {
    return orders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + (o.price || 0), 0);
  }, [orders]);

  const netEarnings = Math.round(totalEarnings * 0.9);

  const completedOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === 'COMPLETED').length;
  }, [orders]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const nowMonth = new Date().getMonth();
    const currentMonths = months.slice(Math.max(0, nowMonth - 5), nowMonth + 1);

    return currentMonths.map((m, idx) => {
      const monthSum = orders
        .filter((o) => o.status === 'COMPLETED' && new Date(o.createdAt).getMonth() === (nowMonth - (currentMonths.length - 1 - idx)))
        .reduce((sum, o) => sum + (o.price || 0), 0);
      return {
        value: monthSum,
        label: m,
        frontColor: idx === currentMonths.length - 1 ? Colors.primary : '#8FB5FF',
      };
    });
  }, [orders]);

  const monthOverMonth = useMemo(() => {
    if (chartData.length < 2) return 0;
    const last = chartData[chartData.length - 1].value;
    const prev = chartData[chartData.length - 2].value;
    if (prev === 0) return last > 0 ? 100 : 0;
    return Math.round(((last - prev) / prev) * 100);
  }, [chartData]);

  const highestMonth = useMemo(() => {
    if (chartData.length === 0) return { label: 'N/A', value: 0 };
    return chartData.reduce((max, item) => (item.value > max.value ? item : max), chartData[0]);
  }, [chartData]);

  const lastPayoutDate = 'Mar 31';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} />
      }
    >
      <View style={styles.heroCard}>
        <View style={styles.heroOrbA} />
        <View style={styles.heroOrbB} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={styles.heroEyebrow}>My Earnings</Text>
            <Text style={styles.heroTitle}>Track your money like a pro</Text>
          </View>
          <NotificationBell />
        </View>
        <Text style={styles.heroSubtitle}>View growth, orders, and payouts with a clean weekly workflow.</Text>

        <View style={styles.heroMainAmountRow}>
          <Text style={styles.heroCurrency}>Rs</Text>
          <Text style={styles.heroAmount}>{totalEarnings.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaPill}>
            <MaterialCommunityIcons
              name={monthOverMonth >= 0 ? 'trending-up' : 'trending-down'}
              size={14}
              color={monthOverMonth >= 0 ? Colors.success : Colors.error}
            />
            <Text
              style={[
                styles.heroMetaText,
                { color: monthOverMonth >= 0 ? Colors.success : Colors.error },
              ]}
            >
              {monthOverMonth >= 0 ? '+' : ''}
              {monthOverMonth}% vs last month
            </Text>
          </View>

          <View style={styles.heroMetaPill}>
            <MaterialCommunityIcons name="check-circle-outline" size={14} color={Colors.primaryDark} />
            <Text style={styles.heroMetaText}>{completedOrdersCount} completed orders</Text>
          </View>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Net earnings</Text>
          <Text style={styles.kpiValue}>Rs {netEarnings.toLocaleString('en-IN')}</Text>
          <Text style={styles.kpiSub}>After 10% platform fee</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Top month</Text>
          <Text style={styles.kpiValue}>{highestMonth.label}</Text>
          <Text style={styles.kpiSub}>Rs {highestMonth.value.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <View style={styles.blockCard}>
        <View style={styles.blockHeaderRow}>
          <Text style={styles.blockTitle}>Earnings trend</Text>
          <View style={styles.rangeSwitchWrap}>
            <TouchableOpacity
              style={[styles.rangeButton, range === '3m' && styles.rangeButtonActive]}
              activeOpacity={0.85}
              onPress={() => setRange('3m')}
            >
              <Text style={[styles.rangeButtonText, range === '3m' && styles.rangeButtonTextActive]}>3M</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rangeButton, range === '6m' && styles.rangeButtonActive]}
              activeOpacity={0.85}
              onPress={() => setRange('6m')}
            >
              <Text style={[styles.rangeButtonText, range === '6m' && styles.rangeButtonTextActive]}>6M</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.blockSubTitle}>Performance over the selected range</Text>

        <BarChart
          data={chartData}
          width={SCREEN_WIDTH - 96}
          height={165}
          barWidth={22}
          spacing={14}
          roundedTop
          noOfSections={4}
          yAxisTextStyle={{ color: Colors.textSecondary, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: Colors.textSecondary, fontSize: 10, fontWeight: '600' }}
          xAxisColor="#D8E2F3"
          yAxisColor="#D8E2F3"
          hideRules={false}
          rulesColor="#E3EAF6"
          rulesType="solid"
          showGradient
          gradientColor="#BFD6FF"
        />
      </View>

      <View style={styles.blockCard}>
        <View style={styles.blockHeaderRow}>
          <Text style={styles.blockTitle}>{isFreelancerMode ? 'Recent Projects' : 'My Purchases'}</Text>
          <Text style={styles.blockActionText}>Tap to manage</Text>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: Spacing.md }} />
        ) : orders.length === 0 ? (
          <Text style={{ textAlign: 'center', color: Colors.textSecondary, marginVertical: Spacing.md, ...Typography.bodySmall }}>
            No orders found.
          </Text>
        ) : (
          orders.map((order, index) => {
            const partnerName = isFreelancerMode
              ? (order.buyer?.name || order.buyer?.username || 'Client')
              : (order.seller?.name || order.seller?.username || 'Freelancer');
            const mappedStatus = getMappedStatus(order.status);
            const isPendingAcceptance = isFreelancerMode && (order.status === 'PENDING_ACCEPTANCE' || order.status === 'PENDING');
            
            return (
              <TouchableOpacity
                key={order.id}
                style={[styles.orderRow, index === orders.length - 1 && styles.orderRowLast]}
                activeOpacity={0.8}
                onPress={() => handleOrderAction(order)}
              >
                <View style={styles.orderLeft}>
                  <View style={styles.orderIconWrap}>
                    <MaterialCommunityIcons name="briefcase-variant-outline" size={18} color={Colors.primaryDark} />
                  </View>
                  <View style={styles.orderTextWrap}>
                    <Text style={styles.orderClient}>{partnerName}</Text>
                    <Text style={styles.orderService} numberOfLines={1}>
                      {order.gig?.title || 'Freelance Service'}
                    </Text>
                    <Text style={styles.orderTime}>{new Date(order.createdAt).toLocaleDateString()}</Text>

                    {isPendingAcceptance && (
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                        <TouchableOpacity
                          style={{ backgroundColor: '#22C55E', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}
                          onPress={() => handleAcceptOrder(order.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={{ color: Colors.white, fontSize: 11, fontWeight: '700' }}>✅ Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ backgroundColor: '#EF4444', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}
                          onPress={() => handleDeclineOrder(order.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={{ color: Colors.white, fontSize: 11, fontWeight: '700' }}>❌ Decline</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {order.status === 'COMPLETED' && !isFreelancerMode && (
                      order.review ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 2 }}>
                          <MaterialCommunityIcons name="star" size={12} color="#D4A017" />
                          <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>{order.review.rating}/5 Rated</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.reviewBtnRow}
                          activeOpacity={0.7}
                          onPress={() => setSelectedOrderForReview(order)}
                        >
                          <MaterialCommunityIcons name="star-outline" size={12} color={Colors.primary} />
                          <Text style={styles.reviewBtnRowText}>Write Review</Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>

                <View style={styles.orderRight}>
                  <Text style={styles.orderAmount}>Rs {order.price}</Text>
                  <Badge label={order.status.toLowerCase()} variant={STATUS_MAP[mappedStatus] || 'pending'} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <View style={[styles.blockCard, styles.payoutCard]}>
        <Text style={styles.blockTitle}>Payout details</Text>

        <View style={styles.payoutRow}>
          <View style={[styles.payoutIcon, { backgroundColor: '#FFF3E3' }]}>
            <MaterialCommunityIcons name="percent-outline" size={18} color={Colors.warning} />
          </View>
          <View style={styles.payoutTextWrap}>
            <Text style={styles.payoutLabel}>Platform fee</Text>
            <Text style={styles.payoutSubText}>10% charged from gross earnings</Text>
          </View>
          <Text style={styles.payoutValue}>10%</Text>
        </View>

        <View style={styles.payoutRow}>
          <View style={[styles.payoutIcon, { backgroundColor: '#EAF8F0' }]}>
            <MaterialCommunityIcons name="wallet-plus-outline" size={18} color={Colors.success} />
          </View>
          <View style={styles.payoutTextWrap}>
            <Text style={styles.payoutLabel}>Net amount</Text>
            <Text style={styles.payoutSubText}>Transferred to your payout account</Text>
          </View>
          <Text style={[styles.payoutValue, { color: Colors.success }]}>Rs {netEarnings.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.payoutRowLast}>
          <View style={[styles.payoutIcon, { backgroundColor: '#E8F0FF' }]}>
            <MaterialCommunityIcons name="calendar-clock-outline" size={18} color={Colors.primaryDark} />
          </View>
          <View style={styles.payoutTextWrap}>
            <Text style={styles.payoutLabel}>Next payout</Text>
            <Text style={styles.payoutSubText}>Payout cycle every 15 days</Text>
          </View>
          <Text style={styles.payoutValue}>{lastPayoutDate}</Text>
        </View>
      </View>

      {/* Feedback Review Modal */}
      <Modal
        visible={selectedOrderForReview !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedOrderForReview(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity onPress={() => setSelectedOrderForReview(null)}>
                <MaterialCommunityIcons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {selectedOrderForReview && (
              <View style={styles.modalBody}>
                <Text style={styles.modalOrderTitle}>
                  How was your experience for "{selectedOrderForReview.gig?.title}"?
                </Text>

                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setRating(s)}>
                      <MaterialCommunityIcons
                        name={s <= rating ? "star" : "star-outline"}
                        size={32}
                        color={Colors.warning}
                        style={{ marginHorizontal: 4 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.commentInput}
                  placeholder="Share details of your experience with this freelancer..."
                  placeholderTextColor={Colors.textSecondary}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  maxLength={300}
                />

                <TouchableOpacity
                  style={[styles.submitBtn, submittingReview && { opacity: 0.7 }]}
                  disabled={submittingReview}
                  onPress={async () => {
                    if (!selectedOrderForReview) return;
                    setSubmittingReview(true);
                    try {
                      await apiFetch('/reviews', {
                        method: 'POST',
                        body: JSON.stringify({
                          orderId: selectedOrderForReview.id,
                          rating,
                          comment: comment.trim()
                        })
                      });
                      Alert.alert('Review Submitted', 'Thank you for your feedback!');
                      setSelectedOrderForReview(null);
                      setComment('');
                      setRating(5);
                      fetchOrders(false); // Reload orders to update the list
                    } catch (err: any) {
                      Alert.alert('Error', err.message || 'Could not submit review.');
                    } finally {
                      setSubmittingReview(false);
                    }
                  }}
                >
                  {submittingReview ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.submitBtnText}>Submit Feedback</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
