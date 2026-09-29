import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Button, Card, StatusBadge } from '../components/ui';
import { APP_NAME, PERMISSIONS, PermissionType } from '../constants/app';
import { borderRadius, colors, shadows, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useResponsive } from '../hooks/useResponsive';
import { MOCK_USERS } from '../services/mockAuth';
import {
  addMember,
  deleteMember,
  getAllMembers,
  getAllStaff,
  getAllUnits,
  getCommitteeMembers,
  getMemberSummaryMetrics,
  rejectMember,
  resetDemoMembers,
  updateMember,
  verifyMember,
} from '../services/mockMembers';
import {
  CommitteeRole,
  MemberSummaryMetrics,
  NewMemberPayload,
  OccupancyStatus,
  ResidentType,
  SocietyMember,
  SocietyStaffMember,
  SocietyUnit,
  VehicleDetail,
} from '../types/members';

export interface MembersScreenProps {
  onNavigateToDashboard?: () => void;
  onNavigateToMaintenance?: () => void;
  onNavigateToWater?: () => void;
  onNavigateToExpenses?: () => void;
  onNavigateToReimbursements?: () => void;
  onNavigateToHallBooking?: () => void;
  onNavigateToComplaints?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToRoles?: () => void;
}

export default function MembersScreen({
  onNavigateToDashboard,
  onNavigateToMaintenance,
  onNavigateToWater,
  onNavigateToExpenses,
  onNavigateToReimbursements,
  onNavigateToHallBooking,
  onNavigateToComplaints,
  onNavigateToNotifications,
  onNavigateToRoles,
}: MembersScreenProps) {
  const { user, loginAsDemoUser, hasPermission } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Permissions
  const canManage = hasPermission(PERMISSIONS.MEMBERS_MANAGE);
  const canView = hasPermission(PERMISSIONS.MEMBERS_VIEW);

  // Active Tab: 'directory' | 'committee' | 'occupancy' | 'staff' | 'rbac'
  const [activeTab, setActiveTab] = useState<'directory' | 'committee' | 'occupancy' | 'staff' | 'rbac'>('directory');

  // State
  const [members, setMembers] = useState<SocietyMember[]>(() => getAllMembers());
  const [staff, setStaff] = useState<SocietyStaffMember[]>(() => getAllStaff());
  const [units, setUnits] = useState<SocietyUnit[]>(() => getAllUnits());
  const [metrics, setMetrics] = useState<MemberSummaryMetrics>(() => getMemberSummaryMetrics());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state when user changes
  useEffect(() => {
    reloadAllData();
  }, [user?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const reloadAllData = () => {
    setMembers(getAllMembers());
    setStaff(getAllStaff());
    setUnits(getAllUnits());
    setMetrics(getMemberSummaryMetrics());
  };

  // Filters for Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ResidentType | 'pending_kyc'>('all');
  const [towerFilter, setTowerFilter] = useState<string>('all');

  // Occupancy Tower Filter
  const [occupancyTowerFilter, setOccupancyTowerFilter] = useState<string>('all');
  const [occupancyStatusFilter, setOccupancyStatusFilter] = useState<'all' | OccupancyStatus>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SocietyMember | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<SocietyUnit | null>(null);
  const [showEmergencyDeskModal, setShowEmergencyDeskModal] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);

  // Form State for Add Member
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formResidentType, setFormResidentType] = useState<ResidentType>('owner');
  const [formTower, setFormTower] = useState('Tower B');
  const [formFlat, setFormFlat] = useState('');
  const [formIntercom, setFormIntercom] = useState('');
  const [formParking, setFormParking] = useState('');
  const [formVehicleNum, setFormVehicleNum] = useState('');
  const [formVehicleType, setFormVehicleType] = useState<'four_wheeler' | 'two_wheeler' | 'ev'>('four_wheeler');
  const [formVehicleModel, setFormVehicleModel] = useState('');
  const [formIsCommittee, setFormIsCommittee] = useState(false);
  const [formCommitteeRole, setFormCommitteeRole] = useState<CommitteeRole>('committee_member');
  const [formEmergencyName, setFormEmergencyName] = useState('');
  const [formEmergencyPhone, setFormEmergencyPhone] = useState('');
  const [formEmergencyRel, setFormEmergencyRel] = useState('Spouse');
  const [formBloodGroup, setFormBloodGroup] = useState('B+');
  const [formHasPets, setFormHasPets] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sub-actions inside Member Detail Modal
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehicleType, setNewVehicleType] = useState<'four_wheeler' | 'two_wheeler' | 'ev'>('two_wheeler');

  // Reset form
  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormResidentType('owner');
    setFormTower('Tower B');
    setFormFlat('');
    setFormIntercom('');
    setFormParking('');
    setFormVehicleNum('');
    setFormVehicleType('four_wheeler');
    setFormVehicleModel('');
    setFormIsCommittee(false);
    setFormCommitteeRole('committee_member');
    setFormEmergencyName('');
    setFormEmergencyPhone('');
    setFormEmergencyRel('Spouse');
    setFormBloodGroup('B+');
    setFormHasPets(false);
    setFormError('');
  };

  const handleCreateMember = () => {
    if (!formName.trim()) {
      setFormError('Resident full name is required');
      return;
    }
    if (!formPhone.trim() || formPhone.trim().length < 10) {
      setFormError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!formFlat.trim()) {
      setFormError('Flat number is required (e.g. B-402)');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload: NewMemberPayload = {
        name: formName.trim(),
        email: formEmail.trim() || `${formName.toLowerCase().replace(/\s+/g, '.') || 'resident'}@apnisociety.com`,
        phone: formPhone.trim(),
        residentType: formResidentType,
        block: formTower,
        flatNumber: formFlat.trim().toUpperCase(),
        intercomNumber: formIntercom.trim() || undefined,
        parkingSlot: formParking.trim() || undefined,
        vehicleNumber: formVehicleNum.trim() || undefined,
        vehicleType: formVehicleType,
        vehicleModel: formVehicleModel.trim() || undefined,
        isCommitteeMember: formIsCommittee,
        committeeRole: formIsCommittee ? formCommitteeRole : undefined,
        emergencyContactName: formEmergencyName.trim() || undefined,
        emergencyContactPhone: formEmergencyPhone.trim() || undefined,
        emergencyContactRelation: formEmergencyRel.trim() || undefined,
        bloodGroup: formBloodGroup,
        hasPets: formHasPets,
      };

      const created = addMember(payload);
      reloadAllData();
      setIsSubmitting(false);
      setShowAddModal(false);
      resetForm();
      showToast(`✅ Resident "${created.name}" onboarded successfully for Unit ${created.flatNumber}!`);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setFormError(err instanceof Error ? err.message : 'Failed to register member');
    }
  };

  const handleVerifyMember = (memberId: string) => {
    const updated = verifyMember(memberId);
    reloadAllData();
    if (selectedMember && selectedMember.id === memberId) {
      setSelectedMember(updated);
    }
    showToast(`✅ Member "${updated.name}" KYC marked as Verified!`);
  };

  const handleRejectMember = (memberId: string) => {
    const updated = rejectMember(memberId);
    reloadAllData();
    if (selectedMember && selectedMember.id === memberId) {
      setSelectedMember(updated);
    }
    showToast(`⚠️ Member "${updated.name}" KYC marked as Rejected/Suspended.`);
  };

  const handleDeleteMember = (memberId: string, memberName: string) => {
    deleteMember(memberId);
    reloadAllData();
    setSelectedMember(null);
    showToast(`🗑️ Member "${memberName}" removed from society registry.`);
  };

  const handleToggleCommitteeRole = (member: SocietyMember) => {
    const isNowCommittee = !member.isCommitteeMember;
    const updated = updateMember(member.id, {
      isCommitteeMember: isNowCommittee,
      committeeRole: isNowCommittee ? 'committee_member' : undefined,
      committeeRoleTitle: isNowCommittee ? 'Committee Member (Resident Executive)' : undefined,
    });
    reloadAllData();
    setSelectedMember(updated);
    showToast(
      isNowCommittee
        ? `🎖️ "${member.name}" assigned to Management Committee!`
        : `ℹ️ "${member.name}" role updated to regular Resident.`
    );
  };

  const handleAddVehicleToMember = (member: SocietyMember) => {
    if (!newVehiclePlate.trim()) return;
    const newVeh: VehicleDetail = {
      id: `veh-${Date.now()}`,
      type: newVehicleType,
      registrationNumber: newVehiclePlate.trim().toUpperCase(),
      makeModel: newVehicleModel.trim() || 'Resident Vehicle',
      parkingSlot: member.parkingSlots[0] || 'Open Bay',
    };
    const updatedVehicles = [...member.vehicles, newVeh];
    const updated = updateMember(member.id, { vehicles: updatedVehicles });
    reloadAllData();
    setSelectedMember(updated);
    setNewVehiclePlate('');
    setNewVehicleModel('');
    setIsAddingVehicle(false);
    showToast(`🚗 Vehicle ${newVeh.registrationNumber} registered for Flat ${member.flatNumber}`);
  };

  const handleResetDemo = () => {
    resetDemoMembers();
    reloadAllData();
    showToast('🔄 Demo society members directory restored to default!');
  };

  const handleExportDirectory = () => {
    showToast('📥 Society Member Directory exported to CSV/PDF (Simulated download)');
  };

  // Filter Members
  const filteredMembers = members.filter((m) => {
    if (typeFilter === 'pending_kyc') {
      if (m.verificationStatus !== 'pending_verification') return false;
    } else if (typeFilter !== 'all') {
      if (typeFilter === 'committee' && !m.isCommitteeMember) return false;
      if (typeFilter !== 'committee' && m.residentType !== typeFilter) return false;
    }

    if (towerFilter !== 'all' && m.block !== towerFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = m.name.toLowerCase().includes(q);
      const matchFlat = m.flatNumber.toLowerCase().includes(q);
      const matchBlock = m.block.toLowerCase().includes(q);
      const matchPhone = m.phone.includes(q);
      const matchIntercom = m.intercomNumber.includes(q);
      const matchVehicle = m.vehicles.some((v) => v.registrationNumber.toLowerCase().includes(q));
      if (!matchName && !matchFlat && !matchBlock && !matchPhone && !matchIntercom && !matchVehicle) {
        return false;
      }
    }

    return true;
  });

  // Filter Units
  const filteredUnits = units.filter((u) => {
    if (occupancyTowerFilter !== 'all' && u.block !== occupancyTowerFilter) return false;
    if (occupancyStatusFilter !== 'all' && u.occupancyStatus !== occupancyStatusFilter) return false;
    return true;
  });

  // Committee members sorted
  const committeeMembers = getCommitteeMembers();

  return (
    <ScreenContainer maxWidth={1180}>
      {/* Toast Banner */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <View style={styles.badgeRow}>
              <Text style={styles.headerSocietyBadge}>{APP_NAME} Society Directory</Text>
              {canManage ? (
                <StatusBadge status="warning" label="Admin / Committee Access" />
              ) : (
                <StatusBadge status="info" label="Resident Directory View" />
              )}
            </View>
            <Text style={styles.headerTitle}>Members & Units Directory</Text>
            <Text style={styles.headerSubtitle}>
              Shanti Heights RWA • Central Registry of Residents, Units, Committee & Security Staff
            </Text>
          </View>

          {/* User Persona Pill & Switcher */}
          <Pressable onPress={() => setShowPersonaModal(true)} style={styles.userProfilePill}>
            <View style={styles.userAvatarMini}>
              <Text style={styles.userAvatarMiniText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View>
              <Text style={styles.userNameMini}>{user?.name || 'Resident'}</Text>
              <Text style={styles.userRoleMini}>{user?.roleTitle || 'Owner'} • Switch Persona 🔄</Text>
            </View>
          </Pressable>
        </View>

        {/* Action Buttons Top */}
        <View style={styles.headerActions}>
          <Button
            title="➕ Onboard Resident"
            variant="primary"
            size="md"
            onPress={() => {
              resetForm();
              setShowAddModal(true);
            }}
          />
          <Button
            title="📞 Emergency Desk"
            variant="outline"
            size="md"
            onPress={() => setShowEmergencyDeskModal(true)}
          />
          <Button
            title="📥 Export Directory"
            variant="outline"
            size="md"
            onPress={handleExportDirectory}
          />
          <Button
            title="🔄 Reset Demo Data"
            variant="ghost"
            size="md"
            onPress={handleResetDemo}
          />
        </View>
      </View>

      {/* KPI & Metrics Bar */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Total Residents</Text>
          <Text style={styles.kpiValue}>{metrics.totalMembers}</Text>
          <Text style={styles.kpiSub}>Registered profiles</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Society Flats</Text>
          <Text style={styles.kpiValue}>{metrics.totalFlats}</Text>
          <Text style={styles.kpiSub}>
            {metrics.ownerOccupiedCount} Owned • {metrics.tenantCount} Rented
          </Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Committee (RWA)</Text>
          <Text style={styles.kpiValue}>{metrics.committeeCount}</Text>
          <Text style={styles.kpiSub}>Office bearers</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Pending KYC</Text>
          <Text style={[styles.kpiValue, metrics.pendingVerificationCount > 0 && { color: colors.warning.main }]}>
            {metrics.pendingVerificationCount}
          </Text>
          <Text style={styles.kpiSub}>Requires verification</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Security & Staff</Text>
          <Text style={styles.kpiValue}>{metrics.activeStaffCount}</Text>
          <Text style={styles.kpiSub}>Police verified staff</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Vehicles (RFID)</Text>
          <Text style={styles.kpiValue}>{metrics.registeredVehiclesCount}</Text>
          <Text style={styles.kpiSub}>Cars & 2-Wheelers</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setActiveTab('directory')}
          style={[styles.tabButton, activeTab === 'directory' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'directory' && styles.tabTextActive]}>
            👥 Residents Directory ({members.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('committee')}
          style={[styles.tabButton, activeTab === 'committee' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'committee' && styles.tabTextActive]}>
            🏛️ Management Committee ({committeeMembers.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('occupancy')}
          style={[styles.tabButton, activeTab === 'occupancy' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'occupancy' && styles.tabTextActive]}>
            🏢 Towers & Units Matrix ({units.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('staff')}
          style={[styles.tabButton, activeTab === 'staff' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'staff' && styles.tabTextActive]}>
            🛡️ Security & Support Staff ({staff.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('rbac')}
          style={[styles.tabButton, activeTab === 'rbac' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'rbac' && styles.tabTextActive]}>
            🔐 Roles & Permissions
          </Text>
        </Pressable>
      </View>

      {/* ========================================================================= */}
      {/* TAB 1: RESIDENTS & MEMBERS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'directory' && (
        <View style={styles.tabContent}>
          {/* Search and Filters Bar */}
          <Card style={styles.filtersCard}>
            <View style={styles.searchRow}>
              <View style={styles.searchInputContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  placeholder="Search by Resident Name, Flat (e.g. B-402), Phone, Vehicle Plate..."
                  placeholderTextColor={colors.text.muted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                    <Text style={styles.clearSearchText}>✕</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Filter Pills Row */}
            <View style={styles.filterPillsRow}>
              <Text style={styles.filterLabel}>Resident Type:</Text>
              {(
                [
                  { id: 'all', label: 'All Residents' },
                  { id: 'owner', label: 'Owners' },
                  { id: 'tenant', label: 'Tenants' },
                  { id: 'committee', label: 'Committee' },
                  { id: 'pending_kyc', label: `Pending KYC (${metrics.pendingVerificationCount})` },
                ] as const
              ).map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => setTypeFilter(f.id)}
                  style={[styles.filterChip, typeFilter === f.id && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, typeFilter === f.id && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Tower Filter Row */}
            <View style={styles.filterPillsRow}>
              <Text style={styles.filterLabel}>Tower / Block:</Text>
              {['all', 'Tower A', 'Tower B', 'Tower C', 'Tower D'].map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTowerFilter(t)}
                  style={[styles.filterChip, towerFilter === t && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, towerFilter === t && styles.filterChipTextActive]}>
                    {t === 'all' ? 'All Towers' : t}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Members List */}
          <View style={styles.membersGrid}>
            {filteredMembers.length === 0 ? (
              <Card style={styles.emptyStateCard}>
                <Text style={styles.emptyStateIcon}>🔎</Text>
                <Text style={styles.emptyStateTitle}>No Residents Found</Text>
                <Text style={styles.emptyStateText}>
                  No residents match your search query or active filters. Try adjusting your search term.
                </Text>
                <Button
                  title="Clear All Filters"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    setSearchQuery('');
                    setTypeFilter('all');
                    setTowerFilter('all');
                  }}
                  style={{ alignSelf: 'center', marginTop: spacing.md }}
                />
              </Card>
            ) : (
              filteredMembers.map((member) => (
                <Card key={member.id} style={styles.memberCard}>
                  <View style={styles.memberCardHeader}>
                    <View style={styles.memberAvatarCircle}>
                      <Text style={styles.memberAvatarInitial}>
                        {member.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.memberHeaderInfo}>
                      <View style={styles.memberTitleRow}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        {member.verificationStatus === 'pending_verification' ? (
                          <StatusBadge status="warning" label="KYC Pending" />
                        ) : member.isCommitteeMember ? (
                          <StatusBadge status="info" label="RWA Committee" />
                        ) : member.residentType === 'tenant' ? (
                          <StatusBadge status="neutral" label="Tenant" />
                        ) : (
                          <StatusBadge status="success" label="Owner" />
                        )}
                      </View>

                      <View style={styles.memberUnitRow}>
                        <Text style={styles.memberFlatBadge}>
                          📍 {member.block} • Flat {member.flatNumber}
                        </Text>
                        <Text style={styles.memberIntercom}>📞 Ext: {member.intercomNumber}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Badges / Chips */}
                  <View style={styles.memberChipsRow}>
                    {member.committeeRoleTitle && (
                      <View style={styles.committeChip}>
                        <Text style={styles.committeChipText}>🎖️ {member.committeeRoleTitle}</Text>
                      </View>
                    )}
                    {member.bloodGroup && (
                      <View style={styles.bloodChip}>
                        <Text style={styles.bloodChipText}>🩸 {member.bloodGroup}</Text>
                      </View>
                    )}
                    {member.hasPets && (
                      <View style={styles.petChip}>
                        <Text style={styles.petChipText}>🐾 Pet Friendly</Text>
                      </View>
                    )}
                  </View>

                  {/* Vehicles Row */}
                  {member.vehicles && member.vehicles.length > 0 && (
                    <View style={styles.vehicleSummaryRow}>
                      <Text style={styles.vehicleRowLabel}>Vehicles ({member.vehicles.length}):</Text>
                      <View style={styles.vehicleBadgesWrap}>
                        {member.vehicles.map((v) => (
                          <View key={v.id} style={styles.vehiclePill}>
                            <Text style={styles.vehiclePillIcon}>
                              {v.type === 'ev' ? '⚡' : v.type === 'two_wheeler' ? '🛵' : '🚗'}
                            </Text>
                            <Text style={styles.vehiclePillText}>{v.registrationNumber}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Contact Row */}
                  <View style={styles.contactDetailsRow}>
                    <Text style={styles.contactItemText}>📱 +91 {member.phone}</Text>
                    <Text style={styles.contactItemText}>✉️ {member.email}</Text>
                  </View>

                  {/* Card Actions */}
                  <View style={styles.memberCardActions}>
                    <Button
                      title="View Dossier & KYC"
                      variant="outline"
                      size="sm"
                      onPress={() => setSelectedMember(member)}
                      style={{ flex: 1 }}
                    />
                    {canManage && member.verificationStatus === 'pending_verification' && (
                      <Button
                        title="Verify KYC ✅"
                        variant="primary"
                        size="sm"
                        onPress={() => handleVerifyMember(member.id)}
                      />
                    )}
                  </View>
                </Card>
              ))
            )}
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MANAGEMENT COMMITTEE (RWA) */}
      {/* ========================================================================= */}
      {activeTab === 'committee' && (
        <View style={styles.tabContent}>
          <Card style={styles.committeeBanner}>
            <View style={styles.committeeBannerContent}>
              <Text style={styles.committeeBannerTitle}>
                🏛️ Management Committee • Shanti Heights RWA (2025-2027)
              </Text>
              <Text style={styles.committeeBannerText}>
                Elected office bearers responsible for society administration, maintenance funds, statutory
                audits, security protocols, and community events. Office hours: Mon-Sat 06:30 PM - 08:30 PM at
                the Society Clubhouse Office.
              </Text>
            </View>
          </Card>

          <View style={styles.committeeGrid}>
            {committeeMembers.map((cm) => (
              <Card key={cm.id} style={styles.committeeCard}>
                <View style={styles.committeeTopRow}>
                  <View style={styles.committeeAvatarCircle}>
                    <Text style={styles.committeeAvatarText}>
                      {cm.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.committeeInfoBlock}>
                    <Text style={styles.committeeName}>{cm.name}</Text>
                    <Text style={styles.committeeDesignation}>
                      {cm.committeeRoleTitle || 'Office Bearer'}
                    </Text>
                    <Text style={styles.committeeUnit}>
                      📍 {cm.block} • Flat {cm.flatNumber} (Intercom: {cm.intercomNumber})
                    </Text>
                  </View>
                </View>

                {cm.committeeBio && (
                  <View style={styles.committeeBioBox}>
                    <Text style={styles.committeeBioText}>"{cm.committeeBio}"</Text>
                  </View>
                )}

                <View style={styles.committeeContactBox}>
                  <View style={styles.contactItemRow}>
                    <Text style={styles.contactIcon}>📱</Text>
                    <Text style={styles.contactVal}>+91 {cm.phone}</Text>
                  </View>
                  <View style={styles.contactItemRow}>
                    <Text style={styles.contactIcon}>✉️</Text>
                    <Text style={styles.contactVal}>{cm.email}</Text>
                  </View>
                </View>

                <View style={styles.committeeActionsRow}>
                  <Button
                    title="Profile & Units"
                    variant="outline"
                    size="sm"
                    onPress={() => setSelectedMember(cm)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="📞 Call"
                    variant="primary"
                    size="sm"
                    onPress={() => showToast(`Initiating call to ${cm.name} (+91 ${cm.phone})`)}
                  />
                </View>
              </Card>
            ))}
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TOWERS & UNITS MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'occupancy' && (
        <View style={styles.tabContent}>
          {/* Occupancy Filters */}
          <Card style={styles.filtersCard}>
            <View style={styles.filterPillsRow}>
              <Text style={styles.filterLabel}>Tower Block:</Text>
              {['all', 'Tower A', 'Tower B', 'Tower C', 'Tower D'].map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setOccupancyTowerFilter(t)}
                  style={[styles.filterChip, occupancyTowerFilter === t && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, occupancyTowerFilter === t && styles.filterChipTextActive]}>
                    {t === 'all' ? 'All Towers' : t}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.filterPillsRow}>
              <Text style={styles.filterLabel}>Occupancy Status:</Text>
              {(
                [
                  { id: 'all', label: 'All Units' },
                  { id: 'owner_occupied', label: 'Owner Occupied' },
                  { id: 'rented', label: 'Rented' },
                  { id: 'vacant', label: 'Vacant' },
                ] as const
              ).map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => setOccupancyStatusFilter(s.id)}
                  style={[styles.filterChip, occupancyStatusFilter === s.id && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, occupancyStatusFilter === s.id && styles.filterChipTextActive]}>
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Units Grid */}
          <View style={styles.unitsGrid}>
            {filteredUnits.map((unit) => {
              const statusBadgeConfig =
                unit.occupancyStatus === 'owner_occupied'
                  ? { status: 'success' as const, label: 'Owner Occupied' }
                  : unit.occupancyStatus === 'rented'
                  ? { status: 'info' as const, label: 'Rented' }
                  : { status: 'neutral' as const, label: 'Vacant' };

              return (
                <Card key={unit.id} style={styles.unitCard}>
                  <View style={styles.unitCardTop}>
                    <View>
                      <Text style={styles.unitFlatTitle}>{unit.flatNumber}</Text>
                      <Text style={styles.unitTowerSub}>{unit.block} • Floor {unit.floor}</Text>
                    </View>
                    <StatusBadge status={statusBadgeConfig.status} label={statusBadgeConfig.label} />
                  </View>

                  <View style={styles.unitDetailsBox}>
                    <View style={styles.unitMetricRow}>
                      <Text style={styles.unitMetricKey}>Area:</Text>
                      <Text style={styles.unitMetricVal}>{unit.areaSqFt} sq.ft</Text>
                    </View>
                    <View style={styles.unitMetricRow}>
                      <Text style={styles.unitMetricKey}>Resident:</Text>
                      <Text style={styles.unitMetricVal}>
                        {unit.primaryResidentName || '— (Vacant)'}
                      </Text>
                    </View>
                    {unit.ownerName && unit.occupancyStatus === 'rented' && (
                      <View style={styles.unitMetricRow}>
                        <Text style={styles.unitMetricKey}>Owner:</Text>
                        <Text style={styles.unitMetricVal}>{unit.ownerName}</Text>
                      </View>
                    )}
                    <View style={styles.unitMetricRow}>
                      <Text style={styles.unitMetricKey}>Parking:</Text>
                      <Text style={styles.unitMetricVal}>
                        {unit.parkingSlots.length > 0 ? unit.parkingSlots.join(', ') : 'None'}
                      </Text>
                    </View>
                    <View style={styles.unitMetricRow}>
                      <Text style={styles.unitMetricKey}>Maintenance:</Text>
                      <Text
                        style={[
                          styles.unitMetricVal,
                          unit.maintenanceDueAmount > 0
                            ? { color: colors.danger.main, fontWeight: '700' }
                            : { color: colors.success.main },
                        ]}
                      >
                        {unit.maintenanceDueAmount > 0
                          ? `₹${unit.maintenanceDueAmount} Due`
                          : 'Cleared (Zero Dues)'}
                      </Text>
                    </View>
                  </View>

                  <Button
                    title="Inspect Unit"
                    variant="outline"
                    size="sm"
                    onPress={() => setSelectedUnit(unit)}
                    style={{ marginTop: spacing.sm }}
                  />
                </Card>
              );
            })}
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SECURITY & SUPPORT STAFF */}
      {/* ========================================================================= */}
      {activeTab === 'staff' && (
        <View style={styles.tabContent}>
          <Card style={styles.staffHeaderCard}>
            <View>
              <Text style={styles.staffHeaderTitle}>🛡️ Society Security & Facility Personnel</Text>
              <Text style={styles.staffHeaderSubtitle}>
                100% Police-verified facility staff, certified electricians, plumbers and round-the-clock security guards.
              </Text>
            </View>
            <Button
              title="Emergency Gate Protocol"
              variant="outline"
              size="sm"
              onPress={() => setShowEmergencyDeskModal(true)}
            />
          </Card>

          <View style={styles.staffGrid}>
            {staff.map((st) => (
              <Card key={st.id} style={styles.staffCard}>
                <View style={styles.staffCardTop}>
                  <View style={styles.staffAvatarCircle}>
                    <Text style={styles.staffAvatarText}>
                      {st.category === 'security'
                        ? '👮'
                        : st.category === 'electrician'
                        ? '⚡'
                        : st.category === 'plumber'
                        ? '🔧'
                        : st.category === 'housekeeping'
                        ? '🧹'
                        : '📋'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.staffNameBadgeRow}>
                      <Text style={styles.staffName}>{st.name}</Text>
                      {st.policeVerified ? (
                        <StatusBadge status="success" label="Police Verified" />
                      ) : (
                        <StatusBadge status="warning" label="KYC in Progress" />
                      )}
                    </View>
                    <Text style={styles.staffCategoryTitle}>{st.categoryTitle}</Text>
                    <Text style={styles.staffBadge}>Badge #{st.badgeNumber}</Text>
                  </View>
                </View>

                <View style={styles.staffDetailsList}>
                  <View style={styles.staffDetailRow}>
                    <Text style={styles.staffDetailKey}>⏰ Duty Shift:</Text>
                    <Text style={styles.staffDetailVal}>{st.shift}</Text>
                  </View>
                  {st.gateAssigned && (
                    <View style={styles.staffDetailRow}>
                      <Text style={styles.staffDetailKey}>🚪 Station:</Text>
                      <Text style={styles.staffDetailVal}>{st.gateAssigned}</Text>
                    </View>
                  )}
                  <View style={styles.staffDetailRow}>
                    <Text style={styles.staffDetailKey}>📅 Since:</Text>
                    <Text style={styles.staffDetailVal}>{st.joiningDate}</Text>
                  </View>
                </View>

                <View style={styles.staffActionRow}>
                  <Button
                    title={`📞 Call (+91 ${st.phone})`}
                    variant="primary"
                    size="sm"
                    onPress={() => showToast(`Dialing ${st.name} at +91 ${st.phone}`)}
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            ))}
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ROLES & PERMISSIONS (RBAC) */}
      {/* ========================================================================= */}
      {activeTab === 'rbac' && (
        <View style={styles.tabContent}>
          <Card style={styles.rbacOverviewCard}>
            <Text style={styles.rbacTitle}>🔐 Granular Permission Matrix (RBAC)</Text>
            <Text style={styles.rbacSubtitle}>
              ApniSociety uses an enterprise-grade capability model where features depend on specific
              permission grants rather than hardcoded string checks.
            </Text>

            {/* Current User Live Permissions */}
            <View style={styles.currentPersonaCard}>
              <View style={styles.currentPersonaHeader}>
                <Text style={styles.currentPersonaName}>
                  Active Session: {user?.name} ({user?.roleTitle})
                </Text>
                <Button
                  title="Switch Persona"
                  variant="outline"
                  size="sm"
                  onPress={() => setShowPersonaModal(true)}
                />
              </View>
              <Text style={styles.currentPersonaSub}>
                Granted Permissions ({user?.permissions.length || 0}):
              </Text>
              <View style={styles.permissionTagsWrap}>
                {user?.permissions.map((p) => (
                  <View key={p} style={styles.permTag}>
                    <Text style={styles.permTagText}>✓ {p}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Role Comparison Table */}
            <View style={styles.rbacTableContainer}>
              <Text style={styles.rbacTableHeading}>Role Permission Matrix Comparison</Text>
              <View style={styles.rbacTable}>
                {/* Table Header */}
                <View style={styles.rbacTableRowHeader}>
                  <Text style={[styles.rbacTableCell, styles.rbacColModule]}>Capability Module</Text>
                  <Text style={[styles.rbacTableCell, styles.rbacColRole]}>Owner</Text>
                  <Text style={[styles.rbacTableCell, styles.rbacColRole]}>Tenant</Text>
                  <Text style={[styles.rbacTableCell, styles.rbacColRole]}>Treasurer</Text>
                  <Text style={[styles.rbacTableCell, styles.rbacColRole]}>President / Admin</Text>
                </View>

                {/* Rows */}
                {[
                  {
                    module: 'Directory & Members View',
                    owner: '✅ Full',
                    tenant: '✅ Full',
                    treasurer: '✅ Full',
                    president: '✅ Full',
                  },
                  {
                    module: 'Onboard & Manage Members',
                    owner: '❌ No',
                    tenant: '❌ No',
                    treasurer: '❌ No',
                    president: '✅ Admin',
                  },
                  {
                    module: 'Verify KYC & Role Assignments',
                    owner: '❌ No',
                    tenant: '❌ No',
                    treasurer: '❌ No',
                    president: '✅ Admin',
                  },
                  {
                    module: 'Maintenance Billing & NOC',
                    owner: '✅ Pay',
                    tenant: '❌ No',
                    treasurer: '✅ Manage & Audit',
                    president: '✅ Manage',
                  },
                  {
                    module: 'Water Meter Readings',
                    owner: '✅ View',
                    tenant: '✅ View',
                    treasurer: '✅ Manage',
                    president: '✅ Manage',
                  },
                  {
                    module: 'Community Hall Bookings',
                    owner: '✅ Book',
                    tenant: '✅ Book',
                    treasurer: '✅ View',
                    president: '✅ Approve/Reject',
                  },
                  {
                    module: 'Expenses & Reimbursements',
                    owner: '❌ No',
                    tenant: '❌ No',
                    treasurer: '✅ Approve & Pay',
                    president: '✅ Authorize',
                  },
                  {
                    module: 'Notice Broadcast (SMS/App)',
                    owner: '❌ View Only',
                    tenant: '❌ View Only',
                    treasurer: '✅ Broadcast',
                    president: '✅ Broadcast',
                  },
                ].map((row, idx) => (
                  <View
                    key={row.module}
                    style={[styles.rbacTableRow, idx % 2 === 1 && styles.rbacTableRowAlt]}
                  >
                    <Text style={[styles.rbacTableCell, styles.rbacColModule, { fontWeight: '600' }]}>
                      {row.module}
                    </Text>
                    <Text style={[styles.rbacTableCell, styles.rbacColRole]}>{row.owner}</Text>
                    <Text style={[styles.rbacTableCell, styles.rbacColRole]}>{row.tenant}</Text>
                    <Text style={[styles.rbacTableCell, styles.rbacColRole]}>{row.treasurer}</Text>
                    <Text style={[styles.rbacTableCell, styles.rbacColRole]}>{row.president}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ONBOARD / ADD NEW MEMBER */}
      {/* ========================================================================= */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Onboard Resident / Member</Text>
                <Text style={styles.modalSubtitle}>Register resident details, assign flat & vehicle</Text>
              </View>
              <Pressable onPress={() => setShowAddModal(false)} style={styles.closeModalBtn}>
                <Text style={styles.closeModalText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {formError.length > 0 && (
                <View style={styles.formErrorBox}>
                  <Text style={styles.formErrorText}>⚠️ {formError}</Text>
                </View>
              )}

              {/* Resident Type Selection */}
              <Text style={styles.formFieldLabel}>Resident Type *</Text>
              <View style={styles.typeSelectorRow}>
                {(['owner', 'tenant'] as ResidentType[]).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setFormResidentType(t)}
                    style={[styles.typeSelectBtn, formResidentType === t && styles.typeSelectBtnActive]}
                  >
                    <Text style={[styles.typeSelectBtnText, formResidentType === t && styles.typeSelectBtnTextActive]}>
                      {t === 'owner' ? '🏡 Resident Owner' : '🔑 Tenant (Renter)'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Full Name */}
              <Text style={styles.formFieldLabel}>Full Name *</Text>
              <TextInput
                placeholder="e.g. Vikramaditya Malhotra"
                placeholderTextColor={colors.text.muted}
                value={formName}
                onChangeText={setFormName}
                style={styles.modalInput}
              />

              {/* Phone & Email Row */}
              <View style={styles.formTwoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formFieldLabel}>Primary Phone *</Text>
                  <TextInput
                    placeholder="10-digit mobile number"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="phone-pad"
                    value={formPhone}
                    onChangeText={setFormPhone}
                    style={styles.modalInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formFieldLabel}>Email Address</Text>
                  <TextInput
                    placeholder="name@example.com"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="email-address"
                    value={formEmail}
                    onChangeText={setFormEmail}
                    style={styles.modalInput}
                  />
                </View>
              </View>

              {/* Tower & Flat Selection */}
              <View style={styles.formTwoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formFieldLabel}>Tower / Block *</Text>
                  <View style={styles.towerChoiceRow}>
                    {['Tower A', 'Tower B', 'Tower C', 'Tower D'].map((tw) => (
                      <Pressable
                        key={tw}
                        onPress={() => setFormTower(tw)}
                        style={[styles.towerChipBtn, formTower === tw && styles.towerChipBtnActive]}
                      >
                        <Text style={[styles.towerChipText, formTower === tw && styles.towerChipTextActive]}>
                          {tw.replace('Tower ', 'T-')}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.formFieldLabel}>Flat Number *</Text>
                  <TextInput
                    placeholder="e.g. B-402, A-101"
                    placeholderTextColor={colors.text.muted}
                    value={formFlat}
                    onChangeText={setFormFlat}
                    style={styles.modalInput}
                  />
                </View>
              </View>

              {/* Intercom & Parking Slot */}
              <View style={styles.formTwoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formFieldLabel}>Intercom Extension</Text>
                  <TextInput
                    placeholder="e.g. 2402"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                    value={formIntercom}
                    onChangeText={setFormIntercom}
                    style={styles.modalInput}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.formFieldLabel}>Assigned Parking Slot</Text>
                  <TextInput
                    placeholder="e.g. P-42, B1-05"
                    placeholderTextColor={colors.text.muted}
                    value={formParking}
                    onChangeText={setFormParking}
                    style={styles.modalInput}
                  />
                </View>
              </View>

              {/* Vehicle Registration */}
              <Text style={styles.formSectionSubHeader}>Vehicle Details (Optional)</Text>
              <View style={styles.formTwoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formFieldLabel}>Vehicle Plate Number</Text>
                  <TextInput
                    placeholder="e.g. DL 08 AB 1234"
                    placeholderTextColor={colors.text.muted}
                    value={formVehicleNum}
                    onChangeText={setFormVehicleNum}
                    style={styles.modalInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formFieldLabel}>Make & Model</Text>
                  <TextInput
                    placeholder="e.g. Honda City White"
                    placeholderTextColor={colors.text.muted}
                    value={formVehicleModel}
                    onChangeText={setFormVehicleModel}
                    style={styles.modalInput}
                  />
                </View>
              </View>

              <View style={styles.typeSelectorRow}>
                {(
                  [
                    { id: 'four_wheeler', label: '🚗 4-Wheeler Car' },
                    { id: 'two_wheeler', label: '🛵 2-Wheeler' },
                    { id: 'ev', label: '⚡ Electric Vehicle (EV)' },
                  ] as const
                ).map((vt) => (
                  <Pressable
                    key={vt.id}
                    onPress={() => setFormVehicleType(vt.id)}
                    style={[styles.typeSelectBtn, formVehicleType === vt.id && styles.typeSelectBtnActive]}
                  >
                    <Text style={[styles.typeSelectBtnText, formVehicleType === vt.id && styles.typeSelectBtnTextActive]}>
                      {vt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Emergency Contact */}
              <Text style={styles.formSectionSubHeader}>Emergency Contact</Text>
              <View style={styles.formTwoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formFieldLabel}>Contact Person</Text>
                  <TextInput
                    placeholder="Name"
                    placeholderTextColor={colors.text.muted}
                    value={formEmergencyName}
                    onChangeText={setFormEmergencyName}
                    style={styles.modalInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formFieldLabel}>Contact Phone</Text>
                  <TextInput
                    placeholder="10-digit phone"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="phone-pad"
                    value={formEmergencyPhone}
                    onChangeText={setFormEmergencyPhone}
                    style={styles.modalInput}
                  />
                </View>
              </View>

              {/* RWA Committee Promotion Toggle */}
              {canManage && (
                <View style={styles.committeeAssignBox}>
                  <Pressable
                    onPress={() => setFormIsCommittee(!formIsCommittee)}
                    style={styles.checkboxRow}
                  >
                    <View style={[styles.checkboxSquare, formIsCommittee && styles.checkboxSquareActive]}>
                      {formIsCommittee && <Text style={styles.checkboxCheck}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      Appoint as RWA Management Committee Member
                    </Text>
                  </Pressable>

                  {formIsCommittee && (
                    <View style={{ marginTop: spacing.sm }}>
                      <Text style={styles.formFieldLabel}>Committee Role</Text>
                      <View style={styles.committeeRolesChoiceWrap}>
                        {(
                          [
                            { id: 'committee_member', label: 'Executive Member' },
                            { id: 'joint_secretary', label: 'Joint Secretary' },
                            { id: 'security_lead', label: 'Security Lead' },
                            { id: 'cultural_head', label: 'Cultural Lead' },
                          ] as const
                        ).map((cr) => (
                          <Pressable
                            key={cr.id}
                            onPress={() => setFormCommitteeRole(cr.id)}
                            style={[
                              styles.committeeRoleChip,
                              formCommitteeRole === cr.id && styles.committeeRoleChipActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.committeeRoleChipText,
                                formCommitteeRole === cr.id && styles.committeeRoleChipTextActive,
                              ]}
                            >
                              {cr.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setShowAddModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={isSubmitting ? 'Registering...' : 'Register Member ✅'}
                variant="primary"
                size="md"
                onPress={handleCreateMember}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: MEMBER DOSSIER & PROFILE DETAIL */}
      {/* ========================================================================= */}
      <Modal visible={Boolean(selectedMember)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedMember && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <View style={styles.memberAvatarCircleLarge}>
                      <Text style={styles.memberAvatarLargeText}>
                        {selectedMember.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.modalTitle}>{selectedMember.name}</Text>
                      <Text style={styles.modalSubtitle}>
                        {selectedMember.block} • Flat {selectedMember.flatNumber}
                      </Text>
                    </View>
                  </View>
                  <Pressable onPress={() => setSelectedMember(null)} style={styles.closeModalBtn}>
                    <Text style={styles.closeModalText}>✕</Text>
                  </Pressable>
                </View>

                <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                  {/* Status & Badges */}
                  <View style={styles.detailBadgeRow}>
                    {selectedMember.verificationStatus === 'verified' ? (
                      <StatusBadge status="success" label="KYC Verified ✅" />
                    ) : (
                      <StatusBadge status="warning" label="KYC Verification Pending" />
                    )}

                    <StatusBadge
                      status={selectedMember.residentType === 'owner' ? 'info' : 'neutral'}
                      label={selectedMember.residentType === 'owner' ? 'Owner Resident' : 'Tenant'}
                    />

                    {selectedMember.isCommitteeMember && (
                      <StatusBadge status="warning" label="Committee Member" />
                    )}
                  </View>

                  {/* Primary Info Cards */}
                  <View style={styles.detailInfoGrid}>
                    <View style={styles.detailInfoItem}>
                      <Text style={styles.detailInfoLabel}>Mobile Phone</Text>
                      <Text style={styles.detailInfoValue}>+91 {selectedMember.phone}</Text>
                    </View>

                    <View style={styles.detailInfoItem}>
                      <Text style={styles.detailInfoLabel}>Email Address</Text>
                      <Text style={styles.detailInfoValue}>{selectedMember.email}</Text>
                    </View>

                    <View style={styles.detailInfoItem}>
                      <Text style={styles.detailInfoLabel}>Intercom Extension</Text>
                      <Text style={styles.detailInfoValue}>{selectedMember.intercomNumber}</Text>
                    </View>

                    <View style={styles.detailInfoItem}>
                      <Text style={styles.detailInfoLabel}>Assigned Parking</Text>
                      <Text style={styles.detailInfoValue}>
                        {selectedMember.parkingSlots.length > 0
                          ? selectedMember.parkingSlots.join(', ')
                          : 'None'}
                      </Text>
                    </View>

                    <View style={styles.detailInfoItem}>
                      <Text style={styles.detailInfoLabel}>Move-in Date</Text>
                      <Text style={styles.detailInfoValue}>{selectedMember.moveInDate}</Text>
                    </View>

                    <View style={styles.detailInfoItem}>
                      <Text style={styles.detailInfoLabel}>Blood Group</Text>
                      <Text style={styles.detailInfoValue}>{selectedMember.bloodGroup || 'Not listed'}</Text>
                    </View>
                  </View>

                  {/* Committee Bio if applicable */}
                  {selectedMember.committeeRoleTitle && (
                    <View style={styles.committeeDetailBanner}>
                      <Text style={styles.committeeDetailTitle}>
                        🎖️ {selectedMember.committeeRoleTitle}
                      </Text>
                      {selectedMember.committeeBio && (
                        <Text style={styles.committeeDetailBio}>
                          "{selectedMember.committeeBio}"
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Emergency Contact */}
                  <View style={styles.emergencyCard}>
                    <Text style={styles.emergencyCardTitle}>🚨 Emergency Contact</Text>
                    <View style={styles.emergencyCardContent}>
                      <Text style={styles.emergencyName}>
                        {selectedMember.emergencyContact.name} ({selectedMember.emergencyContact.relation})
                      </Text>
                      <Text style={styles.emergencyPhone}>
                        📱 +91 {selectedMember.emergencyContact.phone}
                      </Text>
                    </View>
                  </View>

                  {/* Registered Vehicles */}
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Registered Vehicles ({selectedMember.vehicles.length})</Text>
                    <Button
                      title="+ Add Vehicle"
                      variant="ghost"
                      size="sm"
                      onPress={() => setIsAddingVehicle(!isAddingVehicle)}
                    />
                  </View>

                  {/* Add Vehicle Inline Box */}
                  {isAddingVehicle && (
                    <View style={styles.addVehicleBox}>
                      <Text style={styles.formFieldLabel}>Vehicle Plate Number *</Text>
                      <TextInput
                        placeholder="e.g. DL 01 AB 9988"
                        placeholderTextColor={colors.text.muted}
                        value={newVehiclePlate}
                        onChangeText={setNewVehiclePlate}
                        style={styles.modalInput}
                      />
                      <Text style={styles.formFieldLabel}>Make & Model</Text>
                      <TextInput
                        placeholder="e.g. Honda City"
                        placeholderTextColor={colors.text.muted}
                        value={newVehicleModel}
                        onChangeText={setNewVehicleModel}
                        style={styles.modalInput}
                      />
                      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                        <Button
                          title="Save Vehicle"
                          variant="primary"
                          size="sm"
                          onPress={() => handleAddVehicleToMember(selectedMember)}
                        />
                        <Button
                          title="Cancel"
                          variant="ghost"
                          size="sm"
                          onPress={() => setIsAddingVehicle(false)}
                        />
                      </View>
                    </View>
                  )}

                  <View style={styles.vehiclesListWrap}>
                    {selectedMember.vehicles.length === 0 ? (
                      <Text style={styles.emptyVehiclesText}>No vehicles currently registered.</Text>
                    ) : (
                      selectedMember.vehicles.map((v) => (
                        <View key={v.id} style={styles.vehicleCardItem}>
                          <Text style={styles.vehicleTypeEmoji}>
                            {v.type === 'ev' ? '⚡' : v.type === 'two_wheeler' ? '🛵' : '🚗'}
                          </Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.vehiclePlate}>{v.registrationNumber}</Text>
                            <Text style={styles.vehicleModel}>{v.makeModel} • Slot: {v.parkingSlot}</Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>

                  {/* Co-Residents / Family */}
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>
                      Co-Residents / Family Members ({selectedMember.familyMembers.length})
                    </Text>
                  </View>

                  <View style={styles.familyListWrap}>
                    {selectedMember.familyMembers.length === 0 ? (
                      <Text style={styles.emptyVehiclesText}>No co-residents recorded.</Text>
                    ) : (
                      selectedMember.familyMembers.map((fam) => (
                        <View key={fam.id} style={styles.familyItem}>
                          <Text style={styles.familyName}>{fam.name}</Text>
                          <Text style={styles.familyRelation}>
                            {fam.relation} {fam.isEmergencyContact && '• Primary Emergency Contact'}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>

                  {/* Admin Actions */}
                  {canManage && (
                    <View style={styles.adminActionsSection}>
                      <Text style={styles.adminSectionTitle}>Admin Governance Actions</Text>
                      <View style={styles.adminButtonsRow}>
                        {selectedMember.verificationStatus === 'pending_verification' ? (
                          <Button
                            title="Verify KYC ✅"
                            variant="primary"
                            size="sm"
                            onPress={() => handleVerifyMember(selectedMember.id)}
                          />
                        ) : (
                          <Button
                            title="Suspend / Mark Unverified"
                            variant="outline"
                            size="sm"
                            onPress={() => handleRejectMember(selectedMember.id)}
                          />
                        )}

                        <Button
                          title={
                            selectedMember.isCommitteeMember
                              ? 'Revoke Committee Post'
                              : 'Promote to Committee 🎖️'
                          }
                          variant="outline"
                          size="sm"
                          onPress={() => handleToggleCommitteeRole(selectedMember)}
                        />

                        <Button
                          title="Remove Resident"
                          variant="danger"
                          size="sm"
                          onPress={() => handleDeleteMember(selectedMember.id, selectedMember.name)}
                        />
                      </View>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Button
                    title="Close"
                    variant="outline"
                    size="md"
                    onPress={() => setSelectedMember(null)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="📞 Call Resident"
                    variant="primary"
                    size="md"
                    onPress={() => showToast(`Calling +91 ${selectedMember.phone}`)}
                    style={{ flex: 1 }}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: UNIT INSPECTION MODAL */}
      {/* ========================================================================= */}
      <Modal visible={Boolean(selectedUnit)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedUnit && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Unit Dossier: {selectedUnit.flatNumber}</Text>
                    <Text style={styles.modalSubtitle}>{selectedUnit.block} • Floor {selectedUnit.floor}</Text>
                  </View>
                  <Pressable onPress={() => setSelectedUnit(null)} style={styles.closeModalBtn}>
                    <Text style={styles.closeModalText}>✕</Text>
                  </Pressable>
                </View>

                <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                  <View style={styles.detailBadgeRow}>
                    <StatusBadge
                      status={
                        selectedUnit.occupancyStatus === 'owner_occupied'
                          ? 'success'
                          : selectedUnit.occupancyStatus === 'rented'
                          ? 'info'
                          : 'neutral'
                      }
                      label={
                        selectedUnit.occupancyStatus === 'owner_occupied'
                          ? 'Owner Occupied'
                          : selectedUnit.occupancyStatus === 'rented'
                          ? 'Rented Unit'
                          : 'Vacant Flat'
                      }
                    />
                  </View>

                  <View style={styles.detailInfoGrid}>
                    <View style={styles.detailInfoItem}>
                      <Text style={styles.detailInfoLabel}>Super Built-up Area</Text>
                      <Text style={styles.detailInfoValue}>{selectedUnit.areaSqFt} sq.ft</Text>
                    </View>

                    <View style={styles.detailInfoItem}>
                      <Text style={styles.detailInfoLabel}>Occupant Name</Text>
                      <Text style={styles.detailInfoValue}>
                        {selectedUnit.primaryResidentName || 'None (Vacant)'}
                      </Text>
                    </View>

                    {selectedUnit.ownerName && (
                      <View style={styles.detailInfoItem}>
                        <Text style={styles.detailInfoLabel}>Registered Owner</Text>
                        <Text style={styles.detailInfoValue}>{selectedUnit.ownerName}</Text>
                      </View>
                    )}

                    <View style={styles.detailInfoItem}>
                      <Text style={styles.detailInfoLabel}>Parking Slots</Text>
                      <Text style={styles.detailInfoValue}>
                        {selectedUnit.parkingSlots.length > 0
                          ? selectedUnit.parkingSlots.join(', ')
                          : 'None'}
                      </Text>
                    </View>

                    <View style={styles.detailInfoItem}>
                      <Text style={styles.detailInfoLabel}>Maintenance Dues</Text>
                      <Text
                        style={[
                          styles.detailInfoValue,
                          selectedUnit.maintenanceDueAmount > 0
                            ? { color: colors.danger.main, fontWeight: '700' }
                            : { color: colors.success.main },
                        ]}
                      >
                        {selectedUnit.maintenanceDueAmount > 0
                          ? `₹${selectedUnit.maintenanceDueAmount} Outstanding`
                          : 'Zero Outstanding'}
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Button
                    title="Close"
                    variant="outline"
                    size="md"
                    onPress={() => setSelectedUnit(null)}
                    style={{ flex: 1 }}
                  />
                  {onNavigateToMaintenance && (
                    <Button
                      title="View Maintenance Ledger"
                      variant="primary"
                      size="md"
                      onPress={() => {
                        setSelectedUnit(null);
                        onNavigateToMaintenance();
                      }}
                      style={{ flex: 1 }}
                    />
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: EMERGENCY DESK & CONTACTS */}
      {/* ========================================================================= */}
      <Modal visible={showEmergencyDeskModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>🚨 Society Emergency Desk</Text>
                <Text style={styles.modalSubtitle}>Immediate 24/7 contacts for security, medical & civic emergencies</Text>
              </View>
              <Pressable onPress={() => setShowEmergencyDeskModal(false)} style={styles.closeModalBtn}>
                <Text style={styles.closeModalText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {[
                { title: 'Gate 1 (Main Security Desk)', phone: '011-28001001', ext: '1001', icon: '👮' },
                { title: 'Gate 2 (Service Entrance)', phone: '011-28001002', ext: '1002', icon: '🚪' },
                { title: '24/7 Lift Emergency AMC (Otis)', phone: '1800-120-6847', ext: 'Toll-free', icon: '🛗' },
                { title: 'Society Estate Office (Clubhouse)', phone: '011-28001000', ext: '1000', icon: '🏢' },
                { title: 'On-Call Electrician (Rameshwar)', phone: '9876501003', ext: 'Staff', icon: '⚡' },
                { title: 'On-Call Plumber (Santosh)', phone: '9876501004', ext: 'Staff', icon: '🔧' },
                { title: 'Nearest Hospital Ambulance (Fortis)', phone: '102 / 011-47135000', ext: '2.1 km', icon: '🚑' },
                { title: 'Local Police Station (Sector 12)', phone: '112 / 011-28051212', ext: 'Beat Officer', icon: '🚓' },
                { title: 'Fire Station (Sector 10)', phone: '101', ext: 'Fire HQ', icon: '🚒' },
              ].map((em) => (
                <View key={em.title} style={styles.emergencyDeskItem}>
                  <Text style={styles.emergencyDeskIcon}>{em.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emergencyDeskTitle}>{em.title}</Text>
                    <Text style={styles.emergencyDeskPhone}>📞 {em.phone} ({em.ext})</Text>
                  </View>
                  <Button
                    title="Call"
                    variant="primary"
                    size="sm"
                    onPress={() => showToast(`Calling ${em.title}: ${em.phone}`)}
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Close"
                variant="outline"
                size="md"
                onPress={() => setShowEmergencyDeskModal(false)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: PERSONA SWITCHER */}
      {/* ========================================================================= */}
      <Modal visible={showPersonaModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Switch Demo Persona</Text>
                <Text style={styles.modalSubtitle}>Test dynamic RBAC permissions and capabilities</Text>
              </View>
              <Pressable onPress={() => setShowPersonaModal(false)} style={styles.closeModalBtn}>
                <Text style={styles.closeModalText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {MOCK_USERS.map((u) => {
                const isCurrent = user?.id === u.id;
                return (
                  <Pressable
                    key={u.id}
                    onPress={() => {
                      loginAsDemoUser(u);
                      setShowPersonaModal(false);
                      showToast(`Switched active persona to ${u.name} (${u.roleTitle})`);
                    }}
                    style={[styles.personaCard, isCurrent && styles.personaCardActive]}
                  >
                    <View style={styles.personaAvatar}>
                      <Text style={styles.personaAvatarText}>{u.name.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <Text style={styles.personaName}>{u.name}</Text>
                        {isCurrent && <StatusBadge status="success" label="Active" />}
                      </View>
                      <Text style={styles.personaRole}>{u.roleTitle}</Text>
                      <Text style={styles.personaFlat}>
                        {u.block} • Flat {u.flatNumber} • {u.permissions.length} capabilities
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Close"
                variant="outline"
                size="md"
                onPress={() => setShowPersonaModal(false)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  toastBanner: {
    backgroundColor: '#0f172a',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  toastText: {
    color: '#38bdf8',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerSocietyBadge: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  userProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  userAvatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarMiniText: {
    color: colors.text.inverse,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  userNameMini: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  userRoleMini: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  kpiLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  kpiValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: colors.text.muted,
  },
  tabBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    backgroundColor: colors.neutral[100],
    padding: 4,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  tabButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  tabButtonActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.primary[700],
    fontWeight: typography.weights.bold,
  },
  tabContent: {
    marginBottom: spacing.xxl,
  },
  filtersCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  searchRow: {
    marginBottom: spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    height: '100%',
  },
  clearSearchBtn: {
    padding: spacing.xs,
  },
  clearSearchText: {
    color: colors.text.muted,
    fontSize: typography.sizes.sm,
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  filterLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    marginRight: spacing.xs,
  },
  filterChip: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  filterChipActive: {
    backgroundColor: colors.primary[600],
  },
  filterChipText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  filterChipTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },
  membersGrid: {
    gap: spacing.md,
  },
  emptyStateCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyStateTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  emptyStateText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 420,
    marginTop: spacing.xs,
  },
  memberCard: {
    padding: spacing.md,
  },
  memberCardHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  memberAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarInitial: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },
  memberHeaderInfo: {
    flex: 1,
  },
  memberTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  memberName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  memberUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 2,
  },
  memberFlatBadge: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  memberIntercom: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },
  memberChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  committeChip: {
    backgroundColor: '#fef3c7',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  committeChipText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: '#92400e',
  },
  bloodChip: {
    backgroundColor: '#fee2e2',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  bloodChipText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: '#b91c1c',
  },
  petChip: {
    backgroundColor: '#f0fdf4',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  petChipText: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: typography.weights.medium,
  },
  vehicleSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  vehicleRowLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },
  vehicleBadgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  vehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.neutral[100],
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: borderRadius.sm,
  },
  vehiclePillIcon: {
    fontSize: 11,
  },
  vehiclePillText: {
    fontSize: 11,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  contactDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  contactItemText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  memberCardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  committeeBanner: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    marginBottom: spacing.lg,
  },
  committeeBannerContent: {
    padding: spacing.md,
  },
  committeeBannerTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.primary[900],
    marginBottom: 4,
  },
  committeeBannerText: {
    fontSize: typography.sizes.sm,
    color: colors.primary[800],
    lineHeight: 20,
  },
  committeeGrid: {
    gap: spacing.md,
  },
  committeeCard: {
    padding: spacing.md,
  },
  committeeTopRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  committeeAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  committeeAvatarText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
  committeeInfoBlock: {
    flex: 1,
  },
  committeeName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  committeeDesignation: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary[700],
    marginTop: 1,
  },
  committeeUnit: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  committeeBioBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  committeeBioText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  committeeContactBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactIcon: {
    fontSize: 12,
  },
  contactVal: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  committeeActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  unitsGrid: {
    gap: spacing.md,
  },
  unitCard: {
    padding: spacing.md,
  },
  unitCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  unitFlatTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  unitTowerSub: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  unitDetailsBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 4,
  },
  unitMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  unitMetricKey: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },
  unitMetricVal: {
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  staffHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  staffHeaderTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  staffHeaderSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  staffGrid: {
    gap: spacing.md,
  },
  staffCard: {
    padding: spacing.md,
  },
  staffCardTop: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  staffAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffAvatarText: {
    fontSize: 22,
  },
  staffNameBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  staffName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  staffCategoryTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primary[700],
  },
  staffBadge: {
    fontSize: 11,
    color: colors.text.muted,
  },
  staffDetailsList: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 4,
    marginBottom: spacing.sm,
  },
  staffDetailRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  staffDetailKey: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    width: 80,
  },
  staffDetailVal: {
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
  staffActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rbacOverviewCard: {
    padding: spacing.lg,
  },
  rbacTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  rbacSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 4,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  currentPersonaCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  currentPersonaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  currentPersonaName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  currentPersonaSub: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  permissionTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  permTag: {
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: borderRadius.sm,
  },
  permTagText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  rbacTableContainer: {
    marginTop: spacing.md,
  },
  rbacTableHeading: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  rbacTable: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  rbacTableRowHeader: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    paddingVertical: spacing.sm,
  },
  rbacTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingVertical: spacing.sm,
  },
  rbacTableRowAlt: {
    backgroundColor: colors.neutral[50],
  },
  rbacTableCell: {
    paddingHorizontal: spacing.sm,
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
  },
  rbacColModule: {
    flex: 2,
  },
  rbacColRole: {
    flex: 1,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
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
  closeModalBtn: {
    padding: spacing.xs,
  },
  closeModalText: {
    fontSize: typography.sizes.lg,
    color: colors.text.muted,
  },
  modalScrollBody: {
    padding: spacing.lg,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.surface,
  },
  formErrorBox: {
    backgroundColor: colors.danger.background,
    borderColor: colors.danger.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  formErrorText: {
    color: colors.danger.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  formFieldLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: 4,
    marginTop: spacing.xs,
  },
  modalInput: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 40,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  formTwoCol: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  typeSelectBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
  },
  typeSelectBtnActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  typeSelectBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  typeSelectBtnTextActive: {
    color: colors.primary[700],
    fontWeight: typography.weights.bold,
  },
  towerChoiceRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.sm,
  },
  towerChipBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
  },
  towerChipBtnActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  towerChipText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  towerChipTextActive: {
    color: colors.primary[700],
    fontWeight: typography.weights.bold,
  },
  formSectionSubHeader: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary[800],
    marginTop: spacing.sm,
    marginBottom: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
  },
  committeeAssignBox: {
    backgroundColor: '#fffbeb',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#fef3c7',
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border.dark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxSquareActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  checkboxCheck: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  committeeRolesChoiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  committeeRoleChip: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  committeeRoleChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  committeeRoleChipText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  committeeRoleChipTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },
  memberAvatarCircleLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarLargeText: {
    color: colors.text.inverse,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  detailBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  detailInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailInfoItem: {
    width: '48%',
    backgroundColor: colors.neutral[50],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  detailInfoLabel: {
    fontSize: 11,
    color: colors.text.muted,
  },
  detailInfoValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  committeeDetailBanner: {
    backgroundColor: '#fffbeb',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  committeeDetailTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#92400e',
  },
  committeeDetailBio: {
    fontSize: typography.sizes.xs,
    color: '#78350f',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emergencyCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  emergencyCardTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#b91c1c',
  },
  emergencyCardContent: {
    marginTop: 4,
  },
  emergencyName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  emergencyPhone: {
    fontSize: typography.sizes.xs,
    color: '#b91c1c',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  addVehicleBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  vehiclesListWrap: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  emptyVehiclesText: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
  vehicleCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neutral[50],
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  vehicleTypeEmoji: {
    fontSize: 18,
  },
  vehiclePlate: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  vehicleModel: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  familyListWrap: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  familyItem: {
    backgroundColor: colors.neutral[50],
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  familyName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  familyRelation: {
    fontSize: 11,
    color: colors.text.muted,
  },
  adminActionsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  adminSectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  adminButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emergencyDeskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  emergencyDeskIcon: {
    fontSize: 24,
  },
  emergencyDeskTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  emergencyDeskPhone: {
    fontSize: typography.sizes.xs,
    color: colors.primary[700],
    marginTop: 2,
  },
  personaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.sm,
  },
  personaCardActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  personaAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaAvatarText: {
    color: colors.text.inverse,
    fontWeight: typography.weights.bold,
  },
  personaName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  personaRole: {
    fontSize: typography.sizes.xs,
    color: colors.primary[700],
    fontWeight: typography.weights.medium,
  },
  personaFlat: {
    fontSize: 11,
    color: colors.text.muted,
  },
});
