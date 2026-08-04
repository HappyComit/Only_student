import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export default function ModernButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  icon,
}: Props) {
  const isDisabled = disabled || loading;

  const sizeStyles = {
    sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
    md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
    lg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl },
  };

  const variantStyles = {
    primary: {
      backgroundColor: Colors.primary,
      borderColor: 'transparent',
      borderWidth: 0,
      textColor: Colors.white,
    },
    secondary: {
      backgroundColor: Colors.primaryLight,
      borderColor: 'transparent',
      borderWidth: 0,
      textColor: Colors.primary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: Colors.primary,
      borderWidth: 1.5,
      textColor: Colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      textColor: Colors.primary,
    },
  };

  const fontSizes = {
    sm: { fontSize: 12, fontWeight: '600' as const },
    md: { fontSize: 14, fontWeight: '600' as const },
    lg: { fontSize: 16, fontWeight: '600' as const },
  };

  const vs = variantStyles[variant];
  const ss = sizeStyles[size];
  const fs = fontSizes[size];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        ss,
        {
          backgroundColor: isDisabled ? Colors.disabled : vs.backgroundColor,
          borderColor: vs.borderColor,
          borderWidth: vs.borderWidth,
          width: fullWidth ? '100%' : 'auto',
        },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={vs.textColor} size={size === 'lg' ? 'small' : undefined} />
      ) : (
        <>
          {icon && icon}
          <Text style={[styles.text, fs, { color: isDisabled ? Colors.textTertiary : vs.textColor }]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  text: {
    textAlign: 'center',
  },
});
