import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { categories } from '@/data/mockData';
import { Colors, BorderRadius, Spacing, Shadows, Typography } from '@/constants/theme';
import Avatar from '@/components/ui/Avatar';
import ScreenHeader from '@/components/ui/ScreenHeader';
import NotificationBell from '@/components/ui/NotificationBell';
import { apiFetch } from '@/constants/api';

export interface MappedFreelancer {
  id: string;
  name: string;
  role: string;
  university: string;
  rating: number;
  reviews: number;
  completedOrders: number;
  bio: string;
  category: string;
  isVerified: boolean;
  responseTime: string;
  skills: string[];
  services: {
    id: string;
    title: string;
    description: string;
    price: number;
    delivery: string;
    revisions: number;
  }[];
  avatar: string;
}

type QuickFilter = 'best' | 'top' | 'fast' | 'budget';

function getMinPrice(item: MappedFreelancer) {
  return Math.min(...item.services.map((service) => service.price));
}

function getResponseHours(responseTime: string) {
  const match = responseTime.match(/\d+/);
  return match ? Number(match[0]) : 99;
}

function formatCount(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${value}`;
}

function HeroBanner({ activeCount }: { activeCount: number }) {
  return (
    <View style={styles.heroWrap}>
      <View style={styles.heroAccentTop} />
      <View style={styles.heroAccentBottom} />

      <Text style={styles.heroEyebrow}>Campus Marketplace</Text>
      <Text style={styles.heroTitle}>Hire trusted student talent in minutes</Text>
      <Text style={styles.heroSubtitle}>
        Designers, editors, coders, and creators ready to work with clear pricing and quick responses.
      </Text>

      <View style={styles.heroStatsRow}>
        <View style={styles.heroStatPill}>
          <MaterialCommunityIcons name="account-group-outline" size={16} color={Colors.primaryDark} />
          <Text style={styles.heroStatText}>{activeCount} active listings</Text>
        </View>
        <View style={styles.heroStatPill}>
          <MaterialCommunityIcons name="star" size={16} color={Colors.warning} />
          <Text style={styles.heroStatText}>Avg 4.8 rating</Text>
        </View>
      </View>
    </View>
  );
}

function CategoryFilter({
  activeCategory,
  onCategoryChange,
}: {
  activeCategory: string;
  onCategoryChange: (id: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesContent}
      style={styles.categoriesScroll}
    >
      <TouchableOpacity
        onPress={() => onCategoryChange('all')}
        activeOpacity={0.8}
        style={[styles.categoryChip, activeCategory === 'all' && styles.categoryChipActive]}
      >
        <MaterialCommunityIcons
          name="apps"
          size={16}
          color={activeCategory === 'all' ? Colors.white : Colors.primary}
        />
        <Text style={[styles.categoryChipText, activeCategory === 'all' && styles.categoryChipTextActive]}>
          All
        </Text>
      </TouchableOpacity>

      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          onPress={() => onCategoryChange(category.id)}
          activeOpacity={0.8}
          style={[
            styles.categoryChip,
            activeCategory === category.id && styles.categoryChipActive,
          ]}
        >
          <MaterialCommunityIcons
            name={category.icon as any}
            size={16}
            color={activeCategory === category.id ? Colors.white : Colors.primary}
          />
          <Text
            style={[
              styles.categoryChipText,
              activeCategory === category.id && styles.categoryChipTextActive,
            ]}
          >
            {category.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function QuickFilterRow({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: QuickFilter;
  onFilterChange: (value: QuickFilter) => void;
}) {
  const options: { id: QuickFilter; label: string; icon: string }[] = [
    { id: 'best', label: 'Best Match', icon: 'compass-outline' },
    { id: 'top', label: 'Top Rated', icon: 'star-outline' },
    { id: 'fast', label: 'Fast Reply', icon: 'clock-time-three-outline' },
    { id: 'budget', label: 'Budget', icon: 'currency-inr' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickFilterContent}
      style={styles.quickFilterScroll}
    >
      {options.map((option) => {
        const isActive = activeFilter === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => onFilterChange(option.id)}
            activeOpacity={0.8}
            style={[styles.quickFilterChip, isActive && styles.quickFilterChipActive]}
          >
            <MaterialCommunityIcons
              name={option.icon as any}
              size={14}
              color={isActive ? Colors.white : Colors.textSecondary}
            />
            <Text style={[styles.quickFilterText, isActive && styles.quickFilterTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function FreelancerCard({ item }: { item: MappedFreelancer }) {
  const minPrice = getMinPrice(item);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => router.push(`/marketplace/${item.id}`)}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.avatarWrap}>
          <Avatar uri={item.avatar} size={52} />
          {item.isVerified ? (
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={14} color={Colors.success} />
            </View>
          ) : null}
        </View>

        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cardRole} numberOfLines={1}>
            {item.role}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <MaterialCommunityIcons name="school-outline" size={12} color={Colors.primaryDark} />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.university}
              </Text>
            </View>
            <View style={styles.metaBadge}>
              <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.primaryDark} />
              <Text style={styles.metaText}>Reply {item.responseTime}</Text>
            </View>
          </View>
        </View>

        <View style={styles.ratingBox}>
          <MaterialCommunityIcons name="star" size={14} color={Colors.warning} />
          <Text style={styles.ratingValue}>{item.rating.toFixed(1)}</Text>
          <Text style={styles.ratingCount}>({item.reviews})</Text>
        </View>
      </View>

      <View style={styles.skillRow}>
        {item.skills.slice(0, 3).map((skill) => (
          <View key={skill} style={styles.skillChip}>
            <Text style={styles.skillChipText} numberOfLines={1}>
              {skill}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.serviceStrip}>
        <MaterialCommunityIcons name="briefcase-outline" size={14} color={Colors.textSecondary} />
        <Text style={styles.serviceText} numberOfLines={1}>
          {item.services[0]?.title || 'Custom service'}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.priceLabel}>Starting from</Text>
          <Text style={styles.priceValue}>Rs. {minPrice}</Text>
        </View>

        <View style={styles.cardFooterRight}>
          <Text style={styles.ordersText}>{item.completedOrders} orders done</Text>
          <View style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View profile</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MarketplaceScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilter>('best');
  
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGigs = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    try {
      // Fetch all gigs from backend
      const data = await apiFetch<{ count: number; gigs: any[] }>('/gigs');
      setGigs(data.gigs || []);
    } catch (err: any) {
      console.error('Failed to load gigs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGigs();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGigs(false);
  };

  // Convert backend gigs array to the shape expected by the frontend card UI
  const mappedGigs = useMemo<MappedFreelancer[]>(() => {
    return gigs.map((gig) => {
      const skills = gig.seller.skills 
        ? gig.seller.skills.split(',').map((s: string) => s.trim()) 
        : [];
        
      return {
        id: gig.id,
        name: gig.seller.name || gig.seller.username,
        role: gig.title,
        university: gig.seller.university || 'Chandigarh University',
        rating: 4.8, // Default rating fallback
        reviews: 12, // Default reviews fallback
        completedOrders: 15, // Default completed orders fallback
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
      };
    });
  }, [gigs]);

  const filteredFreelancers = useMemo(() => {
    const base = mappedGigs.filter((freelancer) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        freelancer.name.toLowerCase().includes(q) ||
        freelancer.role.toLowerCase().includes(q) ||
        freelancer.university.toLowerCase().includes(q) ||
        freelancer.skills.some((skill) => skill.toLowerCase().includes(q));

      const matchesCategory =
        activeCategory === 'all' || freelancer.category === activeCategory;

      return matchesSearch && matchesCategory;
    });

    const sorted = [...base];

    if (activeQuickFilter === 'top') {
      sorted.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    }

    if (activeQuickFilter === 'fast') {
      sorted.sort(
        (a, b) => getResponseHours(a.responseTime) - getResponseHours(b.responseTime),
      );
    }

    if (activeQuickFilter === 'budget') {
      sorted.sort((a, b) => getMinPrice(a) - getMinPrice(b));
    }

    return sorted;
  }, [mappedGigs, searchQuery, activeCategory, activeQuickFilter]);

  const clearSearch = () => setSearchQuery('');

  const renderEmpty = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.emptyStateContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.emptyTitle, { marginTop: Spacing.md }]}>Loading listings...</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyIconBox}>
          <MaterialCommunityIcons name="magnify" size={40} color={Colors.textSecondary} />
        </View>
        <Text style={styles.emptyTitle}>No creators found</Text>
        <Text style={styles.emptySubtitle}>
          Try a different skill, category, or switch to Best Match.
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Marketplace" subtitle="Find trusted campus professionals" />

      <FlatList
        data={filteredFreelancers}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <HeroBanner activeCount={mappedGigs.length} />

            <View style={styles.searchWrap}>
              <View style={styles.searchBar}>
                <MaterialCommunityIcons name="magnify" size={18} color={Colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name, skill, role..."
                  placeholderTextColor={Colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={clearSearch} activeOpacity={0.8}>
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={18}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <CategoryFilter
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />

            <QuickFilterRow
              activeFilter={activeQuickFilter}
              onFilterChange={setActiveQuickFilter}
            />

            <View style={styles.resultRow}>
              <Text style={styles.resultTitle}>{filteredFreelancers.length} creators</Text>
              <Text style={styles.resultSubtext}>
                Showing {activeQuickFilter === 'best' ? 'best matches' : activeQuickFilter}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => <FreelancerCard item={item} />}
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
    paddingBottom: 120,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },

  headerBlock: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
  },

  heroWrap: {
    borderRadius: BorderRadius.xl,
    backgroundColor: '#EAF2FF',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D8E7FF',
    ...Shadows.sm,
  },

  heroAccentTop: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: '#D6E6FF',
    top: -52,
    right: -34,
  },

  heroAccentBottom: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 999,
    backgroundColor: '#C6DBFF',
    bottom: -38,
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
    color: '#0F2B6B',
    lineHeight: 28,
    marginBottom: Spacing.sm,
    maxWidth: '92%',
  },

  heroSubtitle: {
    ...Typography.body,
    color: '#35528F',
    lineHeight: 22,
    marginBottom: Spacing.base,
  },

  heroStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  heroStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: '#FFFFFFB3',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#D3E3FF',
  },

  heroStatText: {
    ...Typography.bodySmall,
    color: '#27427D',
    fontWeight: '600',
  },

  searchWrap: {
    marginTop: Spacing.base,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#DDE4F1',
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.sm,
    ...Shadows.sm,
  },

  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    padding: 0,
  },

  categoriesScroll: {
    marginTop: Spacing.base,
  },

  categoriesContent: {
    paddingRight: Spacing.base,
    gap: Spacing.sm,
  },

  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#D8E0EE',
    backgroundColor: Colors.white,
    gap: Spacing.xs,
  },

  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  categoryChipText: {
    ...Typography.bodySmall,
    color: '#2E3A53',
    fontWeight: '600',
  },

  categoryChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },

  quickFilterScroll: {
    marginTop: Spacing.sm,
  },

  quickFilterContent: {
    paddingRight: Spacing.base,
    gap: Spacing.sm,
  },

  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: '#EEF2F9',
  },

  quickFilterChipActive: {
    backgroundColor: '#0F2B6B',
  },

  quickFilterText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  quickFilterTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },

  resultRow: {
    marginTop: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  resultTitle: {
    ...Typography.h3,
    color: '#12254B',
  },

  resultSubtext: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },

  itemSeparator: {
    height: Spacing.base,
  },

  card: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#DDE5F1',
    padding: Spacing.base,
    ...Shadows.md,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },

  avatarWrap: {
    position: 'relative',
    width: 52,
    height: 52,
  },

  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardTitleBlock: {
    flex: 1,
    gap: 2,
  },

  cardName: {
    ...Typography.h4,
    color: '#132649',
    fontWeight: '700',
  },

  cardRole: {
    ...Typography.body,
    color: Colors.textSecondary,
  },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 6,
  },

  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECF3FF',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '100%',
  },

  metaText: {
    ...Typography.caption,
    color: '#284372',
    fontWeight: '600',
    maxWidth: 150,
  },

  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFF7E8',
    borderColor: '#F9E5B4',
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  ratingValue: {
    ...Typography.caption,
    color: '#8A5A00',
    fontWeight: '800',
  },

  ratingCount: {
    ...Typography.caption,
    color: '#A47011',
  },

  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },

  skillChip: {
    backgroundColor: '#F4F6FB',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  skillChipText: {
    ...Typography.caption,
    color: '#33435F',
    fontWeight: '600',
  },

  serviceStrip: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  serviceText: {
    ...Typography.bodySmall,
    color: '#3C4C68',
    flex: 1,
  },

  cardFooter: {
    marginTop: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  priceLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },

  priceValue: {
    ...Typography.h3,
    color: Colors.primaryDark,
  },

  cardFooterRight: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },

  ordersText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },

  viewButton: {
    backgroundColor: '#123172',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },

  viewButtonText: {
    ...Typography.bodySmall,
    color: Colors.white,
    fontWeight: '700',
  },

  emptyStateContainer: {
    marginTop: 40,
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#DDE5F1',
    paddingVertical: 40,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
  },

  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2F9',
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
