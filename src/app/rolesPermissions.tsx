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
import { getAllMembers } from '../services/mockMembers';
import {
  ALL_PERMISSION_DEFINITIONS,
  assignRoleToUser,
  createRole,
  deleteRole,
  getAllRoles,
  getAuditLogs,
  getPermissionsByModule,
  getRolesSummaryMetrics,
  resetDemoRoles,
  toggleRolePermission,
  updateMemberDirectPermissions,
  updateRole,
} from '../services/mockRoles';
import { SocietyMember } from '../types/members';
import {
  NewRolePayload,
  PermissionDefinition,
  PermissionModule,
  RoleAssignmentAudit,
  RoleCategory,
  RolesSummaryMetrics,
  SocietyRole,
} from '../types/roles';

export interface RolesPermissionsScreenProps {
  initialRoleIdToEdit?: string | null;
  initialMemberIdToEdit?: string | null;
  onNavigateToDashboard?: () => void;
  onNavigateToMaintenance?: () => void;
  onNavigateToWater?: () => void;
  onNavigateToExpenses?: () => void;
  onNavigateToReimbursements?: () => void;
  onNavigateToHallBooking?: () => void;
  onNavigateToComplaints?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToMembers?: () => void;
  onNavigateToReports?: () => void;
  onNavigateToBackend?: () => void;
}

export default function RolesPermissionsScreen({
  initialRoleIdToEdit,
  initialMemberIdToEdit,
  onNavigateToDashboard,
  onNavigateToMaintenance,
  onNavigateToWater,
  onNavigateToExpenses,
  onNavigateToReimbursements,
  onNavigateToHallBooking,
  onNavigateToComplaints,
  onNavigateToNotifications,
  onNavigateToMembers,
  onNavigateToReports,
  onNavigateToBackend,
}: RolesPermissionsScreenProps) {
  const { user, loginAsDemoUser, hasPermission, refreshSession } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const canManage = hasPermission(PERMISSIONS.ROLES_MANAGE);
  const canView = hasPermission(PERMISSIONS.ROLES_VIEW);
  const isAdminOrPresident =
    user?.roleId === 'role-president' ||
    user?.isCommitteeMember ||
    canManage;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'catalog' | 'matrix' | 'assignments' | 'audit' | 'simulator'>('catalog');

  // State
  const [roles, setRoles] = useState<SocietyRole[]>(() => getAllRoles());
  const [auditLogs, setAuditLogs] = useState<RoleAssignmentAudit[]>(() => getAuditLogs());
  const [metrics, setMetrics] = useState<RolesSummaryMetrics>(() => getRolesSummaryMetrics());
  const [members, setMembers] = useState<SocietyMember[]>(() => getAllMembers());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quickMemberPickId, setQuickMemberPickId] = useState<string>('');

  // Filters for Catalog
  const [categoryFilter, setCategoryFilter] = useState<'all' | RoleCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filters for Matrix
  const [matrixModuleFilter, setMatrixModuleFilter] = useState<'all' | PermissionModule>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRoleForDetail, setSelectedRoleForDetail] = useState<SocietyRole | null>(null);
  const [selectedUserForAssign, setSelectedUserForAssign] = useState<SocietyMember | null>(null);
  const [showPersonaModal, setShowPersonaModal] = useState(false);

  // Edit Role Permissions Modal State (Allows modifying VC, Treasurer, Owner, etc.)
  const [editingRole, setEditingRole] = useState<SocietyRole | null>(null);
  const [editRolePermissions, setEditRolePermissions] = useState<PermissionType[]>([]);
  const [editRoleDesc, setEditRoleDesc] = useState('');
  const [editRoleError, setEditRoleError] = useState('');

  // Edit Direct Member Permissions Modal State
  const [editingMember, setEditingMember] = useState<SocietyMember | null>(null);
  const [editMemberPermissions, setEditMemberPermissions] = useState<PermissionType[]>([]);

  // Form State for Create/Edit Role
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<RoleCategory>('custom');
  const [formIcon, setFormIcon] = useState('🛡️');
  const [formColor, setFormColor] = useState('#0d9488');
  const [formPermissions, setFormPermissions] = useState<PermissionType[]>([]);
  const [formError, setFormError] = useState('');

  // Assign Role Modal Form State
  const [assignTargetRoleId, setAssignTargetRoleId] = useState<string>('');
  const [assignNotes, setAssignNotes] = useState('');

  // Privilege Simulator State
  const [simUserId, setSimUserId] = useState<string>(user?.id || 'user-001');
  const [simPermissionId, setSimPermissionId] = useState<PermissionType>(PERMISSIONS.MAINTENANCE_MANAGE);

  useEffect(() => {
    reloadAll();
  }, [user?.id]);

  // If navigated with initial role or member target (e.g. from Members screen or President desk)
  useEffect(() => {
    if (initialRoleIdToEdit) {
      const allR = getAllRoles();
      const r = allR.find((item) => item.id === initialRoleIdToEdit);
      if (r) {
        handleOpenEditRole(r);
      }
    }
  }, [initialRoleIdToEdit]);

  useEffect(() => {
    if (initialMemberIdToEdit) {
      const allM = getAllMembers();
      const m = allM.find((item) => item.id === initialMemberIdToEdit);
      if (m) {
        handleOpenEditMember(m);
      }
    }
  }, [initialMemberIdToEdit]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const reloadAll = () => {
    setRoles(getAllRoles());
    setAuditLogs(getAuditLogs());
    setMetrics(getRolesSummaryMetrics());
    setMembers(getAllMembers());
  };

  const handleResetDemo = () => {
    resetDemoRoles();
    reloadAll();
    showToast('🔄 Demo roles & permissions reset to standard configuration.');
  };

  const handleTogglePermissionInForm = (permId: PermissionType) => {
    if (formPermissions.includes(permId)) {
      setFormPermissions(formPermissions.filter((p) => p !== permId));
    } else {
      setFormPermissions([...formPermissions, permId]);
    }
  };

  const handleToggleModuleInForm = (moduleKey: PermissionModule) => {
    const modulePerms = ALL_PERMISSION_DEFINITIONS.filter((p) => p.module === moduleKey).map((p) => p.id);
    const allSelected = modulePerms.every((p) => formPermissions.includes(p));

    if (allSelected) {
      setFormPermissions(formPermissions.filter((p) => !modulePerms.includes(p)));
    } else {
      const merged = Array.from(new Set([...formPermissions, ...modulePerms]));
      setFormPermissions(merged);
    }
  };

  const handleSaveRole = () => {
    if (!formName.trim()) {
      setFormError('Role title is required.');
      return;
    }
    if (!formDesc.trim()) {
      setFormError('Please enter a role description.');
      return;
    }
    if (formPermissions.length === 0) {
      setFormError('Please select at least one permission.');
      return;
    }

    try {
      const payload: NewRolePayload = {
        name: formName.trim(),
        description: formDesc.trim(),
        category: formCategory,
        icon: formIcon,
        color: formColor,
        permissions: formPermissions,
      };

      const created = createRole(payload, user?.name ? `${user.name} (${user.roleTitle})` : 'President');
      reloadAll();
      setShowCreateModal(false);
      setFormName('');
      setFormDesc('');
      setFormPermissions([]);
      setFormError('');
      showToast(`✅ Custom Role "${created.name}" created with ${created.permissions.length} capabilities!`);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create role');
    }
  };

  const handleExecuteRoleAssignment = () => {
    if (!selectedUserForAssign || !assignTargetRoleId) return;
    try {
      assignRoleToUser(
        selectedUserForAssign.id,
        assignTargetRoleId,
        user?.name ? `${user.name} (${user.roleTitle})` : 'President'
      );
      reloadAll();
      const assignedRole = roles.find((r) => r.id === assignTargetRoleId);
      showToast(
        `✅ ${selectedUserForAssign.name} (${selectedUserForAssign.flatNumber}) assigned as "${assignedRole?.name}"!`
      );
      setSelectedUserForAssign(null);
      setAssignTargetRoleId('');
      setAssignNotes('');
    } catch (err: unknown) {
      showToast(`⚠️ ${err instanceof Error ? err.message : 'Assignment failed'}`);
    }
  };

  const handleDeleteCustomRole = (roleId: string, roleName: string) => {
    try {
      deleteRole(roleId, user?.name ? `${user.name} (${user.roleTitle})` : 'President');
      reloadAll();
      setSelectedRoleForDetail(null);
      showToast(`🗑️ Role "${roleName}" has been removed.`);
    } catch (err: unknown) {
      showToast(`⚠️ ${err instanceof Error ? err.message : 'Cannot delete role'}`);
    }
  };

  // =========================================================================
  // Role Permission Editing (VC, Treasurer, Owner, Tenant & Custom Roles)
  // =========================================================================
  const handleOpenEditRole = (role: SocietyRole) => {
    setEditingRole(role);
    setEditRolePermissions([...role.permissions]);
    setEditRoleDesc(role.description);
    setEditRoleError('');
  };

  const handleToggleEditRolePermission = (permId: PermissionType) => {
    if (editRolePermissions.includes(permId)) {
      setEditRolePermissions(editRolePermissions.filter((p) => p !== permId));
    } else {
      setEditRolePermissions([...editRolePermissions, permId]);
    }
  };

  const handleToggleEditRoleModule = (moduleKey: PermissionModule) => {
    const modulePerms = ALL_PERMISSION_DEFINITIONS.filter((p) => p.module === moduleKey).map((p) => p.id);
    const allSelected = modulePerms.every((p) => editRolePermissions.includes(p));
    if (allSelected) {
      setEditRolePermissions(editRolePermissions.filter((p) => !modulePerms.includes(p)));
    } else {
      setEditRolePermissions(Array.from(new Set([...editRolePermissions, ...modulePerms])));
    }
  };

  const handleSaveEditRole = () => {
    if (!editingRole) return;
    if (editRolePermissions.length === 0) {
      setEditRoleError('Please select at least one permission capability.');
      return;
    }

    try {
      const updated = updateRole(
        editingRole.id,
        {
          permissions: editRolePermissions,
          description: editRoleDesc.trim() || editingRole.description,
        },
        user?.name ? `${user.name} (${user.roleTitle})` : 'President'
      );
      reloadAll();
      refreshSession();
      setEditingRole(null);
      showToast(`✅ Permissions for "${updated.name}" updated (${updated.permissions.length} capabilities active)!`);
    } catch (err: unknown) {
      setEditRoleError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleQuickToggleMatrix = (roleId: string, permId: PermissionType) => {
    if (!isAdminOrPresident) return;
    try {
      const updated = toggleRolePermission(
        roleId,
        permId,
        user?.name ? `${user.name} (${user.roleTitle})` : 'President'
      );
      reloadAll();
      refreshSession();
      const hasPerm = updated.permissions.includes(permId);
      const permDef = ALL_PERMISSION_DEFINITIONS.find((p) => p.id === permId);
      showToast(
        `${hasPerm ? '✅ Granted' : '🚫 Revoked'} "${permDef?.name || permId}" for ${updated.name}!`
      );
    } catch (err: unknown) {
      showToast(`⚠️ ${err instanceof Error ? err.message : 'Toggle failed'}`);
    }
  };

  // =========================================================================
  // Member Direct Privileges Customization
  // =========================================================================
  const handleOpenEditMember = (member: SocietyMember) => {
    setEditingMember(member);
    const mockUser = MOCK_USERS.find((u) => u.id === member.id);
    if (mockUser) {
      setEditMemberPermissions([...mockUser.permissions]);
    } else {
      const role =
        roles.find((r) => r.name.toLowerCase().includes(member.residentType)) ||
        (member.isCommitteeMember
          ? roles.find((r) => r.id === 'role-president') || roles[0]
          : roles.find((r) => r.id === 'role-owner') || roles[0]);
      setEditMemberPermissions([...role.permissions]);
    }
  };

  const handleToggleEditMemberPermission = (permId: PermissionType) => {
    if (editMemberPermissions.includes(permId)) {
      setEditMemberPermissions(editMemberPermissions.filter((p) => p !== permId));
    } else {
      setEditMemberPermissions([...editMemberPermissions, permId]);
    }
  };

  const handleToggleEditMemberModule = (moduleKey: PermissionModule) => {
    const modulePerms = ALL_PERMISSION_DEFINITIONS.filter((p) => p.module === moduleKey).map((p) => p.id);
    const allSelected = modulePerms.every((p) => editMemberPermissions.includes(p));
    if (allSelected) {
      setEditMemberPermissions(editMemberPermissions.filter((p) => !modulePerms.includes(p)));
    } else {
      setEditMemberPermissions(Array.from(new Set([...editMemberPermissions, ...modulePerms])));
    }
  };

  const handleResetMemberToRoleDefaults = () => {
    if (!editingMember) return;
    const assignedRole =
      roles.find((r) => r.name.toLowerCase().includes(editingMember.residentType)) ||
      (editingMember.isCommitteeMember
        ? roles.find((r) => r.id === 'role-president') || roles[0]
        : roles.find((r) => r.id === 'role-owner') || roles[0]);
    setEditMemberPermissions([...assignedRole.permissions]);
    showToast(`Reset capabilities to default ${assignedRole.name} permissions.`);
  };

  const handleSaveMemberPermissions = () => {
    if (!editingMember) return;
    try {
      const res = updateMemberDirectPermissions(
        editingMember.id,
        editMemberPermissions,
        user?.name ? `${user.name} (${user.roleTitle})` : 'President'
      );
      reloadAll();
      refreshSession();
      setEditingMember(null);
      showToast(`✅ Custom privileges updated for ${editingMember.name} (${res.count} capabilities active)!`);
    } catch (err: unknown) {
      showToast(`⚠️ ${err instanceof Error ? err.message : 'Failed to update member permissions'}`);
    }
  };

  // Filtered Roles
  const filteredRoles = roles.filter((r) => {
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = r.name.toLowerCase().includes(q);
      const matchDesc = r.description.toLowerCase().includes(q);
      const matchPerm = r.permissions.some((p) => p.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchPerm) return false;
    }
    return true;
  });

  // Permissions grouped by module
  const permsByModule = getPermissionsByModule();

  // Simulator calculation
  const simUser = MOCK_USERS.find((u) => u.id === simUserId) || MOCK_USERS[0];
  const simUserRole = roles.find((r) => r.id === simUser.roleId) || roles[0];
  const simHasPerm = simUser.permissions.includes(simPermissionId);
  const simPermDef = ALL_PERMISSION_DEFINITIONS.find((p) => p.id === simPermissionId);

  // If user has neither permission
  if (!canView && !canManage) {
    return (
      <ScreenContainer maxWidth={640}>
        <Card title="Roles & Access Restricted" subtitle="Permission required">
          <View style={{ padding: spacing.md }}>
            <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 20 }}>
              Access to enterprise Role-Based Access Control (RBAC) governance is restricted to Society Administrators and Committee Members.
            </Text>
          </View>
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer maxWidth={1180}>
      {/* Toast Feedback Banner */}
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
              <Text style={styles.headerSocietyBadge}>{APP_NAME} Governance & Security</Text>
              {canManage ? (
                <StatusBadge status="warning" label="RBAC Super Admin" />
              ) : (
                <StatusBadge status="info" label="Audit / Read Access" />
              )}
            </View>
            <Text style={styles.headerTitle}>Roles & Permissions (RBAC)</Text>
            <Text style={styles.headerSubtitle}>
              Shanti Heights RWA • Enterprise Role-Based Access Control, Capability Matrices & Security Governance
            </Text>
          </View>

          {/* User Persona Pill */}
          <Pressable
            onPress={() => Boolean(user?.isAppOwner) && setShowPersonaModal(true)}
            style={styles.userProfilePill}
            accessibilityLabel={user?.isAppOwner ? "Switch Persona" : "User Profile"}
          >
            <View style={styles.userAvatarMini}>
              <Text style={styles.userAvatarMiniText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View>
              <Text style={styles.userNameMini}>{user?.name || 'Resident'}</Text>
              <Text style={styles.userRoleMini}>
                {user?.roleTitle || 'Owner'}{Boolean(user?.isAppOwner) ? ' • Switch Persona 🔄' : ''}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Action Buttons Top */}
        <View style={styles.headerActions}>
          {canManage && (
            <Button
              title="➕ Create Custom Role"
              variant="primary"
              size="md"
              onPress={() => {
                setFormName('');
                setFormDesc('');
                setFormCategory('custom');
                setFormIcon('🛡️');
                setFormPermissions([PERMISSIONS.NOTIFICATION_VIEW, PERMISSIONS.MEMBERS_VIEW]);
                setFormError('');
                setShowCreateModal(true);
              }}
            />
          )}
          {onNavigateToBackend && (
            <Button
              title="⚡ API Backend & Architecture"
              variant="outline"
              size="md"
              onPress={onNavigateToBackend}
            />
          )}
          <Button
            title="🔍 Live RBAC Simulator"
            variant="outline"
            size="md"
            onPress={() => setActiveTab('simulator')}
          />
          <Button
            title="📜 Security Audit Log"
            variant="outline"
            size="md"
            onPress={() => setActiveTab('audit')}
          />
          <Button
            title="🔄 Reset Demo Roles"
            variant="ghost"
            size="md"
            onPress={handleResetDemo}
          />
        </View>
      </View>

      {/* KPIs & Security Posture Bar */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Defined Roles</Text>
          <Text style={styles.kpiValue}>{metrics.totalRoles}</Text>
          <Text style={styles.kpiSub}>
            {metrics.systemRolesCount} Core • {metrics.customRolesCount} Custom
          </Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Granular Capabilities</Text>
          <Text style={styles.kpiValue}>{metrics.totalPermissions}</Text>
          <Text style={styles.kpiSub}>Across 8 functional modules</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Current Persona Grants</Text>
          <Text style={styles.kpiValue}>{user?.permissions.length || 0}</Text>
          <Text style={styles.kpiSub}>{user?.roleTitle || 'Active Role'}</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Security Audit Events</Text>
          <Text style={styles.kpiValue}>{metrics.auditEventsCount}</Text>
          <Text style={styles.kpiSub}>Privilege logs recorded</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setActiveTab('catalog')}
          style={[styles.tabButton, activeTab === 'catalog' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'catalog' && styles.tabTextActive]}>
            🛡️ Roles Catalog ({roles.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('matrix')}
          style={[styles.tabButton, activeTab === 'matrix' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'matrix' && styles.tabTextActive]}>
            📊 Permissions Matrix
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('assignments')}
          style={[styles.tabButton, activeTab === 'assignments' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'assignments' && styles.tabTextActive]}>
            👥 User Role Governance
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('audit')}
          style={[styles.tabButton, activeTab === 'audit' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'audit' && styles.tabTextActive]}>
            📜 Security Audit Log ({auditLogs.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('simulator')}
          style={[styles.tabButton, activeTab === 'simulator' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'simulator' && styles.tabTextActive]}>
            🔍 Privilege Simulator
          </Text>
        </Pressable>
      </View>

      {/* ========================================================================= */}
      {/* TAB 1: ROLES CATALOG */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <View style={styles.tabContent}>
          {/* Filters Card */}
          <Card style={styles.filtersCard}>
            <View style={styles.searchRow}>
              <View style={styles.searchInputContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  placeholder="Search roles by title, description or permission..."
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

            {/* Category Filter Pills */}
            <View style={styles.filterPillsRow}>
              <Text style={styles.filterLabel}>Role Category:</Text>
              {(
                [
                  { id: 'all', label: 'All Categories' },
                  { id: 'committee', label: 'Committee (RWA)' },
                  { id: 'resident', label: 'Residents (Owners & Tenants)' },
                  { id: 'staff', label: 'Facility Staff' },
                  { id: 'custom', label: 'Custom Society Roles' },
                ] as const
              ).map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => setCategoryFilter(f.id)}
                  style={[styles.filterChip, categoryFilter === f.id && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, categoryFilter === f.id && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Executive Quick Roles Bar for Admin/President */}
          {isAdminOrPresident && (
            <Card style={styles.quickRolesCard}>
              <View style={styles.quickRolesHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
                    <Text style={styles.quickRolesTitle}>👑 President & Executive Governance Controls</Text>
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>Super Admin / President Desk</Text>
                    </View>
                  </View>
                  <Text style={styles.quickRolesSubtitle}>
                    Modify, grant, or revoke permissions for Vice President (VC), Treasurer, and custom privileges for all society members in real-time.
                  </Text>
                </View>
              </View>

              {/* VC & Treasurer Direct Executive Action Cards */}
              <View style={[styles.execCardsGrid, isMobile && { flexDirection: 'column' }]}>
                {/* Vice President (VC) Card */}
                {(() => {
                  const vcRole = roles.find((r) => r.id === 'role-vice-president');
                  const vcUser = MOCK_USERS.find((u) => u.roleId === 'role-vice-president');
                  if (!vcRole) return null;
                  return (
                    <View style={styles.execCard}>
                      <View style={styles.execCardTop}>
                        <View style={[styles.execIconCircle, { backgroundColor: '#f3e8ff' }]}>
                          <Text style={{ fontSize: 24 }}>⚡</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                            <Text style={styles.execRoleTitle}>Vice President (VC)</Text>
                            <View style={styles.execTagPill}>
                              <Text style={styles.execTagPillText}>Operations & Civil</Text>
                            </View>
                          </View>
                          <Text style={styles.execHolderText}>
                            Incumbent: <Text style={{ fontWeight: 'bold' }}>{vcUser?.name || 'Meera Joshi'}</Text> (Flat {vcUser?.flatNumber || 'D-302'})
                          </Text>
                          <Text style={styles.execPermCount}>
                            {vcRole.permissions.length} capabilities active
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.execQuickLabel}>Quick Toggle Key Capabilities:</Text>
                      <View style={styles.execTogglesRow}>
                        {[
                          { id: PERMISSIONS.HALL_APPROVE, label: 'Hall Approvals' },
                          { id: PERMISSIONS.COMPLAINT_RESOLVE, label: 'Resolve Complaints' },
                          { id: PERMISSIONS.NOTIFICATION_BROADCAST, label: 'Broadcast Notices' },
                          { id: PERMISSIONS.MAINTENANCE_MANAGE, label: 'Manage Maintenance' },
                        ].map((item) => {
                          const isGranted = vcRole.permissions.includes(item.id);
                          return (
                            <Pressable
                              key={item.id}
                              onPress={() => handleQuickToggleMatrix(vcRole.id, item.id)}
                              style={[
                                styles.execToggleChip,
                                isGranted && styles.execToggleChipActive,
                              ]}
                            >
                              <Text style={[styles.execToggleText, isGranted && styles.execToggleTextActive]}>
                                {isGranted ? '✓' : '+'} {item.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      <Button
                        title="✏️ Modify VC Permissions (Full Matrix)"
                        variant="primary"
                        size="sm"
                        onPress={() => handleOpenEditRole(vcRole)}
                        style={{ marginTop: spacing.sm }}
                      />
                    </View>
                  );
                })()}

                {/* Treasurer Card */}
                {(() => {
                  const trRole = roles.find((r) => r.id === 'role-treasurer');
                  const trUser = MOCK_USERS.find((u) => u.roleId === 'role-treasurer');
                  if (!trRole) return null;
                  return (
                    <View style={styles.execCard}>
                      <View style={styles.execCardTop}>
                        <View style={[styles.execIconCircle, { backgroundColor: '#dcfce7' }]}>
                          <Text style={{ fontSize: 24 }}>💰</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                            <Text style={styles.execRoleTitle}>Treasurer (Accounts & Billing)</Text>
                            <View style={[styles.execTagPill, { backgroundColor: '#dcfce7' }]}>
                              <Text style={[styles.execTagPillText, { color: '#15803d' }]}>Finance & Budget</Text>
                            </View>
                          </View>
                          <Text style={styles.execHolderText}>
                            Incumbent: <Text style={{ fontWeight: 'bold' }}>{trUser?.name || 'Amit Saxena'}</Text> (Flat {trUser?.flatNumber || 'B-104'})
                          </Text>
                          <Text style={styles.execPermCount}>
                            {trRole.permissions.length} capabilities active
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.execQuickLabel}>Quick Toggle Key Financial Powers:</Text>
                      <View style={styles.execTogglesRow}>
                        {[
                          { id: PERMISSIONS.EXPENSES_MANAGE, label: 'Manage Expenses' },
                          { id: PERMISSIONS.REIMBURSEMENT_APPROVE, label: 'Approve Reimbursements' },
                          { id: PERMISSIONS.WATER_MANAGE_SLABS, label: 'Water Slabs' },
                          { id: PERMISSIONS.MAINTENANCE_MANAGE, label: 'Maintenance Bills' },
                        ].map((item) => {
                          const isGranted = trRole.permissions.includes(item.id);
                          return (
                            <Pressable
                              key={item.id}
                              onPress={() => handleQuickToggleMatrix(trRole.id, item.id)}
                              style={[
                                styles.execToggleChip,
                                isGranted && styles.execToggleChipActive,
                              ]}
                            >
                              <Text style={[styles.execToggleText, isGranted && styles.execToggleTextActive]}>
                                {isGranted ? '✓' : '+'} {item.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      <Button
                        title="✏️ Modify Treasurer Permissions (Full Matrix)"
                        variant="primary"
                        size="sm"
                        onPress={() => handleOpenEditRole(trRole)}
                        style={{ marginTop: spacing.sm }}
                      />
                    </View>
                  );
                })()}
              </View>

              {/* Secretary, Joint Sec, Owner & Tenant Quick Bar */}
              <Text style={[styles.execQuickLabel, { marginTop: spacing.md }]}>
                Modify Other Society Roles & Designations:
              </Text>
              <View style={styles.quickRolesRow}>
                {roles
                  .filter((r) =>
                    ['role-secretary', 'role-joint-secretary', 'role-owner', 'role-tenant'].includes(r.id)
                  )
                  .map((r) => (
                    <Pressable
                      key={r.id}
                      style={styles.quickRoleChip}
                      onPress={() => handleOpenEditRole(r)}
                    >
                      <Text style={styles.quickRoleIcon}>{r.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.quickRoleName}>{r.name.split(' (')[0]}</Text>
                        <Text style={styles.quickRolePerms}>{r.permissions.length} capabilities</Text>
                      </View>
                      <Text style={styles.quickRoleEditIcon}>✏️ Edit</Text>
                    </Pressable>
                  ))}
              </View>

              {/* Direct Individual Member Privileges Quick Customizer */}
              <View style={styles.quickMemberBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickMemberTitle}>👤 Customize Individual Member Privileges Directly:</Text>
                  <Text style={styles.quickMemberSubtitle}>
                    Grant special administrative or operational overrides to any specific resident without altering default roles.
                  </Text>
                </View>
                <View style={[styles.quickMemberPickerRow, isMobile && { flexDirection: 'column', alignItems: 'stretch' }]}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: isMobile ? 320 : 540 }}>
                    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                      {members.slice(0, 8).map((m) => (
                        <Pressable
                          key={m.id}
                          onPress={() => handleOpenEditMember(m)}
                          style={styles.quickMemberChip}
                        >
                          <Text style={styles.quickMemberChipName}>{m.name.split(' ')[0]}</Text>
                          <Text style={styles.quickMemberChipFlat}>{m.flatNumber}</Text>
                          <Text style={styles.quickMemberChipEdit}>⚡ Edit</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                  <Button
                    title="View All Members in Governance Tab 👥"
                    variant="outline"
                    size="sm"
                    onPress={() => setActiveTab('assignments')}
                  />
                </View>
              </View>
            </Card>
          )}

          {/* Roles Grid */}
          <View style={styles.rolesGrid}>
            {filteredRoles.map((role) => (
              <Card key={role.id} style={styles.roleCard}>
                <View style={styles.roleCardHeader}>
                  <View style={[styles.roleIconCircle, { backgroundColor: role.color + '20' }]}>
                    <Text style={styles.roleIconEmoji}>{role.icon}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.roleTitleRow}>
                      <Text style={styles.roleTitle}>{role.name}</Text>
                      {role.isSystemRole ? (
                        <StatusBadge status="info" label="Core System" />
                      ) : (
                        <StatusBadge status="warning" label="Custom Role" />
                      )}
                    </View>
                    <Text style={styles.roleCategoryTag}>
                      Category: {role.category.toUpperCase()} • Priority Order #{role.priorityOrder}
                    </Text>
                  </View>
                </View>

                <Text style={styles.roleDescription}>{role.description}</Text>

                {/* Capabilities Summary */}
                <View style={styles.roleCapabilitiesBox}>
                  <View style={styles.roleCapHeaderRow}>
                    <Text style={styles.roleCapTitle}>
                      Granted Capabilities ({role.permissions.length}):
                    </Text>
                    <Text style={styles.roleCapPercent}>
                      {Math.round((role.permissions.length / ALL_PERMISSION_DEFINITIONS.length) * 100)}% Coverage
                    </Text>
                  </View>

                  <View style={styles.rolePermTagsWrap}>
                    {role.permissions.slice(0, 7).map((p) => {
                      const def = ALL_PERMISSION_DEFINITIONS.find((item) => item.id === p);
                      return (
                        <View key={p} style={styles.rolePermTag}>
                          <Text style={styles.rolePermTagText}>✓ {def?.name || p}</Text>
                        </View>
                      );
                    })}
                    {role.permissions.length > 7 && (
                      <View style={styles.rolePermTagMore}>
                        <Text style={styles.rolePermTagMoreText}>
                          +{role.permissions.length - 7} more
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Card Actions */}
                <View style={styles.roleCardActions}>
                  {isAdminOrPresident && (
                    <Button
                      title="✏️ Edit Permissions"
                      variant="primary"
                      size="sm"
                      onPress={() => handleOpenEditRole(role)}
                    />
                  )}
                  <Button
                    title="Inspect Capabilities"
                    variant="outline"
                    size="sm"
                    onPress={() => setSelectedRoleForDetail(role)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Clone Role"
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      setFormName(`${role.name} (Copy)`);
                      setFormDesc(`Custom copy of ${role.name}.`);
                      setFormCategory('custom');
                      setFormIcon(role.icon);
                      setFormColor(role.color);
                      setFormPermissions([...role.permissions]);
                      setShowCreateModal(true);
                      showToast(`Cloned permissions from ${role.name} into form!`);
                    }}
                  />
                  {!role.isSystemRole && canManage && (
                    <Button
                      title="Delete"
                      variant="danger"
                      size="sm"
                      onPress={() => handleDeleteCustomRole(role.id, role.name)}
                    />
                  )}
                </View>
              </Card>
            ))}
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FULL PERMISSIONS MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <View style={styles.tabContent}>
          <Card style={styles.matrixContainerCard}>
            <View style={styles.matrixHeaderRow}>
              <View>
                <Text style={styles.matrixTitle}>📊 Comprehensive Role-to-Permission Matrix</Text>
                <Text style={styles.matrixSubtitle}>
                  Inspect all 24 granular capabilities across each defined society role.
                </Text>
              </View>

              {/* Module Filter */}
              <View style={styles.filterPillsRow}>
                <Text style={styles.filterLabel}>Module:</Text>
                {(
                  [
                    { id: 'all', label: 'All Modules' },
                    { id: 'maintenance', label: 'Maintenance' },
                    { id: 'water', label: 'Water' },
                    { id: 'expenses', label: 'Expenses' },
                    { id: 'hall', label: 'Hall' },
                    { id: 'complaints', label: 'Complaints' },
                    { id: 'notifications', label: 'Broadcast' },
                    { id: 'members', label: 'Members' },
                    { id: 'roles_security', label: 'Roles & Security' },
                  ] as const
                ).map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => setMatrixModuleFilter(m.id)}
                    style={[styles.filterChip, matrixModuleFilter === m.id && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, matrixModuleFilter === m.id && styles.filterChipTextActive]}>
                      {m.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Matrix Table */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.matrixScroll}>
              <View style={styles.matrixTable}>
                {/* Table Header */}
                <View style={styles.matrixHeaderTr}>
                  <View style={styles.matrixThCapability}>
                    <Text style={styles.matrixThText}>Capability / Permission</Text>
                  </View>
                  {roles.map((r) => (
                    <View key={r.id} style={styles.matrixThRole}>
                      <Text style={styles.matrixThRoleIcon}>{r.icon}</Text>
                      <Text style={styles.matrixThRoleTitle} numberOfLines={2}>
                        {r.name}
                      </Text>
                      {isAdminOrPresident && (
                        <Pressable
                          style={styles.matrixThEditBtn}
                          onPress={() => handleOpenEditRole(r)}
                        >
                          <Text style={styles.matrixThEditText}>✏️ Edit</Text>
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>

                {/* Rows Grouped by Module */}
                {(
                  Object.keys(permsByModule) as PermissionModule[]
                )
                  .filter((mod) => matrixModuleFilter === 'all' || matrixModuleFilter === mod)
                  .map((modKey) => {
                    const modulePerms = permsByModule[modKey];
                    if (modulePerms.length === 0) return null;

                    return (
                      <View key={modKey}>
                        {/* Module Sub-Header */}
                        <View style={styles.matrixModuleTr}>
                          <Text style={styles.matrixModuleTrText}>
                            📁 {modulePerms[0].moduleLabel.toUpperCase()} ({modulePerms.length})
                          </Text>
                        </View>

                        {/* Each Permission Row */}
                        {modulePerms.map((perm, idx) => (
                          <View
                            key={perm.id}
                            style={[styles.matrixTr, idx % 2 === 1 && styles.matrixTrAlt]}
                          >
                            <View style={styles.matrixTdCapability}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Text style={styles.matrixTdPermName}>{perm.name}</Text>
                                {perm.isSensitive && (
                                  <View style={styles.sensitivePill}>
                                    <Text style={styles.sensitivePillText}>🔒 Sensitive</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.matrixTdPermDesc}>{perm.description}</Text>
                              <Text style={styles.matrixTdPermCode}>{perm.id}</Text>
                            </View>

                            {roles.map((r) => {
                              const hasPerm = r.permissions.includes(perm.id);
                              return (
                                <Pressable
                                  key={r.id}
                                  style={[
                                    styles.matrixTdRole,
                                    isAdminOrPresident && styles.matrixTdRoleClickable,
                                  ]}
                                  onPress={
                                    isAdminOrPresident
                                      ? () => handleQuickToggleMatrix(r.id, perm.id)
                                      : undefined
                                  }
                                >
                                  {hasPerm ? (
                                    <View style={styles.matrixGrantedBadge}>
                                      <Text style={styles.matrixGrantedText}>✓</Text>
                                    </View>
                                  ) : (
                                    <Text style={styles.matrixDeniedText}>—</Text>
                                  )}
                                </Pressable>
                              );
                            })}
                          </View>
                        ))}
                      </View>
                    );
                  })}
              </View>
            </ScrollView>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: USER ROLE ASSIGNMENTS & GOVERNANCE */}
      {/* ========================================================================= */}
      {activeTab === 'assignments' && (
        <View style={styles.tabContent}>
          <Card style={styles.assignmentsCard}>
            <View style={styles.assignmentsHeader}>
              <View>
                <Text style={styles.assignmentsTitle}>👥 Resident & Staff Role Assignments</Text>
                <Text style={styles.assignmentsSubtitle}>
                  Designate committee portfolios, grant administrative privileges, or customize individual member capabilities.
                </Text>
              </View>
            </View>

            <View style={styles.userList}>
              {members.map((member) => {
                const assignedRole =
                  roles.find((r) => r.name.toLowerCase().includes(member.residentType)) ||
                  (member.isCommitteeMember
                    ? roles.find((r) => r.id === 'role-president') || roles[0]
                    : roles.find((r) => r.id === 'role-owner') || roles[0]);

                return (
                  <View key={member.id} style={styles.userAssignRow}>
                    <View style={styles.userAvatarCircle}>
                      <Text style={styles.userAvatarInitial}>{member.name.charAt(0)}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <Text style={styles.userAssignName}>{member.name}</Text>
                        <Text style={styles.userAssignFlat}>
                          • {member.block} Flat {member.flatNumber}
                        </Text>
                      </View>
                      <Text style={styles.userAssignEmail}>
                        {member.email} • Intercom: {member.intercomNumber}
                      </Text>
                    </View>

                    <View style={styles.userCurrentRoleBadge}>
                      <Text style={styles.userCurrentRoleText}>
                        {member.committeeRoleTitle || (member.residentType === 'tenant' ? 'Tenant' : 'Resident Owner')}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                      {isAdminOrPresident && (
                        <Button
                          title="⚡ Privileges"
                          variant="primary"
                          size="sm"
                          onPress={() => handleOpenEditMember(member)}
                        />
                      )}
                      <Button
                        title="Reassign Role"
                        variant="outline"
                        size="sm"
                        onPress={() => {
                          setSelectedUserForAssign(member);
                          setAssignTargetRoleId(roles[0].id);
                          setAssignNotes('');
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SECURITY AUDIT LOG */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <View style={styles.tabContent}>
          <Card style={styles.auditCard}>
            <View style={styles.auditHeaderRow}>
              <View>
                <Text style={styles.auditTitle}>📜 Security & Privilege Audit Trail</Text>
                <Text style={styles.auditSubtitle}>
                  Immutable audit records of role assignments, permission mutations, and custom role creation.
                </Text>
              </View>
              <StatusBadge status="success" label="Tamper-Evident Ledger" />
            </View>

            <View style={styles.auditTimeline}>
              {auditLogs.map((log) => {
                const actionBadgeStatus =
                  log.action === 'role_assigned'
                    ? ('info' as const)
                    : log.action === 'role_created'
                    ? ('success' as const)
                    : log.action === 'permissions_updated'
                    ? ('warning' as const)
                    : ('danger' as const);

                return (
                  <View key={log.id} style={styles.auditItem}>
                    <View style={styles.auditTimeCol}>
                      <Text style={styles.auditTimestamp}>{log.timestamp}</Text>
                      <StatusBadge status={actionBadgeStatus} label={log.action.replace('_', ' ').toUpperCase()} />
                    </View>

                    <View style={styles.auditContentCol}>
                      <Text style={styles.auditActor}>Executed By: {log.performedBy}</Text>
                      <Text style={styles.auditTarget}>
                        Target Subject: <Text style={{ fontWeight: '700' }}>{log.targetUserName}</Text> ({log.targetUserFlat})
                      </Text>
                      {log.notes && <Text style={styles.auditNotes}>"{log.notes}"</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PRIVILEGE SIMULATOR / SANDBOX */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <View style={styles.tabContent}>
          <Card style={styles.simCard}>
            <Text style={styles.simTitle}>🔍 Live Privilege Verification Sandbox</Text>
            <Text style={styles.simSubtitle}>
              Test how ApniSociety's RBAC engine evaluates real-time permissions for any resident persona.
            </Text>

            <View style={styles.simSelectorBox}>
              {/* Select User Persona */}
              <View style={{ flex: 1, minWidth: 260 }}>
                <Text style={styles.formFieldLabel}>1. Select Resident Persona to Test:</Text>
                <View style={styles.personaChoicesWrap}>
                  {MOCK_USERS.map((u) => (
                    <Pressable
                      key={u.id}
                      onPress={() => setSimUserId(u.id)}
                      style={[styles.personaChoiceBtn, simUserId === u.id && styles.personaChoiceBtnActive]}
                    >
                      <Text style={[styles.personaChoiceText, simUserId === u.id && styles.personaChoiceTextActive]}>
                        {u.name} ({u.roleTitle.split(' ')[0]})
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Select Target Action */}
              <View style={{ flex: 1, minWidth: 260 }}>
                <Text style={styles.formFieldLabel}>2. Select Target Action / Permission to Check:</Text>
                <View style={styles.permChoicesWrap}>
                  {[
                    PERMISSIONS.MAINTENANCE_MANAGE,
                    PERMISSIONS.REIMBURSEMENT_APPROVE,
                    PERMISSIONS.NOTIFICATION_BROADCAST,
                    PERMISSIONS.ROLES_MANAGE,
                    PERMISSIONS.COMPLAINT_RESOLVE,
                    PERMISSIONS.HALL_BOOK,
                    PERMISSIONS.WATER_RECORD_METER,
                    PERMISSIONS.MEMBERS_MANAGE,
                  ].map((p) => {
                    const def = ALL_PERMISSION_DEFINITIONS.find((item) => item.id === p);
                    return (
                      <Pressable
                        key={p}
                        onPress={() => setSimPermissionId(p)}
                        style={[styles.permChoiceBtn, simPermissionId === p && styles.permChoiceBtnActive]}
                      >
                        <Text style={[styles.permChoiceText, simPermissionId === p && styles.permChoiceTextActive]}>
                          {def?.name || p}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Evaluation Result Card */}
            <View
              style={[
                styles.simResultCard,
                simHasPerm ? styles.simResultCardAllowed : styles.simResultCardDenied,
              ]}
            >
              <View style={styles.simResultHeader}>
                <Text style={styles.simResultEmoji}>{simHasPerm ? '✅' : '🚫'}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.simResultStatus,
                      simHasPerm ? { color: colors.success.text } : { color: colors.danger.text },
                    ]}
                  >
                    {simHasPerm ? 'ACCESS GRANTED' : 'ACCESS DENIED (403 FORBIDDEN)'}
                  </Text>
                  <Text style={styles.simResultDetail}>
                    Persona <Text style={{ fontWeight: 'bold' }}>{simUser.name}</Text> ({simUser.roleTitle}){' '}
                    {simHasPerm ? 'is authorized to' : 'is restricted from'}{' '}
                    <Text style={{ fontWeight: 'bold' }}>"{simPermDef?.name}"</Text>.
                  </Text>
                </View>
              </View>

              <View style={styles.simResultExplainer}>
                <Text style={styles.simExplainerText}>
                  {simHasPerm
                    ? `Grant Source: Explicitly granted via permission '${simPermissionId}' in Role [${simUser.roleTitle}].`
                    : `Restriction Reason: Persona does not possess capability '${simPermissionId}'. Requires Management Committee / Admin elevation.`}
                </Text>
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT CUSTOM ROLE */}
      {/* ========================================================================= */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Create Custom Society Role</Text>
                <Text style={styles.modalSubtitle}>Configure granular capability grants across modules</Text>
              </View>
              <Pressable onPress={() => setShowCreateModal(false)} style={styles.closeModalBtn}>
                <Text style={styles.closeModalText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {formError.length > 0 && (
                <View style={styles.formErrorBox}>
                  <Text style={styles.formErrorText}>⚠️ {formError}</Text>
                </View>
              )}

              <Text style={styles.formFieldLabel}>Role Title *</Text>
              <TextInput
                placeholder="e.g. Green Energy & Solar Auditor"
                placeholderTextColor={colors.text.muted}
                value={formName}
                onChangeText={setFormName}
                style={styles.modalInput}
              />

              <Text style={styles.formFieldLabel}>Description & Mandate *</Text>
              <TextInput
                placeholder="Describe role responsibilities and governance mandate..."
                placeholderTextColor={colors.text.muted}
                value={formDesc}
                onChangeText={setFormDesc}
                multiline
                numberOfLines={3}
                style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
              />

              {/* Icon & Category Row */}
              <View style={styles.formTwoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formFieldLabel}>Badge Icon</Text>
                  <View style={styles.iconChoicesRow}>
                    {['🛡️', '🌿', '⚡', '🏛️', '🔧', '📋', '🚨', '🧹'].map((ic) => (
                      <Pressable
                        key={ic}
                        onPress={() => setFormIcon(ic)}
                        style={[styles.iconChoiceBtn, formIcon === ic && styles.iconChoiceBtnActive]}
                      >
                        <Text style={{ fontSize: 18 }}>{ic}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.formFieldLabel}>Category</Text>
                  <View style={styles.typeSelectorRow}>
                    {(['committee', 'resident', 'custom'] as RoleCategory[]).map((cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => setFormCategory(cat)}
                        style={[styles.typeSelectBtn, formCategory === cat && styles.typeSelectBtnActive]}
                      >
                        <Text style={[styles.typeSelectBtnText, formCategory === cat && styles.typeSelectBtnTextActive]}>
                          {cat}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              {/* Permissions Selector by Module */}
              <Text style={styles.formSectionSubHeader}>
                Grant Capabilities ({formPermissions.length} selected)
              </Text>

              {(Object.keys(permsByModule) as PermissionModule[]).map((modKey) => {
                const modulePerms = permsByModule[modKey];
                const allSelected = modulePerms.every((p) => formPermissions.includes(p.id));

                return (
                  <View key={modKey} style={styles.modulePermGroup}>
                    <View style={styles.modulePermGroupHeader}>
                      <Text style={styles.modulePermGroupName}>{modulePerms[0].moduleLabel}</Text>
                      <Pressable onPress={() => handleToggleModuleInForm(modKey)}>
                        <Text style={styles.toggleModuleAllText}>
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </Text>
                      </Pressable>
                    </View>

                    <View style={styles.modulePermItemsList}>
                      {modulePerms.map((perm) => {
                        const isSelected = formPermissions.includes(perm.id);
                        return (
                          <Pressable
                            key={perm.id}
                            onPress={() => handleTogglePermissionInForm(perm.id)}
                            style={[styles.permCheckboxRow, isSelected && styles.permCheckboxRowActive]}
                          >
                            <View style={[styles.checkboxSquare, isSelected && styles.checkboxSquareActive]}>
                              {isSelected && <Text style={styles.checkboxCheck}>✓</Text>}
                            </View>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Text style={styles.permCheckboxTitle}>{perm.name}</Text>
                                {perm.isSensitive && (
                                  <Text style={styles.permSensitiveBadge}>🔒 Sensitive</Text>
                                )}
                              </View>
                              <Text style={styles.permCheckboxDesc}>{perm.description}</Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setShowCreateModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save & Enforce Role ✅"
                variant="primary"
                size="md"
                onPress={handleSaveRole}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: ROLE DOSSIER DETAIL */}
      {/* ========================================================================= */}
      <Modal visible={Boolean(selectedRoleForDetail)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedRoleForDetail && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Text style={{ fontSize: 28 }}>{selectedRoleForDetail.icon}</Text>
                    <View>
                      <Text style={styles.modalTitle}>{selectedRoleForDetail.name}</Text>
                      <Text style={styles.modalSubtitle}>
                        Priority Level #{selectedRoleForDetail.priorityOrder} • Category: {selectedRoleForDetail.category}
                      </Text>
                    </View>
                  </View>
                  <Pressable onPress={() => setSelectedRoleForDetail(null)} style={styles.closeModalBtn}>
                    <Text style={styles.closeModalText}>✕</Text>
                  </Pressable>
                </View>

                <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                  <Text style={styles.roleDetailDesc}>{selectedRoleForDetail.description}</Text>

                  <Text style={styles.formSectionSubHeader}>
                    Explicitly Authorized Capabilities ({selectedRoleForDetail.permissions.length}):
                  </Text>

                  <View style={styles.roleDetailPermList}>
                    {selectedRoleForDetail.permissions.map((p) => {
                      const def = ALL_PERMISSION_DEFINITIONS.find((item) => item.id === p);
                      return (
                        <View key={p} style={styles.roleDetailPermItem}>
                          <Text style={styles.roleDetailPermIcon}>✓</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.roleDetailPermName}>{def?.name || p}</Text>
                            <Text style={styles.roleDetailPermDesc}>{def?.description}</Text>
                            <Text style={styles.roleDetailPermCode}>{p} • {def?.moduleLabel}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Button
                    title="Close"
                    variant="outline"
                    size="md"
                    onPress={() => setSelectedRoleForDetail(null)}
                    style={{ flex: 1 }}
                  />
                  {isAdminOrPresident && (
                    <Button
                      title="✏️ Modify Permissions"
                      variant="primary"
                      size="md"
                      onPress={() => {
                        const r = selectedRoleForDetail;
                        setSelectedRoleForDetail(null);
                        handleOpenEditRole(r);
                      }}
                      style={{ flex: 1 }}
                    />
                  )}
                  {!selectedRoleForDetail.isSystemRole && canManage && (
                    <Button
                      title="Delete Custom Role"
                      variant="danger"
                      size="md"
                      onPress={() => handleDeleteCustomRole(selectedRoleForDetail.id, selectedRoleForDetail.name)}
                    />
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: ASSIGN USER ROLE MODAL */}
      {/* ========================================================================= */}
      <Modal visible={Boolean(selectedUserForAssign)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedUserForAssign && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Reassign Role</Text>
                    <Text style={styles.modalSubtitle}>
                      Assign security designation for {selectedUserForAssign.name} ({selectedUserForAssign.flatNumber})
                    </Text>
                  </View>
                  <Pressable onPress={() => setSelectedUserForAssign(null)} style={styles.closeModalBtn}>
                    <Text style={styles.closeModalText}>✕</Text>
                  </Pressable>
                </View>

                <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                  <Text style={styles.formFieldLabel}>Select New Role:</Text>
                  <View style={styles.roleAssignChoicesList}>
                    {roles.map((r) => (
                      <Pressable
                        key={r.id}
                        onPress={() => setAssignTargetRoleId(r.id)}
                        style={[
                          styles.roleAssignChoiceItem,
                          assignTargetRoleId === r.id && styles.roleAssignChoiceItemActive,
                        ]}
                      >
                        <Text style={{ fontSize: 20 }}>{r.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.roleAssignChoiceTitle}>{r.name}</Text>
                          <Text style={styles.roleAssignChoiceSub}>
                            {r.permissions.length} capabilities • Category: {r.category}
                          </Text>
                        </View>
                        {assignTargetRoleId === r.id && (
                          <Text style={styles.roleAssignChoiceChecked}>✓</Text>
                        )}
                      </Pressable>
                    ))}
                  </View>

                  <Text style={[styles.formFieldLabel, { marginTop: spacing.md }]}>Audit Reason / Notes:</Text>
                  <TextInput
                    placeholder="e.g. Elected in annual general meeting (AGM 2026)"
                    placeholderTextColor={colors.text.muted}
                    value={assignNotes}
                    onChangeText={setAssignNotes}
                    style={styles.modalInput}
                  />
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    size="md"
                    onPress={() => setSelectedUserForAssign(null)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Confirm Assignment ✅"
                    variant="primary"
                    size="md"
                    onPress={handleExecuteRoleAssignment}
                    style={{ flex: 1 }}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: PERSONA SWITCHER (App Owner Only) */}
      {/* ========================================================================= */}
      <Modal visible={Boolean(user?.isAppOwner && showPersonaModal)} transparent animationType="fade">
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

      {/* ========================================================================= */}
      {/* MODAL 5: EDIT ROLE PERMISSIONS (VC, Treasurer, Owners, Tenants, etc.)   */}
      {/* ========================================================================= */}
      <Modal visible={Boolean(editingRole)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {editingRole && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Text style={{ fontSize: 26 }}>{editingRole.icon}</Text>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <Text style={styles.modalTitle}>Modify Role Permissions</Text>
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>President / Admin</Text>
                        </View>
                      </View>
                      <Text style={styles.modalSubtitle}>
                        Role: <Text style={{ fontWeight: 'bold' }}>{editingRole.name}</Text> • {editRolePermissions.length} of {ALL_PERMISSION_DEFINITIONS.length} capabilities enabled
                      </Text>
                    </View>
                  </View>
                  <Pressable onPress={() => setEditingRole(null)} style={styles.closeModalBtn}>
                    <Text style={styles.closeModalText}>✕</Text>
                  </Pressable>
                </View>

                <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                  {editRoleError.length > 0 && (
                    <View style={styles.formErrorBox}>
                      <Text style={styles.formErrorText}>⚠️ {editRoleError}</Text>
                    </View>
                  )}

                  <View style={styles.editRoleNotice}>
                    <Text style={styles.editRoleNoticeText}>
                      💡 Changes made here are saved to the society RBAC directory and immediately applied to all users holding the <Text style={{ fontWeight: 'bold' }}>{editingRole.name}</Text> portfolio (including VC Meera Joshi, Treasurer Amit Saxena, and relevant residents).
                    </Text>
                  </View>

                  <Text style={styles.formFieldLabel}>Governance Description</Text>
                  <TextInput
                    value={editRoleDesc}
                    onChangeText={setEditRoleDesc}
                    multiline
                    numberOfLines={2}
                    style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]}
                    placeholder="Role responsibilities..."
                    placeholderTextColor={colors.text.muted}
                  />

                  {/* Modules Accordion / List */}
                  <Text style={styles.formSectionSubHeader}>
                    Configured Capabilities ({editRolePermissions.length} active)
                  </Text>

                  {(Object.keys(permsByModule) as PermissionModule[]).map((modKey) => {
                    const modulePerms = permsByModule[modKey];
                    const allSelected = modulePerms.every((p) => editRolePermissions.includes(p.id));

                    return (
                      <View key={modKey} style={styles.modulePermGroup}>
                        <View style={styles.modulePermGroupHeader}>
                          <Text style={styles.modulePermGroupName}>
                            {modulePerms[0].moduleLabel} ({modulePerms.filter((p) => editRolePermissions.includes(p.id)).length}/{modulePerms.length})
                          </Text>
                          <Pressable onPress={() => handleToggleEditRoleModule(modKey)}>
                            <Text style={styles.toggleModuleAllText}>
                              {allSelected ? 'Deselect All' : 'Select All'}
                            </Text>
                          </Pressable>
                        </View>

                        <View style={styles.modulePermItemsList}>
                          {modulePerms.map((perm) => {
                            const isSelected = editRolePermissions.includes(perm.id);
                            return (
                              <Pressable
                                key={perm.id}
                                onPress={() => handleToggleEditRolePermission(perm.id)}
                                style={[styles.permCheckboxRow, isSelected && styles.permCheckboxRowActive]}
                              >
                                <View style={[styles.checkboxSquare, isSelected && styles.checkboxSquareActive]}>
                                  {isSelected && <Text style={styles.checkboxCheck}>✓</Text>}
                                </View>
                                <View style={{ flex: 1 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Text style={styles.permCheckboxTitle}>{perm.name}</Text>
                                    {perm.isSensitive && (
                                      <Text style={styles.permSensitiveBadge}>🔒 Sensitive</Text>
                                    )}
                                  </View>
                                  <Text style={styles.permCheckboxDesc}>{perm.description}</Text>
                                </View>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    size="md"
                    onPress={() => setEditingRole(null)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Save & Enforce Permissions ✅"
                    variant="primary"
                    size="md"
                    onPress={handleSaveEditRole}
                    style={{ flex: 1 }}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: CUSTOM MEMBER PERMISSIONS OVERRIDE                              */}
      {/* ========================================================================= */}
      <Modal visible={Boolean(editingMember)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {editingMember && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <View style={styles.userAvatarCircle}>
                      <Text style={styles.userAvatarInitial}>{editingMember.name.charAt(0)}</Text>
                    </View>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <Text style={styles.modalTitle}>{editingMember.name}</Text>
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>Member Override</Text>
                        </View>
                      </View>
                      <Text style={styles.modalSubtitle}>
                        {editingMember.block} Flat {editingMember.flatNumber} • {editingMember.committeeRoleTitle || (editingMember.residentType === 'tenant' ? 'Tenant' : 'Resident Owner')}
                      </Text>
                    </View>
                  </View>
                  <Pressable onPress={() => setEditingMember(null)} style={styles.closeModalBtn}>
                    <Text style={styles.closeModalText}>✕</Text>
                  </Pressable>
                </View>

                <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                  <View style={styles.editRoleNotice}>
                    <Text style={styles.editRoleNoticeText}>
                      👤 Grant or restrict individual capabilities for <Text style={{ fontWeight: 'bold' }}>{editingMember.name}</Text> without altering the base role template.
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                    <Text style={styles.formSectionSubHeader}>
                      Active Privileges ({editMemberPermissions.length} enabled)
                    </Text>
                    <Pressable onPress={handleResetMemberToRoleDefaults}>
                      <Text style={{ fontSize: typography.sizes.xs, color: colors.primary[600], fontWeight: 'bold' }}>
                        ↺ Reset to Role Defaults
                      </Text>
                    </Pressable>
                  </View>

                  {(Object.keys(permsByModule) as PermissionModule[]).map((modKey) => {
                    const modulePerms = permsByModule[modKey];
                    const allSelected = modulePerms.every((p) => editMemberPermissions.includes(p.id));

                    return (
                      <View key={modKey} style={styles.modulePermGroup}>
                        <View style={styles.modulePermGroupHeader}>
                          <Text style={styles.modulePermGroupName}>
                            {modulePerms[0].moduleLabel} ({modulePerms.filter((p) => editMemberPermissions.includes(p.id)).length}/{modulePerms.length})
                          </Text>
                          <Pressable onPress={() => handleToggleEditMemberModule(modKey)}>
                            <Text style={styles.toggleModuleAllText}>
                              {allSelected ? 'Deselect All' : 'Select All'}
                            </Text>
                          </Pressable>
                        </View>

                        <View style={styles.modulePermItemsList}>
                          {modulePerms.map((perm) => {
                            const isSelected = editMemberPermissions.includes(perm.id);
                            return (
                              <Pressable
                                key={perm.id}
                                onPress={() => handleToggleEditMemberPermission(perm.id)}
                                style={[styles.permCheckboxRow, isSelected && styles.permCheckboxRowActive]}
                              >
                                <View style={[styles.checkboxSquare, isSelected && styles.checkboxSquareActive]}>
                                  {isSelected && <Text style={styles.checkboxCheck}>✓</Text>}
                                </View>
                                <View style={{ flex: 1 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Text style={styles.permCheckboxTitle}>{perm.name}</Text>
                                    {perm.isSensitive && (
                                      <Text style={styles.permSensitiveBadge}>🔒 Sensitive</Text>
                                    )}
                                  </View>
                                  <Text style={styles.permCheckboxDesc}>{perm.description}</Text>
                                </View>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    size="md"
                    onPress={() => setEditingMember(null)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Save Member Privileges ✅"
                    variant="primary"
                    size="md"
                    onPress={handleSaveMemberPermissions}
                    style={{ flex: 1 }}
                  />
                </View>
              </>
            )}
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
  rolesGrid: {
    gap: spacing.md,
  },
  roleCard: {
    padding: spacing.md,
  },
  roleCardHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  roleIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconEmoji: {
    fontSize: 24,
  },
  roleTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  roleTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  roleCategoryTag: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  roleDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  roleCapabilitiesBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  roleCapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  roleCapTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  roleCapPercent: {
    fontSize: 11,
    color: colors.primary[700],
    fontWeight: typography.weights.bold,
  },
  rolePermTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  rolePermTag: {
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: borderRadius.sm,
  },
  rolePermTagText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  rolePermTagMore: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: borderRadius.sm,
  },
  rolePermTagMoreText: {
    fontSize: 11,
    color: colors.primary[700],
    fontWeight: typography.weights.bold,
  },
  roleCardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  matrixContainerCard: {
    padding: spacing.md,
  },
  matrixHeaderRow: {
    marginBottom: spacing.md,
  },
  matrixTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  matrixSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  matrixScroll: {
    width: '100%',
  },
  matrixTable: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    minWidth: 1000,
  },
  matrixHeaderTr: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  matrixThCapability: {
    width: 280,
    padding: spacing.sm,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border.default,
  },
  matrixThText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  matrixThRole: {
    width: 90,
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border.light,
  },
  matrixThRoleIcon: {
    fontSize: 18,
  },
  matrixThRoleTitle: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: 2,
  },
  matrixModuleTr: {
    backgroundColor: '#eff6ff',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  matrixModuleTrText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary[900],
    letterSpacing: 0.5,
  },
  matrixTr: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.surface,
  },
  matrixTrAlt: {
    backgroundColor: colors.neutral[50],
  },
  matrixTdCapability: {
    width: 280,
    padding: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.border.default,
  },
  matrixTdPermName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  matrixTdPermDesc: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 1,
  },
  matrixTdPermCode: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.primary[700],
    marginTop: 2,
  },
  sensitivePill: {
    backgroundColor: '#fef3c7',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  sensitivePillText: {
    fontSize: 9,
    color: '#92400e',
    fontWeight: 'bold',
  },
  matrixTdRole: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border.light,
    padding: spacing.xs,
  },
  matrixGrantedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.success.background,
    borderColor: colors.success.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matrixGrantedText: {
    fontSize: 12,
    color: colors.success.text,
    fontWeight: 'bold',
  },
  matrixDeniedText: {
    fontSize: 14,
    color: colors.border.dark,
  },
  assignmentsCard: {
    padding: spacing.md,
  },
  assignmentsHeader: {
    marginBottom: spacing.md,
  },
  assignmentsTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  assignmentsSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  userList: {
    gap: spacing.sm,
  },
  userAssignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  userAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarInitial: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },
  userAssignName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  userAssignFlat: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  userAssignEmail: {
    fontSize: 11,
    color: colors.text.muted,
  },
  userCurrentRoleBadge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  userCurrentRoleText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  auditCard: {
    padding: spacing.md,
  },
  auditHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  auditTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  auditSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  auditTimeline: {
    gap: spacing.sm,
  },
  auditItem: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  auditTimeCol: {
    width: 140,
    gap: 4,
  },
  auditTimestamp: {
    fontSize: 11,
    color: colors.text.muted,
  },
  auditContentCol: {
    flex: 1,
    minWidth: 240,
  },
  auditActor: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primary[700],
  },
  auditTarget: {
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
    marginTop: 2,
  },
  auditNotes: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  simCard: {
    padding: spacing.lg,
  },
  simTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  simSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  simSelectorBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  personaChoicesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  personaChoiceBtn: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  personaChoiceBtnActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  personaChoiceText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  personaChoiceTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.bold,
  },
  permChoicesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  permChoiceBtn: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  permChoiceBtnActive: {
    backgroundColor: colors.primary[700],
    borderColor: colors.primary[700],
  },
  permChoiceText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  permChoiceTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.bold,
  },
  simResultCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
  },
  simResultCardAllowed: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  simResultCardDenied: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  simResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  simResultEmoji: {
    fontSize: 32,
  },
  simResultStatus: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  simResultDetail: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    marginTop: 2,
  },
  simResultExplainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  simExplainerText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  modalOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 640,
    maxHeight: '90%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
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
    marginBottom: spacing.sm,
  },
  iconChoicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  iconChoiceBtn: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
  },
  iconChoiceBtnActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 4,
  },
  typeSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
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
    fontSize: 11,
    color: colors.text.secondary,
  },
  typeSelectBtnTextActive: {
    color: colors.primary[700],
    fontWeight: typography.weights.bold,
  },
  formSectionSubHeader: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary[800],
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
  },
  modulePermGroup: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  modulePermGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modulePermGroupName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary[900],
  },
  toggleModuleAllText: {
    fontSize: 11,
    color: colors.primary[600],
    fontWeight: typography.weights.medium,
  },
  modulePermItemsList: {
    gap: 4,
  },
  permCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  permCheckboxRowActive: {
    backgroundColor: colors.surface,
  },
  checkboxSquare: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: colors.border.dark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginTop: 2,
  },
  checkboxSquareActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  checkboxCheck: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: 'bold',
  },
  permCheckboxTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  permSensitiveBadge: {
    fontSize: 9,
    color: '#b45309',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 4,
    borderRadius: 3,
    fontWeight: 'bold',
  },
  permCheckboxDesc: {
    fontSize: 11,
    color: colors.text.muted,
  },
  roleDetailDesc: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  roleDetailPermList: {
    gap: spacing.xs,
  },
  roleDetailPermItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.neutral[50],
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  roleDetailPermIcon: {
    fontSize: typography.sizes.sm,
    color: colors.success.text,
    fontWeight: 'bold',
    marginTop: 1,
  },
  roleDetailPermName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  roleDetailPermDesc: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 1,
  },
  roleDetailPermCode: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.primary[700],
    marginTop: 2,
  },
  roleAssignChoicesList: {
    gap: spacing.xs,
  },
  roleAssignChoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  roleAssignChoiceItemActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  roleAssignChoiceTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  roleAssignChoiceSub: {
    fontSize: 11,
    color: colors.text.muted,
  },
  roleAssignChoiceChecked: {
    fontSize: 16,
    color: colors.primary[700],
    fontWeight: 'bold',
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
  quickRolesCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  quickRolesHeader: {
    marginBottom: spacing.sm,
  },
  quickRolesTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: '#166534',
  },
  quickRolesSubtitle: {
    fontSize: typography.sizes.xs,
    color: '#15803d',
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: colors.primary[700],
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
  },
  quickRolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  quickRoleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#ffffff',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#86efac',
    minWidth: 160,
  },
  quickRoleIcon: {
    fontSize: 18,
  },
  quickRoleName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  quickRolePerms: {
    fontSize: 10,
    color: colors.text.muted,
  },
  quickRoleEditIcon: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.primary[600],
    marginLeft: spacing.xs,
  },
  matrixThEditBtn: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
    marginTop: 4,
    alignSelf: 'center',
  },
  matrixThEditText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },
  matrixTdRoleClickable: {
    cursor: 'pointer' as any,
  },
  editRoleNotice: {
    backgroundColor: '#eff6ff',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: spacing.md,
  },
  editRoleNoticeText: {
    fontSize: typography.sizes.xs,
    color: '#1e40af',
    lineHeight: 18,
  },
  execCardsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  execCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  execCardTop: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  execIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  execRoleTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  execTagPill: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  execTagPillText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#7e22ce',
  },
  execHolderText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 1,
  },
  execPermCount: {
    fontSize: 11,
    color: colors.primary[700],
    fontWeight: typography.weights.semibold,
  },
  execQuickLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#166534',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  execTogglesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  execToggleChip: {
    paddingVertical: 3,
    paddingHorizontal: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  execToggleChipActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  execToggleText: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  execToggleTextActive: {
    color: '#15803d',
    fontWeight: typography.weights.bold,
  },
  quickMemberBox: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#bbf7d0',
  },
  quickMemberTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#166534',
  },
  quickMemberSubtitle: {
    fontSize: 11,
    color: '#15803d',
    marginTop: 1,
  },
  quickMemberPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  quickMemberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingVertical: 4,
    paddingHorizontal: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  quickMemberChipName: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  quickMemberChipFlat: {
    fontSize: 10,
    color: colors.text.muted,
  },
  quickMemberChipEdit: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primary[600],
  },
});
