import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Button, Card, Input, StatusBadge } from '../components/ui';
import { borderRadius, colors, shadows, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

export interface ChangePasswordScreenProps {
  onNavigateBack?: () => void;
  onNavigateToDashboard?: () => void;
}

export default function ChangePasswordScreen({
  onNavigateBack,
  onNavigateToDashboard,
}: ChangePasswordScreenProps) {
  const { user, changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: colors.neutral[300] };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: '#EF4444' };
    if (score <= 3) return { score: 2, label: 'Fair', color: '#F59E0B' };
    return { score: 3, label: 'Strong', color: '#10B981' };
  };

  const handleSave = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const curr = currentPassword.trim();
    const next = newPassword.trim();
    const conf = confirmPassword.trim();

    if (!curr) {
      setErrorMsg('Please enter your current password.');
      return;
    }
    if (!next) {
      setErrorMsg('Please enter a new password.');
      return;
    }
    if (next.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    if (next === curr) {
      setErrorMsg('New password cannot be the same as your current password.');
      return;
    }
    if (next !== conf) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changePassword(curr, next);
      if (res.success) {
        setSuccessMsg(res.message || 'Password changed successfully! You can now use your new password on all devices.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg(res.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error occurred while updating password. Please check your current password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const strength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <ScreenContainer maxWidth={680}>
      {/* Top Navigation & Breadcrumbs */}
      <View style={styles.topNavRow}>
        <Button
          title="← Back"
          variant="outline"
          size="sm"
          onPress={onNavigateBack || onNavigateToDashboard}
        />
        <View style={styles.userBadgeRow}>
          <Text style={styles.userBadgeLabel}>
            Account: <Text style={styles.userBadgeName}>{user?.name || 'User'}</Text>
          </Text>
          <StatusBadge status="paid" label={user?.roleTitle || 'Member'} size="sm" />
        </View>
      </View>

      {/* Main Password Change Card */}
      <Card
        title="🔑 Change Account Password"
        subtitle="Manage your credentials securely. Updated password will apply across all active sessions."
        style={styles.mainCard}
      >
        {/* Success Alert */}
        {Boolean(successMsg) && (
          <View style={styles.successBanner}>
            <Text style={styles.successIcon}>✓</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>Password Updated</Text>
              <Text style={styles.successDesc}>{successMsg}</Text>
            </View>
          </View>
        )}

        {/* Error Alert */}
        {Boolean(errorMsg) && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>Action Required</Text>
              <Text style={styles.errorDesc}>{errorMsg}</Text>
            </View>
          </View>
        )}

        {/* Password Form */}
        <View style={styles.formContainer}>
          {/* Current Password */}
          <View style={styles.fieldGroup}>
            <Input
              label="Current Password"
              required
              placeholder="Enter your current password"
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                if (errorMsg) setErrorMsg(null);
              }}
              secureTextEntry={!showCurrentPassword}
              rightIcon={
                <Pressable
                  onPress={() => setShowCurrentPassword((prev) => !prev)}
                  style={styles.eyeBtn}
                  accessibilityLabel={showCurrentPassword ? 'Hide password' : 'Show password'}
                >
                  <Text style={styles.eyeIcon}>{showCurrentPassword ? '👁️' : '🔒'}</Text>
                </Pressable>
              }
            />
          </View>

          {/* New Password */}
          <View style={styles.fieldGroup}>
            <Input
              label="New Password"
              required
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (errorMsg) setErrorMsg(null);
              }}
              secureTextEntry={!showNewPassword}
              rightIcon={
                <Pressable
                  onPress={() => setShowNewPassword((prev) => !prev)}
                  style={styles.eyeBtn}
                  accessibilityLabel={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  <Text style={styles.eyeIcon}>{showNewPassword ? '👁️' : '🔒'}</Text>
                </Pressable>
              }
            />

            {/* Strength Meter */}
            {Boolean(newPassword) && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBarsRow}>
                  {[1, 2, 3].map((step) => (
                    <View
                      key={step}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            step <= strength.score ? strength.color : colors.neutral[200],
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthText, { color: strength.color }]}>
                  Strength: {strength.label}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm New Password */}
          <View style={styles.fieldGroup}>
            <Input
              label="Confirm New Password"
              required
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errorMsg) setErrorMsg(null);
              }}
              secureTextEntry={!showConfirmPassword}
              rightIcon={
                <Pressable
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  style={styles.eyeBtn}
                  accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '🔒'}</Text>
                </Pressable>
              }
            />

            {/* Password Match Indicator */}
            {passwordsMatch && (
              <View style={styles.matchNoticeRow}>
                <Text style={styles.matchNoticeTextSuccess}>✓ Passwords match</Text>
              </View>
            )}
            {passwordsMismatch && (
              <View style={styles.matchNoticeRow}>
                <Text style={styles.matchNoticeTextError}>⚠️ Passwords do not match</Text>
              </View>
            )}
          </View>

          {/* Security Best Practices */}
          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>🛡️ Security Guidelines</Text>
            <Text style={styles.tipsItem}>• Use at least 6 characters (8+ characters recommended).</Text>
            <Text style={styles.tipsItem}>• Include a mix of uppercase letters, numbers, and symbols.</Text>
            <Text style={styles.tipsItem}>• Avoid reusing recent passwords or easily guessed birthdays/names.</Text>
            <Text style={styles.tipsItem}>• Once updated, your new password will be active immediately.</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <Button
              title={isSubmitting ? 'Updating Password...' : 'Save New Password'}
              variant="primary"
              size="lg"
              onPress={handleSave}
              disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
              style={{ flex: 1 }}
            />
            <Button
              title="Clear"
              variant="outline"
              size="lg"
              onPress={handleClear}
              disabled={isSubmitting || (!currentPassword && !newPassword && !confirmPassword)}
            />
          </View>
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userBadgeLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  userBadgeName: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  mainCard: {
    marginTop: spacing.xs,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  successIcon: {
    fontSize: 18,
    color: '#059669',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: '#065F46',
  },
  successDesc: {
    fontSize: typography.sizes.xs,
    color: '#047857',
    marginTop: 2,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorIcon: {
    fontSize: 18,
    color: '#DC2626',
  },
  errorTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: '#991B1B',
  },
  errorDesc: {
    fontSize: typography.sizes.xs,
    color: '#B91C1C',
    marginTop: 2,
    lineHeight: 18,
  },
  formContainer: {
    gap: spacing.sm,
  },
  fieldGroup: {
    marginBottom: spacing.xs,
  },
  eyeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  eyeIcon: {
    fontSize: 16,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    marginRight: spacing.sm,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: borderRadius.full,
  },
  strengthText: {
    fontSize: 11,
    fontWeight: '600',
  },
  matchNoticeRow: {
    marginTop: 4,
  },
  matchNoticeTextSuccess: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  matchNoticeTextError: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  tipsBox: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipsTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tipsItem: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
