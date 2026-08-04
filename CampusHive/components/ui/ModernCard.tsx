import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '@/constants/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  shadow?: 'sm' | 'md' | 'lg' | 'none';
  padding?: 'sm' | 'md' | 'lg';
  border?: boolean;
}

export default function ModernCard({
  children,
  style,
  shadow = 'sm',
  padding = 'md',
  border = false,
}: Props) {
  const paddingValues = {
    sm: Spacing.md,
    md: Spacing.lg,
    lg: Spacing.xl,
  };

  const shadowStyles = {
    sm: Shadows.sm,
    md: Shadows.md,
    lg: Shadows.lg,
    none: {},
  };

  return (
    <View
      style={[
        styles.card,
        {
          padding: paddingValues[padding],
          borderWidth: border ? 1 : 0,
          borderColor: Colors.border,
        },
        shadowStyles[shadow],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
  },
});
