import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '@/constants/theme';

type BadgeVariant = 'pending' | 'in-progress' | 'completed' | 'verified' | 'free' | 'paid' | 'info' | 'warning';

interface Props {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  pending:      { bg: '#FEF3C7', text: '#92400E' },
  'in-progress':{ bg: '#DBEAFE', text: '#1E40AF' },
  completed:    { bg: '#D1FAE5', text: '#065F46' },
  verified:     { bg: '#EDE9FE', text: '#5B21B6' },
  free:         { bg: '#D1FAE5', text: '#065F46' },
  paid:         { bg: '#FEE2E2', text: '#991B1B' },
  info:         { bg: '#DBEAFE', text: '#1E40AF' },
  warning:      { bg: '#FEF3C7', text: '#92400E' },
};

export default function Badge({ label, variant = 'info', size = 'sm' }: Props) {
  const vs = variantStyles[variant] || variantStyles.info;
  return (
    <View style={[styles.base, { backgroundColor: vs.bg }, size === 'md' && styles.md]}>
      <Text style={[styles.text, { color: vs.text }, size === 'md' && styles.textMd]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textMd: {
    fontSize: 13,
  },
});
