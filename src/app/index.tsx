import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Card, Input, StatusBadge } from '../components/ui';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { APP_NAME, APP_TAGLINE, APP_VERSION } from '../constants/app';
import { borderRadius, colors, spacing, typography } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';

export default function HomeScreen() {
  const { width, deviceType, isMobile } = useResponsive();
  const [sampleInput, setSampleInput] = useState('');
  const [clickCount, setClickCount] = useState(0);

  return (
    <ScreenContainer maxWidth={880}>
      {/* Header / Hero Brand Section */}
      <View style={styles.heroSection}>
        <View style={styles.badgeContainer}>
          <StatusBadge
            status="info"
            label={`v${APP_VERSION} • Foundation Ready`}
            showDot
          />
        </View>

        <Text style={[styles.title, isMobile && styles.titleMobile]}>
          {APP_NAME}
        </Text>
        <Text style={[styles.tagline, isMobile && styles.taglineMobile]}>
          {APP_TAGLINE}
        </Text>

        <View style={styles.platformPill}>
          <Text style={styles.platformPillText}>
            Running on: <Text style={styles.boldText}>{Platform.OS.toUpperCase()}</Text> ({deviceType} • {Math.round(width)}px)
          </Text>
        </View>
      </View>

      {/* Foundation Architecture Card */}
      <Card
        title="Project Foundation"
        subtitle="Core design system and reusable primitives"
        style={styles.mainCard}
      >
        <Text style={styles.descriptionText}>
          The base architecture for <Text style={styles.boldText}>ApniSociety</Text> is active.
          Modular components below are ready for upcoming modules (Authentication, Dashboard, Maintenance, etc.).
        </Text>

        {/* Component Showcase 1: Status Badges */}
        <View style={styles.showcaseSection}>
          <Text style={styles.sectionHeader}>Reusable Status Badges</Text>
          <View style={styles.badgeRow}>
            <StatusBadge status="paid" label="Paid" />
            <StatusBadge status="pending" label="Pending" />
            <StatusBadge status="overdue" label="Overdue" />
            <StatusBadge status="info" label="In Progress" />
            <StatusBadge status="neutral" label="Closed" />
          </View>
        </View>

        {/* Component Showcase 2: Buttons */}
        <View style={styles.showcaseSection}>
          <Text style={styles.sectionHeader}>Reusable Button Variants</Text>
          <View style={[styles.buttonRow, isMobile && styles.buttonCol]}>
            <Button
              title={`Primary (${clickCount})`}
              variant="primary"
              onPress={() => setClickCount((prev) => prev + 1)}
              style={isMobile ? styles.fullWidth : undefined}
            />
            <Button
              title="Secondary"
              variant="secondary"
              onPress={() => {}}
              style={isMobile ? styles.fullWidth : undefined}
            />
            <Button
              title="Outline"
              variant="outline"
              onPress={() => {}}
              style={isMobile ? styles.fullWidth : undefined}
            />
          </View>
        </View>

        {/* Component Showcase 3: Input */}
        <View style={styles.showcaseSection}>
          <Text style={styles.sectionHeader}>Reusable Input Component</Text>
          <Input
            label="Sample Input Field"
            placeholder="Type something to test two-way state..."
            value={sampleInput}
            onChangeText={setSampleInput}
            helperText={
              sampleInput
                ? `Current value: "${sampleInput}"`
                : 'Type here to test component reactivity'
            }
          />
        </View>
      </Card>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ApniSociety • Modular Society & Apartment Management
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    alignItems: 'center',
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  badgeContainer: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  titleMobile: {
    fontSize: typography.sizes['3xl'],
  },
  tagline: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.regular,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  taglineMobile: {
    fontSize: typography.sizes.base,
  },
  platformPill: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[200],
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  platformPillText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
  },
  boldText: {
    fontWeight: typography.weights.semibold,
    color: colors.neutral[800],
  },
  mainCard: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  descriptionText: {
    fontSize: typography.sizes.sm + 1,
    color: colors.neutral[600],
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  showcaseSection: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    marginBottom: spacing.md,
  },
  sectionHeader: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[800],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  buttonCol: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  fullWidth: {
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  footerText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[400],
    textAlign: 'center',
  },
});
