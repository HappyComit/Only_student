import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography } from '@/constants/theme';
import { apiFetch } from '@/constants/api';

interface NotificationBellProps {
  color?: string;
  size?: number;
  style?: object;
  variant?: 'hero' | 'light' | 'auto';
}

export default function NotificationBell({
  color,
  size = 22,
  style,
  variant = 'auto',
}: NotificationBellProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiFetch('/notifications');
      if (res && typeof res.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
      } else if (res && Array.isArray(res.notifications)) {
        // Fallback: count unread from notifications array
        const count = res.notifications.filter((n: any) => !n.isRead).length;
        setUnreadCount(count);
      }
    } catch {
      // Ignore background fetch errors silently
    }
  }, []);

  // Setup interval background polling every 30s
  useEffect(() => {
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Refresh count whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount])
  );

  const isHeroMode =
    variant === 'hero' ||
    (variant === 'auto' && (!color || color === Colors.white || color === '#FFFFFF' || color === '#fff'));

  const finalColor = color || (isHeroMode ? Colors.primary : Colors.text);
  const containerStyle = isHeroMode ? styles.heroBellButton : styles.lightBellButton;

  return (
    <TouchableOpacity
      style={[containerStyle, style]}
      onPress={() => router.push('/notifications')}
      activeOpacity={0.75}
    >
      <MaterialCommunityIcons name="bell" size={size} color={finalColor} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  heroBellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  lightBellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
});

