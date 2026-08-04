import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { communities } from '@/data/mockData';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';

type Segment = 'all' | 'following' | 'discover';

function formatMembers(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${value}`;
}

function SegmentControl({
  value,
  onChange,
}: {
  value: Segment;
  onChange: (next: Segment) => void;
}) {
  const options: { id: Segment; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'following', label: 'Following' },
    { id: 'discover', label: 'Discover' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.segmentScrollContent}
      style={styles.segmentScroll}
    >
      {options.map((option) => {
        const active = value === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            activeOpacity={0.85}
            onPress={() => onChange(option.id)}
            style={[styles.segmentChip, active && styles.segmentChipActive]}
          >
            <Text style={[styles.segmentChipText, active && styles.segmentChipTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function CommunityCard({
  item,
  onOpen,
  onToggleFollow,
}: {
  item: (typeof communities)[number];
  onOpen: () => void;
  onToggleFollow: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.92} onPress={onOpen}>
      <View style={styles.cardTop}>
        <View style={[styles.cardIconWrap, { backgroundColor: item.color + '1A' }]}>
          <MaterialCommunityIcons name={item.emoji as any} size={22} color={item.color} />
        </View>

        <View style={styles.cardMain}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.isVerified ? (
              <MaterialCommunityIcons name="check-decagram" size={15} color={Colors.primary} />
            ) : null}
          </View>

          <Text style={styles.cardHandle} numberOfLines={1}>
            @{item.shortName} • {item.university}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onToggleFollow}
          activeOpacity={0.85}
          style={[styles.followButton, item.isFollowing && styles.followingButton]}
        >
          <Text style={[styles.followButtonText, item.isFollowing && styles.followingButtonText]}>
            {item.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.cardDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.cardMetricsRow}>
        <View style={styles.metricPill}>
          <MaterialCommunityIcons name="account-group-outline" size={14} color={Colors.primaryDark} />
          <Text style={styles.metricText}>{formatMembers(item.members)} members</Text>
        </View>

        <View style={styles.metricPill}>
          <MaterialCommunityIcons name="post-outline" size={14} color={Colors.primaryDark} />
          <Text style={styles.metricText}>{item.posts.length} posts</Text>
        </View>

        <View style={styles.metricPill}>
          <MaterialCommunityIcons name="chevron-right" size={14} color={Colors.textSecondary} />
          <Text style={styles.metricText}>Open</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CommunitiesScreen() {
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<Segment>('all');
  const [communityState, setCommunityState] = useState(communities);

  const stats = useMemo(() => {
    const followingCount = communityState.filter((item) => item.isFollowing).length;
    const totalMembers = communityState.reduce((sum, item) => sum + item.members, 0);
    return {
      total: communityState.length,
      following: followingCount,
      members: totalMembers,
    };
  }, [communityState]);

  const filteredCommunities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return communityState
      .filter((item) => {
        if (segment === 'following' && !item.isFollowing) {
          return false;
        }

        if (segment === 'discover' && item.isFollowing) {
          return false;
        }

        if (!query) {
          return true;
        }

        return (
          item.name.toLowerCase().includes(query) ||
          item.university.toLowerCase().includes(query) ||
          item.shortName.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => b.members - a.members);
  }, [communityState, search, segment]);

  const handleToggleFollow = (communityId: string) => {
    setCommunityState((prev) =>
      prev.map((item) =>
        item.id === communityId ? { ...item, isFollowing: !item.isFollowing } : item,
      ),
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Communities" subtitle="Find your tribe on campus" />

      <FlatList
        data={filteredCommunities}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.heroCard}>
              <View style={styles.heroBlurA} />
              <View style={styles.heroBlurB} />

              <Text style={styles.heroEyebrow}>Campus Network</Text>
              <Text style={styles.heroTitle}>Discover communities that match your vibe</Text>
              <Text style={styles.heroSubtitle}>
                Join clubs, follow updates, and connect with students across universities.
              </Text>

              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatPill}>
                  <Text style={styles.heroStatValue}>{stats.total}</Text>
                  <Text style={styles.heroStatLabel}>Communities</Text>
                </View>
                <View style={styles.heroStatPill}>
                  <Text style={styles.heroStatValue}>{stats.following}</Text>
                  <Text style={styles.heroStatLabel}>Following</Text>
                </View>
                <View style={styles.heroStatPill}>
                  <Text style={styles.heroStatValue}>{formatMembers(stats.members)}</Text>
                  <Text style={styles.heroStatLabel}>Members</Text>
                </View>
              </View>
            </View>

            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by club, university, or topic"
                placeholderTextColor={Colors.textSecondary}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 ? (
                <TouchableOpacity activeOpacity={0.8} onPress={() => setSearch('')}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>

            <SegmentControl value={segment} onChange={setSegment} />

            <View style={styles.resultRow}>
              <Text style={styles.resultTitle}>{filteredCommunities.length} communities</Text>
              <Text style={styles.resultSubTitle}>
                {segment === 'all' ? 'All communities' : segment}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <MaterialCommunityIcons name="account-search-outline" size={38} color={Colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No communities found</Text>
            <Text style={styles.emptySubtitle}>Try a different keyword or switch filter tabs.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <CommunityCard
            item={item}
            onOpen={() => router.push(`/communities/${item.id}`)}
            onToggleFollow={() => handleToggleFollow(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
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

  headerContent: {
    marginBottom: Spacing.md,
  },

  heroCard: {
    borderRadius: BorderRadius.xl,
    backgroundColor: '#E8F0FF',
    borderWidth: 1,
    borderColor: '#D3E1FF',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },

  heroBlurA: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: '#CFE0FF',
    top: -56,
    right: -38,
  },

  heroBlurB: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 999,
    backgroundColor: '#BDD4FF',
    bottom: -30,
    left: -24,
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
    maxWidth: '90%',
  },

  heroSubtitle: {
    ...Typography.body,
    color: '#39538D',
    lineHeight: 21,
    marginBottom: Spacing.base,
  },

  heroStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  heroStatPill: {
    flex: 1,
    backgroundColor: '#FFFFFFB3',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#D5E3FF',
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },

  heroStatValue: {
    ...Typography.h4,
    color: '#183B86',
    fontWeight: '800',
  },

  heroStatLabel: {
    ...Typography.caption,
    color: '#35528F',
    marginTop: 2,
  },

  searchBar: {
    marginTop: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 48,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#DCE5F4',
    ...Shadows.sm,
  },

  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    padding: 0,
  },

  segmentScroll: {
    marginTop: Spacing.sm,
  },

  segmentScrollContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.base,
  },

  segmentChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    backgroundColor: '#EAF0F9',
  },

  segmentChipActive: {
    backgroundColor: '#102A61',
  },

  segmentChipText: {
    ...Typography.bodySmall,
    color: '#455775',
    fontWeight: '700',
  },

  segmentChipTextActive: {
    color: Colors.white,
  },

  resultRow: {
    marginTop: Spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  resultTitle: {
    ...Typography.h3,
    color: '#132649',
  },

  resultSubTitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },

  itemSeparator: {
    height: Spacing.base,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#DEE6F3',
    padding: Spacing.base,
    ...Shadows.md,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },

  cardIconWrap: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardMain: {
    flex: 1,
  },

  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  cardName: {
    ...Typography.h4,
    color: '#132649',
    maxWidth: '90%',
  },

  cardHandle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 3,
  },

  followButton: {
    borderRadius: BorderRadius.full,
    backgroundColor: '#123172',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  followingButton: {
    backgroundColor: '#ECF2FF',
    borderWidth: 1,
    borderColor: '#D6E2FA',
  },

  followButtonText: {
    ...Typography.bodySmall,
    color: Colors.white,
    fontWeight: '700',
  },

  followingButtonText: {
    color: '#1D3C84',
  },

  cardDescription: {
    ...Typography.body,
    color: '#3C4C68',
    lineHeight: 21,
    marginTop: Spacing.sm,
  },

  cardMetricsRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },

  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#EDF3FF',
  },

  metricText: {
    ...Typography.caption,
    color: '#2D4A87',
    fontWeight: '700',
  },

  emptyState: {
    marginTop: 16,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#DEE6F3',
    backgroundColor: Colors.white,
    paddingVertical: 44,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
  },

  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
