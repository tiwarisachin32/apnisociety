import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Card, Input, StatusBadge } from '../components/ui';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { APP_NAME, APP_TAGLINE } from '../constants/app';
import { borderRadius, colors, shadows, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useResponsive } from '../hooks/useResponsive';
import { MOCK_USERS } from '../services/mockAuth';

export interface LoginScreenProps {
  onNavigateToDashboard?: () => void;
}

export default function LoginScreen({ onNavigateToDashboard }: LoginScreenProps) {
  const { user, isAuthenticated, isLoading, error, login, loginAsDemoUser, logout } = useAuth();
  const { isMobile } = useResponsive();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState(false);

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
      errors.password = 'Password is required (min 4 characters).';
    } else if (password.length < 4) {
      errors.password = 'Password must be at least 4 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setForgotPasswordMsg(false);
    if (!validate()) return;

    try {
      await login({
        identifier: identifier.trim(),
        password,
      });
      onNavigateToDashboard?.();
    } catch {
      // Error handled in AuthContext
    }
  };

  const handleSelectDemoPersona = (demoUser: (typeof MOCK_USERS)[0]) => {
    setIdentifier(demoUser.email);
    setPassword('demo1234');
    setFieldErrors({});
    setForgotPasswordMsg(false);
    loginAsDemoUser(demoUser);
    onNavigateToDashboard?.();
  };

  // If already authenticated, show the Active Session state with permissions breakdown
  if (isAuthenticated && user) {
    return (
      <ScreenContainer maxWidth={680}>
        <View style={styles.header}>
          <StatusBadge status="paid" label="Session Active" />
          <Text style={styles.title}>{APP_NAME}</Text>
          <Text style={styles.subtitle}>Authentication Module</Text>
        </View>

        <Card
          title="Logged In Profile"
          subtitle="Dynamic permission-based session"
          style={styles.card}
        >
          {/* User Profile Summary */}
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </Text>
            </View>

            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{user.name}</Text>
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
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mobile:</Text>
              <Text style={styles.infoValue}>{user.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member Type:</Text>
              <Text style={styles.infoValue}>
                {user.isCommitteeMember ? 'Managing Committee' : 'Resident'}
              </Text>
            </View>
          </View>

          {/* Assigned Permissions (Dynamic RBAC demonstration) */}
          <View style={styles.permissionsContainer}>
            <View style={styles.permissionsHeader}>
              <Text style={styles.sectionTitle}>
                Granted Permissions ({user.permissions.length})
              </Text>
              <Text style={styles.sectionSubtitle}>
                No hard-coded role checks; features are unlocked strictly by permission keys.
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

          {/* Switch Persona or Logout */}
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
              title="Sign Out / Switch Persona"
              variant="outline"
              fullWidth
              onPress={logout}
            />
          </View>
        </Card>

        {/* Quick Persona Switcher */}
        <View style={styles.switchPersonaSection}>
          <Text style={styles.switchPersonaTitle}>Switch to Another Persona:</Text>
          <View style={styles.demoPersonaGrid}>
            {MOCK_USERS.map((demo) => {
              const isCurrent = demo.id === user.id;
              return (
                <Pressable
                  key={demo.id}
                  onPress={() => handleSelectDemoPersona(demo)}
                  style={[
                    styles.demoPersonaItem,
                    isCurrent && styles.demoPersonaItemActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.demoPersonaName,
                      isCurrent && styles.demoPersonaNameActive,
                    ]}
                  >
                    {demo.name}
                  </Text>
                  <Text style={styles.demoPersonaRole}>{demo.roleTitle.split('(')[0]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer maxWidth={520}>
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.logoPill}>
          <Text style={styles.logoText}>AS</Text>
        </View>
        <Text style={styles.title}>{APP_NAME}</Text>
        <Text style={styles.subtitle}>{APP_TAGLINE}</Text>
      </View>

      {/* Login Card */}
      <Card
        title="Sign In"
        subtitle="Enter your mobile number or email to access your account"
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
          label="Email or Mobile Number"
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
          required
        />

        {/* Password Input */}
        <Input
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }
          }}
          secureTextEntry={!showPassword}
          error={fieldErrors.password}
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

        {/* Forgot Password Action */}
        <View style={styles.formRow}>
          <Pressable
            onPress={() => setForgotPasswordMsg((prev) => !prev)}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>Forgot password?</Text>
          </Pressable>
        </View>

        {forgotPasswordMsg && (
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              For the demo, you can click any persona below to log in instantly, or use password: <Text style={styles.bold}>demo1234</Text>
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <Button
          title={isLoading ? 'Signing in...' : 'Sign In'}
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          onPress={handleSubmit}
          style={styles.submitBtn}
        />

        {/* Quick Demo Personas (Role & Permission Testing) */}
        <View style={styles.demoSection}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or test with a demo persona</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.demoInstructions}>
            Select a resident or committee role to inspect its permissions:
          </Text>

          <View style={styles.demoGrid}>
            {MOCK_USERS.map((demo) => {
              const isOwner = Boolean(demo.isAppOwner);
              const isPres = demo.roleId === 'role-president';
              return (
                <Pressable
                  key={demo.id}
                  onPress={() => handleSelectDemoPersona(demo)}
                  style={[
                    styles.demoCard,
                    isOwner && { borderColor: '#F59E0B', borderWidth: 1.5, backgroundColor: '#FFFDF5' },
                  ]}
                >
                  <View style={styles.demoCardTop}>
                    <Text style={[styles.demoName, isOwner && { color: '#B45309', fontWeight: 'bold' }]}>
                      {isOwner ? '👑 ' : ''}{demo.name}
                    </Text>
                    <StatusBadge
                      status={isOwner ? 'warning' : isPres ? 'info' : demo.isCommitteeMember ? 'success' : 'neutral'}
                      label={isOwner ? 'APP OWNER' : isPres ? 'PRESIDENT' : demo.roleTitle.split(' ')[0]}
                      size="sm"
                      showDot={false}
                    />
                  </View>
                  <Text style={styles.demoSub}>
                    {demo.societyName} • {demo.block} • {demo.flatNumber}
                  </Text>
                  <Text style={styles.demoEmail}>{demo.email}</Text>
                </Pressable>
              );
            })}
          </View>
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
  logoPill: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  logoText: {
    color: colors.text.inverse,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.primary[800],
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[500],
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
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
  infoBanner: {
    backgroundColor: colors.info.background,
    borderColor: colors.info.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
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
  formRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    color: colors.neutral[400],
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoSection: {
    marginTop: spacing.xs,
  },
  demoInstructions: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    marginBottom: spacing.sm,
  },
  demoGrid: {
    flexDirection: 'column',
    gap: spacing.xs + 4,
  },
  demoCard: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
  },
  demoCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  demoName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  demoSub: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
  },
  demoEmail: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[400],
    marginTop: 2,
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
  avatarText: {
    color: colors.primary[700],
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.lg,
  },
  profileDetails: {
    flex: 1,
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
  switchPersonaSection: {
    marginTop: spacing.lg,
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
    minWidth: 120,
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
  marginBottomSm: {
    marginBottom: spacing.sm,
  },
});
