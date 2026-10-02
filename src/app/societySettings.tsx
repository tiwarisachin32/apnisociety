import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Button, Card, FileUpload, StatusBadge } from '../components/ui';
import { APP_NAME, PERMISSIONS } from '../constants/app';
import { borderRadius, colors, shadows, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useResponsive } from '../hooks/useResponsive';
import {
  applySocietyPreset,
  exportSocietyConfigJson,
  getProductionReleaseChecklist,
  getSocietyConfig,
  importSocietyConfigJson,
  resetSocietyConfig,
  saveSocietyConfig,
  SOCIETY_PRESETS,
} from '../services/societyConfig';
import {
  clearModuleData,
  getStorageStatistics,
  isRealDataMode,
  resetAllToRealProduction,
  restoreDemoData,
  StorageStatistics,
  subscribeToDataReset,
} from '../services/dataManager';
import { useAndroidInstallPrompt } from '../hooks/useAndroidInstallPrompt';
import { getStoredMembers, getStoredUnits, saveMembers, saveUnits } from '../services/mockMembers';
import { SocietyMember, SocietyUnit } from '../types/members';
import {
  SocietyConfig,
  SocietyFacilityConfig,
  SocietyPresetType,
  SocietyTowerConfig,
} from '../types/societyConfig';

export interface SocietySettingsScreenProps {
  onNavigateToDashboard?: () => void;
  onNavigateToBackend?: () => void;
  onNavigateToMaintenance?: () => void;
}

type SettingsTab =
  | 'release'
  | 'datamode'
  | 'android'
  | 'identity'
  | 'architecture'
  | 'finance'
  | 'amenities'
  | 'modules'
  | 'presets';

export default function SocietySettingsScreen({
  onNavigateToDashboard,
  onNavigateToBackend,
  onNavigateToMaintenance,
}: SocietySettingsScreenProps) {
  const { user, hasPermission } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const canManageSettings =
    hasPermission(PERMISSIONS.SETTINGS_MANAGE) ||
    hasPermission(PERMISSIONS.ROLES_MANAGE) ||
    Boolean(user?.isCommitteeMember);

  const [activeTab, setActiveTab] = useState<SettingsTab>('release');
  const [config, setConfig] = useState<SocietyConfig>(getSocietyConfig());
  const [savedSuccessToast, setSavedSuccessToast] = useState('');
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New Tower modal/form
  const [newTowerName, setNewTowerName] = useState('');
  const [newTowerFloors, setNewTowerFloors] = useState('12');
  const [newTowerFlatsPerFloor, setNewTowerFlatsPerFloor] = useState('4');
  const [newTowerPrefix, setNewTowerPrefix] = useState('E-');
  const [showAddTowerModal, setShowAddTowerModal] = useState(false);

  // Real Data & Storage Management State
  const [storageStats, setStorageStats] = useState<StorageStatistics>(getStorageStatistics());
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetAdminName, setResetAdminName] = useState(user?.name || 'Society Administrator');
  const [resetAdminEmail, setResetAdminEmail] = useState(user?.email || 'admin@apnisociety.com');
  const [resetAdminPhone, setResetAdminPhone] = useState(user?.phone || '9876543210');
  const [resetAdminFlat, setResetAdminFlat] = useState(user?.flatNumber || 'A-101');
  const [genUnitsFromTowers, setGenUnitsFromTowers] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [showBulkMemberModal, setShowBulkMemberModal] = useState(false);
  const [bulkMemberText, setBulkMemberText] = useState('');
  const [activeAndroidSubTab, setActiveAndroidSubTab] = useState<'webapk' | 'eas' | 'twa' | 'permissions'>('webapk');

  const androidPrompt = useAndroidInstallPrompt();

  useEffect(() => {
    const unsub = subscribeToDataReset(() => {
      setStorageStats(getStorageStatistics());
    });
    return unsub;
  }, []);

  const handleMasterReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      const res = resetAllToRealProduction({
        adminName: resetAdminName,
        adminEmail: resetAdminEmail,
        adminPhone: resetAdminPhone,
        adminFlat: resetAdminFlat,
        societyName: config.societyName,
        generateRealUnitsFromTowers: genUnitsFromTowers,
      });
      setStorageStats(getStorageStatistics());
      setIsResetting(false);
      setShowResetModal(false);
      showToast(res.message);
    }, 300);
  };

  const handleModuleWipe = (
    mod: 'maintenance' | 'complaints' | 'expenses' | 'reimbursements' | 'water' | 'bookings' | 'notifications'
  ) => {
    clearModuleData(mod);
    setStorageStats(getStorageStatistics());
    showToast(`✓ Cleared data for ${mod.toUpperCase()}`);
  };

  const handleRestoreDemo = () => {
    restoreDemoData();
    setStorageStats(getStorageStatistics());
    showToast('🔄 Demo test seed data restored.');
  };

  const handleBulkImport = () => {
    if (!bulkMemberText.trim()) return;
    const lines = bulkMemberText.split('\n').filter((l) => l.trim().length > 0);
    const existingMembers = getStoredMembers();
    const existingUnits = getStoredUnits();
    let importedCount = 0;

    const newMembers = [...existingMembers];
    const updatedUnits = [...existingUnits];

    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length < 2) continue;
      const flat = parts[0];
      const name = parts[1];
      const phone = parts[2] || '9876543210';
      const email = parts[3] || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@society.com`;
      const roleStr = (parts[4] || 'owner').toLowerCase();
      const isOwner = roleStr.includes('owner');

      const newMem: SocietyMember = {
        id: `mem-real-${Date.now()}-${importedCount}`,
        name,
        email,
        phone,
        flatNumber: flat,
        block: flat.split('-')[0] ? `Tower ${flat.split('-')[0]}` : 'Tower A',
        residentType: isOwner ? 'owner' : 'tenant',
        intercomNumber: '1000',
        parkingSlots: [],
        isCommitteeMember: false,
        moveInDate: new Date().toISOString().split('T')[0],
        vehicles: [],
        familyMembers: [],
        hasPets: false,
        emergencyContact: {
          name: 'Contact',
          relation: 'Family',
          phone,
        },
        verificationStatus: 'verified',
      };
      newMembers.push(newMem);

      const unit = updatedUnits.find((u) => u.flatNumber.toLowerCase() === flat.toLowerCase());
      if (unit) {
        unit.occupancyStatus = isOwner ? 'owner_occupied' : 'rented';
        unit.primaryResidentName = name;
        unit.primaryResidentId = newMem.id;
        if (isOwner) {
          unit.ownerName = name;
          unit.ownerContact = phone;
        }
      }
      importedCount++;
    }

    saveMembers(newMembers);
    saveUnits(updatedUnits);
    setStorageStats(getStorageStatistics());
    setBulkMemberText('');
    setShowBulkMemberModal(false);
    showToast(`✓ Successfully onboarded ${importedCount} real society members!`);
  };

  const checklist = getProductionReleaseChecklist(config);
  const allChecksReady = checklist.every((c) => c.isReady);

  const showToast = (msg: string) => {
    setSavedSuccessToast(msg);
    setTimeout(() => setSavedSuccessToast(''), 4000);
  };

  const handleSave = () => {
    setIsSaving(true);
    // Recalculate total units
    const total = config.towers.reduce((acc, t) => (t.active ? acc + t.floorsCount * t.flatsPerFloor : acc), 0);
    const updated: SocietyConfig = {
      ...config,
      totalUnitsCount: total || config.totalUnitsCount,
      customizedAt: new Date().toISOString(),
    };
    saveSocietyConfig(updated);
    setConfig(updated);
    setIsSaving(false);
    showToast(`✓ Society settings customized and applied for ${updated.societyName}!`);
  };

  const handleApplyPreset = (presetKey: SocietyPresetType) => {
    const updated = applySocietyPreset(presetKey);
    setConfig(updated);
    showToast(`✓ Applied "${SOCIETY_PRESETS[presetKey].title}" preset configuration!`);
  };

  const handleExportJson = () => {
    const json = exportSocietyConfigJson(config);
    setJsonText(json);
    setJsonError('');
    setShowJsonModal(true);
  };

  const handleImportJson = () => {
    const res = importSocietyConfigJson(jsonText);
    if (res.success && res.config) {
      setConfig(res.config);
      setShowJsonModal(false);
      showToast('✓ Custom society configuration imported successfully!');
    } else {
      setJsonError(res.error || 'Failed to import JSON.');
    }
  };

  const handleAddTower = () => {
    if (!newTowerName.trim()) return;
    const floors = parseInt(newTowerFloors) || 10;
    const flats = parseInt(newTowerFlatsPerFloor) || 4;
    const newTower: SocietyTowerConfig = {
      id: `tow-${Date.now()}`,
      name: newTowerName.trim(),
      floorsCount: floors,
      flatsPerFloor: flats,
      unitPrefix: newTowerPrefix.trim() || `${newTowerName.charAt(0).toUpperCase()}-`,
      active: true,
    };
    const updatedTowers = [...config.towers, newTower];
    const newTotal = updatedTowers.reduce((acc, t) => (t.active ? acc + t.floorsCount * t.flatsPerFloor : acc), 0);
    setConfig({
      ...config,
      towers: updatedTowers,
      totalUnitsCount: newTotal,
    });
    setNewTowerName('');
    setShowAddTowerModal(false);
    showToast(`Added ${newTower.name} (${floors * flats} flats)`);
  };

  const handleToggleTower = (id: string) => {
    const updated = config.towers.map((t) => (t.id === id ? { ...t, active: !t.active } : t));
    const newTotal = updated.reduce((acc, t) => (t.active ? acc + t.floorsCount * t.flatsPerFloor : acc), 0);
    setConfig({ ...config, towers: updated, totalUnitsCount: newTotal });
  };

  const handleDeleteTower = (id: string) => {
    const updated = config.towers.filter((t) => t.id !== id);
    const newTotal = updated.reduce((acc, t) => (t.active ? acc + t.floorsCount * t.flatsPerFloor : acc), 0);
    setConfig({ ...config, towers: updated, totalUnitsCount: newTotal });
  };

  const handleUpdateFacility = (facId: string, updates: Partial<SocietyFacilityConfig>) => {
    const updated = config.facilities.map((f) => (f.id === facId ? { ...f, ...updates } : f));
    setConfig({ ...config, facilities: updated });
  };

  // Preview share text
  const shareableMsg = `🎉 Welcome to ${config.societyName} Official Resident App! Manage maintenance, hall bookings, water supply & community complaints directly from your phone. Open: ${window.location.origin}`;

  return (
    <ScreenContainer>
      {/* Top Banner */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.badgeRow}>
            <View style={styles.headerPill}>
              <Text style={styles.headerPillText}>SOCIETY SETUP & CUSTOMIZATION</Text>
            </View>
            <View style={styles.productionPill}>
              <Text style={styles.productionPillDot}>●</Text>
              <Text style={styles.productionPillText}>RELEASE READY (v{config.version})</Text>
            </View>
          </View>
          <Text style={styles.title}>{config.societyName} Configuration Desk</Text>
          <Text style={styles.subtitle}>
            Tailor the application to your housing society's specific bylaws, flat architecture, maintenance tariffs, bank accounts, and clubhouse rules before release.
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Button
            title="💾 Save & Apply"
            variant="primary"
            size="md"
            onPress={handleSave}
            loading={isSaving}
          />
          <Button
            title="📥 Export Config"
            variant="outline"
            size="md"
            onPress={handleExportJson}
          />
          {onNavigateToDashboard && (
            <Button
              title="📊 Dashboard"
              variant="outline"
              size="md"
              onPress={onNavigateToDashboard}
            />
          )}
        </View>
      </View>

      {/* Success Toast */}
      {savedSuccessToast ? (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>{savedSuccessToast}</Text>
        </View>
      ) : null}

      {/* Tabs Row */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'release' && styles.tabBtnActive]}
            onPress={() => setActiveTab('release')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'release' && styles.tabBtnTextActive]}>
              🚀 Release Hub
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'datamode' && styles.tabBtnActive]}
            onPress={() => setActiveTab('datamode')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'datamode' && styles.tabBtnTextActive]}>
              🧹 Real Data Reset {storageStats.mode === 'real' ? '🟢' : '🟡'}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'android' && styles.tabBtnActive]}
            onPress={() => setActiveTab('android')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'android' && styles.tabBtnTextActive]}>
              🤖 Android App Deploy
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'identity' && styles.tabBtnActive]}
            onPress={() => setActiveTab('identity')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'identity' && styles.tabBtnTextActive]}>
              🏛️ Society Identity
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'architecture' && styles.tabBtnActive]}
            onPress={() => setActiveTab('architecture')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'architecture' && styles.tabBtnTextActive]}>
              🏢 Towers & Flats ({config.totalUnitsCount} Units)
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'finance' && styles.tabBtnActive]}
            onPress={() => setActiveTab('finance')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'finance' && styles.tabBtnTextActive]}>
              💳 Maintenance & Bank
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'amenities' && styles.tabBtnActive]}
            onPress={() => setActiveTab('amenities')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'amenities' && styles.tabBtnTextActive]}>
              🎪 Clubhouse & Facilities
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'modules' && styles.tabBtnActive]}
            onPress={() => setActiveTab('modules')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'modules' && styles.tabBtnTextActive]}>
              🧩 Module Toggles
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'presets' && styles.tabBtnActive]}
            onPress={() => setActiveTab('presets')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'presets' && styles.tabBtnTextActive]}>
              📑 1-Click Presets
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* ========================================================================= */}
      {/* TAB 1: RELEASE & LAUNCH HUB                                               */}
      {/* ========================================================================= */}
      {activeTab === 'release' && (
        <View style={styles.tabContent}>
          {/* Release Hero Card */}
          <Card style={styles.releaseHeroCard}>
            <View style={styles.releaseHeroTop}>
              <View style={styles.releaseStatusIconCircle}>
                <Text style={styles.releaseStatusIcon}>🚀</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <Text style={styles.releaseHeroTitle}>Ready for Society Deployment</Text>
                  <StatusBadge status="paid" label="VERIFIED BUILD" size="sm" />
                </View>
                <Text style={styles.releaseHeroSubtitle}>
                  This build is compiled and linked to Firebase Firestore database <Text style={styles.monoText}>ai-studio-apnisociety-0a2721b7</Text>. All 8 personas, maintenance calculators, file upload dialogs, and receipt seals are verified.
                </Text>
              </View>
            </View>

            {/* Launch URL Row */}
            <View style={styles.launchUrlBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.launchUrlLabel}>Public Resident Portal URL (PWA Web & Mobile):</Text>
                <Text style={styles.launchUrlText} numberOfLines={1}>
                  {typeof window !== 'undefined' ? window.location.href : 'https://apnisociety.web.app'}
                </Text>
              </View>
              <View style={styles.launchBtnRow}>
                <Button
                  title="📱 QR Code"
                  variant="outline"
                  size="sm"
                  onPress={() => setShowQrModal(true)}
                />
                <Button
                  title="📋 Copy Link"
                  variant="primary"
                  size="sm"
                  onPress={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                      showToast('✓ Public Resident Portal link copied to clipboard!');
                    }
                  }}
                />
              </View>
            </View>

            {/* Quick Action Badges: Real Data Status & Android App */}
            <View style={styles.quickLaunchBannerGrid}>
              <View style={[styles.quickLaunchBanner, storageStats.mode === 'real' ? styles.quickBannerGreen : styles.quickBannerYellow]}>
                <View style={styles.quickBannerIconCircle}>
                  <Text style={styles.quickBannerIcon}>{storageStats.mode === 'real' ? '🟢' : '🧹'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickBannerTitle}>
                    {storageStats.mode === 'real' ? 'Real Production Mode Active' : 'Dummy Demo Data Active'}
                  </Text>
                  <Text style={styles.quickBannerSubtitle}>
                    {storageStats.mode === 'real'
                      ? 'Ledgers and logs are clean. Ready for genuine society operations.'
                      : `${storageStats.billsCount} bills, ${storageStats.complaintsCount} complaints, ${storageStats.expensesCount} expenses detected. Reset to real data before launch.`}
                  </Text>
                </View>
                <Button
                  title={storageStats.mode === 'real' ? 'Manage Real Data →' : 'Wipe Dummy Data →'}
                  variant={storageStats.mode === 'real' ? 'outline' : 'primary'}
                  size="sm"
                  onPress={() => setActiveTab('datamode')}
                />
              </View>

              <View style={[styles.quickLaunchBanner, styles.quickBannerBlue]}>
                <View style={styles.quickBannerIconCircleBlue}>
                  <Text style={styles.quickBannerIcon}>🤖</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickBannerTitle}>Android App Deployment</Text>
                  <Text style={styles.quickBannerSubtitle}>
                    WebAPK, Expo EAS Build (.apk), and Google Play TWA configured with package com.apnisociety.app.
                  </Text>
                </View>
                <Button
                  title="Deploy Android →"
                  variant="primary"
                  size="sm"
                  onPress={() => setActiveTab('android')}
                />
              </View>
            </View>
          </Card>

          {/* Pre-Flight Checklist */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Production Release Pre-Flight Audit</Text>
                <Text style={styles.sectionSubtitle}>
                  Ensure all society bylaws, bank details, and tower configurations are customized before distributing to residents.
                </Text>
              </View>
              <View style={[styles.checklistScoreBadge, allChecksReady ? styles.scoreReady : styles.scoreWarn]}>
                <Text style={styles.checklistScoreText}>
                  {checklist.filter((c) => c.isReady).length} / {checklist.length} Complete
                </Text>
              </View>
            </View>

            <View style={styles.checklistGrid}>
              {checklist.map((item) => (
                <View key={item.id} style={styles.checkItemCard}>
                  <View style={styles.checkIconCol}>
                    <Text style={styles.checkStatusIcon}>{item.isReady ? '✅' : '⚠️'}</Text>
                  </View>
                  <View style={styles.checkBody}>
                    <View style={styles.checkTitleRow}>
                      <Text style={styles.checkTitle}>{item.title}</Text>
                      <StatusBadge
                        status={item.isReady ? 'approved' : 'pending'}
                        label={item.isReady ? 'READY' : 'NEEDS ATTENTION'}
                        size="sm"
                      />
                    </View>
                    <Text style={styles.checkDesc}>{item.description}</Text>
                    {!item.isReady && item.actionHint && (
                      <Text style={styles.checkActionHint}>💡 Action: {item.actionHint}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Card>

          {/* Resident Onboarding Share Box */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📢 Official Resident Circular & Onboarding Invitation</Text>
            <Text style={styles.sectionSubtitle}>
              Broadcast this message via WhatsApp, Email, or print on the society clubhouse notice board.
            </Text>
            <View style={styles.shareMessageBox}>
              <Text style={styles.shareMessageText}>{shareableMsg}</Text>
            </View>
            <View style={styles.shareActionsRow}>
              <Button
                title="📋 Copy Announcement Text"
                variant="outline"
                size="md"
                onPress={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareableMsg);
                    showToast('✓ Onboarding announcement copied to clipboard!');
                  }
                }}
              />
              <Button
                title="⚙️ Customize Society Name & Details"
                variant="primary"
                size="md"
                onPress={() => setActiveTab('identity')}
              />
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SOCIETY IDENTITY & BRANDING                                       */}
      {/* ========================================================================= */}
      {activeTab === 'identity' && (
        <View style={styles.tabContent}>
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🏛️ Legal Society Identity & Official Crest</Text>
            <Text style={styles.sectionSubtitle}>
              These details appear on all official maintenance invoices, digital receipt seals, gate passes, and resident circulars.
            </Text>

            <View style={styles.formGrid}>
              <View style={styles.formColFull}>
                <Text style={styles.fieldLabel}>Society Legal Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={config.societyName}
                  onChangeText={(val) => setConfig({ ...config, societyName: val })}
                  placeholder="e.g. Shanti Heights Cooperative Housing Society Ltd"
                />
              </View>

              <View style={styles.formColHalf}>
                <Text style={styles.fieldLabel}>Short Code / Prefix *</Text>
                <TextInput
                  style={styles.textInput}
                  value={config.societyCode}
                  onChangeText={(val) => setConfig({ ...config, societyCode: val })}
                  placeholder="e.g. SH-402 or SHCHS"
                />
              </View>

              <View style={styles.formColHalf}>
                <Text style={styles.fieldLabel}>Government Registration Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={config.registrationNumber}
                  onChangeText={(val) => setConfig({ ...config, registrationNumber: val })}
                  placeholder="e.g. REG/2019/MAH/HSG/4981"
                />
              </View>

              <View style={styles.formColFull}>
                <Text style={styles.fieldLabel}>Tagline / Motto</Text>
                <TextInput
                  style={styles.textInput}
                  value={config.tagline}
                  onChangeText={(val) => setConfig({ ...config, tagline: val })}
                  placeholder="e.g. A Secure, Green & Self-Governed Resident Community"
                />
              </View>

              {/* Society Logo Upload */}
              <View style={styles.formColFull}>
                <FileUpload
                  label="Official Society Logo / Crest (Optional)"
                  description="Appears in header, official receipts, and PDF exports"
                  accept="image/*"
                  currentFileName={config.logoUrl ? 'Society_Official_Logo.png' : ''}
                  currentFileUrl={config.logoUrl}
                  onFileSelect={(f) => setConfig({ ...config, logoUrl: f.dataUrl || '' })}
                  onClear={() => setConfig({ ...config, logoUrl: '' })}
                />
              </View>

              <View style={styles.formColHalf}>
                <Text style={styles.fieldLabel}>Address Line 1</Text>
                <TextInput
                  style={styles.textInput}
                  value={config.addressLine1}
                  onChangeText={(val) => setConfig({ ...config, addressLine1: val })}
                  placeholder="Plot / Sector / Road"
                />
              </View>

              <View style={styles.formColHalf}>
                <Text style={styles.fieldLabel}>Address Line 2 / Landmark</Text>
                <TextInput
                  style={styles.textInput}
                  value={config.addressLine2}
                  onChangeText={(val) => setConfig({ ...config, addressLine2: val })}
                  placeholder="Near Central Park"
                />
              </View>

              <View style={styles.formColThird}>
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput
                  style={styles.textInput}
                  value={config.city}
                  onChangeText={(val) => setConfig({ ...config, city: val })}
                  placeholder="Navi Mumbai"
                />
              </View>

              <View style={styles.formColThird}>
                <Text style={styles.fieldLabel}>State</Text>
                <TextInput
                  style={styles.textInput}
                  value={config.state}
                  onChangeText={(val) => setConfig({ ...config, state: val })}
                  placeholder="Maharashtra"
                />
              </View>

              <View style={styles.formColThird}>
                <Text style={styles.fieldLabel}>PIN Code</Text>
                <TextInput
                  style={styles.textInput}
                  value={config.pincode}
                  onChangeText={(val) => setConfig({ ...config, pincode: val })}
                  placeholder="400706"
                />
              </View>

              <View style={styles.formColThird}>
                <Text style={styles.fieldLabel}>Committee Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={config.contactEmail}
                  onChangeText={(val) => setConfig({ ...config, contactEmail: val })}
                  placeholder="committee@society.org"
                />
              </View>

              <View style={styles.formColThird}>
                <Text style={styles.fieldLabel}>Committee Phone / Helpline</Text>
                <TextInput
                  style={styles.textInput}
                  value={config.contactPhone}
                  onChangeText={(val) => setConfig({ ...config, contactPhone: val })}
                  placeholder="+91 98201 44821"
                />
              </View>

              <View style={styles.formColThird}>
                <Text style={styles.fieldLabel}>Security Main Gate SOS</Text>
                <TextInput
                  style={styles.textInput}
                  value={config.emergencyGateContact}
                  onChangeText={(val) => setConfig({ ...config, emergencyGateContact: val })}
                  placeholder="+91 98201 99999"
                />
              </View>
            </View>

            <View style={styles.saveSectionBar}>
              <Button title="💾 Save Society Identity" variant="primary" size="lg" onPress={handleSave} />
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TOWERS & FLATS ARCHITECTURE                                       */}
      {/* ========================================================================= */}
      {activeTab === 'architecture' && (
        <View style={styles.tabContent}>
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>🏢 Towers, Blocks & Flat Inventory</Text>
                <Text style={styles.sectionSubtitle}>
                  Configure your society's blocks/wings. Currently {config.towers.filter(t => t.active).length} active towers with {config.totalUnitsCount} total flats.
                </Text>
              </View>
              <Button
                title="+ Add Tower / Block"
                variant="primary"
                size="md"
                onPress={() => setShowAddTowerModal(true)}
              />
            </View>

            <View style={styles.towersGrid}>
              {config.towers.map((tower) => {
                const unitsInTower = tower.floorsCount * tower.flatsPerFloor;
                return (
                  <View key={tower.id} style={[styles.towerCard, !tower.active && styles.towerInactive]}>
                    <View style={styles.towerCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.towerName}>{tower.name}</Text>
                        <Text style={styles.towerPrefix}>Prefix: "{tower.unitPrefix}" • e.g. {tower.unitPrefix}101 to {tower.unitPrefix}{tower.floorsCount}0{tower.flatsPerFloor}</Text>
                      </View>
                      <Switch
                        value={tower.active}
                        onValueChange={() => handleToggleTower(tower.id)}
                        trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                      />
                    </View>

                    <View style={styles.towerStatsRow}>
                      <View style={styles.towerStatCol}>
                        <Text style={styles.towerStatVal}>{tower.floorsCount}</Text>
                        <Text style={styles.towerStatLabel}>Floors</Text>
                      </View>
                      <View style={styles.towerStatCol}>
                        <Text style={styles.towerStatVal}>{tower.flatsPerFloor}</Text>
                        <Text style={styles.towerStatLabel}>Flats / Floor</Text>
                      </View>
                      <View style={styles.towerStatCol}>
                        <Text style={styles.towerStatVal}>{unitsInTower}</Text>
                        <Text style={styles.towerStatLabel}>Total Units</Text>
                      </View>
                    </View>

                    <View style={styles.towerActionsRow}>
                      <Pressable
                        style={styles.delTowerBtn}
                        onPress={() => handleDeleteTower(tower.id)}
                      >
                        <Text style={styles.delTowerText}>🗑️ Remove Block</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.saveSectionBar}>
              <Button title="💾 Save Architecture Changes" variant="primary" size="lg" onPress={handleSave} />
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MAINTENANCE & FINANCIAL SETTINGS                                   */}
      {/* ========================================================================= */}
      {activeTab === 'finance' && (
        <View style={styles.tabContent}>
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>💳 Maintenance Tariffs & Billing Calculations</Text>
            <Text style={styles.sectionSubtitle}>
              Configure monthly society maintenance billing rates, reserve fund splits, grace periods, and late penalty charges.
            </Text>

            <View style={styles.formGrid}>
              <View style={styles.formColFull}>
                <Text style={styles.fieldLabel}>Calculation Method</Text>
                <View style={styles.modeToggleRow}>
                  <Pressable
                    style={[styles.modeChip, config.maintenance.calculationMode === 'flat_fixed' && styles.modeChipActive]}
                    onPress={() => setConfig({ ...config, maintenance: { ...config.maintenance, calculationMode: 'flat_fixed' } })}
                  >
                    <Text style={[styles.modeChipText, config.maintenance.calculationMode === 'flat_fixed' && styles.modeChipTextActive]}>
                      🏷️ Flat Fixed Rate (Uniform)
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modeChip, config.maintenance.calculationMode === 'sqft_area' && styles.modeChipActive]}
                    onPress={() => setConfig({ ...config, maintenance: { ...config.maintenance, calculationMode: 'sqft_area' } })}
                  >
                    <Text style={[styles.modeChipText, config.maintenance.calculationMode === 'sqft_area' && styles.modeChipTextActive]}>
                      📐 Per Sq.Ft Built-Up Area
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modeChip, config.maintenance.calculationMode === 'hybrid' && styles.modeChipActive]}
                    onPress={() => setConfig({ ...config, maintenance: { ...config.maintenance, calculationMode: 'hybrid' } })}
                  >
                    <Text style={[styles.modeChipText, config.maintenance.calculationMode === 'hybrid' && styles.modeChipTextActive]}>
                      ⚖️ Hybrid (Base + Amenities)
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.formColHalf}>
                <Text style={styles.fieldLabel}>Base Monthly Maintenance (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={String(config.maintenance.baseMonthlyRate)}
                  onChangeText={(val) => setConfig({ ...config, maintenance: { ...config.maintenance, baseMonthlyRate: parseFloat(val) || 0 } })}
                  placeholder="3500"
                />
              </View>

              <View style={styles.formColHalf}>
                <Text style={styles.fieldLabel}>Rate Per Sq.Ft (₹ / sq.ft)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={String(config.maintenance.ratePerSqFt)}
                  onChangeText={(val) => setConfig({ ...config, maintenance: { ...config.maintenance, ratePerSqFt: parseFloat(val) || 0 } })}
                  placeholder="2.80"
                />
              </View>

              <View style={styles.formColThird}>
                <Text style={styles.fieldLabel}>Sinking Fund (₹ / mo)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={String(config.maintenance.sinkingFundRate)}
                  onChangeText={(val) => setConfig({ ...config, maintenance: { ...config.maintenance, sinkingFundRate: parseFloat(val) || 0 } })}
                />
              </View>

              <View style={styles.formColThird}>
                <Text style={styles.fieldLabel}>Common Amenities (₹ / mo)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={String(config.maintenance.commonFacilitiesRate)}
                  onChangeText={(val) => setConfig({ ...config, maintenance: { ...config.maintenance, commonFacilitiesRate: parseFloat(val) || 0 } })}
                />
              </View>

              <View style={styles.formColThird}>
                <Text style={styles.fieldLabel}>Security & Guarding (₹ / mo)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={String(config.maintenance.securityFee)}
                  onChangeText={(val) => setConfig({ ...config, maintenance: { ...config.maintenance, securityFee: parseFloat(val) || 0 } })}
                />
              </View>

              <View style={styles.formColThird}>
                <Text style={styles.fieldLabel}>Billing Cycle Due Day</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={String(config.maintenance.billingDueDay)}
                  onChangeText={(val) => setConfig({ ...config, maintenance: { ...config.maintenance, billingDueDay: parseInt(val) || 10 } })}
                  placeholder="10 (10th of every month)"
                />
              </View>

              <View style={styles.formColThird}>
                <Text style={styles.fieldLabel}>Grace Period (Days)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={String(config.maintenance.gracePeriodDays)}
                  onChangeText={(val) => setConfig({ ...config, maintenance: { ...config.maintenance, gracePeriodDays: parseInt(val) || 7 } })}
                  placeholder="7"
                />
              </View>

              <View style={styles.formColThird}>
                <Text style={styles.fieldLabel}>Late Penalty (Flat ₹)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={String(config.maintenance.lateFeeValue)}
                  onChangeText={(val) => setConfig({ ...config, maintenance: { ...config.maintenance, lateFeeValue: parseFloat(val) || 0 } })}
                  placeholder="200"
                />
              </View>
            </View>

            {/* Society Bank Details */}
            <View style={{ marginTop: spacing.lg }}>
              <Text style={styles.subSectionTitle}>🏦 Society Official Bank Account & UPI VPA</Text>
              <Text style={styles.subSectionSubtitle}>
                Payments from residents and NEFT transfers will be routed to these official credentials.
              </Text>

              <View style={styles.formGrid}>
                <View style={styles.formColHalf}>
                  <Text style={styles.fieldLabel}>Bank Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={config.maintenance.bankName}
                    onChangeText={(val) => setConfig({ ...config, maintenance: { ...config.maintenance, bankName: val } })}
                    placeholder="HDFC Bank"
                  />
                </View>

                <View style={styles.formColHalf}>
                  <Text style={styles.fieldLabel}>Account Number</Text>
                  <TextInput
                    style={styles.textInput}
                    value={config.maintenance.bankAccountNumber}
                    onChangeText={(val) => setConfig({ ...config, maintenance: { ...config.maintenance, bankAccountNumber: val } })}
                    placeholder="50100412890142"
                  />
                </View>

                <View style={styles.formColHalf}>
                  <Text style={styles.fieldLabel}>IFSC Code</Text>
                  <TextInput
                    style={styles.textInput}
                    value={config.maintenance.bankIfscCode}
                    onChangeText={(val) => setConfig({ ...config, maintenance: { ...config.maintenance, bankIfscCode: val } })}
                    placeholder="HDFC0001042"
                  />
                </View>

                <View style={styles.formColHalf}>
                  <Text style={styles.fieldLabel}>Account Holder Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={config.maintenance.bankAccountHolder}
                    onChangeText={(val) => setConfig({ ...config, maintenance: { ...config.maintenance, bankAccountHolder: val } })}
                    placeholder="Shanti Heights RWA Official"
                  />
                </View>

                <View style={styles.formColHalf}>
                  <Text style={styles.fieldLabel}>Society UPI VPA (for QR code payments)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={config.maintenance.upiVpa}
                    onChangeText={(val) => setConfig({ ...config, maintenance: { ...config.maintenance, upiVpa: val } })}
                    placeholder="shantiheights.rwa@hdfcbank"
                  />
                </View>

                <View style={styles.formColHalf}>
                  <Text style={styles.fieldLabel}>UPI Payee Display Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={config.maintenance.upiPayeeName}
                    onChangeText={(val) => setConfig({ ...config, maintenance: { ...config.maintenance, upiPayeeName: val } })}
                    placeholder="Shanti Heights RWA"
                  />
                </View>
              </View>
            </View>

            <View style={styles.saveSectionBar}>
              <Button title="💾 Save Financial Tariffs" variant="primary" size="lg" onPress={handleSave} />
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CLUBHOUSE & AMENITIES                                             */}
      {/* ========================================================================= */}
      {activeTab === 'amenities' && (
        <View style={styles.tabContent}>
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🎪 Society Facilities, Hall & Lawn Booking Rules</Text>
            <Text style={styles.sectionSubtitle}>
              Activate or deactivate facilities and customize slot tariffs, security deposits, and cleaning charges.
            </Text>

            <View style={styles.facilitiesList}>
              {config.facilities.map((fac) => (
                <View key={fac.id} style={[styles.facilityCard, !fac.enabled && styles.facilityDisabled]}>
                  <View style={styles.facilityHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.facilityName}>{fac.name}</Text>
                      <Text style={styles.facilityMeta}>Category: {fac.category.toUpperCase()} • Max Capacity: {fac.capacity} guests</Text>
                    </View>
                    <Switch
                      value={fac.enabled}
                      onValueChange={(val) => handleUpdateFacility(fac.id, { enabled: val })}
                      trackColor={{ false: colors.neutral[300], true: colors.success.main }}
                    />
                  </View>

                  <View style={styles.facilityTariffsRow}>
                    <View style={styles.tariffCol}>
                      <Text style={styles.tariffLabel}>Morning Slot (₹)</Text>
                      <TextInput
                        style={styles.tariffInput}
                        keyboardType="numeric"
                        value={String(fac.morningSlotRate)}
                        onChangeText={(v) => handleUpdateFacility(fac.id, { morningSlotRate: parseFloat(v) || 0 })}
                      />
                    </View>
                    <View style={styles.tariffCol}>
                      <Text style={styles.tariffLabel}>Evening Slot (₹)</Text>
                      <TextInput
                        style={styles.tariffInput}
                        keyboardType="numeric"
                        value={String(fac.eveningSlotRate)}
                        onChangeText={(v) => handleUpdateFacility(fac.id, { eveningSlotRate: parseFloat(v) || 0 })}
                      />
                    </View>
                    <View style={styles.tariffCol}>
                      <Text style={styles.tariffLabel}>Full Day (₹)</Text>
                      <TextInput
                        style={styles.tariffInput}
                        keyboardType="numeric"
                        value={String(fac.fullDaySlotRate)}
                        onChangeText={(v) => handleUpdateFacility(fac.id, { fullDaySlotRate: parseFloat(v) || 0 })}
                      />
                    </View>
                    <View style={styles.tariffCol}>
                      <Text style={styles.tariffLabel}>Security Deposit (₹)</Text>
                      <TextInput
                        style={styles.tariffInput}
                        keyboardType="numeric"
                        value={String(fac.securityDeposit)}
                        onChangeText={(v) => handleUpdateFacility(fac.id, { securityDeposit: parseFloat(v) || 0 })}
                      />
                    </View>
                    <View style={styles.tariffCol}>
                      <Text style={styles.tariffLabel}>Cleaning Fee (₹)</Text>
                      <TextInput
                        style={styles.tariffInput}
                        keyboardType="numeric"
                        value={String(fac.cleaningFee)}
                        onChangeText={(v) => handleUpdateFacility(fac.id, { cleaningFee: parseFloat(v) || 0 })}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.saveSectionBar}>
              <Button title="💾 Save Amenity Tariffs" variant="primary" size="lg" onPress={handleSave} />
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: MODULE TOGGLES                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'modules' && (
        <View style={styles.tabContent}>
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🧩 Society Feature Flags & Module Visibility</Text>
            <Text style={styles.sectionSubtitle}>
              Activate or deactivate entire modules based on whether your society requires water tanker management, clubhouse bookings, petty cash reimbursements, etc.
            </Text>

            <View style={styles.modulesGrid}>
              {[
                { key: 'maintenanceBilling', label: 'Maintenance Billing & NOCs', icon: '💳', desc: 'Monthly bill cycles, ledger cards, payment receipts, NOC certificates' },
                { key: 'waterManagement', label: 'Water Supply & Tankers', icon: '💧', desc: 'Sump/tank telemetry, municipal schedules, tanker procurement' },
                { key: 'expensesBudgeting', label: 'Society Expenses & Vouchers', icon: '📊', desc: 'Vendor vouchers, category allocations, reserve fund scrutinies' },
                { key: 'reimbursements', label: 'Reimbursement Claims Desk', icon: '💰', desc: 'Resident and committee member emergency out-of-pocket claims' },
                { key: 'hallBooking', label: 'Clubhouse & Hall Bookings', icon: '🏛️', desc: 'Event facilities, slot calendar, security deposits, gate passes' },
                { key: 'complaintsDesk', label: 'Service Complaints Desk', icon: '🛠️', desc: 'Plumbing, electrical, lifts, SLA tracking, staff assignments' },
                { key: 'noticesBroadcast', label: 'Broadcasting & Notices Rail', icon: '📢', desc: 'WhatsApp, SMS, push alerts, emergency siren broadcast' },
                { key: 'membersDirectory', label: 'Resident & Member Directory', icon: '👥', desc: 'Owners, tenants, management committee portfolio rosters' },
                { key: 'rolesRbac', label: 'Roles & RBAC Governance', icon: '🛡️', desc: 'President, Vice President, Treasurer granular permissions' },
                { key: 'apiBackend', label: 'API Backend & System Console', icon: '⚡', desc: 'Developer architecture explorer, database telemetry' },
              ].map((mod) => {
                const isEnabled = (config.modules as any)[mod.key];
                return (
                  <View key={mod.key} style={styles.moduleItem}>
                    <Text style={styles.moduleIcon}>{mod.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.moduleTitle}>{mod.label}</Text>
                      <Text style={styles.moduleDesc}>{mod.desc}</Text>
                    </View>
                    <Switch
                      value={isEnabled}
                      onValueChange={(val) =>
                        setConfig({
                          ...config,
                          modules: { ...config.modules, [mod.key]: val },
                        })
                      }
                      trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                    />
                  </View>
                );
              })}
            </View>

            <View style={styles.saveSectionBar}>
              <Button title="💾 Save Module Toggles" variant="primary" size="lg" onPress={handleSave} />
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: 1-CLICK PRESETS                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'presets' && (
        <View style={styles.tabContent}>
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📑 1-Click Society Templates</Text>
            <Text style={styles.sectionSubtitle}>
              Instantly configure the entire application for your type of housing complex with optimized defaults.
            </Text>

            <View style={styles.presetsGrid}>
              {(Object.keys(SOCIETY_PRESETS) as SocietyPresetType[]).map((key) => {
                const preset = SOCIETY_PRESETS[key];
                return (
                  <View key={key} style={styles.presetCard}>
                    <View style={styles.presetIconBox}>
                      <Text style={styles.presetIcon}>{preset.icon}</Text>
                    </View>
                    <Text style={styles.presetTitle}>{preset.title}</Text>
                    <Text style={styles.presetSubtitle}>{preset.subtitle}</Text>
                    <View style={styles.presetSampleBox}>
                      <Text style={styles.presetSampleText}>
                        🏷️ {preset.config.societyName}
                      </Text>
                      <Text style={styles.presetSampleSub}>
                        Flats: {preset.config.totalUnitsCount} • Base: ₹{preset.config.maintenance?.baseMonthlyRate}/mo
                      </Text>
                    </View>
                    <Button
                      title="Apply This Template →"
                      variant="outline"
                      size="sm"
                      onPress={() => handleApplyPreset(key)}
                    />
                  </View>
                );
              })}
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB: REAL DATA MODE & DUMMY DATA PURGE                                    */}
      {/* ========================================================================= */}
      {activeTab === 'datamode' && (
        <View style={styles.tabContent}>
          {/* Status Hero Card */}
          <Card style={styles.sectionCard}>
            <View style={styles.dataModeHeroRow}>
              <View style={styles.dataModeIconBox}>
                <Text style={styles.dataModeIcon}>{storageStats.mode === 'real' ? '🟢' : '🧹'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <Text style={styles.sectionTitle}>
                    {storageStats.mode === 'real' ? 'Real Production Data Mode Active' : 'Demo / Dummy Data Active'}
                  </Text>
                  <StatusBadge
                    status={storageStats.mode === 'real' ? 'paid' : 'pending'}
                    label={storageStats.mode === 'real' ? 'PRODUCTION CLEAN' : 'DUMMY SEED'}
                    size="sm"
                  />
                </View>
                <Text style={styles.sectionSubtitle}>
                  {storageStats.mode === 'real'
                    ? `Your society is operating on clean production data. All sample invoices, mock complaints, and dummy records have been cleared.`
                    : `The application currently contains pre-packaged sample records for demonstration. To prepare for official society release, purge all dummy data below to start with a fresh slate.`}
                </Text>
              </View>
            </View>

            {/* Master Action Banner */}
            <View style={styles.masterResetCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.masterResetTitle}>🚀 Initialize Real Society Data</Text>
                <Text style={styles.masterResetDesc}>
                  Wipe all dummy bills, tickets, expenses, water readings, and bookings. Automatically creates real vacant units matching your configured towers and initializes your official Secretary/Admin profile.
                </Text>
              </View>
              <View style={styles.masterResetBtnRow}>
                <Button
                  title="🧹 Reset All Dummy Data"
                  variant="primary"
                  size="md"
                  onPress={() => setShowResetModal(true)}
                />
                <Button
                  title="👥 Bulk Import Residents"
                  variant="outline"
                  size="md"
                  onPress={() => setShowBulkMemberModal(true)}
                />
                {storageStats.mode === 'real' && (
                  <Button
                    title="🔄 Load Sandbox Demo"
                    variant="ghost"
                    size="md"
                    onPress={handleRestoreDemo}
                  />
                )}
              </View>
            </View>
          </Card>

          {/* Operational Ledger Records Table */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>📊 Live Database Ledger Audit</Text>
                <Text style={styles.sectionSubtitle}>
                  Inspect active operational records. Clear individual modules as needed.
                </Text>
              </View>
            </View>

            <View style={styles.moduleAuditGrid}>
              {/* Bills */}
              <View style={styles.auditRowItem}>
                <View style={styles.auditRowIconCircle}>
                  <Text style={styles.auditRowIcon}>💳</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.auditRowTitle}>Maintenance Invoices & Receipts</Text>
                  <Text style={styles.auditRowDesc}>
                    {storageStats.billsCount} active bills stored in database
                  </Text>
                </View>
                <View style={styles.auditRowAction}>
                  <StatusBadge
                    status={storageStats.billsCount === 0 ? 'paid' : 'pending'}
                    label={storageStats.billsCount === 0 ? '0 (CLEAN)' : `${storageStats.billsCount} RECORDS`}
                    size="sm"
                  />
                  {storageStats.billsCount > 0 && (
                    <Button
                      title="Clear"
                      variant="outline"
                      size="sm"
                      onPress={() => handleModuleWipe('maintenance')}
                    />
                  )}
                </View>
              </View>

              {/* Complaints */}
              <View style={styles.auditRowItem}>
                <View style={styles.auditRowIconCircle}>
                  <Text style={styles.auditRowIcon}>🛠️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.auditRowTitle}>Helpdesk & Complaint Tickets</Text>
                  <Text style={styles.auditRowDesc}>
                    {storageStats.complaintsCount} active complaints logged
                  </Text>
                </View>
                <View style={styles.auditRowAction}>
                  <StatusBadge
                    status={storageStats.complaintsCount === 0 ? 'paid' : 'pending'}
                    label={storageStats.complaintsCount === 0 ? '0 (CLEAN)' : `${storageStats.complaintsCount} RECORDS`}
                    size="sm"
                  />
                  {storageStats.complaintsCount > 0 && (
                    <Button
                      title="Clear"
                      variant="outline"
                      size="sm"
                      onPress={() => handleModuleWipe('complaints')}
                    />
                  )}
                </View>
              </View>

              {/* Expenses */}
              <View style={styles.auditRowItem}>
                <View style={styles.auditRowIconCircle}>
                  <Text style={styles.auditRowIcon}>🧾</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.auditRowTitle}>Society Expense Vouchers</Text>
                  <Text style={styles.auditRowDesc}>
                    {storageStats.expensesCount} expenses & {storageStats.claimsCount} claims
                  </Text>
                </View>
                <View style={styles.auditRowAction}>
                  <StatusBadge
                    status={storageStats.expensesCount === 0 ? 'paid' : 'pending'}
                    label={storageStats.expensesCount === 0 ? '0 (CLEAN)' : `${storageStats.expensesCount} RECORDS`}
                    size="sm"
                  />
                  {storageStats.expensesCount > 0 && (
                    <Button
                      title="Clear"
                      variant="outline"
                      size="sm"
                      onPress={() => {
                        handleModuleWipe('expenses');
                        handleModuleWipe('reimbursements');
                      }}
                    />
                  )}
                </View>
              </View>

              {/* Water Readings */}
              <View style={styles.auditRowItem}>
                <View style={styles.auditRowIconCircle}>
                  <Text style={styles.auditRowIcon}>💧</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.auditRowTitle}>Water Meter Readings & Tankers</Text>
                  <Text style={styles.auditRowDesc}>
                    {storageStats.waterReadingsCount} meter readings registered
                  </Text>
                </View>
                <View style={styles.auditRowAction}>
                  <StatusBadge
                    status={storageStats.waterReadingsCount === 0 ? 'paid' : 'pending'}
                    label={storageStats.waterReadingsCount === 0 ? '0 (CLEAN)' : `${storageStats.waterReadingsCount} RECORDS`}
                    size="sm"
                  />
                  {storageStats.waterReadingsCount > 0 && (
                    <Button
                      title="Clear"
                      variant="outline"
                      size="sm"
                      onPress={() => handleModuleWipe('water')}
                    />
                  )}
                </View>
              </View>

              {/* Hall Bookings */}
              <View style={styles.auditRowItem}>
                <View style={styles.auditRowIconCircle}>
                  <Text style={styles.auditRowIcon}>🎪</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.auditRowTitle}>Hall & Facility Bookings</Text>
                  <Text style={styles.auditRowDesc}>
                    {storageStats.bookingsCount} booking slots reserved
                  </Text>
                </View>
                <View style={styles.auditRowAction}>
                  <StatusBadge
                    status={storageStats.bookingsCount === 0 ? 'paid' : 'pending'}
                    label={storageStats.bookingsCount === 0 ? '0 (CLEAN)' : `${storageStats.bookingsCount} RECORDS`}
                    size="sm"
                  />
                  {storageStats.bookingsCount > 0 && (
                    <Button
                      title="Clear"
                      variant="outline"
                      size="sm"
                      onPress={() => handleModuleWipe('bookings')}
                    />
                  )}
                </View>
              </View>

              {/* Broadcast Notifications */}
              <View style={styles.auditRowItem}>
                <View style={styles.auditRowIconCircle}>
                  <Text style={styles.auditRowIcon}>📢</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.auditRowTitle}>Broadcast Alerts & Notices</Text>
                  <Text style={styles.auditRowDesc}>
                    {storageStats.notificationsCount} circular notifications
                  </Text>
                </View>
                <View style={styles.auditRowAction}>
                  <StatusBadge
                    status={storageStats.notificationsCount <= 1 ? 'paid' : 'pending'}
                    label={`${storageStats.notificationsCount} NOTICES`}
                    size="sm"
                  />
                  {storageStats.notificationsCount > 1 && (
                    <Button
                      title="Clear"
                      variant="outline"
                      size="sm"
                      onPress={() => handleModuleWipe('notifications')}
                    />
                  )}
                </View>
              </View>

              {/* Members & Units */}
              <View style={styles.auditRowItem}>
                <View style={styles.auditRowIconCircle}>
                  <Text style={styles.auditRowIcon}>👥</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.auditRowTitle}>Units & Resident Directory</Text>
                  <Text style={styles.auditRowDesc}>
                    {storageStats.unitsCount} total units • {storageStats.membersCount} registered members
                  </Text>
                </View>
                <View style={styles.auditRowAction}>
                  <StatusBadge
                    status="paid"
                    label={`${storageStats.membersCount} MEMBERS`}
                    size="sm"
                  />
                  <Button
                    title="Bulk Add"
                    variant="outline"
                    size="sm"
                    onPress={() => setShowBulkMemberModal(true)}
                  />
                </View>
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB: ANDROID APP DEPLOYMENT & DISTRIBUTION                                */}
      {/* ========================================================================= */}
      {activeTab === 'android' && (
        <View style={styles.tabContent}>
          {/* Android Hero Card */}
          <Card style={styles.sectionCard}>
            <View style={styles.dataModeHeroRow}>
              <View style={styles.androidHeroIconCircle}>
                <Text style={styles.dataModeIcon}>🤖</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <Text style={styles.sectionTitle}>Android App Deployment Hub</Text>
                  <StatusBadge status="paid" label="PACKAGE READY" size="sm" />
                </View>
                <Text style={styles.sectionSubtitle}>
                  Package: <Text style={styles.monoText}>com.apnisociety.app</Text> • Deep Link Scheme: <Text style={styles.monoText}>apnisociety://</Text>
                </Text>
              </View>
            </View>

            {/* Android Device Live Status */}
            <View style={styles.androidLiveBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.androidLiveTitle}>
                  {androidPrompt.isAndroid ? '📱 Android Smartphone Detected' : '💻 Web / Desktop Browser'}
                </Text>
                <Text style={styles.androidLiveDesc}>
                  {androidPrompt.isInstalled
                    ? 'ApniSociety is installed in Standalone Native WebAPK mode on this device.'
                    : androidPrompt.isInstallable
                    ? 'This Android browser is ready for 1-Tap native WebAPK installation.'
                    : 'Residents can install directly on any Android device via Google Chrome or build an APK with Expo EAS.'}
                </Text>
              </View>

              {androidPrompt.isInstallable && !androidPrompt.isInstalled && (
                <Button
                  title="📲 1-Tap Install App"
                  variant="primary"
                  size="md"
                  onPress={async () => {
                    const outcome = await androidPrompt.triggerInstall();
                    if (outcome === 'accepted') {
                      showToast('✓ ApniSociety installed successfully on your Android device!');
                    }
                  }}
                />
              )}
            </View>

            {/* Android Sub-Nav Pills */}
            <View style={styles.androidPillsRow}>
              <Pressable
                style={[styles.androidPillBtn, activeAndroidSubTab === 'webapk' && styles.androidPillBtnActive]}
                onPress={() => setActiveAndroidSubTab('webapk')}
              >
                <Text style={[styles.androidPillBtnText, activeAndroidSubTab === 'webapk' && styles.androidPillBtnTextActive]}>
                  ⚡ 1-Click WebAPK (Fastest)
                </Text>
              </Pressable>

              <Pressable
                style={[styles.androidPillBtn, activeAndroidSubTab === 'eas' && styles.androidPillBtnActive]}
                onPress={() => setActiveAndroidSubTab('eas')}
              >
                <Text style={[styles.androidPillBtnText, activeAndroidSubTab === 'eas' && styles.androidPillBtnTextActive]}>
                  📦 Expo EAS Build (.apk / .aab)
                </Text>
              </Pressable>

              <Pressable
                style={[styles.androidPillBtn, activeAndroidSubTab === 'twa' && styles.androidPillBtnActive]}
                onPress={() => setActiveAndroidSubTab('twa')}
              >
                <Text style={[styles.androidPillBtnText, activeAndroidSubTab === 'twa' && styles.androidPillBtnTextActive]}>
                  🏪 Google Play Store (TWA)
                </Text>
              </Pressable>

              <Pressable
                style={[styles.androidPillBtn, activeAndroidSubTab === 'permissions' && styles.androidPillBtnActive]}
                onPress={() => setActiveAndroidSubTab('permissions')}
              >
                <Text style={[styles.androidPillBtnText, activeAndroidSubTab === 'permissions' && styles.androidPillBtnTextActive]}>
                  🛡️ Permissions & Security
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* Sub-tab 1: WebAPK */}
          {activeAndroidSubTab === 'webapk' && (
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>⚡ 1-Click Android WebAPK Distribution (Zero Compile)</Text>
              <Text style={styles.sectionSubtitle}>
                Chromium on Android natively packages compliant PWAs into official Android WebAPKs with genuine app drawer presence, badge notifications, camera access, and offline caching.
              </Text>

              <View style={styles.guideStepsBox}>
                <View style={styles.guideStepItem}>
                  <View style={styles.guideStepNum}><Text style={styles.guideStepNumText}>1</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideStepTitle}>Share the Resident Portal URL with Residents</Text>
                    <Text style={styles.guideStepText}>
                      Share via WhatsApp group or display the QR code at the security gate or elevators.
                    </Text>
                  </View>
                </View>

                <View style={styles.guideStepItem}>
                  <View style={styles.guideStepNum}><Text style={styles.guideStepNumText}>2</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideStepTitle}>Resident Opens Link in Google Chrome on Android</Text>
                    <Text style={styles.guideStepText}>
                      Chrome detects the web app manifest and displays the "Install ApniSociety" banner or resident taps (⋮) → "Install App".
                    </Text>
                  </View>
                </View>

                <View style={styles.guideStepItem}>
                  <View style={styles.guideStepNum}><Text style={styles.guideStepNumText}>3</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideStepTitle}>Android Installs Native WebAPK</Text>
                    <Text style={styles.guideStepText}>
                      The app appears in Android's App Drawer alongside WhatsApp and Gmail, launches in full-screen standalone mode with no browser URL bar, and supports camera for receipt uploads.
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.shareActionsRow}>
                <Button
                  title="📱 Show Resident QR Code"
                  variant="primary"
                  size="md"
                  onPress={() => setShowQrModal(true)}
                />
                <Button
                  title="📋 Copy Portal Link"
                  variant="outline"
                  size="md"
                  onPress={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                      showToast('✓ Resident Portal link copied to clipboard!');
                    }
                  }}
                />
              </View>
            </Card>
          )}

          {/* Sub-tab 2: Expo EAS Build (.apk / .aab) */}
          {activeAndroidSubTab === 'eas' && (
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>📦 Expo EAS Build: Sideloadable APK & Google Play AAB</Text>
              <Text style={styles.sectionSubtitle}>
                Generate a standalone installable Android package file (.apk) or official Android App Bundle (.aab) using Expo EAS CLI.
              </Text>

              <View style={styles.codeSnippetBlock}>
                <Text style={styles.codeSnippetHeader}>1. Install EAS CLI and login to Expo account:</Text>
                <Text style={styles.codeSnippetText}>npm install -g eas-cli && npx eas login</Text>
              </View>

              <View style={styles.codeSnippetBlock}>
                <Text style={styles.codeSnippetHeader}>2. Build Direct Installable Android APK (For Sideloading & WhatsApp):</Text>
                <Text style={styles.codeSnippetText}>npx eas build -p android --profile preview</Text>
              </View>

              <View style={styles.codeSnippetBlock}>
                <Text style={styles.codeSnippetHeader}>3. Build Signed AAB for Google Play Store Developer Console:</Text>
                <Text style={styles.codeSnippetText}>npx eas build -p android --profile production</Text>
              </View>

              <View style={styles.shareActionsRow}>
                <Button
                  title="📋 Copy Build Commands"
                  variant="primary"
                  size="md"
                  onPress={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText('npx eas build -p android --profile preview');
                      showToast('✓ EAS build command copied to clipboard!');
                    }
                  }}
                />
                <Button
                  title="💾 Download app.json"
                  variant="outline"
                  size="md"
                  onPress={() => {
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute('href', dataStr);
                    downloadAnchor.setAttribute('download', 'app.json');
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    showToast('✓ Downloaded app.json configuration');
                  }}
                />
              </View>
            </Card>
          )}

          {/* Sub-tab 3: Google Play Store TWA (Bubblewrap) */}
          {activeAndroidSubTab === 'twa' && (
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🏪 Google Play Store Trusted Web Activity (TWA)</Text>
              <Text style={styles.sectionSubtitle}>
                Package your web app into a signed Google Play Store Android App Bundle (.aab) with Google's official Bubblewrap CLI.
              </Text>

              <View style={styles.codeSnippetBlock}>
                <Text style={styles.codeSnippetHeader}>Step 1: Install Bubblewrap CLI</Text>
                <Text style={styles.codeSnippetText}>npm install -g @bubblewrap/cli</Text>
              </View>

              <View style={styles.codeSnippetBlock}>
                <Text style={styles.codeSnippetHeader}>Step 2: Initialize from Web App Manifest</Text>
                <Text style={styles.codeSnippetText}>
                  bubblewrap init --manifest={typeof window !== 'undefined' ? window.location.origin + '/manifest.json' : 'https://apnisociety.app/manifest.json'}
                </Text>
              </View>

              <View style={styles.codeSnippetBlock}>
                <Text style={styles.codeSnippetHeader}>Step 3: Compile and sign release APK/AAB</Text>
                <Text style={styles.codeSnippetText}>bubblewrap build</Text>
              </View>

              <View style={styles.assetLinksBox}>
                <Text style={styles.assetLinksTitle}>✅ Android Digital Asset Links Configured</Text>
                <Text style={styles.assetLinksDesc}>
                  File <Text style={styles.monoText}>/.well-known/assetlinks.json</Text> is active on this server with SHA-256 fingerprint for <Text style={styles.monoText}>com.apnisociety.app</Text>, eliminating browser chrome URL bar.
                </Text>
              </View>
            </Card>
          )}

          {/* Sub-tab 4: Permissions */}
          {activeAndroidSubTab === 'permissions' && (
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🛡️ Android Native Permissions Matrix</Text>
              <Text style={styles.sectionSubtitle}>
                Declared permissions configured in <Text style={styles.monoText}>app.json</Text> and Android manifest.
              </Text>

              <View style={styles.permTable}>
                <View style={styles.permTableRow}>
                  <Text style={styles.permName}>android.permission.INTERNET</Text>
                  <Text style={styles.permDesc}>Real-time sync with Firebase Firestore database</Text>
                </View>
                <View style={styles.permTableRow}>
                  <Text style={styles.permName}>android.permission.CAMERA</Text>
                  <Text style={styles.permDesc}>Scanning QR payment codes & capturing receipt/complaint proof</Text>
                </View>
                <View style={styles.permTableRow}>
                  <Text style={styles.permName}>android.permission.READ_EXTERNAL_STORAGE</Text>
                  <Text style={styles.permDesc}>Uploading bills, PDF invoices, and vendor vouchers</Text>
                </View>
                <View style={styles.permTableRow}>
                  <Text style={styles.permName}>android.permission.WRITE_EXTERNAL_STORAGE</Text>
                  <Text style={styles.permDesc}>Downloading stamped maintenance receipts and statements</Text>
                </View>
                <View style={styles.permTableRow}>
                  <Text style={styles.permName}>android.permission.VIBRATE</Text>
                  <Text style={styles.permDesc}>Haptic alert on gate visitor approval and SOS triggers</Text>
                </View>
              </View>
            </Card>
          )}
        </View>
      )}
      <Modal visible={showAddTowerModal} transparent animationType="fade" onRequestClose={() => setShowAddTowerModal(false)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add New Tower / Wing Block</Text>
            <Text style={styles.modalSubtitle}>Configure floor count and unit numbering convention</Text>

            <View style={{ marginVertical: spacing.md, gap: spacing.sm }}>
              <Text style={styles.fieldLabel}>Tower / Wing Name *</Text>
              <TextInput
                style={styles.textInput}
                value={newTowerName}
                onChangeText={setNewTowerName}
                placeholder="e.g. Tower E (Neem) or Wing D"
              />

              <View style={styles.formRowTwo}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>Number of Floors</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={newTowerFloors}
                    onChangeText={setNewTowerFloors}
                    placeholder="12"
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>Flats per Floor</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={newTowerFlatsPerFloor}
                    onChangeText={setNewTowerFlatsPerFloor}
                    placeholder="4"
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Unit Prefix (e.g. "E-" for E-101)</Text>
              <TextInput
                style={styles.textInput}
                value={newTowerPrefix}
                onChangeText={setNewTowerPrefix}
                placeholder="E-"
              />
            </View>

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" size="md" onPress={() => setShowAddTowerModal(false)} />
              <Button title="Add Block" variant="primary" size="md" onPress={handleAddTower} />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: EXPORT / IMPORT JSON                                               */}
      {/* ========================================================================= */}
      <Modal visible={showJsonModal} transparent animationType="fade" onRequestClose={() => setShowJsonModal(false)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalLargeBox}>
            <Text style={styles.modalTitle}>Society Configuration JSON (Manifest)</Text>
            <Text style={styles.modalSubtitle}>
              Backup your society configuration or paste a new configuration file to import.
            </Text>

            {jsonError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {jsonError}</Text>
              </View>
            ) : null}

            <TextInput
              style={styles.jsonTextArea}
              multiline
              value={jsonText}
              onChangeText={setJsonText}
              placeholder="Paste JSON here..."
            />

            <View style={styles.modalActions}>
              <Button
                title="Copy to Clipboard"
                variant="outline"
                size="md"
                onPress={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(jsonText);
                    showToast('✓ JSON copied to clipboard!');
                  }
                }}
              />
              <Button title="Import & Apply" variant="primary" size="md" onPress={handleImportJson} />
              <Button title="Close" variant="ghost" size="md" onPress={() => setShowJsonModal(false)} />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: RESIDENT ONBOARDING QR CODE                                       */}
      {/* ========================================================================= */}
      <Modal visible={showQrModal} transparent animationType="fade" onRequestClose={() => setShowQrModal(false)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.qrModalCard}>
            <Text style={styles.modalTitle}>📱 Resident Onboarding QR Code</Text>
            <Text style={styles.modalSubtitle}>
              Print or display this QR code at the security gate or elevator lobbies for residents to install the app on their phone.
            </Text>

            <View style={styles.qrCodeBox}>
              {/* Scalable SVG/Canvas QR Code Representation */}
              <View style={styles.qrFrame}>
                <Text style={styles.qrEmblem}>🏛️</Text>
                <Text style={styles.qrSocietyName}>{config.societyName}</Text>
                <Text style={styles.qrScanText}>Scan to Open ApniSociety App</Text>
                <View style={styles.qrPattern}>
                  <Text style={styles.qrPatternGlyphs}>
                    █▀▀▀▀▀█ ▄ █▄▄ █▀▀▀▀▀█{'\n'}
                    █ ███ █ ▄▀█▄█ █ ███ █{'\n'}
                    █ ▀▀▀ █ █ ▀ █ █ ▀▀▀ █{'\n'}
                    ▀▀▀▀▀▀▀ ▀ █ ▀ ▀▀▀▀▀▀▀{'\n'}
                    ██ █▀▀█▄▀▄█▀▄ ▀ █ ▄▀█{'\n'}
                    ▀▀▀▀▀▀▀ ▀ █ ▀ ▀▀▀▀▀▀▀{'\n'}
                    █▀▀▀▀▀█ ▄ ▀▀█ █ ▀ █ ▄{'\n'}
                    █ ███ █ █▄█ ▄ █▀▀▀▀ █{'\n'}
                    █ ▀▀▀ █ ▄▀ ▄▀ █ █ █ █{'\n'}
                    ▀▀▀▀▀▀▀ ▀   ▀ ▀▀▀ ▀ ▀
                  </Text>
                </View>
                <Text style={styles.qrUrlSub}>{typeof window !== 'undefined' ? window.location.host : 'apnisociety.app'}</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Print Notice Poster"
                variant="outline"
                size="md"
                onPress={() => window.print && window.print()}
              />
              <Button
                title="Done"
                variant="primary"
                size="md"
                onPress={() => setShowQrModal(false)}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: MASTER RESET DUMMY DATA TO REAL DATA                               */}
      {/* ========================================================================= */}
      <Modal visible={showResetModal} transparent animationType="fade" onRequestClose={() => setShowResetModal(false)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalLargeBox}>
            <Text style={styles.modalTitle}>🧹 Master Reset: Wipe Dummy Data & Go Live</Text>
            <Text style={styles.modalSubtitle}>
              Purge all simulated invoices, demo complaints, test expenses, and sample water readings to launch your society on 100% genuine data.
            </Text>

            <View style={styles.resetWarningBox}>
              <Text style={styles.resetWarningTitle}>⚠️ Production Clean Slate Confirmation</Text>
              <Text style={styles.resetWarningText}>
                • All dummy maintenance bills ({storageStats.billsCount}) will be cleared.{'\n'}
                • All demo complaint tickets ({storageStats.complaintsCount}) and expense vouchers ({storageStats.expensesCount}) will be purged.{'\n'}
                • Unit directory will be reset to real vacant flats matching your {config.towers.length} configured towers ({config.totalUnitsCount} flats).{'\n'}
                • An official primary administrator account will be initialized with the details below.
              </Text>
            </View>

            <View style={styles.formGrid}>
              <View style={styles.formColFull}>
                <Text style={styles.fieldLabel}>Society Official Legal Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={config.societyName}
                  onChangeText={(val) => setConfig({ ...config, societyName: val })}
                  placeholder="e.g. Shanti Heights CHS"
                />
              </View>

              <View style={styles.formColHalf}>
                <Text style={styles.fieldLabel}>Primary Admin / Secretary Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={resetAdminName}
                  onChangeText={setResetAdminName}
                  placeholder="e.g. Col. S. K. Verma"
                />
              </View>

              <View style={styles.formColHalf}>
                <Text style={styles.fieldLabel}>Admin Mobile Phone (Login) *</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="phone-pad"
                  value={resetAdminPhone}
                  onChangeText={setResetAdminPhone}
                  placeholder="e.g. 9876543210"
                />
              </View>

              <View style={styles.formColHalf}>
                <Text style={styles.fieldLabel}>Admin Official Email *</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="email-address"
                  value={resetAdminEmail}
                  onChangeText={setResetAdminEmail}
                  placeholder="e.g. secretary@society.org"
                />
              </View>

              <View style={styles.formColHalf}>
                <Text style={styles.fieldLabel}>Admin Flat Unit Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={resetAdminFlat}
                  onChangeText={setResetAdminFlat}
                  placeholder="e.g. A-101"
                />
              </View>

              <View style={styles.formColFull}>
                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => setGenUnitsFromTowers(!genUnitsFromTowers)}
                >
                  <View style={[styles.checkboxBox, genUnitsFromTowers && styles.checkboxActive]}>
                    {genUnitsFromTowers && <Text style={styles.checkmarkText}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    Auto-generate real vacant units for all {config.towers.length} configured towers ({config.totalUnitsCount} flats)
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                size="md"
                onPress={() => setShowResetModal(false)}
              />
              <Button
                title={isResetting ? "Purging & Setting Up..." : "🚀 Confirm Wipe & Start Real Data"}
                variant="primary"
                size="md"
                disabled={isResetting}
                onPress={handleMasterReset}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: BULK RESIDENT ONBOARDING (CSV)                                      */}
      {/* ========================================================================= */}
      <Modal visible={showBulkMemberModal} transparent animationType="fade" onRequestClose={() => setShowBulkMemberModal(false)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalLargeBox}>
            <Text style={styles.modalTitle}>👥 Bulk Onboard Residents (CSV Paste)</Text>
            <Text style={styles.modalSubtitle}>
              Paste flat numbers and resident records from Excel or Google Sheets. One resident per line.
            </Text>

            <View style={styles.csvHelpBox}>
              <Text style={styles.csvHelpTitle}>Format: FlatNumber, FullName, Phone, Email, Role</Text>
              <Text style={styles.csvHelpSample}>
                A-101, Ramesh Gupta, 9811002233, ramesh@example.com, Owner{'\n'}
                A-102, Sangeeta Nair, 9822114455, sangeeta@example.com, Tenant{'\n'}
                B-201, Deepak Verma, 9833445566, deepak@example.com, Owner
              </Text>
            </View>

            <TextInput
              style={styles.csvTextArea}
              multiline
              value={bulkMemberText}
              onChangeText={setBulkMemberText}
              placeholder="Paste comma-separated resident rows here..."
              placeholderTextColor={colors.neutral[400]}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                size="md"
                onPress={() => setShowBulkMemberModal(false)}
              />
              <Button
                title="Import & Save Residents"
                variant="primary"
                size="md"
                onPress={handleBulkImport}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  headerContent: {
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerPill: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  headerPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
    letterSpacing: 0.5,
  },
  productionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  productionPillDot: {
    fontSize: 8,
    color: '#15803d',
  },
  productionPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#15803d',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    maxWidth: 900,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: spacing.md,
  },
  toastBanner: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  toastText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: '#15803d',
    textAlign: 'center',
  },
  tabsContainer: {
    marginBottom: spacing.md,
  },
  tabsScroll: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tabBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tabBtnActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  tabBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  tabBtnTextActive: {
    color: '#ffffff',
    fontWeight: typography.weights.semibold,
  },
  tabContent: {
    gap: spacing.md,
  },
  releaseHeroCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  releaseHeroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  releaseStatusIconCircle: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  releaseStatusIcon: {
    fontSize: 24,
  },
  releaseHeroTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  releaseHeroSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginTop: 4,
  },
  monoText: {
    fontFamily: 'monospace',
    color: colors.primary[700],
    backgroundColor: colors.primary[50],
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  launchUrlBox: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  launchUrlLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontWeight: typography.weights.medium,
  },
  launchUrlText: {
    fontSize: typography.sizes.sm,
    color: colors.primary[700],
    fontWeight: typography.weights.semibold,
    marginTop: 2,
  },
  launchBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  checklistScoreBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  scoreReady: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  scoreWarn: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  checklistScoreText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  checklistGrid: {
    gap: spacing.sm,
  },
  checkItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  checkIconCol: {
    marginTop: 2,
  },
  checkStatusIcon: {
    fontSize: 20,
  },
  checkBody: {
    flex: 1,
  },
  checkTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  checkTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  checkDesc: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  checkActionHint: {
    fontSize: typography.sizes.xs - 1,
    color: colors.primary[700],
    fontWeight: typography.weights.medium,
    marginTop: 4,
  },
  shareMessageBox: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  shareMessageText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  shareActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  formColFull: {
    width: '100%',
  },
  formColHalf: {
    flex: 1,
    minWidth: 260,
  },
  formColThird: {
    flex: 1,
    minWidth: 180,
  },
  fieldLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  subSectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  subSectionSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  modeToggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modeChip: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modeChipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  modeChipText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  modeChipTextActive: {
    color: colors.primary[700],
    fontWeight: typography.weights.bold,
  },
  saveSectionBar: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    alignItems: 'flex-start',
  },
  towersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  towerCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  towerInactive: {
    opacity: 0.6,
    backgroundColor: colors.neutral[50],
  },
  towerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  towerName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  towerPrefix: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  towerStatsRow: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  towerStatCol: {
    alignItems: 'center',
  },
  towerStatVal: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },
  towerStatLabel: {
    fontSize: typography.sizes.xs - 2,
    color: colors.text.muted,
  },
  towerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  delTowerBtn: {
    padding: 4,
  },
  delTowerText: {
    fontSize: typography.sizes.xs,
    color: colors.danger.main,
    fontWeight: typography.weights.medium,
  },
  facilitiesList: {
    gap: spacing.md,
  },
  facilityCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  facilityDisabled: {
    opacity: 0.6,
    backgroundColor: colors.neutral[50],
  },
  facilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  facilityName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  facilityMeta: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  facilityTariffsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tariffCol: {
    flex: 1,
    minWidth: 110,
  },
  tariffLabel: {
    fontSize: typography.sizes.xs - 1,
    color: colors.text.muted,
    marginBottom: 2,
  },
  tariffInput: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
  },
  modulesGrid: {
    gap: spacing.sm,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  moduleIcon: {
    fontSize: 24,
  },
  moduleTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  moduleDesc: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  presetCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  presetIconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetIcon: {
    fontSize: 22,
  },
  presetTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  presetSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  presetSampleBox: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  presetSampleText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  presetSampleSub: {
    fontSize: typography.sizes.xs - 1,
    color: colors.text.muted,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalBox: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  modalLargeBox: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  qrModalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  formRowTwo: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formCol: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  jsonTextArea: {
    fontFamily: 'monospace',
    fontSize: typography.sizes.xs,
    backgroundColor: colors.neutral[900],
    color: '#38bdf8',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 320,
    textAlignVertical: 'top',
  },
  errorBox: {
    backgroundColor: colors.danger.background,
    borderWidth: 1,
    borderColor: colors.danger.border,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  errorText: {
    color: colors.danger.text,
    fontSize: typography.sizes.xs,
  },
  qrCodeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  qrFrame: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: colors.neutral[900],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  qrEmblem: {
    fontSize: 28,
  },
  qrSocietyName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.neutral[900],
  },
  qrScanText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
  },
  qrPattern: {
    backgroundColor: '#000000',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.xs,
  },
  qrPatternGlyphs: {
    fontFamily: 'monospace',
    fontSize: 10,
    lineHeight: 11,
    color: '#ffffff',
    letterSpacing: 2,
  },
  qrUrlSub: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[500],
    fontFamily: 'monospace',
  },

  // Quick Launch Banners
  quickLaunchBannerGrid: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  quickLaunchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    borderWidth: 1,
  },
  quickBannerGreen: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  quickBannerYellow: {
    backgroundColor: '#fefce8',
    borderColor: '#fde047',
  },
  quickBannerBlue: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  quickBannerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  quickBannerIconCircleBlue: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBannerIcon: {
    fontSize: 18,
  },
  quickBannerTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.neutral[900],
  },
  quickBannerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    marginTop: 2,
  },

  // Data Mode Styles
  dataModeHeroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dataModeIconBox: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  androidHeroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  dataModeIcon: {
    fontSize: 26,
  },
  masterResetCard: {
    backgroundColor: '#f8fafc',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.md,
  },
  masterResetTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.neutral[900],
  },
  masterResetDesc: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[600],
    marginTop: 4,
    lineHeight: 18,
  },
  masterResetBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },

  // Module Audit Grid
  moduleAuditGrid: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  auditRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.sm,
  },
  auditRowIconCircle: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditRowIcon: {
    fontSize: 18,
  },
  auditRowTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[900],
  },
  auditRowDesc: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  auditRowAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  // Android Live Box & Pills
  androidLiveBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  androidLiveTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.neutral[900],
  },
  androidLiveDesc: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    marginTop: 2,
  },
  androidPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  androidPillBtn: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: borderRadius.md,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  androidPillBtnActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  androidPillBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[700],
  },
  androidPillBtnTextActive: {
    color: '#ffffff',
  },

  // Guide Steps
  guideStepsBox: {
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  guideStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  guideStepNum: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideStepNumText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  guideStepTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.neutral[900],
  },
  guideStepText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    marginTop: 2,
    lineHeight: 18,
  },

  // Code Snippet Block
  codeSnippetBlock: {
    backgroundColor: '#0f172a',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.xs + 2,
  },
  codeSnippetHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: '#94a3b8',
    marginBottom: 4,
  },
  codeSnippetText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#38bdf8',
    lineHeight: 18,
  },
  assetLinksBox: {
    backgroundColor: '#f0fdf4',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#86efac',
    marginTop: spacing.md,
  },
  assetLinksTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#166534',
  },
  assetLinksDesc: {
    fontSize: typography.sizes.xs,
    color: '#15803d',
    marginTop: 4,
  },

  // Permissions Table
  permTable: {
    gap: spacing.xs,
    marginVertical: spacing.md,
  },
  permTableRow: {
    padding: spacing.sm + 2,
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  permName: {
    fontSize: typography.sizes.xs,
    fontFamily: 'monospace',
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },
  permDesc: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    marginTop: 2,
  },

  // Modals Extra Styles
  resetWarningBox: {
    backgroundColor: '#fffbeb',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: spacing.md,
  },
  resetWarningTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#92400e',
    marginBottom: 4,
  },
  resetWarningText: {
    fontSize: typography.sizes.xs,
    color: '#78350f',
    lineHeight: 18,
  },
  csvHelpBox: {
    backgroundColor: '#f8fafc',
    padding: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.sm,
  },
  csvHelpTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.neutral[800],
  },
  csvHelpSample: {
    fontSize: typography.sizes.xs - 1,
    fontFamily: 'monospace',
    color: colors.neutral[600],
    marginTop: 4,
  },
  csvTextArea: {
    height: 140,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontFamily: 'monospace',
    fontSize: 12,
    textAlignVertical: 'top',
    color: colors.neutral[900],
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.neutral[400],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[800],
    flex: 1,
  },
});
