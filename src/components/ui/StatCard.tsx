import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { borderRadius, colors, shadows, spacing, typography } from '../../constants/theme';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  trend,
  icon,
  badge,
  badgeColor,
  variant = 'default',
  style,
}) => {
  const getVariantBorder = () => {
    switch (variant) {
      case 'primary': return colors.primary[500];
      case 'success': return colors.success.main;
      case 'warning': return colors.warning.main;
      case 'danger': return colors.danger.main;
      default: return 'transparent';
    }
  };

  return (
    <View style={[styles.card, variant !== 'default' && { borderLeftColor: getVariantBorder(), borderLeftWidth: 4 }, style]}>
      <View style={styles.header}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        {badge && (
          <View style={[styles.badge, badgeColor ? { backgroundColor: badgeColor } : null]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>

      <Text style={styles.value} numberOfLines={1}>{value}</Text>

      {(subtext || trend) && (
        <View style={styles.footer}>
          {trend && (
            <Text style={[styles.trendText, trend.isPositive ? styles.trendPositive : styles.trendNegative]}>
              {trend.isPositive ? '↑' : '↓'} {trend.value} {trend.label || ''}
            </Text>
          )}
          {subtext && <Text style={styles.subtext} numberOfLines={1}>{subtext}</Text>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    flex: 1,
    minWidth: 160,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    flex: 1,
  },
  iconContainer: {
    marginLeft: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.semibold,
  },
  value: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginVertical: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  subtext: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },
  trendText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  trendPositive: {
    color: colors.success.text,
  },
  trendNegative: {
    color: colors.danger.text,
  },
});
