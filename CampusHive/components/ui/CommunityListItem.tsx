import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import ModernButton from './ModernButton';

interface CommunityItemProps {
  id: string;
  name: string;
  university: string;
  description: string;
  members: number;
  isVerified?: boolean;
  isFollowing?: boolean;
  icon: string; // MaterialCommunityIcons name
  iconColor: string;
  onPress: () => void;
  onFollowPress: () => void;
}

export default function CommunityListItem({
  name,
  university,
  description,
  members,
  isVerified,
  isFollowing,
  icon,
  iconColor,
  onPress,
  onFollowPress,
}: CommunityItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      style={[styles.card, Shadows.sm]}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
          <MaterialCommunityIcons name={icon as any} size={24} color={iconColor} />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            {isVerified && (
              <MaterialCommunityIcons
                name="check-circle"
                size={14}
                color={Colors.primary}
                style={{ marginLeft: Spacing.xs }}
              />
            )}
          </View>
          <Text style={styles.university}>{university}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
          <View style={styles.footer}>
            <MaterialCommunityIcons
              name="account-multiple"
              size={14}
              color={Colors.textTertiary}
            />
            <Text style={styles.members}>{members.toLocaleString()} members</Text>
          </View>
        </View>

        {/* Button */}
        <View style={styles.buttonContainer}>
          <ModernButton
            label={isFollowing ? 'Following' : 'Follow'}
            variant={isFollowing ? 'outline' : 'primary'}
            size="sm"
            onPress={onFollowPress}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    padding: Spacing.base,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  name: {
    ...Typography.h4,
    color: Colors.text,
  },
  university: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  members: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  buttonContainer: {
    justifyContent: 'flex-start',
  },
});
