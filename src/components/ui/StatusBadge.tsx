import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { StatusType } from '../../types';

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md';
  showDot?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  showDot = true,
  icon,
  style,
  textStyle,
}) => {
  // Map domain statuses to visual themes
  const getBadgeColors = (): { bg: string; border: string; text: string; dot: string } => {
    switch (status) {
      case 'paid':
      case 'approved':
      case 'resolved':
      case 'success':
        return {
          bg: colors.success.background,
          border: colors.success.border,
          text: colors.success.text,
          dot: colors.success.main,
        };
      case 'pending':
      case 'warning':
        return {
          bg: colors.warning.background,
          border: colors.warning.border,
          text: colors.warning.text,
          dot: colors.warning.main,
        };
      case 'overdue':
      case 'rejected':
      case 'danger':
        return {
          bg: colors.danger.background,
          border: colors.danger.border,
          text: colors.danger.text,
          dot: colors.danger.main,
        };
      case 'in_progress':
      case 'info':
        return {
          bg: colors.info.background,
          border: colors.info.border,
          text: colors.info.text,
          dot: colors.info.main,
        };
      case 'neutral':
      default:
        return {
          bg: colors.neutral[100],
          border: colors.neutral[200],
          text: colors.neutral[700],
          dot: colors.neutral[500],
        };
    }
  };

  const getDisplayText = (): string => {
    if (label) return label;
    // Capitalize first letter of status
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const themeColors = getBadgeColors();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: themeColors.bg,
          borderColor: themeColors.border,
          paddingVertical: isSmall ? 2 : spacing.xs,
          paddingHorizontal: isSmall ? spacing.xs + 2 : spacing.sm + 2,
        },
        style,
      ]}
    >
      {showDot && (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: themeColors.dot,
              width: isSmall ? 5 : 6,
              height: isSmall ? 5 : 6,
            },
          ]}
        />
      )}

      {icon && <View style={styles.iconContainer}>{icon}</View>}

      <Text
        style={[
          styles.text,
          {
            color: themeColors.text,
            fontSize: isSmall ? typography.sizes.xs - 1 : typography.sizes.xs,
          },
          textStyle,
        ]}
      >
        {getDisplayText()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  dot: {
    borderRadius: borderRadius.full,
    marginRight: spacing.xs + 1,
  },
  iconContainer: {
    marginRight: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.2,
  },
});

export default StatusBadge;
