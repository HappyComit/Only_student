import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { communities } from '@/data/mockData';
import { Colors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import Badge from '@/components/ui/Badge';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Card from '@/components/ui/Card';

const POST_TYPE_COLORS: Record<string, string> = {
  announcement: '#4F46E5',
  event: '#EC4899',
  update: '#10B981',
};

const POST_TYPE_LABELS: Record<string, string> = {
  announcement: '📢 Announcement',
  event: '🎉 Event',
  update: '💬 Update',
};

export default function CommunityPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const community = communities.find((c) => c.id === id);
  const [isFollowing, setIsFollowing] = useState(community?.isFollowing ?? false);

  if (!community) {
    return (
      <View style={styles.notFound}>
        <Text>Community not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={[community.color, community.color + 'CC', '#1E1B4B']} style={styles.hero}>
        <View style={styles.heroBg} />
        <View style={styles.heroContent}>
          <View style={[styles.emojiBox, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Text style={styles.emoji}>{community.emoji}</Text>
          </View>
          <Text style={styles.heroName}>{community.name}</Text>
          <Text style={styles.heroShort}>@{community.shortName}</Text>
          <Text style={styles.heroDesc}>{community.description}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{community.members.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{community.posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{community.university.split(' ')[0]}</Text>
              <Text style={styles.statLabel}>University</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setIsFollowing(!isFollowing)}
            style={[styles.followBtn, isFollowing && styles.followingBtn]}
            activeOpacity={0.85}
          >
            <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
              {isFollowing ? '✓ Following' : '+ Follow'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Posts Feed */}
      <View style={styles.feed}>
        {community.posts.length === 0 ? (
          <View style={styles.emptyPosts}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubText}>This community hasn't posted anything yet.</Text>
          </View>
        ) : (
          community.posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={[styles.postTypeBadge, { backgroundColor: POST_TYPE_COLORS[post.type] + '18' }]}>
                  <Text style={[styles.postTypeText, { color: POST_TYPE_COLORS[post.type] }]}>
                    {POST_TYPE_LABELS[post.type]}
                  </Text>
                </View>
                <Text style={styles.postTime}>{post.time}</Text>
              </View>

              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postBody}>{post.body}</Text>

              {post.hasImage && (
                <Image
                  source={{ uri: `https://picsum.photos/seed/${post.id}/600/300` }}
                  style={styles.postImage}
                  contentFit="cover"
                />
              )}

              <View style={styles.postFooter}>
                <TouchableOpacity style={styles.postAction}>
                  <Ionicons name="heart-outline" size={17} color={Colors.textSecondary} />
                  <Text style={styles.postActionText}>{post.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postAction}>
                  <Ionicons name="chatbubble-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.postActionText}>{post.comments}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postAction}>
                  <Ionicons name="share-social-outline" size={17} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { paddingTop: 96, paddingBottom: 24 },
  heroBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  heroContent: { paddingHorizontal: Spacing.base, alignItems: 'center' },
  emojiBox: {
    width: 80, height: 80, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  emoji: { fontSize: 40 },
  heroName: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 2 },
  heroShort: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 10 },
  heroDesc: {
    fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center',
    lineHeight: 20, marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16,
    paddingHorizontal: 20, paddingVertical: 12, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  followBtn: {
    paddingHorizontal: 32, paddingVertical: 12,
    backgroundColor: '#fff', borderRadius: BorderRadius.full,
  },
  followingBtn: {
    backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
  },
  followBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  followingBtnText: { color: '#fff' },

  feed: { padding: Spacing.base },
  postCard: {
    backgroundColor: '#fff', borderRadius: BorderRadius.lg,
    padding: 16, marginBottom: 12, ...Shadows.md,
  },
  postHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  postTypeBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full,
  },
  postTypeText: { fontSize: 12, fontWeight: '600' },
  postTime: { fontSize: 11, color: Colors.subtext },
  postTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  postBody: { fontSize: 14, color: Colors.subtext, lineHeight: 20, marginBottom: 12 },
  postImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12 },
  postFooter: {
    flexDirection: 'row', gap: 20, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  postAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  postActionText: { fontSize: 13, color: Colors.subtext },

  emptyPosts: { alignItems: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  emptySubText: { fontSize: 14, color: Colors.subtext },
});
