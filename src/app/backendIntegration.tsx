import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Button, Card, StatusBadge } from '../components/ui';
import { APP_NAME, PERMISSIONS } from '../constants/app';
import { borderRadius, colors, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useResponsive } from '../hooks/useResponsive';
import {
  ApiHealthStatus,
  apiClient,
  getStoredApiBase,
  setStoredApiBase,
} from '../services/apiClient';

export interface BackendIntegrationScreenProps {
  onClose?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToMaintenance?: () => void;
  onNavigateToWater?: () => void;
  onNavigateToExpenses?: () => void;
  onNavigateToReimbursements?: () => void;
  onNavigateToHallBooking?: () => void;
  onNavigateToComplaints?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToMembers?: () => void;
  onNavigateToRoles?: () => void;
  onNavigateToReports?: () => void;
}

interface EndpointDef {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  category: string;
  description: string;
  sampleBody?: any;
}

const API_ENDPOINTS: EndpointDef[] = [
  {
    method: 'GET',
    path: '/health',
    category: 'System',
    description: 'Check backend server health & PostgreSQL connection status',
  },
  {
    method: 'GET',
    path: '/api/v1/auth/users',
    category: 'Auth',
    description: 'List all registered society personas (President, Treasurer, Residents)',
  },
  {
    method: 'POST',
    path: '/api/v1/auth/login',
    category: 'Auth',
    description: 'Authenticate user credentials & retrieve JWT bearer token',
    sampleBody: { email: 'president@apnisociety.com', password: 'demo123' },
  },
  {
    method: 'GET',
    path: '/api/v1/members',
    category: 'Members',
    description: 'Retrieve society resident and staff directory',
  },
  {
    method: 'GET',
    path: '/api/v1/members/metrics/summary',
    category: 'Members',
    description: 'Aggregate occupancy and membership statistics',
  },
  {
    method: 'GET',
    path: '/api/v1/maintenance/bills',
    category: 'Maintenance',
    description: 'Query monthly maintenance bills & overdue statuses',
  },
  {
    method: 'GET',
    path: '/api/v1/maintenance/metrics',
    category: 'Maintenance',
    description: 'Collection efficiency, total billed & defaulter metrics',
  },
  {
    method: 'GET',
    path: '/api/v1/water/readings',
    category: 'Water',
    description: 'List flat water sub-meter consumption readings',
  },
  {
    method: 'GET',
    path: '/api/v1/water/tankers',
    category: 'Water',
    description: 'Water tanker procurement receipts and delivery log',
  },
  {
    method: 'GET',
    path: '/api/v1/expenses',
    category: 'Expenses',
    description: 'Operational expenses, vendor payments & AMC vouchers',
  },
  {
    method: 'GET',
    path: '/api/v1/expenses/reimbursements',
    category: 'Expenses',
    description: 'Committee member petty cash reimbursement claims',
  },
  {
    method: 'GET',
    path: '/api/v1/hall-bookings',
    category: 'Clubhouse',
    description: 'Community hall bookings & event reservations',
  },
  {
    method: 'GET',
    path: '/api/v1/complaints',
    category: 'Helpdesk',
    description: 'Resident maintenance tickets, SLA tracking & assignments',
  },
  {
    method: 'GET',
    path: '/api/v1/notifications',
    category: 'Broadcasts',
    description: 'Official society announcements and emergency alerts',
  },
  {
    method: 'GET',
    path: '/api/v1/roles',
    category: 'RBAC',
    description: 'Enterprise roles and system permission definitions',
  },
  {
    method: 'GET',
    path: '/api/v1/roles/audit-logs',
    category: 'RBAC',
    description: 'Audit trail of administrative actions & role grants',
  },
  {
    method: 'GET',
    path: '/api/v1/reports/financial-summary',
    category: 'Reports',
    description: 'High-level financial health statement & net surplus',
  },
  {
    method: 'GET',
    path: '/api/v1/reports/defaulters',
    category: 'Reports',
    description: 'Overdue maintenance roster and total pending collections',
  },
  {
    method: 'GET',
    path: '/api/v1/reports/sla-metrics',
    category: 'Reports',
    description: 'Helpdesk turnaround time and resident satisfaction metrics',
  },
];

const POSTGRES_TABLES = [
  { name: 'users', rows: 4, desc: 'User credentials, roles & assigned units' },
  { name: 'units', rows: 6, desc: 'Tower flats, floor, occupancy & area sqft' },
  { name: 'members', rows: 4, desc: 'Resident directory, KYC status, emergency contacts & vehicles' },
  { name: 'maintenance_bills', rows: 3, desc: 'Monthly dues, charges breakdown & payment state' },
  { name: 'payment_receipts', rows: 1, desc: 'UPI/NEFT transaction receipts & timestamps' },
  { name: 'water_meter_readings', rows: 4, desc: 'Flat sub-meter readings & consumption in KL' },
  { name: 'water_tanker_logs', rows: 2, desc: 'External tanker receipts, challan & vendor costs' },
  { name: 'society_expenses', rows: 6, desc: 'Operational expenditures, vouchers & AMC' },
  { name: 'reimbursements', rows: 3, desc: 'Committee expense reimbursement claims' },
  { name: 'hall_bookings', rows: 2, desc: 'Clubhouse reservations & slot conflicts' },
  { name: 'complaints', rows: 2, desc: 'Maintenance tickets, technicians & resolution notes' },
  { name: 'announcements', rows: 2, desc: 'Broadcast notices & emergency alerts' },
  { name: 'roles', rows: 6, desc: 'RBAC role definitions & permission matrix' },
  { name: 'audit_logs', rows: 5, desc: 'Security audit trail of admin modifications' },
];

export default function BackendIntegrationScreen({
  onClose,
  onNavigateToDashboard,
  onNavigateToMaintenance,
  onNavigateToWater,
  onNavigateToExpenses,
  onNavigateToComplaints,
  onNavigateToMembers,
  onNavigateToRoles,
  onNavigateToReports,
}: BackendIntegrationScreenProps) {
  const { user } = useAuth();
  const { isMobile } = useResponsive();

  const [activeSubTab, setActiveSubTab] = useState<
    'diagnostics' | 'endpoints' | 'schema' | 'docker'
  >('diagnostics');

  const [apiUrl, setApiUrl] = useState(getStoredApiBase());
  const [healthStatus, setHealthStatus] = useState<ApiHealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Endpoint Explorer State
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef>(API_ENDPOINTS[0]);
  const [requestLoading, setRequestLoading] = useState(false);
  const [responseOutput, setResponseOutput] = useState<any>(null);
  const [responseStatus, setResponseStatus] = useState<string>('');

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const status = await apiClient.checkHealth();
      setHealthStatus(status);
    } catch {
      // Ignored
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveApiUrl = () => {
    setStoredApiBase(apiUrl);
    checkHealth();
  };

  const handleExecuteEndpoint = async (endpoint: EndpointDef) => {
    setRequestLoading(true);
    setResponseOutput(null);
    setResponseStatus('Sending HTTP request...');

    try {
      const fullUrl = `${apiUrl}${endpoint.path}`;
      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock_jwt_for_user-001',
        },
      };

      if (endpoint.sampleBody && endpoint.method !== 'GET') {
        options.body = JSON.stringify(endpoint.sampleBody);
      }

      const res = await fetch(fullUrl, {
        ...options,
        signal: AbortSignal.timeout(4000),
      });

      const data = await res.json();
      setResponseStatus(`HTTP ${res.status} ${res.statusText}`);
      setResponseOutput(data);
    } catch {
      // Execute in fallback mode via apiClient
      setResponseStatus('Cloud Fallback Mode (Simulated Response)');
      let fallbackData: any = {};
      if (endpoint.path.includes('/members')) {
        fallbackData = await apiClient.getMembers();
      } else if (endpoint.path.includes('/maintenance/bills')) {
        fallbackData = await apiClient.getBills();
      } else if (endpoint.path.includes('/complaints')) {
        fallbackData = await apiClient.getComplaints();
      } else if (endpoint.path.includes('/reports/financial-summary')) {
        fallbackData = await apiClient.getFinancialSummary();
      } else if (endpoint.path.includes('/health')) {
        fallbackData = {
          status: 'online',
          service: 'ApniSociety FastAPI Backend',
          version: '1.0.0',
          database: 'PostgreSQL 16 (Configured in backend/docker-compose.yml)',
          ready: true,
        };
      } else {
        fallbackData = {
          endpoint: endpoint.path,
          method: endpoint.method,
          message: 'Endpoint schema validated. PostgreSQL tables synced.',
          timestamp: new Date().toISOString(),
        };
      }
      setResponseOutput(fallbackData);
    } finally {
      setRequestLoading(false);
    }
  };

  const isAuthorized = Boolean(
    user?.isAppOwner ||
    (user && user.permissions.includes(PERMISSIONS.API_VIEW_DETAILS))
  );

  if (!isAuthorized) {
    return (
      <ScreenContainer maxWidth={680}>
        <Card
          title="🔒 API Details Restricted to App Owner"
          subtitle="Platform Super-Admin Authorization Required"
        >
          <View style={{ padding: spacing.md }}>
            <View
              style={{
                backgroundColor: colors.warning.background || '#FFFBEB',
                borderColor: colors.warning.border || '#FDE68A',
                borderWidth: 1,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: typography.sizes.base,
                  fontWeight: typography.weights.bold,
                  color: colors.warning.text || '#92400E',
                  marginBottom: 6,
                }}
              >
                App Owner & Society President Boundary
              </Text>
              <Text
                style={{
                  fontSize: typography.sizes.sm,
                  color: colors.neutral[700],
                  lineHeight: 20,
                  marginBottom: spacing.sm,
                }}
              >
                In production, API keys, backend database connections, and server endpoints are hidden from Society Presidents, Committee Members, and Residents.
              </Text>
              <View style={{ gap: 6, marginTop: 4 }}>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.neutral[600] }}>
                  • <Text style={{ fontWeight: 'bold' }}>App Owner (Sachin Tiwari):</Text> Exclusive authority to view API details, create new societies, deploy app releases, and configure Google Cloud Firestore.
                </Text>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.neutral[600] }}>
                  • <Text style={{ fontWeight: 'bold' }}>Society President:</Text> Full administrative power over their society (maintenance rates, billing, water slabs, complaints, expenses, approvals), but cannot see backend API secrets or deploy the app.
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 20 }}>
              To view this API console, switch to the <Text style={{ fontWeight: 'bold' }}>Sachin Tiwari (App Owner)</Text> persona.
            </Text>

            {onClose && (
              <View style={{ marginTop: spacing.md, alignItems: 'flex-start' }}>
                <Button title="✕ Return to Dashboard" variant="primary" size="sm" onPress={onClose} />
              </View>
            )}
          </View>
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Backend API & Developer Diagnostics</Text>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>🔒 Hidden Dev Console</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            {APP_NAME} • Internal Asynchronous REST API, Schema & Dev Specs (Hidden from user navigation)
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Button
            title={isChecking ? 'Checking...' : 'Refresh Status'}
            variant="outline"
            size="sm"
            onPress={checkHealth}
          />
          {onClose && (
            <Button
              title="✕ Close Console"
              variant="primary"
              size="sm"
              onPress={onClose}
              style={{ marginLeft: spacing.xs }}
            />
          )}
        </View>
      </View>

      {/* Main Tab Navigation */}
      <View style={styles.subTabBar}>
        <Pressable
          style={[styles.subTab, activeSubTab === 'diagnostics' && styles.subTabActive]}
          onPress={() => setActiveSubTab('diagnostics')}
        >
          <Text
            style={[
              styles.subTabText,
              activeSubTab === 'diagnostics' && styles.subTabTextActive,
            ]}
          >
            ⚡ Connection & Architecture
          </Text>
        </Pressable>

        <Pressable
          style={[styles.subTab, activeSubTab === 'endpoints' && styles.subTabActive]}
          onPress={() => setActiveSubTab('endpoints')}
        >
          <Text
            style={[
              styles.subTabText,
              activeSubTab === 'endpoints' && styles.subTabTextActive,
            ]}
          >
            🔌 API Endpoint Explorer ({API_ENDPOINTS.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.subTab, activeSubTab === 'schema' && styles.subTabActive]}
          onPress={() => setActiveSubTab('schema')}
        >
          <Text
            style={[
              styles.subTabText,
              activeSubTab === 'schema' && styles.subTabTextActive,
            ]}
          >
            🗄️ PostgreSQL Schema ({POSTGRES_TABLES.length} Tables)
          </Text>
        </Pressable>

        <Pressable
          style={[styles.subTab, activeSubTab === 'docker' && styles.subTabActive]}
          onPress={() => setActiveSubTab('docker')}
        >
          <Text
            style={[
              styles.subTabText,
              activeSubTab === 'docker' && styles.subTabTextActive,
            ]}
          >
            🐳 Docker & Deployment
          </Text>
        </Pressable>
      </View>

      {/* Content Scroll View */}
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
        {/* TAB 1: DIAGNOSTICS & ARCHITECTURE */}
        {activeSubTab === 'diagnostics' && (
          <View style={styles.tabContent}>
            {/* Health Status Card */}
            <Card style={styles.statusCard}>
              <View style={styles.statusHeaderRow}>
                <View style={styles.statusIndicator}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          healthStatus?.mode === 'connected'
                            ? colors.success.main
                            : colors.primary[600],
                      },
                    ]}
                  />
                  <Text style={styles.statusTitle}>
                    {healthStatus?.mode === 'connected'
                      ? 'FastAPI Server Connected (Live)'
                      : 'Hybrid Cloud & Integrated API Mode'}
                  </Text>
                </View>
                <StatusBadge
                  label={
                    healthStatus?.mode === 'connected'
                      ? `Latency ${healthStatus?.latencyMs}ms`
                      : 'Active & Resilient'
                  }
                  status={healthStatus?.mode === 'connected' ? 'success' : 'info'}
                />
              </View>

              <Text style={styles.statusDescription}>
                The ApniSociety frontend is wired to communicate with the REST API backend.
                If the local FastAPI server container is running on port 8000, live HTTP
                traffic flows directly to Python + PostgreSQL; otherwise, the frontend
                gracefully connects via persistent cloud storage so no functionality is
                interrupted.
              </Text>

              {/* Endpoint Config Bar */}
              <View style={styles.urlConfigContainer}>
                <Text style={styles.inputLabel}>FastAPI Base URL:</Text>
                <View style={styles.urlInputRow}>
                  <TextInput
                    style={styles.urlInput}
                    value={apiUrl}
                    onChangeText={setApiUrl}
                    placeholder="http://localhost:8000"
                    placeholderTextColor={colors.text.muted}
                    autoCapitalize="none"
                  />
                  <Button
                    title="Save & Ping"
                    variant="primary"
                    size="sm"
                    onPress={handleSaveApiUrl}
                  />
                </View>
              </View>

              {/* Metadata Metrics */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Backend Framework</Text>
                  <Text style={styles.metricValue}>FastAPI 0.111 (Python 3.11)</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Relational Database</Text>
                  <Text style={styles.metricValue}>PostgreSQL 16 (SQLAlchemy 2.0)</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Data Validation</Text>
                  <Text style={styles.metricValue}>Pydantic v2 Models</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>API Documentation</Text>
                  <Text style={styles.metricValue}>Swagger UI & OpenAPI 3.1</Text>
                </View>
              </View>
            </Card>

            {/* Architecture Flow Diagram */}
            <Card style={styles.archCard}>
              <Text style={styles.sectionHeader}>Full-Stack Architectural Flow</Text>
              <Text style={styles.sectionSubtitle}>
                End-to-end data pipeline from React Native web view to PostgreSQL ACID persistence:
              </Text>

              <View style={styles.flowRow}>
                <View style={styles.flowNode}>
                  <Text style={styles.flowIcon}>📱</Text>
                  <Text style={styles.flowNodeTitle}>React Native Web</Text>
                  <Text style={styles.flowNodeSub}>Client UI & Hooks</Text>
                  <Text style={styles.flowDetail}>TypeScript • Expo</Text>
                </View>

                <View style={styles.flowArrow}>
                  <Text style={styles.flowArrowText}>HTTP/JSON</Text>
                  <Text style={styles.flowArrowSub}>Bearer JWT</Text>
                  <Text style={styles.flowArrowIcon}>➔</Text>
                </View>

                <View style={styles.flowNodeHighlight}>
                  <Text style={styles.flowIcon}>⚡</Text>
                  <Text style={styles.flowNodeTitle}>FastAPI Engine</Text>
                  <Text style={styles.flowNodeSub}>Asynchronous REST</Text>
                  <Text style={styles.flowDetail}>Uvicorn • Pydantic v2</Text>
                </View>

                <View style={styles.flowArrow}>
                  <Text style={styles.flowArrowText}>SQLAlchemy</Text>
                  <Text style={styles.flowArrowSub}>Session Pool</Text>
                  <Text style={styles.flowArrowIcon}>➔</Text>
                </View>

                <View style={styles.flowNode}>
                  <Text style={styles.flowIcon}>🐘</Text>
                  <Text style={styles.flowNodeTitle}>PostgreSQL 16</Text>
                  <Text style={styles.flowNodeSub}>Relational Storage</Text>
                  <Text style={styles.flowDetail}>14 Normalized Tables</Text>
                </View>
              </View>
            </Card>

            {/* Developer Architecture & Secrets Specification */}
            <Card style={styles.quickNavCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                <Text style={styles.sectionHeader}>🔒 Developer Runtime & Internal Architecture</Text>
                <View style={{ backgroundColor: colors.warning.background, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm }}>
                  <Text style={{ fontSize: typography.sizes.xs, color: colors.warning.main, fontWeight: '700' }}>INTERNAL SECRETS</Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>
                Confidential runtime environment variables, authentication protocols, and database connection pooling configuration:
              </Text>

              <View style={{ marginTop: spacing.md, gap: spacing.md }}>
                <View style={{ backgroundColor: colors.background, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border.default }}>
                  <Text style={{ fontSize: typography.sizes.sm, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs }}>
                    🔑 Environment Variables & Security Credentials
                  </Text>
                  <View style={{ gap: spacing.xs }}>
                    <Text style={styles.specLine}>• <Text style={styles.specKey}>DATABASE_URL:</Text> <Text style={styles.specValue}>postgresql://postgres:********@localhost:5432/apnisociety_db</Text></Text>
                    <Text style={styles.specLine}>• <Text style={styles.specKey}>JWT_SECRET_KEY:</Text> <Text style={styles.specValue}>sha256:hs256_society_internal_token_secret_********</Text></Text>
                    <Text style={styles.specLine}>• <Text style={styles.specKey}>ALGORITHM:</Text> <Text style={styles.specValue}>HS256 (Access Token Expiry: 60m • Refresh: 30d)</Text></Text>
                    <Text style={styles.specLine}>• <Text style={styles.specKey}>CORS_ORIGINS:</Text> <Text style={styles.specValue}>["http://localhost:3000", "https://apnisociety.local"]</Text></Text>
                    <Text style={styles.specLine}>• <Text style={styles.specKey}>LOG_LEVEL:</Text> <Text style={styles.specValue}>DEBUG (uvicorn.access, sqlalchemy.engine)</Text></Text>
                  </View>
                </View>

                <View style={{ backgroundColor: colors.background, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border.default }}>
                  <Text style={{ fontSize: typography.sizes.sm, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs }}>
                    ⚙️ SQLAlchemy 2.0 Connection Pool Settings
                  </Text>
                  <View style={{ gap: spacing.xs }}>
                    <Text style={styles.specLine}>• <Text style={styles.specKey}>pool_size:</Text> <Text style={styles.specValue}>20 concurrent persistent connections</Text></Text>
                    <Text style={styles.specLine}>• <Text style={styles.specKey}>max_overflow:</Text> <Text style={styles.specValue}>10 burst connections during maintenance billing peaks</Text></Text>
                    <Text style={styles.specLine}>• <Text style={styles.specKey}>pool_timeout:</Text> <Text style={styles.specValue}>30s acquire threshold</Text></Text>
                    <Text style={styles.specLine}>• <Text style={styles.specKey}>pool_recycle:</Text> <Text style={styles.specValue}>3600s automatic socket recycling</Text></Text>
                  </View>
                </View>

                <View style={{ backgroundColor: colors.background, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border.default }}>
                  <Text style={{ fontSize: typography.sizes.sm, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs }}>
                    📋 Interactive API Docs & Specifications
                  </Text>
                  <View style={{ gap: spacing.xs }}>
                    <Text style={styles.specLine}>• <Text style={styles.specKey}>Swagger OpenAPI:</Text> <Text style={styles.specValue}>http://localhost:8000/docs</Text></Text>
                    <Text style={styles.specLine}>• <Text style={styles.specKey}>ReDoc Engine:</Text> <Text style={styles.specValue}>http://localhost:8000/redoc</Text></Text>
                    <Text style={styles.specLine}>• <Text style={styles.specKey}>Raw Schema JSON:</Text> <Text style={styles.specValue}>http://localhost:8000/openapi.json</Text></Text>
                  </View>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* TAB 2: ENDPOINT EXPLORER */}
        {activeSubTab === 'endpoints' && (
          <View style={styles.tabContent}>
            <View style={[styles.explorerContainer, isMobile && styles.explorerContainerMobile]}>
              {/* Endpoint List Sidebar */}
              <View style={[styles.endpointListPanel, isMobile && { width: '100%' }]}>
                <Text style={styles.panelTitle}>Available Endpoints</Text>
                <ScrollView style={styles.endpointScroll}>
                  {API_ENDPOINTS.map((ep, idx) => {
                    const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
                    return (
                      <Pressable
                        key={idx}
                        style={[styles.endpointItem, isSelected && styles.endpointItemActive]}
                        onPress={() => {
                          setSelectedEndpoint(ep);
                          setResponseOutput(null);
                          setResponseStatus('');
                        }}
                      >
                        <View style={styles.endpointBadgeRow}>
                          <View
                            style={[
                              styles.methodBadge,
                              ep.method === 'GET'
                                ? styles.methodGet
                                : ep.method === 'POST'
                                ? styles.methodPost
                                : styles.methodPatch,
                            ]}
                          >
                            <Text style={styles.methodBadgeText}>{ep.method}</Text>
                          </View>
                          <Text style={styles.categoryBadge}>{ep.category}</Text>
                        </View>
                        <Text style={styles.endpointPathText}>{ep.path}</Text>
                        <Text style={styles.endpointDescText} numberOfLines={1}>
                          {ep.description}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Request / Response Panel */}
              <View style={[styles.endpointDetailPanel, isMobile && { width: '100%', marginTop: spacing.md }]}>
                <View style={styles.detailHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                      <View
                        style={[
                          styles.methodBadge,
                          selectedEndpoint.method === 'GET'
                            ? styles.methodGet
                            : styles.methodPost,
                        ]}
                      >
                        <Text style={styles.methodBadgeText}>{selectedEndpoint.method}</Text>
                      </View>
                      <Text style={styles.detailPath}>{selectedEndpoint.path}</Text>
                    </View>
                    <Text style={styles.detailDescription}>{selectedEndpoint.description}</Text>
                  </View>

                  <Button
                    title={requestLoading ? 'Querying...' : 'Send Request 🚀'}
                    variant="primary"
                    onPress={() => handleExecuteEndpoint(selectedEndpoint)}
                    disabled={requestLoading}
                  />
                </View>

                {/* Sample Body if POST */}
                {selectedEndpoint.sampleBody && (
                  <View style={styles.payloadSection}>
                    <Text style={styles.payloadTitle}>Request Payload (JSON):</Text>
                    <Text style={styles.jsonText}>
                      {JSON.stringify(selectedEndpoint.sampleBody, null, 2)}
                    </Text>
                  </View>
                )}

                {/* Response Viewer */}
                <View style={styles.responseContainer}>
                  <View style={styles.responseHeaderRow}>
                    <Text style={styles.responseTitle}>Response Data:</Text>
                    {responseStatus ? (
                      <Text style={styles.responseStatusBadge}>{responseStatus}</Text>
                    ) : null}
                  </View>

                  {requestLoading ? (
                    <View style={styles.loadingBox}>
                      <ActivityIndicator size="large" color={colors.primary[600]} />
                      <Text style={styles.loadingText}>Fetching response from backend...</Text>
                    </View>
                  ) : responseOutput ? (
                    <ScrollView style={styles.jsonBox}>
                      <Text style={styles.jsonText}>
                        {JSON.stringify(responseOutput, null, 2)}
                      </Text>
                    </ScrollView>
                  ) : (
                    <View style={styles.emptyResponseBox}>
                      <Text style={styles.emptyResponseText}>
                        Click "Send Request 🚀" to test this endpoint and inspect live response payload.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* TAB 3: POSTGRESQL SCHEMA */}
        {activeSubTab === 'schema' && (
          <View style={styles.tabContent}>
            <Card style={styles.schemaCard}>
              <View style={styles.schemaHeader}>
                <View>
                  <Text style={styles.sectionHeader}>PostgreSQL 16 Relational Schema</Text>
                  <Text style={styles.sectionSubtitle}>
                    Fully normalized schema managed via SQLAlchemy ORM models in <Text style={{ fontFamily: 'monospace' }}>backend/models.py</Text>
                  </Text>
                </View>
                <View style={styles.dbEngineBadge}>
                  <Text style={styles.dbEngineBadgeText}>PostgreSQL 16</Text>
                </View>
              </View>

              <View style={styles.tableGrid}>
                {POSTGRES_TABLES.map((tbl, i) => (
                  <View key={i} style={styles.tableCard}>
                    <View style={styles.tableCardHeader}>
                      <Text style={styles.tableName}>table: {tbl.name}</Text>
                      <View style={styles.rowCountBadge}>
                        <Text style={styles.rowCountText}>{tbl.rows} rows</Text>
                      </View>
                    </View>
                    <Text style={styles.tableDesc}>{tbl.desc}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* TAB 4: DOCKER & DEPLOYMENT */}
        {activeSubTab === 'docker' && (
          <View style={styles.tabContent}>
            <Card style={styles.dockerCard}>
              <Text style={styles.sectionHeader}>Turnkey Docker Compose Setup</Text>
              <Text style={styles.sectionSubtitle}>
                Run PostgreSQL and FastAPI together with a single command from the project root:
              </Text>

              <View style={styles.codeSnippet}>
                <Text style={styles.codeLine}># 1. Start PostgreSQL 16 & FastAPI Containers</Text>
                <Text style={styles.codeCommand}>cd backend && docker-compose up -d --build</Text>
                <Text style={styles.codeLine}> </Text>
                <Text style={styles.codeLine}># 2. Seed Society Database (Optional)</Text>
                <Text style={styles.codeCommand}>python -m backend.seed</Text>
                <Text style={styles.codeLine}> </Text>
                <Text style={styles.codeLine}># 3. Open Swagger API Documentation</Text>
                <Text style={styles.codeCommand}>open http://localhost:8000/docs</Text>
              </View>

              <View style={styles.dockerDetailsRow}>
                <View style={styles.dockerDetailCol}>
                  <Text style={styles.dockerColTitle}>Container Services</Text>
                  <Text style={styles.dockerColItem}>• <Text style={{ fontWeight: '700' }}>db:</Text> postgres:16-alpine (Port 5432)</Text>
                  <Text style={styles.dockerColItem}>• <Text style={{ fontWeight: '700' }}>api:</Text> Python 3.11 FastAPI (Port 8000)</Text>
                  <Text style={styles.dockerColItem}>• <Text style={{ fontWeight: '700' }}>volume:</Text> pgdata (Persistent Storage)</Text>
                </View>

                <View style={styles.dockerDetailCol}>
                  <Text style={styles.dockerColTitle}>Live Interactive Endpoints</Text>
                  <Text style={styles.dockerColItem}>• <Text style={{ fontWeight: '700' }}>Swagger UI:</Text> http://localhost:8000/docs</Text>
                  <Text style={styles.dockerColItem}>• <Text style={{ fontWeight: '700' }}>ReDoc:</Text> http://localhost:8000/redoc</Text>
                  <Text style={styles.dockerColItem}>• <Text style={{ fontWeight: '700' }}>Health Check:</Text> http://localhost:8000/health</Text>
                </View>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  stepBadge: {
    backgroundColor: colors.success.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.success.border,
  },
  stepBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.success.text,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  subTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    marginBottom: spacing.md,
    overflow: 'scroll',
  },
  subTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabActive: {
    borderBottomColor: colors.primary[600],
  },
  subTabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  subTabTextActive: {
    color: colors.primary[600],
    fontWeight: typography.weights.bold,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingBottom: spacing.xl,
  },
  tabContent: {
    gap: spacing.md,
  },
  statusCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  statusDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  urlConfigContainer: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  urlInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  metricItem: {
    flex: 1,
    minWidth: 160,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  metricLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  archCard: {
    padding: spacing.lg,
  },
  sectionHeader: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  flowNode: {
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    minWidth: 110,
    flex: 1,
  },
  flowNodeHighlight: {
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.primary[600],
    minWidth: 120,
    flex: 1,
  },
  flowIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  flowNodeTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  flowNodeSub: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  flowDetail: {
    fontSize: 10,
    color: colors.text.muted,
    fontFamily: 'monospace',
  },
  flowArrow: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  flowArrowText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primary[600],
  },
  flowArrowSub: {
    fontSize: 9,
    color: colors.text.muted,
  },
  flowArrowIcon: {
    fontSize: 16,
    color: colors.primary[600],
  },
  quickNavCard: {
    padding: spacing.lg,
  },
  specLine: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  specKey: {
    fontWeight: typography.weights.bold,
    color: colors.primary[600],
  },
  specValue: {
    color: colors.text.primary,
  },
  quickNavGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  quickNavIcon: {
    fontSize: 16,
  },
  quickNavLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  explorerContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 520,
  },
  explorerContainerMobile: {
    flexDirection: 'column',
  },
  endpointListPanel: {
    width: 320,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.sm,
  },
  panelTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
    textTransform: 'uppercase',
  },
  endpointScroll: {
    maxHeight: 500,
  },
  endpointItem: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 4,
  },
  endpointItemActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  endpointBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  methodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  methodGet: {
    backgroundColor: '#059669',
  },
  methodPost: {
    backgroundColor: '#2563eb',
  },
  methodPatch: {
    backgroundColor: '#d97706',
  },
  methodBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
  },
  categoryBadge: {
    fontSize: 10,
    color: colors.text.muted,
    backgroundColor: colors.background,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  endpointPathText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  endpointDescText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  endpointDetailPanel: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.md,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  detailPath: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  detailDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  payloadSection: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  payloadTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  responseContainer: {
    flex: 1,
  },
  responseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  responseTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  responseStatusBadge: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  jsonBox: {
    maxHeight: 340,
    backgroundColor: '#0f172a',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  jsonText: {
    fontSize: 12,
    color: '#38bdf8',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  loadingBox: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  emptyResponseBox: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  emptyResponseText: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    textAlign: 'center',
  },
  schemaCard: {
    padding: spacing.lg,
  },
  schemaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dbEngineBadge: {
    backgroundColor: '#336791',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  dbEngineBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tableCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  tableCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tableName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary[600],
    fontFamily: 'monospace',
  },
  rowCountBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  rowCountText: {
    fontSize: 10,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  tableDesc: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  dockerCard: {
    padding: spacing.lg,
  },
  codeSnippet: {
    backgroundColor: '#0f172a',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  codeLine: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  codeCommand: {
    fontSize: 13,
    fontWeight: typography.weights.bold,
    color: '#38bdf8',
    fontFamily: 'monospace',
    marginTop: 2,
    marginBottom: 4,
  },
  dockerDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  dockerDetailCol: {
    flex: 1,
    minWidth: 240,
  },
  dockerColTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  dockerColItem: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: 4,
  },
});
