import React from 'react';
import { ViewStyle } from 'react-native';
import ModernButton from './ModernButton';

/**
 * DEPRECATED: Use ModernButton instead.
 * This component is kept for backward compatibility only.
 */
interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  fullWidth?: boolean;
}

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  style,
  fullWidth = false,
}: Props) {
  // Map old variant names to new ones if needed
  const mappedVariant = variant as any;

  return (
    <ModernButton
      label={title}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      variant={mappedVariant}
      size={size}
      style={style}
      fullWidth={fullWidth}
    />
  );
}
