import React, { useMemo, useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import Avatar from '@/components/ui/Avatar';
import { apiFetch } from '@/constants/api';

type TabType = 'overview' | 'verifications' | 'flagged';

type FreelancerStatus = {
  id: string;
  isVerified: boolean;
};

function formatCompact(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${value}`;
}

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
      marginBottom: Spacing.sm,
      maxWidth: '94%',
    },
    heroSubtitle: {
      ...Typography.body,
      color: Colors.textSecondary,
      lineHeight: 21,
      marginBottom: Spacing.base,
    },
    heroPillRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    heroPill: {
      borderRadius: BorderRadius.full,
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: 10,
      paddingVertical: 7,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    heroPillText: {
      ...Typography.bodySmall,
      color: Colors.text,
      fontWeight: '700',
    },
    tabScroll: {
      marginTop: Spacing.base,
    },
    tabContent: {
      gap: Spacing.sm,
      paddingRight: Spacing.base,
    },
    tabChip: {
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    tabChipActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    tabChipText: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
      fontWeight: '700',
    },
    tabChipTextActive: {
      color: Colors.white,
    },
    badgeDot: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 5,
      backgroundColor: Colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeDotActive: {
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    badgeDotText: {
      ...Typography.caption,
      color: Colors.text,
      fontWeight: '800',
    },
    badgeDotTextActive: {
      color: Colors.white,
    },
    sectionStack: {
      marginTop: Spacing.base,
      gap: Spacing.base,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    metricCard: {
      width: '48.5%',
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      padding: Spacing.md,
      ...Shadows.sm,
    },
    metricIconWrap: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    metricValue: {
      ...Typography.h3,
      color: Colors.text,
      marginBottom: 2,
    },
    metricLabel: {
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
    blockTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    blockTitle: {
      ...Typography.h4,
      color: Colors.text,
    },
    actionRow: {
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      paddingVertical: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    actionRowLast: {
      paddingBottom: 0,
    },
    actionIcon: {
      width: 34,
      height: 34,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionText: {
      flex: 1,
      ...Typography.body,
      color: Colors.text,
      fontWeight: '600',
    },
    healthRow: {
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      paddingVertical: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    healthRowLast: {
      paddingBottom: 0,
    },
    healthLabel: {
      ...Typography.body,
      color: Colors.textSecondary,
    },
    healthValue: {
      ...Typography.h4,
      fontWeight: '800',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
    },
    sectionHeaderRowWithTopMargin: {
      marginTop: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
    },
    sectionIconBubble: {
      width: 38,
      height: 38,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionHeaderTextWrap: {
      flex: 1,
    },
    sectionHeaderTitle: {
      ...Typography.h4,
      color: Colors.text,
      marginBottom: 2,
    },
    sectionHeaderSubtitle: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
    },
    verifyCardPending: {
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.warningLight,
      backgroundColor: Colors.warning,
      padding: Spacing.md,
      ...Shadows.sm,
    },
    verifyCardConfirmed: {
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      padding: Spacing.md,
      ...Shadows.sm,
    },
    verifyTopRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      alignItems: 'center',
    },
    verifyInfoWrap: {
      flex: 1,
    },
    verifyName: {
      ...Typography.body,
      color: Colors.text,
      fontWeight: '700',
      marginBottom: 1,
    },
    verifyRole: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
    },
    verifyMeta: {
      ...Typography.caption,
      color: Colors.primaryDark,
      marginTop: 4,
      fontWeight: '700',
    },
    rankPill: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: Colors.warningLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankText: {
      ...Typography.caption,
      color: Colors.warning,
      fontWeight: '800',
    },
    verifyButtonRow: {
      marginTop: Spacing.md,
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    verifyButton: {
      flex: 1,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    approveButton: {
      borderColor: Colors.successLight,
      backgroundColor: Colors.successLight,
    },
    rejectButton: {
      borderColor: Colors.errorLight,
      backgroundColor: Colors.errorLight,
    },
    verifyButtonText: {
      ...Typography.bodySmall,
      color: Colors.text,
      fontWeight: '700',
    },
    inlineTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaChipRow: {
      marginTop: 6,
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    metaChip: {
      borderRadius: BorderRadius.full,
      backgroundColor: Colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaChipText: {
      ...Typography.caption,
      color: Colors.primary,
      fontWeight: '700',
    },
    verifyFooterText: {
      ...Typography.caption,
      color: Colors.textSecondary,
      marginTop: Spacing.sm,
    },
    emptyCard: {
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.base,
      alignItems: 'center',
      ...Shadows.sm,
    },
    emptyCardLarge: {
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      paddingVertical: 42,
      paddingHorizontal: Spacing.base,
      alignItems: 'center',
      ...Shadows.sm,
    },
    emptyIconCircle: {
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
      marginTop: Spacing.sm,
      marginBottom: 4,
    },
    emptySubtitle: {
      ...Typography.body,
      color: Colors.textSecondary,
    },
    emptySubtitleCenter: {
      ...Typography.body,
      color: Colors.textSecondary,
      textAlign: 'center',
      maxWidth: '88%',
    },
    ruleRow: {
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      paddingVertical: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    ruleRowLast: {
      paddingBottom: 0,
    },
    ruleText: {
      ...Typography.body,
      color: Colors.textSecondary,
      flex: 1,
    },
  });
};

function TabBar({
  activeTab,
  pendingCount,
  onChange,
  styles,
}: {
  activeTab: TabType;
  pendingCount: number;
  onChange: (tab: TabType) => void;
  styles: ReturnType<typeof getStyles>;
}) {
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'view-dashboard-outline' },
    { id: 'verifications', label: 'Verifications', icon: 'shield-check-outline' },
    { id: 'flagged', label: 'Flagged', icon: 'flag-outline' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabContent}
      style={styles.tabScroll}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabChip, active && styles.tabChipActive]}
            onPress={() => onChange(tab.id)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={14}
              color={active ? Colors.white : Colors.textSecondary}
            />
            <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>{tab.label}</Text>
            {tab.id === 'verifications' && pendingCount > 0 ? (
              <View style={[styles.badgeDot, active && styles.badgeDotActive]}>
                <Text style={[styles.badgeDotText, active && styles.badgeDotTextActive]}>
                  {pendingCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export default function AdminPanelScreen() {
  const styles = getStyles();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalFreelancers: 0,
    verifiedCount: 0,
    pendingCount: 0,
    totalGigs: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [verifiedFreelancers, setVerifiedFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await apiFetch<any>('/auth/admin/stats');
      setStats(data.stats);
      setPendingVerifications(data.pendingList || []);
      setVerifiedFreelancers(data.verifiedList || []);
    } catch (e) {
      console.error('Failed to load admin stats:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats(true);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats(false);
  };

  const approveFreelancer = async (userId: string, name: string) => {
    try {
      await apiFetch(`/auth/admin/verify/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ isVerified: true })
      });
      Alert.alert('Approved', `${name} has been successfully verified!`);
      fetchStats(false);
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Could not verify user.');
    }
  };

  const rejectFreelancer = async (userId: string, name: string) => {
    try {
      await apiFetch(`/auth/admin/verify/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ isVerified: false })
      });
      Alert.alert('Rejected', `${name}'s verification request was rejected.`);
      fetchStats(false);
    } catch (err: any) {
      Alert.alert('Action Failed', err.message || 'Could not update verification.');
    }
  };

  const overviewStats = useMemo(() => {
    return [
      {
        id: 'total-users',
        label: 'Total Users',
        value: `${stats.totalUsers}`,
        icon: 'account-multiple-outline',
        color: Colors.primary,
      },
      {
        id: 'active-freelancers',
        label: 'Freelancers',
        value: `${stats.totalFreelancers}`,
        icon: 'briefcase-variant-outline',
        color: '#6D28D9',
      },
      {
        id: 'verified',
        label: 'Verified',
        value: `${stats.verifiedCount}`,
        icon: 'check-decagram-outline',
        color: Colors.success,
      },
      {
        id: 'orders',
        label: 'Gigs Purchased',
        value: `${stats.totalOrders}`,
        icon: 'package-variant-closed',
        color: Colors.primaryDark,
      },
      {
        id: 'today-revenue',
        label: 'Platform Volume',
        value: `Rs ${formatCompact(stats.totalRevenue)}`,
        icon: 'wallet-outline',
        color: '#059669',
      },
    ];
  }, [stats]);

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: Spacing.md, color: Colors.textSecondary, ...Typography.body }}>Loading dashboard...</Text>
      </View>
    );
  }

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

        <Text style={styles.heroEyebrow}>Admin Console</Text>
        <Text style={styles.heroTitle}>Manage your campus platform from one place</Text>
        <Text style={styles.heroSubtitle}>
          Monitor health, approve freelancers, and keep community content safe and high quality.
        </Text>

        <View style={styles.heroPillRow}>
          <View style={styles.heroPill}>
            <MaterialCommunityIcons name="shield-check-outline" size={14} color={Colors.primaryDark} />
            <Text style={styles.heroPillText}>{verifiedFreelancers.length} verified</Text>
          </View>
          <View style={styles.heroPill}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#92400E" />
            <Text style={styles.heroPillText}>{pendingVerifications.length} pending</Text>
          </View>
        </View>
      </View>

      <TabBar activeTab={activeTab} pendingCount={pendingVerifications.length} onChange={setActiveTab} styles={styles} />

      {activeTab === 'overview' ? (
        <View style={styles.sectionStack}>
          <View style={styles.statsGrid}>
            {overviewStats.map((item) => (
              <View key={item.id} style={styles.metricCard}>
                <View style={[styles.metricIconWrap, { backgroundColor: item.color + '1A' }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={styles.metricValue}>{item.value}</Text>
                <Text style={styles.metricLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.blockCard}>
            <View style={styles.blockTitleRow}>
              <MaterialCommunityIcons name="lightning-bolt-outline" size={18} color={Colors.warning} />
              <Text style={styles.blockTitle}>Quick actions</Text>
            </View>

            {[
              { icon: 'check-circle-outline', text: 'Approve pending verifications', color: Colors.success },
              { icon: 'flag-outline', text: 'Review flagged content', color: Colors.error },
              { icon: 'bullhorn-outline', text: 'Send platform announcement', color: Colors.primaryDark },
              { icon: 'chart-areaspline', text: 'Open analytics dashboard', color: '#0F766E' },
              { icon: 'file-delimited-outline', text: 'Export reports (CSV)', color: '#B45309' },
            ].map((action, index) => (
              <TouchableOpacity
                key={action.text}
                style={[styles.actionRow, index === 4 && styles.actionRowLast]}
                activeOpacity={0.82}
                onPress={() => Alert.alert('Admin action', `"${action.text}" would open here.`)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '18' }]}>
                  <MaterialCommunityIcons name={action.icon as any} size={16} color={action.color} />
                </View>
                <Text style={styles.actionText}>{action.text}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.blockCard}>
            <View style={styles.blockTitleRow}>
              <MaterialCommunityIcons name="heart-pulse" size={18} color={Colors.primaryDark} />
              <Text style={styles.blockTitle}>Platform health</Text>
            </View>

            {[
              { label: 'Order completion rate', value: '94.2%', color: Colors.success },
              { label: 'Avg response time', value: '2.4 hrs', color: Colors.primaryDark },
              { label: 'Dispute rate', value: '1.8%', color: Colors.warning },
              { label: '30-day retention', value: '78%', color: Colors.success },
            ].map((metric, index) => (
              <View key={metric.label} style={[styles.healthRow, index === 3 && styles.healthRowLast]}>
                <Text style={styles.healthLabel}>{metric.label}</Text>
                <Text style={[styles.healthValue, { color: metric.color }]}>{metric.value}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {activeTab === 'verifications' ? (
        <View style={styles.sectionStack}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBubble, { backgroundColor: Colors.warning + '20' }]}>
              <MaterialCommunityIcons name="clock-outline" size={17} color="#A16207" />
            </View>
            <View style={styles.sectionHeaderTextWrap}>
              <Text style={styles.sectionHeaderTitle}>Pending approvals</Text>
              <Text style={styles.sectionHeaderSubtitle}>
                {pendingVerifications.length} freelancer applications waiting review
              </Text>
            </View>
          </View>

          {pendingVerifications.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="check-circle" size={30} color={Colors.success} />
              <Text style={styles.emptyTitle}>All caught up</Text>
              <Text style={styles.emptySubtitle}>No pending verification requests right now.</Text>
            </View>
          ) : (
            pendingVerifications.map((item, index) => (
              <View key={item.id} style={styles.verifyCardPending}>
                <View style={styles.verifyTopRow}>
                  <Avatar uri={item.avatar} size={54} />
                  <View style={styles.verifyInfoWrap}>
                    <Text style={styles.verifyName}>{item.name}</Text>
                    <Text style={styles.verifyRole}>{item.role}</Text>
                    <Text style={styles.verifyMeta}>{item.university}</Text>
                  </View>
                  <View style={styles.rankPill}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                </View>

                <View style={styles.verifyButtonRow}>
                  <TouchableOpacity
                    style={[styles.verifyButton, styles.approveButton]}
                    activeOpacity={0.85}
                    onPress={() => approveFreelancer(item.id, item.name)}
                  >
                    <MaterialCommunityIcons name="check-circle" size={16} color={Colors.success} />
                    <Text style={styles.verifyButtonText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.verifyButton, styles.rejectButton]}
                    activeOpacity={0.85}
                    onPress={() => rejectFreelancer(item.id, item.name)}
                  >
                    <MaterialCommunityIcons name="close-circle" size={16} color={Colors.error} />
                    <Text style={styles.verifyButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <View style={styles.sectionHeaderRowWithTopMargin}>
            <View style={[styles.sectionIconBubble, { backgroundColor: Colors.success + '18' }]}>
              <MaterialCommunityIcons name="check-decagram" size={17} color={Colors.success} />
            </View>
            <View style={styles.sectionHeaderTextWrap}>
              <Text style={styles.sectionHeaderTitle}>Verified freelancers</Text>
              <Text style={styles.sectionHeaderSubtitle}>{verifiedFreelancers.length} trusted creators</Text>
            </View>
          </View>

          {verifiedFreelancers.map((item) => (
            <View key={item.id} style={styles.verifyCardConfirmed}>
              <View style={styles.verifyTopRow}>
                <Avatar uri={item.avatar} size={50} />
                <View style={styles.verifyInfoWrap}>
                  <View style={styles.inlineTitleRow}>
                    <Text style={styles.verifyName}>{item.name}</Text>
                    <MaterialCommunityIcons name="check-decagram" size={14} color={Colors.success} />
                  </View>
                  <Text style={styles.verifyRole}>{item.role}</Text>
                  <View style={styles.metaChipRow}>
                    <View style={styles.metaChip}>
                      <MaterialCommunityIcons name="star" size={12} color={Colors.warning} />
                      <Text style={styles.metaChipText}>{item.rating}</Text>
                    </View>
                    <View style={styles.metaChip}>
                      <MaterialCommunityIcons name="package-variant-closed" size={12} color={Colors.primaryDark} />
                      <Text style={styles.metaChipText}>{item.completedOrders} orders</Text>
                    </View>
                  </View>
                </View>
              </View>
              <Text style={styles.verifyFooterText}>{item.university} • Responds {item.responseTime}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {activeTab === 'flagged' ? (
        <View style={styles.sectionStack}>
          <View style={styles.emptyCardLarge}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="shield-check-outline" size={34} color={Colors.success} />
            </View>
            <Text style={styles.emptyTitle}>No flagged content</Text>
            <Text style={styles.emptySubtitleCenter}>
              Everything looks clean. Auto-moderation is actively protecting the platform.
            </Text>
          </View>

          <View style={styles.blockCard}>
            <View style={styles.blockTitleRow}>
              <MaterialCommunityIcons name="robot-outline" size={18} color={Colors.primaryDark} />
              <Text style={styles.blockTitle}>Auto moderation rules</Text>
            </View>

            {[
              'Spam keyword and link filtering',
              'Price manipulation anomaly checks',
              'Duplicate service detection',
              'Unsafe content pattern blocking',
              'Fake review activity detection',
            ].map((rule, index) => (
              <View key={rule} style={[styles.ruleRow, index === 4 && styles.ruleRowLast]}>
                <MaterialCommunityIcons name="check-circle" size={14} color={Colors.success} />
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
