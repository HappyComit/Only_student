import React, { useMemo, useState, useEffect } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import Avatar from '@/components/ui/Avatar';
import StarRating from '@/components/ui/StarRating';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { apiFetch } from '@/constants/api';
import RazorpayCheckout from '@/components/ui/RazorpayCheckout';


const { width: W } = Dimensions.get('window');

function formatCompact(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${value}`;
}

export default function FreelancerProfile() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedPackage, setSelectedPackage] = useState(0);

  const [gig, setGig] = useState<any | null>(null);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const [razorpayModalVisible, setRazorpayModalVisible] = useState(false);
  const [razorpayData, setRazorpayData] = useState<{
    keyId: string;
    razorpayOrderId: string;
    amount: number;
    pendingOrderId: string;
  } | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const data = await apiFetch<{ user: any }>('/auth/profile');
        if (data?.user) {
          setCurrentUserId(data.user.id);
          setCurrentUserEmail(data.user.email || '');
          setCurrentUserName(data.user.name || data.user.username || '');
        }
      } catch {
        // Guest or unauthenticated
      }
    };
    fetchCurrentUser();
  }, []);

  const [completedOrdersCount, setCompletedOrdersCount] = useState<number>(0);

  useEffect(() => {
    const fetchGigDetails = async () => {
      try {
        const data = await apiFetch<{ gig: any; completedOrdersCount?: number }>(`/gigs/${id}`);
        setGig(data.gig);
        setCompletedOrdersCount(data.completedOrdersCount || 0);
        
        try {
          const reviewsData = await apiFetch<any>(`/reviews/gig/${id}`);
          setReviewsList(reviewsData.reviews || []);
        } catch (revErr) {
          console.error('Error fetching reviews for gig:', revErr);
        }
      } catch (err: any) {
        console.error('Error fetching gig details:', err);
        Alert.alert('Error', 'Failed to load details for this service.');
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchGigDetails();
    }
  }, [id]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/marketplace');
  };

  const handleOrder = async () => {
    if (!gig) return;

    if (!currentUserId) {
      Alert.alert(
        'Sign In Required 🔒',
        'To order this service, please sign in or create your student account.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log In / Sign Up', onPress: () => router.push('/(auth)/auth') }
        ]
      );
      return;
    }

    if (gig.sellerId === currentUserId) {
      Alert.alert(
        'Your Service Listing 💡',
        'You created this service! To test hiring and paying as a buyer, please sign up or log in with a second student account.'
      );
      return;
    }

    setSubmittingOrder(true);
    try {
      // 1. Create pending order in backend
      const orderRes = await apiFetch<any>('/orders', {
        method: 'POST',
        body: JSON.stringify({ gigId: gig.id }),
      });

      const orderId = orderRes.order?.id;
      if (!orderId) {
        throw new Error('Could not initialize order.');
      }

      // 2. Request Razorpay Order ID from backend
      const rzpRes = await apiFetch<any>('/payments/razorpay/create-order', {
        method: 'POST',
        body: JSON.stringify({ orderId, paymentType: 'booking' }),
      });

      setRazorpayData({
        keyId: rzpRes.keyId,
        razorpayOrderId: rzpRes.razorpayOrderId,
        amount: rzpRes.amount || 600,
        pendingOrderId: orderId,
      });

      setRazorpayModalVisible(true);
    } catch (err: any) {
      Alert.alert('Payment Initialization Failed', err.message || 'Could not start Razorpay payment.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handlePaymentSuccess = async (data: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => {
    setRazorpayModalVisible(false);
    if (!razorpayData) return;

    setSubmittingOrder(true);
    try {
      // Cryptographically verify signature on backend
      await apiFetch('/payments/razorpay/verify-signature', {
        method: 'POST',
        body: JSON.stringify({
          orderId: razorpayData.pendingOrderId,
          paymentType: 'booking',
          razorpay_order_id: data.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
        }),
      });

      Alert.alert(
        '₹6 Fee Paid & Request Sent! 🎉',
        `Your hire request for "${gig?.title}" (₹6 platform fee verified via Razorpay) has been sent! The seller will review and accept your request.`,
        [
          {
            text: 'Track Request',
            onPress: () => router.replace('/earnings'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Payment Verification Failed ⚠️', err.message || 'Payment signature could not be verified.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handlePaymentFailure = (errorMsg: string) => {
    setRazorpayModalVisible(false);
    Alert.alert('Payment Failed ❌', errorMsg || 'Transaction was not completed.');
  };

  const handleMessagePress = () => {
    if (!freelancer || !gig) return;

    // Fast sync check — currentUserId is already fetched on mount, no async needed
    if (!currentUserId) {
      Alert.alert(
        'Sign In Required 🔒',
        'To message this freelancer, please sign in or create your student account.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log In / Sign Up', onPress: () => router.push('/(auth)/auth') },
        ]
      );
      return;
    }

    if (gig.sellerId === currentUserId) {
      Alert.alert(
        'Your Service Listing 💡',
        'You cannot message yourself. To test live chat between buyer and seller, log in with a second student account.'
      );
      return;
    }

    // Navigate instantly — zero async calls before navigation
    router.push({
      pathname: '/chats/[id]',
      params: {
        id: `new-${freelancer.id}`,
        freelancerId: freelancer.id,
        freelancerName: freelancer.name,
        freelancerAvatar: freelancer.avatar,
        projectTitle: gig.title,
      },
    });
  };

  const freelancer = useMemo(() => {
    if (!gig) return null;
    const skills = gig.seller.skills 
      ? gig.seller.skills.split(',').map((s: string) => s.trim()) 
      : [];

    const totalReviews = reviewsList.length;
    const avgRating = totalReviews > 0
      ? parseFloat((reviewsList.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 5.0; // Default to 5.0 for new freelancers
      
    return {
      id: gig.seller.id,
      name: gig.seller.name || gig.seller.username,
      role: gig.title,
      university: gig.seller.university || 'Chandigarh University',
      rating: avgRating,
      reviews: totalReviews,
      completedOrders: completedOrdersCount,
      bio: gig.description,
      category: gig.category,
      isVerified: gig.seller.isVerified || false,
      responseTime: gig.seller.responseTime || '~2 hrs',
      skills: skills,
      services: [
        {
          id: gig.id,
          title: gig.title,
          description: gig.description,
          price: gig.price,
          delivery: `${gig.deliveryDays} days`,
          revisions: 3,
        }
      ],
      avatar: gig.seller.avatarUrl || `https://i.pravatar.cc/150?img=${Math.abs(gig.seller.username.charCodeAt(0) % 70) || 12}`,
      reviews_list: reviewsList.map(r => ({
        author: r.reviewer?.name || r.reviewer?.username || 'Student',
        rating: r.rating,
        text: r.comment || 'No written comment.'
      }))
    };
  }, [gig, reviewsList, completedOrdersCount]);

  const reviewBreakdown = useMemo(() => {
    if (!freelancer) return [];
    const buckets = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: freelancer.reviews_list.filter((review) => Math.round(review.rating) === star).length,
    }));

    return buckets.map((item) => ({
      ...item,
      pct: freelancer.reviews ? (item.count / freelancer.reviews) * 100 : 0,
    }));
  }, [freelancer]);

  if (loading) {
    return (
      <View style={[styles.notFound, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.notFoundText, { marginTop: Spacing.md }]}>Loading details...</Text>
      </View>
    );
  }

  if (!freelancer || !gig) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Service not found</Text>
      </View>
    );
  }

  const service = freelancer.services[selectedPackage];
  const minPrice = Math.min(...freelancer.services.map((item) => item.price));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ maxWidth: 900, width: '100%', alignSelf: 'center' }} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#0E2A67', '#1F4EA6']} style={[styles.hero, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.heroOrbA} />
        <View style={styles.heroOrbB} />

        <View style={styles.heroContent}>
          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.navButton}
              activeOpacity={0.86}
              onPress={handleBack}
            >
              <MaterialCommunityIcons name="chevron-left" size={22} color={Colors.white} />
            </TouchableOpacity>

            <View style={styles.navRightRow}>
              <TouchableOpacity
                style={styles.navButton}
                activeOpacity={0.86}
                onPress={() => Alert.alert('Saved', 'Freelancer added to saved profiles.')}
              >
                <MaterialCommunityIcons name="bookmark-outline" size={18} color={Colors.white} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navButton}
                activeOpacity={0.86}
                onPress={() => Alert.alert('Share', 'Share profile feature coming soon.')}
              >
                <MaterialCommunityIcons name="share-variant-outline" size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.topBadgesRow}>
            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="clock-time-four-outline" size={13} color={Colors.white} />
              <Text style={styles.heroBadgeText}>Replies in {freelancer.responseTime}</Text>
            </View>

            {freelancer.isVerified ? (
              <View style={styles.heroBadge}>
                <MaterialCommunityIcons name="check-decagram" size={13} color={Colors.white} />
                <Text style={styles.heroBadgeText}>Verified</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.avatarWrapper}>
            <Avatar uri={freelancer.avatar} size={88} showBorder borderColor="rgba(255,255,255,0.5)" />
            {freelancer.isVerified && (
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="check" size={12} color="#fff" />
              </View>
            )}
          </View>

          <Text style={styles.heroName}>{freelancer.name}</Text>
          <Text style={styles.heroRole}>{freelancer.role}</Text>
          <Text style={styles.heroUni}>{freelancer.university}</Text>

          <View style={styles.ratingRow}>
            <StarRating rating={freelancer.rating} size="sm" showCount={false} />
            <Text style={styles.ratingText}>
              {freelancer.rating.toFixed(1)} ({freelancer.reviews} reviews)
            </Text>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{formatCompact(freelancer.completedOrders)}</Text>
              <Text style={styles.heroStatLabel}>Orders</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{freelancer.services.length}</Text>
              <Text style={styles.heroStatLabel}>Packages</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>Rs {minPrice}</Text>
              <Text style={styles.heroStatLabel}>Starting</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.ctaRowTop}>
          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickActionSecondary]}
            activeOpacity={0.86}
            onPress={handleMessagePress}
          >
            <MaterialCommunityIcons name="message-outline" size={16} color={Colors.primaryDark} />
            <Text style={styles.quickActionSecondaryText}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickActionPrimary]}
            activeOpacity={0.86}
            onPress={handleOrder}
            disabled={submittingOrder}
          >
            <MaterialCommunityIcons name="briefcase-check-outline" size={16} color={Colors.white} />
            <Text style={styles.quickActionPrimaryText}>
              {currentUserId && gig?.sellerId === currentUserId
                ? 'Your Service'
                : submittingOrder
                ? 'Hiring...'
                : 'Hire'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{freelancer.bio}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skills}>
            {freelancer.skills.map((skill: string) => (
              <View key={skill} style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Service Packages</Text>
          <View style={styles.packageTabs}>
            {freelancer.services.map((s, i) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSelectedPackage(i)}
                style={[styles.packageTab, selectedPackage === i && styles.packageTabActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.packageTabText, selectedPackage === i && styles.packageTabTextActive]} numberOfLines={1}>
                  {s.title.split(' ')[0]} {i + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.packageDetail}>
            <Text style={styles.packageTitle}>{service.title}</Text>
            <Text style={styles.packageDesc}>{service.description}</Text>

            <View style={styles.packageMeta}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="clock-time-four-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{service.delivery} delivery</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="refresh" size={14} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{service.revisions} revisions</Text>
              </View>
            </View>

            <View style={styles.packagePriceRow}>
              <Text style={styles.packagePrice}>Rs {service.price}</Text>
              <PrimaryButton
                title={submittingOrder ? 'Placing...' : 'Order Now'}
                onPress={handleOrder}
                size="sm"
              />
            </View>
          </View>
        </View>

        {(() => {
          const portfolioImgs: string[] = Array.isArray(gig?.portfolio) && gig.portfolio.length > 0
            ? gig.portfolio
            : gig?.imageUrl
            ? [gig.imageUrl]
            : [];

          if (portfolioImgs.length === 0) return null;

          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Portfolio</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.portfolio}>
                {portfolioImgs.map((uri: string, i: number) => (
                  <View key={i} style={styles.portfolioCard}>
                    <Image source={{ uri }} style={styles.portfolioImg} contentFit="cover" />
                    <View style={styles.portfolioOverlay}>
                      <Text style={styles.portfolioLabel}>Project {i + 1}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          );
        })()}

        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Reviews ({freelancer.reviews})</Text>

          <View style={styles.overallRatingCard}>
            <View style={styles.overallLeft}>
              <Text style={styles.ratingBig}>{freelancer.rating.toFixed(1)}</Text>
              <StarRating rating={freelancer.rating} size="sm" showCount={false} />
              <Text style={styles.ratingNote}>Based on {freelancer.reviews} reviews</Text>
            </View>

            <View style={styles.overallRight}>
              {reviewBreakdown.map((item) => (
                <View key={item.star} style={styles.ratingBarRow}>
                  <Text style={styles.ratingBarLabel}>{item.star}</Text>
                  <View style={styles.ratingTrack}>
                    <View style={[styles.ratingFill, { width: `${item.pct}%` }]} />
                  </View>
                  <Text style={styles.ratingBarCount}>{item.count}</Text>
                </View>
              ))}
            </View>
          </View>

          {freelancer.reviews_list.map((review, i) => (
            <View key={i} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Avatar name={review.author} size={32} />
                <View style={styles.reviewMeta}>
                  <Text style={styles.reviewAuthor}>{review.author}</Text>
                  <StarRating rating={review.rating} size="sm" showCount={false} />
                </View>
              </View>
              <Text style={styles.reviewText}>{review.text}</Text>
            </View>
          ))}
        </View>

        {razorpayData && (
          <RazorpayCheckout
            visible={razorpayModalVisible}
            onClose={() => setRazorpayModalVisible(false)}
            onSuccess={handlePaymentSuccess}
            onFailure={handlePaymentFailure}
            razorpayKeyId={razorpayData.keyId}
            razorpayOrderId={razorpayData.razorpayOrderId}
            amount={razorpayData.amount}
            name="CampusHive"
            description={`₹6 Booking Fee for ${gig?.title || 'Service'}`}
            prefillEmail={currentUserEmail}
            prefillName={currentUserName}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7FC',
  },
  notFoundText: {
    ...Typography.h4,
    color: Colors.textSecondary,
  },
  hero: {
    paddingBottom: 28,
    overflow: 'hidden',
  },
  navRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  navRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOrbA: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 999,
    top: -72,
    right: -44,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroOrbB: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 999,
    left: -24,
    bottom: -34,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },
  topBadgesRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroBadgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '700',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0A2A5E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  heroName: {
    ...Typography.h1,
    color: '#fff',
    marginBottom: 2,
    textAlign: 'center',
  },
  heroRole: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.86)',
    marginBottom: 4,
    textAlign: 'center',
  },
  heroUni: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 10,
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  ratingText: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 20,
    paddingVertical: 11,
    width: '100%',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    ...Typography.h4,
    color: '#fff',
    fontWeight: '800',
  },
  heroStatLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  body: {
    padding: Spacing.base,
  },
  ctaRowTop: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: BorderRadius.full,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
  },
  quickActionPrimary: {
    backgroundColor: '#0E3B84',
    borderColor: '#0E3B84',
  },
  quickActionSecondary: {
    backgroundColor: Colors.white,
    borderColor: '#D9E3F4',
  },
  quickActionPrimaryText: {
    ...Typography.bodySmall,
    color: Colors.white,
    fontWeight: '700',
  },
  quickActionSecondaryText: {
    ...Typography.bodySmall,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  card: {
    marginBottom: 14,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#DEE6F3',
    padding: Spacing.base,
    ...Shadows.sm,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    ...Typography.h4,
    color: '#132649',
    marginBottom: 12,
    fontWeight: '700',
  },
  bio: {
    ...Typography.body,
    color: '#41526F',
    lineHeight: 21,
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: '#EAF0FC',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  skillText: {
    ...Typography.caption,
    fontWeight: '700',
    color: '#1D3E82',
  },
  packageTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  packageTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F0F3F9',
    alignItems: 'center',
  },
  packageTabActive: {
    backgroundColor: '#0E3B84',
  },
  packageTabText: {
    ...Typography.caption,
    fontWeight: '700',
    color: '#546178',
  },
  packageTabTextActive: {
    color: '#fff',
  },
  packageDetail: {},
  packageTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: '#132649',
    marginBottom: 4,
  },
  packageDesc: {
    ...Typography.bodySmall,
    color: '#435474',
    lineHeight: 19,
    marginBottom: 12,
  },
  packageMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  packagePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E1E8F4',
  },
  packagePrice: {
    ...Typography.h2,
    fontWeight: '800',
    color: '#0E3B84',
  },
  portfolio: {
    marginHorizontal: -Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  portfolioCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginRight: 10,
  },
  portfolioImg: {
    width: Math.min(220, W * 0.58),
    height: 132,
  },
  portfolioOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  portfolioLabel: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '700',
  },
  overallRatingCard: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#DEE6F3',
    ...Shadows.sm,
  },
  overallLeft: {
    width: 90,
  },
  overallRight: {
    flex: 1,
    justifyContent: 'center',
    gap: 5,
  },
  ratingBig: {
    ...Typography.hero,
    fontWeight: '800',
    color: '#132649',
    lineHeight: 34,
    marginBottom: 4,
  },
  ratingNote: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 5,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingBarLabel: {
    ...Typography.caption,
    color: '#31445F',
    width: 10,
    textAlign: 'right',
    fontWeight: '700',
  },
  ratingTrack: {
    flex: 1,
    height: 6,
    borderRadius: 4,
    backgroundColor: '#E4EAF5',
    overflow: 'hidden',
  },
  ratingFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#1F4EA6',
  },
  ratingBarCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    width: 20,
    textAlign: 'right',
  },
  reviewCard: {
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#DEE6F3',
    padding: 14,
    ...Shadows.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  reviewMeta: { flex: 1 },
  reviewAuthor: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: '#132649',
  },
  reviewText: {
    ...Typography.bodySmall,
    color: '#435474',
    lineHeight: 19,
  },
});
