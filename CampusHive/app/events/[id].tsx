import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { events } from '@/data/mockData';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import PrimaryButton from '@/components/ui/PrimaryButton';

function getCapacityPercent(registeredCount: number, maxCapacity: number) {
  if (maxCapacity === 0) {
    return 0;
  }
  return Math.min(100, Math.round((registeredCount / maxCapacity) * 100));
}

export default function EventDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = events.find((entry) => entry.id === id);

  const [isRegistered, setIsRegistered] = useState(event?.isRegistered ?? false);
  const [loading, setLoading] = useState(false);

  if (!event) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Event not found</Text>
      </View>
    );
  }

  const registrationCount = isRegistered && !event.isRegistered
    ? event.registeredCount + 1
    : event.registeredCount;

  const spotsLeft = Math.max(0, event.maxCapacity - registrationCount);
  const capacityPercent = getCapacityPercent(registrationCount, event.maxCapacity);
  const pricingLabel = event.isFree ? 'Free Entry' : event.registrationFee || 'Paid Entry';

  const urgencyText = useMemo(() => {
    if (spotsLeft === 0) {
      return 'No seats left. Join waitlist to stay updated.';
    }
    if (capacityPercent >= 90) {
      return 'Almost full. Register soon to secure your seat.';
    }
    if (capacityPercent >= 70) {
      return 'Seats are filling up fast.';
    }
    return 'Seats available. Registration is open.';
  }, [capacityPercent, spotsLeft]);

  const eventHighlights = useMemo(() => {
    const lines = [
      `${event.community} hosting this experience`,
      `Starts ${event.date} at ${event.time}`,
      spotsLeft > 0 ? `${spotsLeft} seats currently available` : 'Waitlist likely to open soon',
    ];

    if (event.prize) {
      lines.push(`Prize pool: ${event.prize}`);
    }

    return lines;
  }, [event.community, event.date, event.time, spotsLeft, event.prize]);

  const ctaTitle = useMemo(() => {
    if (isRegistered) {
      return 'You are registered';
    }
    if (spotsLeft === 0) {
      return 'Event is full';
    }
    if (event.isFree) {
      return 'Register for free';
    }
    return `Register for ${event.registrationFee}`;
  }, [event.isFree, event.registrationFee, isRegistered, spotsLeft]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/events');
  };

  const handleRegister = () => {
    if (spotsLeft === 0 || isRegistered || loading) {
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsRegistered(true);
      Alert.alert('Registration successful', `You are now registered for ${event.title}.`);
    }, 1100);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[event.communityColor, '#163A7A']}
        style={[styles.hero, { paddingTop: insets.top + Spacing.sm }]}
      >
        <View style={styles.heroOrbA} />
        <View style={styles.heroOrbB} />

        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navButton} activeOpacity={0.86} onPress={handleBack}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.navRightRow}>
            <TouchableOpacity
              style={styles.navButton}
              activeOpacity={0.86}
              onPress={() => Alert.alert('Saved', 'Event added to your saved list.')}
            >
              <MaterialCommunityIcons name="bookmark-outline" size={18} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              activeOpacity={0.86}
              onPress={() => Alert.alert('Share', 'Share event feature coming soon.')}
            >
              <MaterialCommunityIcons name="share-variant-outline" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroTopPills}>
          <View style={styles.topBadge}>
            <MaterialCommunityIcons name="account-group-outline" size={13} color={Colors.white} />
            <Text style={styles.topBadgeText} numberOfLines={1}>{event.community}</Text>
          </View>
          <View style={styles.topBadge}>
            <MaterialCommunityIcons
              name={event.isFree ? 'ticket-confirmation-outline' : 'cash-multiple'}
              size={13}
              color={Colors.white}
            />
            <Text style={styles.topBadgeText}>{pricingLabel}</Text>
          </View>
        </View>

        <View style={styles.heroIconWrap}>
          <MaterialCommunityIcons name={event.emoji as any} size={38} color={Colors.white} />
        </View>

        <Text style={styles.heroTitle}>{event.title}</Text>
        <Text style={styles.heroSubtitle}>{event.description}</Text>

        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaPill}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={14} color={Colors.white} />
            <Text style={styles.heroMetaText}>{event.date}</Text>
          </View>
          <View style={styles.heroMetaPill}>
            <MaterialCommunityIcons name="clock-time-four-outline" size={14} color={Colors.white} />
            <Text style={styles.heroMetaText}>{event.time}</Text>
          </View>
          <View style={styles.heroMetaPill}>
            <MaterialCommunityIcons name="map-marker-outline" size={14} color={Colors.white} />
            <Text style={styles.heroMetaText} numberOfLines={1}>{event.location}</Text>
          </View>
        </View>

        <View style={styles.heroMetricsCard}>
          <View style={styles.heroMetricCell}>
            <Text style={styles.heroMetricValue}>{registrationCount}</Text>
            <Text style={styles.heroMetricLabel}>Registered</Text>
          </View>
          <View style={styles.heroMetricDivider} />
          <View style={styles.heroMetricCell}>
            <Text style={styles.heroMetricValue}>{spotsLeft}</Text>
            <Text style={styles.heroMetricLabel}>Seats left</Text>
          </View>
          <View style={styles.heroMetricDivider} />
          <View style={styles.heroMetricCell}>
            <Text style={styles.heroMetricValue}>{capacityPercent}%</Text>
            <Text style={styles.heroMetricLabel}>Filled</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What to expect</Text>
          {eventHighlights.map((line) => (
            <View key={line} style={styles.highlightRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={16} color={Colors.primaryDark} />
              <Text style={styles.highlightText}>{line}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Event details</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIconWrap}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={16} color={Colors.primaryDark} />
            </View>
            <View style={styles.detailTextBlock}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{event.date}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconWrap}>
              <MaterialCommunityIcons name="clock-time-four-outline" size={16} color={Colors.primaryDark} />
            </View>
            <View style={styles.detailTextBlock}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{event.time}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconWrap}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={Colors.primaryDark} />
            </View>
            <View style={styles.detailTextBlock}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{event.location}</Text>
            </View>
          </View>

          {event.prize ? (
            <View style={styles.prizeRow}>
              <MaterialCommunityIcons name="trophy-outline" size={16} color="#855700" />
              <Text style={styles.prizeText}>Prize: {event.prize}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.tagsCard}>
          {event.tags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.capacityHeader}>
            <Text style={styles.sectionTitle}>Seat availability</Text>
            <Text style={styles.capacitySubText}>{spotsLeft > 0 ? `${spotsLeft} seats left` : 'No seats left'}</Text>
          </View>

          <View style={styles.capacityTrack}>
            <View
              style={[
                styles.capacityFill,
                {
                  width: `${capacityPercent}%` as any,
                  backgroundColor:
                    capacityPercent >= 90
                      ? Colors.error
                      : capacityPercent >= 75
                        ? Colors.warning
                        : Colors.primary,
                },
              ]}
            />
          </View>

          <Text style={styles.capacityCaption}>{urgencyText}</Text>
        </View>

        <View style={styles.ctaCard}>
          {isRegistered ? (
            <View style={styles.registeredBanner}>
              <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
              <Text style={styles.registeredBannerText}>You are registered for this event.</Text>
            </View>
          ) : null}

          <PrimaryButton
            title={ctaTitle}
            onPress={handleRegister}
            loading={loading}
            disabled={spotsLeft === 0 || isRegistered}
            size="lg"
            fullWidth
          />

          {!event.isFree ? (
            <Text style={styles.feeNote}>Registration fee applies at checkout: {event.registrationFee}</Text>
          ) : null}

          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity
              style={styles.secondaryAction}
              activeOpacity={0.86}
              onPress={() => Alert.alert('Add to Calendar', 'Calendar integration coming soon.')}
            >
              <MaterialCommunityIcons name="calendar-plus" size={16} color={Colors.primaryDark} />
              <Text style={styles.secondaryActionText}>Add to calendar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryAction}
              activeOpacity={0.86}
              onPress={() => Alert.alert('Directions', 'Maps integration coming soon.')}
            >
              <MaterialCommunityIcons name="navigation-variant-outline" size={16} color={Colors.primaryDark} />
              <Text style={styles.secondaryActionText}>Get directions</Text>
            </TouchableOpacity>
          </View>

          {spotsLeft === 0 && !isRegistered ? (
            <TouchableOpacity activeOpacity={0.85} style={styles.waitlistButton}>
              <Text style={styles.waitlistText}>Join waitlist</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.bottomSpacer} />
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
    ...Typography.h3,
    color: Colors.text,
  },
  hero: {
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.base,
    overflow: 'hidden',
  },
  heroOrbA: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    top: -68,
    right: -46,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  heroOrbB: {
    position: 'absolute',
    width: 102,
    height: 102,
    borderRadius: 999,
    left: -26,
    bottom: -34,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  navRow: {
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
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTopPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.base,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '100%',
  },
  topBadgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '700',
    maxWidth: 240,
  },
  heroIconWrap: {
    width: 86,
    height: 86,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: Spacing.base,
  },
  heroTitle: {
    ...Typography.h1,
    color: Colors.white,
    lineHeight: 36,
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 22,
    marginBottom: Spacing.base,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    marginBottom: Spacing.base,
  },
  heroMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroMetaText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '700',
    maxWidth: 200,
  },
  heroMetricsCard: {
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroMetricCell: {
    flex: 1,
    alignItems: 'center',
  },
  heroMetricValue: {
    ...Typography.h4,
    color: Colors.white,
    fontWeight: '800',
  },
  heroMetricLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 2,
  },
  heroMetricDivider: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  content: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.base,
    gap: Spacing.base,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#DEE6F3',
    padding: Spacing.base,
    ...Shadows.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: '#132649',
    marginBottom: Spacing.md,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  highlightText: {
    ...Typography.body,
    color: '#2D3F5F',
    flex: 1,
    lineHeight: 21,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  detailIconWrap: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: '#ECF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextBlock: {
    flex: 1,
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  detailValue: {
    ...Typography.body,
    color: '#2D3F5F',
    fontWeight: '600',
    marginTop: 1,
  },
  prizeRow: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFF2DE',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  prizeText: {
    ...Typography.caption,
    color: '#7B5000',
    fontWeight: '700',
  },
  tagsCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tagChip: {
    borderRadius: BorderRadius.full,
    backgroundColor: '#EAF0FC',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    ...Typography.caption,
    color: '#2D4A86',
    fontWeight: '700',
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  capacitySubText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  capacityTrack: {
    height: 9,
    borderRadius: 5,
    backgroundColor: '#DFE6F2',
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  capacityFill: {
    height: '100%',
    borderRadius: 5,
  },
  capacityCaption: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  ctaCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#DEE6F3',
    padding: Spacing.base,
    ...Shadows.md,
    gap: Spacing.sm,
  },
  registeredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#EAF8F0',
    borderWidth: 1,
    borderColor: '#BFE8D0',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  registeredBannerText: {
    ...Typography.body,
    color: Colors.success,
    fontWeight: '700',
  },
  feeNote: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  secondaryAction: {
    flex: 1,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#D7E2F4',
    backgroundColor: '#F8FBFF',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  secondaryActionText: {
    ...Typography.bodySmall,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  waitlistButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: Spacing.base,
  },
  waitlistText: {
    ...Typography.body,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 44,
  },
});
