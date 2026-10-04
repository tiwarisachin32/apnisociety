import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppLogo, Button, Card, Input, StatusBadge } from '../components/ui';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { APP_NAME, APP_TAGLINE } from '../constants/app';
import { borderRadius, colors, shadows, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useResponsive } from '../hooks/useResponsive';
import {
  MOCK_USERS,
  resetPasswordForIdentifier,
} from '../services/mockAuth';
import {
  DeviceSession,
  getActiveDeviceSessions,
  terminateAllOtherSessions,
  terminateDeviceSession,
} from '../services/deviceSession';

export interface LoginScreenProps {
  onNavigateToDashboard?: () => void;
}

export default function LoginScreen({ onNavigateToDashboard }: LoginScreenProps) {
  const { user, isAuthenticated, isLoading, error, login, loginAsDemoUser, logout } = useAuth();
  const { isMobile } = useResponsive();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});

  const passwordInputRef = useRef<any>(null);

  // Multi-device active sessions state
  const [deviceSessions, setDeviceSessions] = useState<DeviceSession[]>([]);
  const [deviceActionMsg, setDeviceActionMsg] = useState<string | null>(null);

  // Modals & Panels
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);

  // Refresh active device sessions when user is authenticated
  useEffect(() => {
    if (user?.id) {
      const sessions = getActiveDeviceSessions(user.id);
      setDeviceSessions(sessions);
    }
  }, [user?.id]);

  const handleTerminateSession = (deviceId: string) => {
    if (!user?.id) return;
    const updated = terminateDeviceSession(user.id, deviceId);
    setDeviceSessions(updated.map((s) => ({ ...s, isCurrentDevice: false })));
    setDeviceActionMsg('Device session signed out successfully.');
    setTimeout(() => setDeviceActionMsg(null), 3000);
  };

  const handleTerminateOtherSessions = () => {
    if (!user?.id) return;
    const remaining = terminateAllOtherSessions(user.id);
    setDeviceSessions(remaining);
    setDeviceActionMsg('Signed out of all other devices. This device remains active.');
    setTimeout(() => setDeviceActionMsg(null), 3500);
  };

  const validate = (): boolean => {
    const errors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      errors.identifier = 'Email address or 10-digit mobile number is required.';
    } else if (
      !identifier.includes('@') &&
      !/^\d{10}$/.test(identifier.replace(/[^0-9]/g, ''))
    ) {
      errors.identifier = 'Please enter a valid email or 10-digit mobile number.';
    }

    if (!password) {
      errors.password = 'Password is required to sign in.';
    } else if (password.length < 4) {
      errors.password = 'Password must be at least 4 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await login({
        identifier: identifier.trim(),
        password,
        rememberMe,
      });
      onNavigateToDashboard?.();
    } catch {
      // Error handled in AuthContext
    }
  };

  const handleResetPassword = () => {
    if (!forgotInput.trim()) {
      setForgotSuccessMsg('Please enter your registered email or phone number.');
      return;
    }
    const success = resetPasswordForIdentifier(forgotInput.trim(), 'Password@123');
    if (success) {
      setForgotSuccessMsg(
        'Temporary password set to: "Password@123" (or use "demo1234"). You can now sign in.'
      );
      setIdentifier(forgotInput.trim());
      setPassword('Password@123');
    } else {
      setForgotSuccessMsg(
        'No matching account found. Please check with your Society Secretary or use "demo1234".'
      );
    }
  };

  // =========================================================================
  // AUTHENTICATED STATE: Profile + Multi-Device Sessions + (Owner-Only) Switcher
  // =========================================================================
  if (isAuthenticated && user) {
    const isAppOwner = Boolean(user.isAppOwner);

    return (
      <ScreenContainer maxWidth={680}>
        <View style={styles.header}>
          <AppLogo size="md" variant="horizontal" />
          <View style={{ marginTop: spacing.sm, alignItems: 'center', gap: 4 }}>
            <StatusBadge status="paid" label="Session Active" />
            <Text style={styles.profileSubtitle}>Account & Security Profile</Text>
          </View>
        </View>

        {/* User Profile Card */}
        <Card
          title="Active Account Profile"
          subtitle="Signed in with registered credentials"
          style={styles.card}
        >
          {/* User Profile Summary */}
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, isAppOwner && styles.avatarOwner]}>
              <Text style={[styles.avatarText, isAppOwner && styles.avatarTextOwner]}>
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </Text>
            </View>

            <View style={styles.profileDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>{user.name}</Text>
                {isAppOwner && (
                  <StatusBadge status="warning" label="APP OWNER" size="sm" showDot={false} />
                )}
              </View>
              <Text style={styles.profileRole}>{user.roleTitle}</Text>
              <Text style={styles.profileMeta}>
                {user.block} • Flat {user.flatNumber}
              </Text>
              <Text style={styles.profileSociety}>
                {user.societyName} ({user.societyCode})
              </Text>
            </View>
          </View>

          {/* Contact Details */}
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Registered Email:</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mobile Number:</Text>
              <Text style={styles.infoValue}>{user.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member Type:</Text>
              <Text style={styles.infoValue}>
                {isAppOwner
                  ? 'Platform Super-Admin'
                  : user.isCommitteeMember
                  ? 'Managing Committee'
                  : 'Society Resident'}
              </Text>
            </View>
          </View>

          {/* Dynamic Permissions Breakdown */}
          <View style={styles.permissionsContainer}>
            <View style={styles.permissionsHeader}>
              <Text style={styles.sectionTitle}>
                Active Access Permissions ({user.permissions.length})
              </Text>
              <Text style={styles.sectionSubtitle}>
                Features are dynamically unlocked strictly according to your granted keys.
              </Text>
            </View>

            <View style={styles.permissionBadges}>
              {user.permissions.map((perm) => (
                <View key={perm} style={styles.permissionChip}>
                  <Text style={styles.permissionChipText}>{perm}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Dashboard and Sign Out Actions */}
          <View style={styles.sessionActions}>
            {onNavigateToDashboard && (
              <Button
                title="Open Society Dashboard →"
                variant="primary"
                fullWidth
                onPress={onNavigateToDashboard}
                style={styles.marginBottomSm}
              />
            )}
            <Button
              title={isAppOwner ? 'Sign Out / Switch Account' : 'Sign Out of this Device'}
              variant="outline"
              fullWidth
              onPress={logout}
            />
          </View>
        </Card>

        {/* ================================================================ */}
        {/* MULTI-DEVICE LOGIN & ACTIVE SESSIONS CARD                        */}
        {/* ================================================================ */}
        <Card
          title="📱 Multi-Device Login & Connected Sessions"
          subtitle="Concurrent logins active across your devices"
          style={[styles.card, styles.marginTopMd]}
        >
          <View style={styles.multiDeviceBanner}>
            <Text style={styles.multiDeviceBannerTitle}>
              ✓ Simultaneous Multi-Device Access Enabled
            </Text>
            <Text style={styles.multiDeviceBannerDesc}>
              Your account can be logged in concurrently on your smartphones, tablets, and computers.
              Logging in on another device will not disconnect your current session.
            </Text>
          </View>

          {deviceActionMsg && (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>{deviceActionMsg}</Text>
            </View>
          )}

          <View style={styles.sessionsList}>
            {deviceSessions.map((session, index) => {
              const isCurrent = session.isCurrentDevice;
              return (
                <View
                  key={session.deviceId || index}
                  style={[styles.sessionItem, isCurrent && styles.sessionItemCurrent]}
                >
                  <View style={styles.sessionIconBox}>
                    <Text style={styles.sessionIcon}>
                      {session.deviceType === 'mobile'
                        ? '📱'
                        : session.deviceType === 'tablet'
                        ? '📟'
                        : '💻'}
                    </Text>
                  </View>
                  <View style={styles.sessionDetails}>
                    <View style={styles.sessionTitleRow}>
                      <Text style={styles.sessionName}>{session.deviceName}</Text>
                      {isCurrent ? (
                        <StatusBadge status="success" label="THIS DEVICE" size="sm" showDot />
                      ) : (
                        <StatusBadge status="neutral" label="ACTIVE" size="sm" showDot={false} />
                      )}
                    </View>
                    <Text style={styles.sessionMeta}>
                      OS: {session.platform} • Browser: {session.browser}
                    </Text>
                    <Text style={styles.sessionTime}>
                      Active: {new Date(session.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(session.lastActive).toLocaleDateString()}
                    </Text>
                  </View>

                  {!isCurrent && (
                    <Pressable
                      onPress={() => handleTerminateSession(session.deviceId)}
                      style={styles.disconnectBtn}
                      accessibilityLabel="Sign out this device"
                    >
                      <Text style={styles.disconnectBtnText}>Sign Out</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>

          {deviceSessions.length > 1 && (
            <Button
              title="Sign Out of All Other Devices"
              variant="outline"
              size="sm"
              onPress={handleTerminateOtherSessions}
              style={styles.marginTopSm}
            />
          )}
        </Card>

        {/* ================================================================ */}
        {/* PERSONA SWITCHER: STRICTLY RESTRICTED TO PLATFORM APP OWNER     */}
        {/* (Non-owner users have this feature completely removed)           */}
        {/* ================================================================ */}
        {isAppOwner && (
          <View style={styles.switchPersonaSection}>
            <View style={styles.ownerNoticeBox}>
              <Text style={styles.ownerNoticeTitle}>
                👑 Platform App Owner Super-Admin Access
              </Text>
              <Text style={styles.ownerNoticeText}>
                As the platform administrator, you can switch personas below to audit RBAC
                permissions and verify features for different roles. Regular society residents
                and presidents cannot access this switcher and must log in with their credentials.
              </Text>
            </View>

            <Text style={styles.switchPersonaTitle}>Switch Persona (Owner Privilege):</Text>
            <View style={styles.demoPersonaGrid}>
              {MOCK_USERS.map((demo) => {
                const isCurrent = demo.id === user.id;
                const isDemoOwner = Boolean(demo.isAppOwner);
                return (
                  <Pressable
                    key={demo.id}
                    onPress={() => {
                      loginAsDemoUser(demo);
                      onNavigateToDashboard?.();
                    }}
                    style={[
                      styles.demoPersonaItem,
                      isCurrent && styles.demoPersonaItemActive,
                      isDemoOwner && { borderColor: '#F59E0B' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.demoPersonaName,
                        isCurrent && styles.demoPersonaNameActive,
                        isDemoOwner && { color: '#B45309', fontWeight: 'bold' },
                      ]}
                    >
                      {isDemoOwner ? '👑 ' : ''}
                      {demo.name}
                    </Text>
                    <Text style={styles.demoPersonaRole}>
                      {demo.roleTitle.split('(')[0].trim()}
                    </Text>
                    <Text style={styles.demoPersonaFlat}>
                      {demo.block} • {demo.flatNumber}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScreenContainer>
    );
  }

  // =========================================================================
  // UNAUTHENTICATED STATE: Credential-Only Login Page
  // =========================================================================
  return (
    <ScreenContainer maxWidth={520}>
      {/* Brand Header */}
      <View style={styles.header}>
        <AppLogo size={160} variant="mark" />
      </View>

      {/* Login Card */}
      <Card
        title="Resident & Committee Sign In"
        subtitle="Sign in with your registered credentials to access your account"
        style={styles.card}
      >
        {/* Error notification banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Identifier Input */}
        <Input
          label="Email Address or 10-Digit Mobile"
          placeholder="e.g. rahul.owner@apnisociety.com or 9876543210"
          value={identifier}
          onChangeText={(text) => {
            setIdentifier(text);
            if (fieldErrors.identifier) {
              setFieldErrors((prev) => ({ ...prev, identifier: undefined }));
            }
          }}
          error={fieldErrors.identifier}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType={password.trim() ? 'go' : 'next'}
          onSubmitEditing={() => {
            if (password.trim()) {
              handleSubmit();
            } else {
              passwordInputRef.current?.focus();
            }
          }}
          onKeyPress={(e: any) => {
            if (e.key === 'Enter' || e.nativeEvent?.key === 'Enter') {
              if (password.trim()) {
                handleSubmit();
              } else {
                passwordInputRef.current?.focus();
              }
            }
          }}
          required
        />

        {/* Password Input with show/hide toggle */}
        <Input
          ref={passwordInputRef}
          label="Password"
          placeholder="Enter your account password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }
          }}
          secureTextEntry={!showPassword}
          error={fieldErrors.password}
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
          onKeyPress={(e: any) => {
            if (e.key === 'Enter' || e.nativeEvent?.key === 'Enter') {
              handleSubmit();
            }
          }}
          required
          rightIcon={
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.eyeButton}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Text style={styles.eyeButtonText}>
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </Pressable>
          }
        />

        {/* Multi-Device Login / Remember Me Option */}
        <Pressable
          onPress={() => setRememberMe((prev) => !prev)}
          style={styles.rememberRow}
          accessibilityLabel="Keep signed in on this device"
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
            {rememberMe && <Text style={styles.checkboxCheck}>✓</Text>}
          </View>
          <View style={styles.rememberTextBox}>
            <Text style={styles.rememberText}>
              Keep me signed in on this device
            </Text>
            <Text style={styles.rememberSubtext}>
              Multi-Device: Allows concurrent access on your phone, tablet, and PC
            </Text>
          </View>
        </Pressable>

        {/* Forgot Password Action */}
        <View style={styles.formRow}>
          <Pressable
            onPress={() => setShowForgotModal((prev) => !prev)}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>Forgot your password?</Text>
          </Pressable>
        </View>

        {/* Forgot Password Helper Drawer */}
        {showForgotModal && (
          <View style={styles.forgotBox}>
            <Text style={styles.forgotTitle}>Password Assistance</Text>
            <Text style={styles.forgotDesc}>
              Enter your registered email or 10-digit mobile number to reset your password or retrieve your initial login credentials.
            </Text>
            <Input
              label="Registered Email or Mobile"
              placeholder="e.g. 9876543210"
              value={forgotInput}
              onChangeText={setForgotInput}
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={handleResetPassword}
              onKeyPress={(e: any) => {
                if (e.key === 'Enter' || e.nativeEvent?.key === 'Enter') {
                  handleResetPassword();
                }
              }}
            />
            {forgotSuccessMsg && (
              <View style={styles.infoBanner}>
                <Text style={styles.infoBannerText}>{forgotSuccessMsg}</Text>
              </View>
            )}
            <View style={styles.forgotBtnRow}>
              <Button
                title="Reset Password"
                variant="primary"
                size="sm"
                onPress={handleResetPassword}
              />
              <Button
                title="Cancel"
                variant="ghost"
                size="sm"
                onPress={() => {
                  setShowForgotModal(false);
                  setForgotSuccessMsg(null);
                }}
              />
            </View>
          </View>
        )}

        {/* Submit Button */}
        <Button
          title={isLoading ? 'Verifying credentials...' : 'Sign In to Account'}
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          onPress={handleSubmit}
          style={styles.submitBtn}
        />

        {/* Multi-Device Security Guarantee Banner */}
        <View style={styles.securityNote}>
          <Text style={styles.securityNoteText}>
            🔒 <Text style={styles.bold}>Multi-Device Sync:</Text> Your session is persistent and can be logged in simultaneously on your family's smartphones, tablets, and computers.
          </Text>
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  profileSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[500],
    marginTop: 2,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
  },
  marginTopSm: {
    marginTop: spacing.sm,
  },
  marginTopMd: {
    marginTop: spacing.md,
  },
  errorBanner: {
    backgroundColor: colors.danger.background,
    borderColor: colors.danger.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    color: colors.danger.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  successBanner: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  successBannerText: {
    color: '#15803D',
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.medium,
  },
  infoBanner: {
    backgroundColor: colors.info.background,
    borderColor: colors.info.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  infoBannerText: {
    color: colors.info.text,
    fontSize: typography.sizes.xs,
  },
  bold: {
    fontWeight: typography.weights.bold,
  },
  eyeButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  eyeButtonText: {
    color: colors.primary[600],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: spacing.xs + 2,
    gap: spacing.xs + 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.neutral[400],
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  checkboxCheck: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: typography.weights.bold,
  },
  rememberTextBox: {
    flex: 1,
  },
  rememberText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  rememberSubtext: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[500],
    marginTop: 1,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  linkButton: {
    paddingVertical: 2,
  },
  linkText: {
    color: colors.primary[600],
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.medium,
  },
  submitBtn: {
    marginTop: spacing.xs,
  },
  securityNote: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  securityNoteText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    lineHeight: 18,
  },
  forgotBox: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  forgotTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  forgotDesc: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  forgotBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },

  // Active Session styles
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[300],
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarOwner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  avatarText: {
    color: colors.primary[700],
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.lg,
  },
  avatarTextOwner: {
    color: '#B45309',
  },
  profileDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  profileName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  profileRole: {
    fontSize: typography.sizes.sm,
    color: colors.primary[600],
    fontWeight: typography.weights.medium,
    marginTop: 1,
  },
  profileMeta: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  profileSociety: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[400],
  },
  infoBox: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[500],
  },
  infoValue: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  permissionsContainer: {
    marginBottom: spacing.lg,
  },
  permissionsHeader: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  permissionBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  permissionChip: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingVertical: 3,
    paddingHorizontal: spacing.xs + 4,
  },
  permissionChipText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.primary[800],
    fontWeight: typography.weights.medium,
  },
  sessionActions: {
    marginTop: spacing.sm,
  },

  // Multi-Device section styles
  multiDeviceBanner: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  multiDeviceBannerTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: '#166534',
  },
  multiDeviceBannerDesc: {
    fontSize: typography.sizes.xs,
    color: '#15803D',
    marginTop: 2,
    lineHeight: 16,
  },
  sessionsList: {
    gap: spacing.xs + 2,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  sessionItemCurrent: {
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
  },
  sessionIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  sessionIcon: {
    fontSize: 18,
  },
  sessionDetails: {
    flex: 1,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sessionName: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  sessionMeta: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[500],
  },
  sessionTime: {
    fontSize: typography.sizes.xs - 2,
    color: colors.neutral[400],
    marginTop: 1,
  },
  disconnectBtn: {
    marginLeft: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.danger.border,
    backgroundColor: colors.surface,
  },
  disconnectBtnText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.danger.text,
    fontWeight: typography.weights.medium,
  },

  // Owner persona switcher styles
  switchPersonaSection: {
    marginTop: spacing.xl,
  },
  ownerNoticeBox: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  ownerNoticeTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: '#B45309',
    marginBottom: 2,
  },
  ownerNoticeText: {
    fontSize: typography.sizes.xs,
    color: '#92400E',
    lineHeight: 18,
  },
  switchPersonaTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  demoPersonaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 4,
  },
  demoPersonaItem: {
    flex: 1,
    minWidth: 130,
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  demoPersonaItemActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  demoPersonaName: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  demoPersonaNameActive: {
    color: colors.primary[700],
  },
  demoPersonaRole: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[500],
    marginTop: 2,
    textAlign: 'center',
  },
  demoPersonaFlat: {
    fontSize: typography.sizes.xs - 2,
    color: colors.neutral[400],
    marginTop: 1,
    textAlign: 'center',
  },
  marginBottomSm: {
    marginBottom: spacing.sm,
  },
});
