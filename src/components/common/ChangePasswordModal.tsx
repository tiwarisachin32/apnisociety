import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Input, Modal } from '../ui';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';

export interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { user, changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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

  const handleSubmit = async () => {
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

    setIsLoading(true);
    try {
      const res = await changePassword(curr, next);
      if (res.success) {
        setSuccessMsg(res.message || 'Password changed successfully!');
        resetForm();
        onSuccess?.();
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setErrorMsg(res.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update password. Please verify current password.');
    } finally {
      setIsLoading(false);
    }
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="🔑 Change Account Password"
      subtitle={`Update login credentials for ${user?.name || 'your account'}`}
      maxWidth={480}
    >
      <View style={styles.container}>
        {/* User Identity Reminder */}
        {user && (
          <View style={styles.userBanner}>
            <Text style={styles.userBannerTitle}>Logged In Account:</Text>
            <Text style={styles.userBannerDetail}>
              {user.name} ({user.email}) • {user.roleTitle}
            </Text>
          </View>
        )}

        {/* Success Alert */}
        {Boolean(successMsg) ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✓ {successMsg}</Text>
          </View>
        ) : null}

        {/* Error Alert */}
        {Boolean(errorMsg) ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        {/* Current Password Field */}
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
                accessibilityLabel={showCurrentPassword ? 'Hide current password' : 'Show current password'}
              >
                <Text style={styles.eyeIcon}>{showCurrentPassword ? '👁️' : '🔒'}</Text>
              </Pressable>
            }
          />
        </View>

        {/* New Password Field */}
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
                accessibilityLabel={showNewPassword ? 'Hide new password' : 'Show new password'}
              >
                <Text style={styles.eyeIcon}>{showNewPassword ? '👁️' : '🔒'}</Text>
              </Pressable>
            }
          />

          {/* Strength Meter */}
          {newPassword.length > 0 && (
            <View style={styles.strengthRow}>
              <View style={styles.strengthBars}>
                {[1, 2, 3].map((bar) => (
                  <View
                    key={bar}
                    style={[
                      styles.barSegment,
                      { backgroundColor: strength.score >= bar ? strength.color : colors.neutral[200] },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthText, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}
        </View>

        {/* Confirm Password Field */}
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
                accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '🔒'}</Text>
              </Pressable>
            }
          />

          {/* Match validation badge */}
          {confirmPassword.length > 0 && (
            <View style={styles.matchRow}>
              <Text
                style={[
                  styles.matchText,
                  { color: confirmPassword === newPassword ? '#059669' : '#DC2626' },
                ]}
              >
                {confirmPassword === newPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </Text>
            </View>
          )}
        </View>

        {/* Guidance Box */}
        <View style={styles.guidanceBox}>
          <Text style={styles.guidanceTitle}>Tips for a strong password:</Text>
          <Text style={styles.guidanceItem}>• At least 6 characters (8+ recommended)</Text>
          <Text style={styles.guidanceItem}>• Combine uppercase, lowercase, numbers & symbols</Text>
          <Text style={styles.guidanceItem}>• Changes sync instantly across all active sessions</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={handleClose}
            disabled={isLoading}
            style={styles.cancelBtn}
          />
          <Button
            title={isLoading ? 'Updating...' : 'Update Password'}
            variant="primary"
            onPress={handleSubmit}
            disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
            style={styles.submitBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.xs,
  },
  userBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  userBannerTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.neutral[500],
    textTransform: 'uppercase',
  },
  userBannerDetail: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.neutral[800],
    marginTop: 2,
  },
  successBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  successText: {
    color: '#065F46',
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: '#991B1B',
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: spacing.sm,
  },
  eyeBtn: {
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 16,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    marginRight: spacing.sm,
  },
  barSegment: {
    height: 4,
    flex: 1,
    borderRadius: borderRadius.full,
  },
  strengthText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  matchRow: {
    marginTop: 4,
    paddingHorizontal: 2,
  },
  matchText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  guidanceBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: spacing.sm,
    marginVertical: spacing.sm,
  },
  guidanceTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 2,
  },
  guidanceItem: {
    fontSize: typography.sizes.xs,
    color: '#1E3A8A',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    minWidth: 90,
  },
  submitBtn: {
    flex: 1,
  },
});
