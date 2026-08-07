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
}

export default function NotificationBell({
  color = Colors.white,
  size = 22,
  style,
}: NotificationBellProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiFetch('/notifications');
      if (res && typeof res.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
      }
    } catch {
      // Ignore background fetch errors silently
    }
  }, []);

  // Fetch immediately on mount & setup interval
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Refresh count whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount])
  );

  return (
    <TouchableOpacity
      style={[styles.bellButton, style]}
      onPress={() => router.push('/notifications')}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons name="bell-outline" size={size} color={color} />
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
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
});

