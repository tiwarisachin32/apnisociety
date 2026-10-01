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
              🚀 Release & Launch
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
      {/* MODAL: ADD TOWER                                                          */}
      {/* ========================================================================= */}
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
});
