import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/constants/theme';

interface Props {
  rating: number;
  reviews?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export default function StarRating({ rating, reviews, size = 'md', showCount = true }: Props) {
  const fontSize = size === 'sm' ? 11 : size === 'md' ? 13 : 16;
  const starSize = size === 'sm' ? 10 : size === 'md' ? 13 : 16;

  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i < Math.floor(rating)) return '★';
    if (i < rating) return '★'; // half star simplified
    return '☆';
  });

  return (
    <View style={styles.container}>
      <Text style={[styles.stars, { fontSize: starSize }]}>
        {stars.join('')}
      </Text>
      <Text style={[styles.rating, { fontSize }]}> {rating.toFixed(1)}</Text>
      {showCount && reviews !== undefined && (
        <Text style={[styles.reviews, { fontSize }]}> ({reviews})</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    color: '#F59E0B',
  },
  rating: {
    fontWeight: '700',
    color: Colors.text,
  },
  reviews: {
    color: Colors.textSecondary,
  },
});
