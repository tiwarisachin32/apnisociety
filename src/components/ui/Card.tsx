import React from 'react';
import {
  GestureResponderEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { borderRadius, colors, shadows, spacing, typography } from '../../constants/theme';
import { CardVariant } from '../../types';

export interface CardProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  footerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  footer,
  variant = 'elevated',
  padding = 'md',
  onPress,
  style,
  headerStyle,
  contentStyle,
  footerStyle,
  titleStyle,
  subtitleStyle,
  testID,
}) => {
  const getPaddingStyle = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: spacing.sm + 2 };
      case 'lg':
        return { padding: spacing.lg };
      case 'md':
      default:
        return { padding: spacing.md };
    }
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border.default,
        };
      case 'flat':
        return {
          backgroundColor: colors.neutral[100],
          borderWidth: 0,
        };
      case 'elevated':
      default:
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border.light,
          ...shadows.sm,
        };
    }
  };

  const hasHeader = !!title || !!subtitle || !!action;
  const paddingStyle = getPaddingStyle();
  const variantStyle = getVariantStyle();

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          variantStyle,
          paddingStyle,
          pressed && styles.pressed,
          style,
        ]}
      >
        {hasHeader && (
          <View style={[styles.header, headerStyle]}>
            <View style={styles.headerTitles}>
              {title && (
                <Text style={[styles.title, titleStyle]}>{title}</Text>
              )}
              {subtitle && (
                <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
              )}
            </View>
            {action && <View style={styles.headerAction}>{action}</View>}
          </View>
        )}

        {children && <View style={[styles.content, contentStyle]}>{children}</View>}

        {footer && <View style={[styles.footer, footerStyle]}>{footer}</View>}
      </Pressable>
    );
  }

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        variantStyle,
        paddingStyle,
        style,
      ]}
    >
      {hasHeader && (
        <View style={[styles.header, headerStyle]}>
          <View style={styles.headerTitles}>
            {title && (
              <Text style={[styles.title, titleStyle]}>{title}</Text>
            )}
            {subtitle && (
              <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
            )}
          </View>
          {action && <View style={styles.headerAction}>{action}</View>}
        </View>
      )}

      {children && <View style={[styles.content, contentStyle]}>{children}</View>}

      {footer && <View style={[styles.footer, footerStyle]}>{footer}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm + 4,
  },
  headerTitles: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.sizes.xs + 1,
    color: colors.text.secondary,
    marginTop: 2,
  },
  headerAction: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    width: '100%',
  },
  pressed: {
    opacity: 0.92,
  },
});

export default Card;
