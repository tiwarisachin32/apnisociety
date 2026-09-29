import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { ButtonSize, ButtonVariant } from '../../types';

export interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  testID,
}) => {
  const isInteractive = !disabled && !loading;

  // Determine button background and border based on variant
  const getVariantStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          button: {
            backgroundColor: colors.neutral[100],
            borderWidth: 1,
            borderColor: colors.neutral[200],
          },
          text: {
            color: colors.neutral[800],
          },
        };
      case 'outline':
        return {
          button: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.neutral[300],
          },
          text: {
            color: colors.neutral[700],
          },
        };
      case 'ghost':
        return {
          button: {
            backgroundColor: 'transparent',
            borderWidth: 0,
          },
          text: {
            color: colors.primary[600],
          },
        };
      case 'danger':
        return {
          button: {
            backgroundColor: colors.danger.main,
            borderWidth: 0,
          },
          text: {
            color: colors.text.inverse,
          },
        };
      case 'primary':
      default:
        return {
          button: {
            backgroundColor: colors.primary[600],
            borderWidth: 0,
          },
          text: {
            color: colors.text.inverse,
          },
        };
    }
  };

  // Determine sizing styles
  const getSizeStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          button: {
            paddingVertical: spacing.xs + 2,
            paddingHorizontal: spacing.sm + 4,
            borderRadius: borderRadius.sm,
            minHeight: 34,
          },
          text: {
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.medium,
          },
        };
      case 'lg':
        return {
          button: {
            paddingVertical: spacing.md - 2,
            paddingHorizontal: spacing.lg,
            borderRadius: borderRadius.md,
            minHeight: 50,
          },
          text: {
            fontSize: typography.sizes.base,
            fontWeight: typography.weights.semibold,
          },
        };
      case 'md':
      default:
        return {
          button: {
            paddingVertical: spacing.sm + 2,
            paddingHorizontal: spacing.md,
            borderRadius: borderRadius.md,
            minHeight: 42,
          },
          text: {
            fontSize: typography.sizes.sm + 1,
            fontWeight: typography.weights.medium,
          },
        };
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();

  return (
    <Pressable
      testID={testID}
      disabled={!isInteractive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyle.button,
        sizeStyle.button,
        fullWidth && styles.fullWidth,
        pressed && isInteractive && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
    >
      <View style={styles.contentRow}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variantStyle.text.color}
            style={styles.spinner}
          />
        ) : (
          leftIcon && <View style={styles.leftIconWrapper}>{leftIcon}</View>
        )}

        {children ? (
          children
        ) : (
          <Text
            style={[
              styles.baseText,
              variantStyle.text,
              sizeStyle.text,
              textStyle,
            ]}
          >
            {title}
          </Text>
        )}

        {!loading && rightIcon && (
          <View style={styles.rightIconWrapper}>{rightIcon}</View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    textAlign: 'center',
  },
  leftIconWrapper: {
    marginRight: spacing.sm,
  },
  rightIconWrapper: {
    marginLeft: spacing.sm,
  },
  spinner: {
    marginRight: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
