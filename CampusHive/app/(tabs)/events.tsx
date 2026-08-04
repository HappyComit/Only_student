import React, { useMemo, useState, useCallback } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { events } from '@/data/mockData';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';

type EventFilter = 'all' | 'free' | 'paid' | 'trending' | 'registered';

type EventSort = 'recommended' | 'capacity' | 'price';

function formatCount(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${value}`;
}

function getCapacityPercent(registeredCount: number, maxCapacity: number) {
  if (maxCapacity === 0) {
    return 0;
  }
  return Math.min(100, Math.round((registeredCount / maxCapacity) * 100));
}

function HeroBlock() {
  const registeredEvents = events.filter((event) => event.isRegistered).length;
  const totalSeats = events.reduce((sum, event) => sum + event.maxCapacity, 0);

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroOrbTop} />
      <View style={styles.heroOrbBottom} />

      <Text style={styles.heroEyebrow}>Campus Calendar</Text>
      <Text style={styles.heroTitle}>Find events worth your weekend</Text>
      <Text style={styles.heroSubtitle}>
        From hackathons to dance nights, discover events with clear details and one-tap registration.
      </Text>

      <View style={styles.heroStatsRow}>
        <View style={styles.heroStatPill}>
          <Text style={styles.heroStatValue}>{events.length}</Text>
          <Text style={styles.heroStatLabel}>Live events</Text>
        </View>
        <View style={styles.heroStatPill}>
          <Text style={styles.heroStatValue}>{registeredEvents}</Text>
          <Text style={styles.heroStatLabel}>Registered</Text>
        </View>
        <View style={styles.heroStatPill}>
          <Text style={styles.heroStatValue}>{formatCount(totalSeats)}</Text>
          <Text style={styles.heroStatLabel}>Total seats</Text>
        </View>
      </View>
    </View>
  );
}

function FilterRow({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: EventFilter;
  onFilterChange: (value: EventFilter) => void;
}) {
  const options: { id: EventFilter; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: 'apps' },
    { id: 'free', label: 'Free', icon: 'ticket-percent-outline' },
    { id: 'paid', label: 'Paid', icon: 'cash-multiple' },
    { id: 'trending', label: 'Trending', icon: 'trending-up' },
    { id: 'registered', label: 'Registered', icon: 'check-circle-outline' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterScroll}
      contentContainerStyle={styles.filterContent}
    >
      {options.map((option) => {
        const isActive = activeFilter === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            activeOpacity={0.85}
            onPress={() => onFilterChange(option.id)}
            style={[styles.filterChip, isActive && styles.filterChipActive]}
          >
            <MaterialCommunityIcons
              name={option.icon as any}
              size={14}
              color={isActive ? Colors.white : Colors.textSecondary}
            />
            <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function SortRow({
  sort,
  onChange,
}: {
  sort: EventSort;
  onChange: (value: EventSort) => void;
}) {
  const options: { id: EventSort; label: string }[] = [
    { id: 'recommended', label: 'Recommended' },
    { id: 'capacity', label: 'Most Filled' },
    { id: 'price', label: 'Lowest Price' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.sortScroll}
      contentContainerStyle={styles.sortContent}
    >
      {options.map((option) => {
        const active = sort === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            activeOpacity={0.85}
            onPress={() => onChange(option.id)}
            style={[styles.sortChip, active && styles.sortChipActive]}
          >
            <Text style={[styles.sortText, active && styles.sortTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function EventCard({ item }: { item: (typeof events)[number] }) {
  const capacityPercent = getCapacityPercent(item.registeredCount, item.maxCapacity);
  const spotsLeft = Math.max(0, item.maxCapacity - item.registeredCount);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => router.push(`/events/${item.id}`)}
    >
      <View style={[styles.cardTop, { backgroundColor: item.communityColor + '12' }]}>
        <View style={[styles.iconWrap, { backgroundColor: item.communityColor + '24' }]}>
          <MaterialCommunityIcons name={item.emoji as any} size={24} color={item.communityColor} />
        </View>

        <View style={styles.cardHeadTextWrap}>
          <Text style={[styles.communityText, { color: item.communityColor }]} numberOfLines={1}>
            {item.community}
          </Text>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>
        </View>

        <View style={[styles.feeBadge, item.isFree ? styles.feeFree : styles.feePaid]}>
          <Text style={[styles.feeBadgeText, item.isFree ? styles.feeFreeText : styles.feePaidText]}>
            {item.isFree ? 'Free' : item.registrationFee || 'Paid'}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.eventDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={13} color={Colors.primaryDark} />
            <Text style={styles.metaText}>{item.date}</Text>
          </View>
          <View style={styles.metaPill}>
            <MaterialCommunityIcons name="clock-time-four-outline" size={13} color={Colors.primaryDark} />
            <Text style={styles.metaText}>{item.time}</Text>
          </View>
          <View style={styles.metaPill}>
            <MaterialCommunityIcons name="map-marker-outline" size={13} color={Colors.primaryDark} />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        </View>

        <View style={styles.tagRow}>
          {item.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.capacityRow}>
          <Text style={styles.capacityInfoText}>
            {item.registeredCount}/{item.maxCapacity} seats taken
          </Text>
          <Text style={styles.capacityInfoText}>{spotsLeft} left</Text>
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

        <View style={styles.footerRow}>
          {item.isRegistered ? (
            <View style={styles.registeredPill}>
              <MaterialCommunityIcons name="check-circle" size={14} color={Colors.success} />
              <Text style={styles.registeredText}>Registered</Text>
            </View>
          ) : (
            <View style={styles.registerPromptPill}>
              <MaterialCommunityIcons name="arrow-right" size={14} color={Colors.primaryDark} />
              <Text style={styles.registerPromptText}>View and register</Text>
            </View>
          )}

          {item.prize ? (
            <View style={styles.prizePill}>
              <MaterialCommunityIcons name="trophy-outline" size={14} color="#895A07" />
              <Text style={styles.prizePillText} numberOfLines={1}>
                {item.prize}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function EventsScreen() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<EventFilter>('all');
  const [sort, setSort] = useState<EventSort>('recommended');
  const [, setRefreshTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshTick((prev) => prev + 1);
    }, [])
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    const base = events.filter((event) => {
      const matchesQuery =
        query.length === 0 ||
        event.title.toLowerCase().includes(query) ||
        event.community.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.tags.some((tag) => tag.toLowerCase().includes(query));

      let matchesFilter = true;

      if (activeFilter === 'free') {
        matchesFilter = event.isFree;
      }

      if (activeFilter === 'paid') {
        matchesFilter = !event.isFree;
      }

      if (activeFilter === 'trending') {
        matchesFilter = getCapacityPercent(event.registeredCount, event.maxCapacity) >= 70;
      }

      if (activeFilter === 'registered') {
        matchesFilter = event.isRegistered;
      }

      return matchesQuery && matchesFilter;
    });

    const sorted = [...base];

    if (sort === 'capacity') {
      sorted.sort(
        (a, b) =>
          getCapacityPercent(b.registeredCount, b.maxCapacity) -
          getCapacityPercent(a.registeredCount, a.maxCapacity),
      );
    }

    if (sort === 'price') {
      sorted.sort((a, b) => {
        const feeA = a.isFree ? 0 : Number(a.registrationFee?.replace(/[^0-9]/g, '') || 0);
        const feeB = b.isFree ? 0 : Number(b.registrationFee?.replace(/[^0-9]/g, '') || 0);
        return feeA - feeB;
      });
    }

    return sorted;
  }, [search, activeFilter, sort]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Events" subtitle="Plan your campus week better" />

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <HeroBlock />

            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by event, location, or community"
                placeholderTextColor={Colors.textSecondary}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 ? (
                <TouchableOpacity activeOpacity={0.85} onPress={() => setSearch('')}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>

            <FilterRow activeFilter={activeFilter} onFilterChange={setActiveFilter} />
            <SortRow sort={sort} onChange={setSort} />

            <View style={styles.resultsHeaderRow}>
              <Text style={styles.resultsTitle}>{filteredEvents.length} events</Text>
              <Text style={styles.resultsSubtitle}>Sorted by {sort}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="calendar-search" size={36} color={Colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptySubtitle}>Try changing your filters or search keyword.</Text>
          </View>
        }
        renderItem={({ item }) => <EventCard item={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },

  listContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: 120,
  },

  heroCard: {
    borderRadius: BorderRadius.xl,
    backgroundColor: '#EAF2FF',
    borderWidth: 1,
    borderColor: '#D4E5FF',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },

  heroOrbTop: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 999,
    backgroundColor: '#D3E5FF',
    top: -52,
    right: -34,
  },

  heroOrbBottom: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 999,
    backgroundColor: '#C5DCFF',
    bottom: -32,
    left: -20,
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
    color: '#102A61',
    lineHeight: 30,
    marginBottom: Spacing.sm,
    maxWidth: '92%',
  },

  heroSubtitle: {
    ...Typography.body,
    color: '#35528F',
    lineHeight: 21,
    marginBottom: Spacing.base,
  },

  heroStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  heroStatPill: {
    flex: 1,
    backgroundColor: '#FFFFFFB8',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#D4E2FC',
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },

  heroStatValue: {
    ...Typography.h4,
    color: '#183A84',
    fontWeight: '800',
  },

  heroStatLabel: {
    ...Typography.caption,
    color: '#35528F',
    marginTop: 2,
  },

  searchBar: {
    marginTop: Spacing.base,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#DCE5F4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },

  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    padding: 0,
  },

  filterScroll: {
    marginTop: Spacing.base,
  },

  filterContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.base,
  },

  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FA',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },

  filterChipActive: {
    backgroundColor: '#123172',
  },

  filterText: {
    ...Typography.bodySmall,
    color: '#4A5E7D',
    fontWeight: '700',
  },

  filterTextActive: {
    color: Colors.white,
  },

  sortScroll: {
    marginTop: Spacing.sm,
  },

  sortContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.base,
  },

  sortChip: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#D8E2F2',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },

  sortChipActive: {
    borderColor: '#1C3D85',
    backgroundColor: '#ECF2FF',
  },

  sortText: {
    ...Typography.bodySmall,
    color: '#4A5E7D',
    fontWeight: '700',
  },

  sortTextActive: {
    color: '#1C3D85',
  },

  resultsHeaderRow: {
    marginTop: Spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  resultsTitle: {
    ...Typography.h3,
    color: '#132649',
  },

  resultsSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },

  separator: {
    height: Spacing.base,
  },

  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#DEE6F3',
    backgroundColor: Colors.white,
    overflow: 'hidden',
    ...Shadows.md,
  },

  cardTop: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
    padding: Spacing.md,
  },

  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardHeadTextWrap: {
    flex: 1,
  },

  communityText: {
    ...Typography.caption,
    fontWeight: '700',
    marginBottom: 2,
  },

  eventTitle: {
    ...Typography.h4,
    color: '#132649',
    lineHeight: 22,
  },

  feeBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },

  feeFree: {
    backgroundColor: '#E7F8EE',
    borderColor: '#BFE8D0',
  },

  feePaid: {
    backgroundColor: '#FFF4E5',
    borderColor: '#F5D8A8',
  },

  feeBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
  },

  feeFreeText: {
    color: '#0F7A45',
  },

  feePaidText: {
    color: '#8A5B00',
  },

  cardBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },

  eventDescription: {
    ...Typography.body,
    color: '#3D4C68',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },

  metaRow: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },

  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDF3FF',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  metaText: {
    ...Typography.caption,
    color: '#2A4A86',
    fontWeight: '700',
    flex: 1,
  },

  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },

  tagChip: {
    borderRadius: BorderRadius.full,
    backgroundColor: '#F2F5FB',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  tagText: {
    ...Typography.caption,
    color: '#3E4F6B',
    fontWeight: '600',
  },

  capacityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },

  capacityInfoText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },

  capacityTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DFE6F2',
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },

  capacityFill: {
    height: '100%',
    borderRadius: 3,
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  registeredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: '#EAF8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  registeredText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '700',
  },

  registerPromptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: '#EDF3FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  registerPromptText: {
    ...Typography.caption,
    color: Colors.primaryDark,
    fontWeight: '700',
  },

  prizePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFF2DD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '58%',
  },

  prizePillText: {
    ...Typography.caption,
    color: '#7A4F00',
    fontWeight: '700',
    flex: 1,
  },

  emptyState: {
    marginTop: 16,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#DEE6F3',
    backgroundColor: Colors.white,
    paddingVertical: 46,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
  },

  emptyIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EDF2FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },

  emptyTitle: {
    ...Typography.h3,
    color: '#132649',
    marginBottom: Spacing.xs,
  },

  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
