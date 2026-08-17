import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { communities, events, freelancers } from '@/data/mockData';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import Avatar from '@/components/ui/Avatar';
import NotificationBell from '@/components/ui/NotificationBell';
import SectionHeader from '@/components/ui/SectionHeader';
import StarRating from '@/components/ui/StarRating';
import Badge from '@/components/ui/Badge';
import { apiFetch, getToken } from '@/constants/api';

function formatCompact(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${value}`;
}

function minServicePrice(freelancer: (typeof freelancers)[number]) {
  return Math.min(...freelancer.services.map((service) => service.price));
}

const getStyles = () => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    contentContainer: {
      paddingBottom: 110,
    },
    heroWrap: {
      paddingHorizontal: Spacing.base,
      paddingBottom: Spacing.lg,
      backgroundColor: Colors.primary,
      overflow: 'hidden',
    },
    heroOrbOne: {
      position: 'absolute',
      width: 180,
      height: 180,
      borderRadius: 999,
      backgroundColor: Colors.primaryLight,
      top: -72,
      right: -48,
    },
    heroOrbTwo: {
      position: 'absolute',
      width: 92,
      height: 92,
      borderRadius: 999,
      backgroundColor: Colors.primaryDark,
      bottom: 14,
      left: -30,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    heroGreetingWrap: {
      flex: 1,
    },
    greetingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginBottom: 2,
    },
    greetingText: {
      ...Typography.body,
      color: Colors.white,
    },
    userName: {
      ...Typography.h1,
      color: Colors.white,
      marginBottom: 2,
    },
    userMeta: {
      ...Typography.bodySmall,
      color: Colors.white,
    },
    heroRightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    notificationButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.26)',
    },
    notificationDot: {
      position: 'absolute',
      top: 8,
      right: 9,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#F97316',
      borderWidth: 1,
      borderColor: Colors.primary,
    },
    metricRow: {
      marginTop: Spacing.lg,
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    metricCard: {
      flex: 1,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
    },
    metricValue: {
      ...Typography.h4,
      color: Colors.text,
      fontWeight: '800',
    },
    metricLabel: {
      ...Typography.caption,
      color: Colors.textSecondary,
      marginTop: 1,
    },
    primaryCtaRow: {
      marginTop: Spacing.base,
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    primaryCtaButton: {
      flex: 1,
      height: 44,
      borderRadius: BorderRadius.full,
      backgroundColor: Colors.primaryDark,
      borderWidth: 1,
      borderColor: Colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    primaryCtaText: {
      ...Typography.bodySmall,
      color: Colors.white,
      fontWeight: '700',
    },
    secondaryCtaButton: {
      flex: 1,
      height: 44,
      borderRadius: BorderRadius.full,
      backgroundColor: Colors.primary,
      borderWidth: 1,
      borderColor: Colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    secondaryCtaText: {
      ...Typography.bodySmall,
      color: Colors.white,
      fontWeight: '700',
    },
    sectionBlock: {
      paddingHorizontal: Spacing.base,
      marginTop: Spacing.lg,
    },
    quickGrid: {
      marginTop: Spacing.sm,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    quickCard: {
      width: '48.5%',
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      padding: Spacing.md,
      ...Shadows.sm,
    },
    quickIconWrap: {
      width: 38,
      height: 38,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    quickCardTitle: {
      ...Typography.body,
      color: Colors.text,
      fontWeight: '700',
    },
    quickCardMeta: {
      ...Typography.caption,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    horizontalContent: {
      paddingTop: Spacing.sm,
      paddingRight: Spacing.base,
      gap: Spacing.sm,
    },
    eventCard: {
      width: 268,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      overflow: 'hidden',
      ...Shadows.md,
    },
    eventCardTop: {
      padding: Spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    eventEmojiWrap: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eventCardTitle: {
      ...Typography.h4,
      color: Colors.text,
      paddingHorizontal: Spacing.md,
      lineHeight: 22,
      marginBottom: 6,
    },
    eventCardMeta: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
      paddingHorizontal: Spacing.md,
    },
    eventCardLocation: {
      ...Typography.caption,
      color: Colors.textSecondary,
      paddingHorizontal: Spacing.md,
      marginTop: 3,
    },
    eventFooterRow: {
      marginTop: Spacing.md,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    eventCommunity: {
      ...Typography.caption,
      color: Colors.primary,
      fontWeight: '700',
      flex: 1,
    },
    registeredPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: BorderRadius.full,
      backgroundColor: Colors.successLight,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    registeredPillText: {
      ...Typography.caption,
      color: Colors.success,
      fontWeight: '700',
    },
    freelancerCard: {
      width: 178,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      padding: Spacing.md,
      ...Shadows.sm,
    },
    freelancerTopRow: {
      alignItems: 'center',
      marginBottom: Spacing.sm,
      position: 'relative',
    },
    freelancerVerified: {
      position: 'absolute',
      bottom: 0,
      right: 46,
    },
    freelancerName: {
      ...Typography.h4,
      color: Colors.text,
      textAlign: 'center',
      marginBottom: 3,
    },
    freelancerRole: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
      textAlign: 'center',
      minHeight: 34,
    },
    freelancerRatingRow: {
      marginTop: Spacing.sm,
      alignItems: 'center',
    },
    freelancerPrice: {
      ...Typography.h4,
      color: Colors.primary,
      textAlign: 'center',
      marginTop: Spacing.sm,
      fontWeight: '800',
    },
    lastSection: {
      marginBottom: 8,
    },
    communityRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      padding: Spacing.md,
      ...Shadows.sm,
      marginTop: Spacing.sm,
    },
    communityIconWrap: {
      width: 42,
      height: 42,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    communityContent: {
      flex: 1,
    },
    communityName: {
      ...Typography.caption,
      ...Typography.subtitle,
      color: Colors.text,
    },
    postAuthorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginTop: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    postAuthorName: {
      ...Typography.bodySmall,
      color: Colors.text,
      fontWeight: '600',
    },
    postContent: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    communityFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.xs,
      paddingTop: Spacing.xs,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    communityLikesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
  });
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const styles = getStyles();

  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>({ completedOrders: 0, earnings: 0 });
  const [liveGigs, setLiveGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHomeData = async () => {
    try {
      const token = await getToken();
      if (token) {
        const profileData = await apiFetch<{ user: any }>('/auth/profile');
        if (profileData?.user) {
          setProfile(profileData.user);
          const endpoint = profileData.user.isSeller ? '/orders/seller' : '/orders/buyer';
          const ordersData = await apiFetch<{ count: number; orders: any[] }>(endpoint).catch(() => null);
          if (ordersData?.orders) {
            const completed = ordersData.orders.filter((o: any) => o.status === 'COMPLETED');
            setStats({
              completedOrders: completed.length,
              earnings: completed.reduce((sum: number, o: any) => sum + (o.price || 0), 0),
            });
          }
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      const gigsData = await apiFetch<{ count: number; gigs: any[] }>('/gigs');
      if (gigsData && Array.isArray(gigsData.gigs)) {
        setLiveGigs(gigsData.gigs);
      }
    } catch (err) {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHomeData();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchHomeData();
    }, [])
  );

  const greetingInfo = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return { text: 'Good morning', icon: 'white-balance-sunny' };
    }

    if (hour < 17) {
      return { text: 'Hello', icon: 'hand-wave-outline' };
    }

    return { text: 'Good evening', icon: 'moon-waning-crescent' };
  }, []);

  const highlightedPosts = useMemo(
    () =>
      communities
        .filter((community) => community.posts.length > 0)
        .flatMap((community) =>
          community.posts.slice(0, 1).map((post) => ({
            ...post,
            community,
          })),
        )
        .slice(0, 3),
    [],
  );

  const featuredFreelancers = useMemo(() => freelancers.slice(0, 6), []);
  const upcomingEvents = useMemo(() => events.slice(0, 4), []);

  const displayName = profile?.name || 'Student User';
  const displayAvatar = profile?.avatarUrl || '';
  const displayUniversity = profile?.university || 'Campus Student';
  const displayYear = profile?.year || '1st Year';
  const displayOrders = stats?.completedOrders ?? 0;
  const displayEarnings = stats?.earnings ?? 0;
  const displayRating = profile?.isVerified ? 5.0 : 4.8;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
          progressBackgroundColor="#0F172A"
        />
      }
    >
      <View style={[styles.heroWrap, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.heroOrbOne} />
        <View style={styles.heroOrbTwo} />

        <View style={styles.heroTopRow}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.88}
            style={styles.heroGreetingWrap}
          >
            <View style={styles.greetingRow}>
              <MaterialCommunityIcons
                name={greetingInfo.icon as any}
                size={20}
                color="#D8E6FF"
              />
              <Text style={styles.greetingText}>{greetingInfo.text}</Text>
            </View>
            <Text style={styles.userName}>{displayName.split(' ')[0]}</Text>
            <Text style={styles.userMeta}>
              {displayUniversity} • {displayYear}
            </Text>
          </TouchableOpacity>

          <View style={styles.heroRightRow}>
            <NotificationBell />
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.88}
            >
              <Avatar uri={displayAvatar} size={46} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.metricRow}>
          <TouchableOpacity
            style={styles.metricCard}
            activeOpacity={0.88}
            onPress={() => router.push('/earnings')}
          >
            <Text style={styles.metricValue}>{displayOrders}</Text>
            <Text style={styles.metricLabel}>Completed orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.metricCard}
            activeOpacity={0.88}
            onPress={() => router.push('/earnings')}
          >
            <Text style={styles.metricValue}>Rs {formatCompact(displayEarnings)}</Text>
            <Text style={styles.metricLabel}>Total earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.metricCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.metricValue}>{displayRating.toFixed(1)}</Text>
            <Text style={styles.metricLabel}>Average rating</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.primaryCtaRow}>
          <TouchableOpacity
            onPress={() => router.push('/post-service')}
            style={styles.primaryCtaButton}
            activeOpacity={0.9}
          >
            <MaterialCommunityIcons name="briefcase-plus-outline" size={16} color={Colors.white} />
            <Text style={styles.primaryCtaText}>Post Service</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/create-event')}
            style={styles.secondaryCtaButton}
            activeOpacity={0.9}
          >
            <MaterialCommunityIcons name="calendar-plus" size={16} color={Colors.white} />
            <Text style={styles.secondaryCtaText}>Create Event</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeader
          title="Quick Access"
          actionLabel="Manage"
          onAction={() => router.push('/(tabs)/profile')}
        />

        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/marketplace')}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: '#DBEAFE' }]}>
              <MaterialCommunityIcons name="compass-outline" size={20} color={Colors.primaryDark} />
            </View>
            <Text style={styles.quickCardTitle}>Explore services</Text>
            <Text style={styles.quickCardMeta}>Find freelancers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/events')}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: '#FFE8D5' }]}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={20} color="#B45309" />
            </View>
            <Text style={styles.quickCardTitle}>Campus events</Text>
            <Text style={styles.quickCardMeta}>Plan your week</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/communities')}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <MaterialCommunityIcons name="account-group-outline" size={20} color="#15803D" />
            </View>
            <Text style={styles.quickCardTitle}>Communities</Text>
            <Text style={styles.quickCardMeta}>Join student groups</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.9}
            onPress={() => router.push('/admin')}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: '#F3E8FF' }]}>
              <MaterialCommunityIcons name="shield-crown-outline" size={20} color="#7E22CE" />
            </View>
            <Text style={styles.quickCardTitle}>Admin panel</Text>
            <Text style={styles.quickCardMeta}>Platform controls</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeader
          title="Trending Events"
          actionLabel="See all"
          onAction={() => router.push('/(tabs)/events')}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContent}
        >
          {upcomingEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              onPress={() => router.push(`/events/${event.id}`)}
              activeOpacity={0.9}
              style={styles.eventCard}
            >
              <View style={[styles.eventCardTop, { backgroundColor: event.communityColor + '16' }]}>
                <View style={[styles.eventEmojiWrap, { backgroundColor: event.communityColor + '26' }]}>
                  <MaterialCommunityIcons name={event.emoji as any} size={22} color={event.communityColor} />
                </View>
                <Badge
                  label={event.isFree ? 'Free' : event.registrationFee || 'Paid'}
                  variant={event.isFree ? 'free' : 'paid'}
                  size="sm"
                />
              </View>

              <Text style={styles.eventCardTitle} numberOfLines={2}>
                {event.title}
              </Text>
              <Text style={styles.eventCardMeta} numberOfLines={1}>
                {event.date} • {event.time}
              </Text>
              <Text style={styles.eventCardLocation} numberOfLines={1}>
                {event.location}
              </Text>

              <View style={styles.eventFooterRow}>
                <Text style={styles.eventCommunity} numberOfLines={1}>
                  {event.community}
                </Text>
                {event.isRegistered ? (
                  <View style={styles.registeredPill}>
                    <MaterialCommunityIcons name="check-circle" size={12} color={Colors.success} />
                    <Text style={styles.registeredPillText}>Registered</Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeader
          title="Active Student Services"
          actionLabel="See all"
          onAction={() => router.push('/(tabs)/marketplace')}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContent}
        >
          {liveGigs.length > 0 ? (
            liveGigs.slice(0, 6).map((gig: any) => (
              <TouchableOpacity
                key={gig.id}
                onPress={() => router.push(`/marketplace/${gig.id}`)}
                style={styles.freelancerCard}
                activeOpacity={0.9}
              >
                <View style={styles.freelancerTopRow}>
                  <Avatar uri={gig.seller?.avatarUrl || gig.imageUrl} size={50} />
                  {gig.seller?.isVerified ? (
                    <MaterialCommunityIcons
                      name="check-decagram"
                      size={16}
                      color={Colors.primary}
                      style={styles.freelancerVerified}
                    />
                  ) : null}
                </View>

                <Text style={styles.freelancerName} numberOfLines={1}>
                  {gig.seller?.name || gig.seller?.username || 'Student Seller'}
                </Text>
                <Text style={styles.freelancerRole} numberOfLines={2}>
                  {gig.title}
                </Text>

                <View style={styles.freelancerRatingRow}>
                  <Badge label={gig.category?.toUpperCase() || 'SERVICE'} variant="info" />
                </View>

                <Text style={styles.freelancerPrice}>Rs. {gig.price}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View
              style={{
                width: '100%',
                padding: Spacing.lg,
                backgroundColor: Colors.surface,
                borderRadius: BorderRadius.xl,
                borderWidth: 1,
                borderColor: Colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="store-search-outline" size={36} color={Colors.primary} style={{ marginBottom: 8 }} />
              <Text style={{ ...Typography.h4, color: Colors.text, textAlign: 'center', marginBottom: 4 }}>
                No active services posted yet
              </Text>
              <Text style={{ ...Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', marginBottom: 14 }}>
                Be the first student on campus to post a service and offer your skills!
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: BorderRadius.full,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
                onPress={() => router.push('/post-service')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="plus-circle" size={18} color={Colors.white} />
                <Text style={{ ...Typography.bodySmall, color: Colors.white, fontWeight: '700' }}>
                  Post First Service
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>

      <View style={[styles.sectionBlock, styles.lastSection]}>
        <SectionHeader
          title="Community Pulse"
          actionLabel="See all"
          onAction={() => router.push('/(tabs)/communities')}
        />

        {highlightedPosts.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => router.push(`/communities/${item.community.id}`)}
            activeOpacity={0.9}
            style={styles.communityRow}
          >
            <View style={[styles.communityIconWrap, { backgroundColor: item.community.color + '18' }]}>
              <MaterialCommunityIcons
                name={item.community.emoji as any}
                size={20}
                color={item.community.color}
              />
            </View>

            <View style={styles.communityContent}>
              <Text style={styles.communityName}>{item.community.name}</Text>
              <Text style={styles.communityTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.communityMetaRow}>
                <Text style={styles.communityTime}>{item.time}</Text>
                <View style={styles.communityLikesRow}>
                  <MaterialCommunityIcons name="heart" size={12} color={Colors.error} />
                  <Text style={styles.communityLikesText}>{item.likes}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

