import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAndroidInstallPrompt } from '../../hooks/useAndroidInstallPrompt';
import { borderRadius, colors, shadows, spacing } from '../../constants/theme';

interface AndroidInstallBannerProps {
  onOpenAndroidHub?: () => void;
  isAppOwner?: boolean;
}

export function AndroidInstallBanner({ onOpenAndroidHub, isAppOwner }: AndroidInstallBannerProps) {
  const { isInstallable, isInstalled, isAndroid, triggerInstall } = useAndroidInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (dismissed || isInstalled) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      setInstalling(true);
      await triggerInstall();
      setInstalling(false);
    } else if (isAppOwner && onOpenAndroidHub) {
      onOpenAndroidHub();
    }
  };

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.iconCircle}>
        <Text style={styles.androidIcon}>🤖</Text>
      </View>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>Install ApniSociety on Android</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>WebAPK / App</Text>
          </View>
        </View>
        <Text style={styles.subtitleText}>
          {isAndroid
            ? 'Add to home screen for fast native app experience & gate notifications.'
            : 'Deploy or install as an Android app with full native permissions.'}
        </Text>
      </View>
      <View style={styles.actionRow}>
        {(isInstallable || isAppOwner) && (
          <Pressable
            style={[styles.installBtn, installing && styles.installBtnDisabled]}
            onPress={handleInstallClick}
          >
            <Text style={styles.installBtnText}>
              {installing ? 'Installing...' : isInstallable ? '📥 Install App' : '⚙️ Android Hub'}
            </Text>
          </Pressable>
        )}
        <Pressable style={styles.closeBtn} onPress={() => setDismissed(true)}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#1E293B',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    ...shadows.sm,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    backgroundColor: '#047857',
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidIcon: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  badge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  subtitleText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  installBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: borderRadius.md,
  },
  installBtnDisabled: {
    opacity: 0.6,
  },
  installBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
});
