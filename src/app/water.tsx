import React, { useState } from 'react';
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
import { APP_NAME, PERMISSIONS } from '../constants/app';
import { borderRadius, colors, shadows, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useResponsive } from '../hooks/useResponsive';
import {
  calculateWaterBill,
  getHistoricalConsumption,
  getWaterReadings,
  getWaterReceiptForBill,
  getWaterSocietySummary,
  getWaterTariffConfig,
  payWaterBill,
  recordMeterReading,
  updateWaterTariffConfig,
} from '../services/mockWater';
import {
  HistoricalConsumption,
  WaterMeterReading,
  WaterPaymentReceipt,
  WaterSocietySummary,
  WaterTariffConfig,
} from '../types/water';

export default function WaterScreen() {
  const { user, hasPermission } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Permission Checks
  const canView = hasPermission(PERMISSIONS.WATER_VIEW);
  const canRecordMeter = hasPermission(PERMISSIONS.WATER_RECORD_METER);
  const canManageSlabs = hasPermission(PERMISSIONS.WATER_MANAGE_SLABS);

  // Tab State: default to 'my-meter' if resident/tenant, or 'meter-reader' if committee/metermaster
  const [activeTab, setActiveTab] = useState<'my-meter' | 'meter-reader' | 'slabs-tariff' | 'supply-analytics'>(
    canRecordMeter && !canView ? 'meter-reader' : 'my-meter'
  );

  // Core Data
  const [readings, setReadings] = useState<WaterMeterReading[]>(() => getWaterReadings());
  const [tariff, setTariff] = useState<WaterTariffConfig>(() => getWaterTariffConfig());
  const [summary, setSummary] = useState<WaterSocietySummary>(() => getWaterSocietySummary());

  // Search & Filter state for Meter Reader Table
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('all');
  const [selectedFilterStatus, setSelectedFilterStatus] = useState('all');

  // Record Meter Reading Modal State
  const [recordingModalReading, setRecordingModalReading] = useState<WaterMeterReading | null>(null);
  const [inputCurrentReading, setInputCurrentReading] = useState('');
  const [inputMeterStatus, setInputMeterStatus] = useState<'normal' | 'faulty' | 'locked' | 'unreachable'>('normal');
  const [inputNotes, setInputNotes] = useState('');
  const [isSavingReading, setIsSavingReading] = useState(false);

  // Edit Tariff Modal State
  const [showTariffModal, setShowTariffModal] = useState(false);
  const [slabRates, setSlabRates] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    tariff.slabs.forEach((s) => {
      initial[s.id] = s.ratePerKL.toString();
    });
    return initial;
  });
  const [inputFixedMeterFee, setInputFixedMeterFee] = useState(tariff.fixedMeterCharge.toString());
  const [inputSanitationPercent, setInputSanitationPercent] = useState(tariff.sanitationSurchargePercent.toString());
  const [isSavingTariff, setIsSavingTariff] = useState(false);

  // Payment Modal State
  const [paymentModalBill, setPaymentModalBill] = useState<WaterMeterReading | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'UPI' | 'NetBanking' | 'Card'>('UPI');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'GPay' | 'PhonePe' | 'Paytm' | 'BHIM'>('GPay');
  const [selectedBank, setSelectedBank] = useState<'HDFC' | 'SBI' | 'ICICI' | 'Axis'>('HDFC');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Active Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<WaterPaymentReceipt | null>(null);

  // Toast banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const refreshData = () => {
    setReadings(getWaterReadings());
    setTariff(getWaterTariffConfig());
    setSummary(getWaterSocietySummary());
  };

  // Logged-in resident flat
  const userFlat = user?.flatNumber || 'B-402';
  const myReading = readings.find((r) => r.flatNumber.toLowerCase() === userFlat.toLowerCase()) || readings[0];
  const history = getHistoricalConsumption(userFlat);

  // Filtered readings for meter-reader tab
  const filteredReadings = readings.filter((r) => {
    const matchesSearch =
      r.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.meterNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBlock =
      selectedBlock === 'all' || r.block.toLowerCase().includes(selectedBlock.toLowerCase());

    const matchesStatus =
      selectedFilterStatus === 'all' || r.status === selectedFilterStatus;

    return matchesSearch && matchesBlock && matchesStatus;
  });

  // Calculate live preview in Meter Record Modal
  const parsedCurrentReading = parseFloat(inputCurrentReading);
  const prevReading = recordingModalReading?.previousReading || 0;
  const liveConsumption =
    !isNaN(parsedCurrentReading) && parsedCurrentReading >= prevReading
      ? Math.round((parsedCurrentReading - prevReading) * 10) / 10
      : 0;
  const liveBillCalc = calculateWaterBill(liveConsumption, tariff);

  // Handle Meter Reading Save
  const handleSaveMeterReading = async () => {
    if (!recordingModalReading) return;
    const currentVal = parseFloat(inputCurrentReading);
    if (isNaN(currentVal) || currentVal < recordingModalReading.previousReading) {
      showToast('Current reading cannot be lower than the previous reading (' + recordingModalReading.previousReading + ' kL).');
      return;
    }

    setIsSavingReading(true);
    try {
      await recordMeterReading({
        flatNumber: recordingModalReading.flatNumber,
        currentReading: currentVal,
        meterStatus: inputMeterStatus,
        notes: inputNotes,
        recordedBy: `${user?.name || 'Committee'} (${user?.roleTitle || 'Meter Reader'})`,
      });
      refreshData();
      setIsSavingReading(false);
      setRecordingModalReading(null);
      showToast(`Meter logged for Flat ${recordingModalReading.flatNumber}: ${liveConsumption} kL (₹${liveBillCalc.totalAmount})`);
    } catch {
      setIsSavingReading(false);
      showToast('Failed to record meter reading.');
    }
  };

  // Handle Tariff Update
  const handleSaveTariff = () => {
    setIsSavingTariff(true);
    const updatedSlabs = tariff.slabs.map((s) => ({
      ...s,
      ratePerKL: parseFloat(slabRates[s.id]) || s.ratePerKL,
    }));

    const newTariff: WaterTariffConfig = {
      ...tariff,
      fixedMeterCharge: parseFloat(inputFixedMeterFee) || 50,
      sanitationSurchargePercent: parseFloat(inputSanitationPercent) || 10,
      slabs: updatedSlabs,
      effectiveDate: new Date().toLocaleDateString('en-GB'),
      lastUpdatedBy: `${user?.name || 'Committee'} (${user?.roleTitle || 'Admin'})`,
    };

    updateWaterTariffConfig(newTariff);
    refreshData();
    setIsSavingTariff(false);
    setShowTariffModal(false);
    showToast('Water tariff rates and slab rules updated successfully!');
  };

  // Handle Online Water Bill Payment
  const handleConfirmPayment = async () => {
    if (!paymentModalBill) return;
    setIsProcessingPayment(true);
    try {
      const methodLabel =
        selectedPaymentMethod === 'UPI'
          ? `UPI (${selectedUpiApp})`
          : selectedPaymentMethod === 'NetBanking'
          ? `NetBanking (${selectedBank})`
          : 'Debit/Credit Card';

      const res = await payWaterBill(paymentModalBill.id, methodLabel);
      refreshData();
      setIsProcessingPayment(false);
      setPaymentModalBill(null);
      setActiveReceipt(res.receipt);
      showToast(`Water bill of ₹${paymentModalBill.totalAmount} paid successfully!`);
    } catch {
      setIsProcessingPayment(false);
      showToast('Payment processing failed. Please retry.');
    }
  };

  return (
    <ScreenContainer maxWidth={1120}>
      {/* Toast Banner */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>✓ {toastMessage}</Text>
        </View>
      )}

      {/* Module Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>Water Supply & Sub-Meters</Text>
            <StatusBadge
              status="info"
              label="Tiered Volumetric Tariff"
              size="sm"
              showDot={false}
            />
          </View>
          <Text style={styles.pageSubtitle}>
            Individual automated sub-meter billing, slab slabs, daily conservation trends & society supply mix
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          {canView && (
            <Pressable
              onPress={() => setActiveTab('my-meter')}
              style={[styles.tabButton, activeTab === 'my-meter' && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, activeTab === 'my-meter' && styles.tabButtonTextActive]}>
                My Flat (Flat {userFlat})
              </Text>
            </Pressable>
          )}

          {canRecordMeter && (
            <Pressable
              onPress={() => setActiveTab('meter-reader')}
              style={[styles.tabButton, activeTab === 'meter-reader' && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, activeTab === 'meter-reader' && styles.tabButtonTextActive]}>
                Record Meters ({summary.readingsRecorded}/{summary.totalFlats})
              </Text>
            </Pressable>
          )}

          {canManageSlabs && (
            <Pressable
              onPress={() => setActiveTab('slabs-tariff')}
              style={[styles.tabButton, activeTab === 'slabs-tariff' && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, activeTab === 'slabs-tariff' && styles.tabButtonTextActive]}>
                Slab Tariffs
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => setActiveTab('supply-analytics')}
            style={[styles.tabButton, activeTab === 'supply-analytics' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, activeTab === 'supply-analytics' && styles.tabButtonTextActive]}>
              Supply Mix
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ============================================================== */}
      {/* 1. RESIDENT / "MY FLAT METER & CONSUMPTION" VIEW                */}
      {/* ============================================================== */}
      {activeTab === 'my-meter' && canView && (
        <View style={styles.residentViewContainer}>
          {/* Main Meter Hero Card */}
          <Card
            title={`Water Bill • ${myReading.month}`}
            subtitle={`Sub-Meter: ${myReading.meterNumber} • Flat ${myReading.flatNumber}`}
            action={
              <StatusBadge
                status={myReading.status}
                label={myReading.status.toUpperCase()}
                size="md"
              />
            }
            style={styles.heroCard}
          >
            {/* Top row: Consumption + Amount + Quick Action */}
            <View style={styles.heroMainRow}>
              <View style={styles.consumptionBadgeCol}>
                <Text style={styles.heroMetricLabel}>Monthly Consumption</Text>
                <View style={styles.consumptionValueRow}>
                  <Text style={styles.consumptionBigVal}>{myReading.consumptionKL}</Text>
                  <Text style={styles.consumptionUnit}>kL</Text>
                </View>
                <Text style={styles.dailyAverageText}>
                  ≈ {Math.round((myReading.consumptionKL * 1000) / 30)} Litres / day
                </Text>
              </View>

              <View style={styles.readingDialBox}>
                <View style={styles.dialMetricRow}>
                  <Text style={styles.dialLabel}>Previous Reading:</Text>
                  <Text style={styles.dialVal}>{myReading.previousReading} kL</Text>
                </View>
                <View style={styles.dialMetricRow}>
                  <Text style={styles.dialLabel}>Current Reading:</Text>
                  <Text style={[styles.dialVal, styles.dialValCurrent]}>
                    {myReading.currentReading} kL
                  </Text>
                </View>
                <View style={styles.dialMetricRow}>
                  <Text style={styles.dialLabel}>Meter Condition:</Text>
                  <Text style={styles.dialConditionText}>✓ Certified Normal</Text>
                </View>
                <Text style={styles.dialDateSub}>Recorded on {myReading.recordedAt}</Text>
              </View>

              <View style={styles.heroPayCol}>
                <Text style={styles.heroAmountLabel}>Total Bill Amount</Text>
                <Text style={styles.heroAmountHighlight}>₹{myReading.totalAmount}</Text>
                <Text style={styles.heroDueSub}>Due: {myReading.dueDate}</Text>

                {myReading.status === 'paid' ? (
                  <Button
                    title="View Receipt"
                    variant="outline"
                    onPress={() => setActiveReceipt(getWaterReceiptForBill(myReading))}
                    style={styles.heroPayBtn}
                  />
                ) : (
                  <Button
                    title={`Pay ₹${myReading.totalAmount} Now`}
                    variant="primary"
                    onPress={() => setPaymentModalBill(myReading)}
                    style={styles.heroPayBtn}
                  />
                )}
              </View>
            </View>

            {/* Tiered Volumetric Calculation Breakdown */}
            <View style={styles.slabBreakdownBox}>
              <View style={styles.slabBreakdownHeader}>
                <Text style={styles.breakdownTitle}>Volumetric Slab Calculation</Text>
                <Text style={styles.breakdownSub}>
                  Progressive rates designed to incentivize water conservation
                </Text>
              </View>

              <View style={styles.slabGrid}>
                {myReading.slabBreakdown.map((item, idx) => (
                  <View key={idx} style={styles.slabRow}>
                    <View style={styles.slabRowLeft}>
                      <View style={styles.slabBullet} />
                      <Text style={styles.slabNameText}>{item.slabName}</Text>
                      <Text style={styles.slabRatePill}>
                        {item.kl} kL @ ₹{item.rate}/kL
                      </Text>
                    </View>
                    <Text style={styles.slabAmountVal}>₹{item.amount}</Text>
                  </View>
                ))}

                <View style={styles.slabRow}>
                  <View style={styles.slabRowLeft}>
                    <View style={[styles.slabBullet, styles.bulletFixed]} />
                    <Text style={styles.slabNameText}>Fixed Meter Maintenance Charge</Text>
                  </View>
                  <Text style={styles.slabAmountVal}>₹{myReading.fixedMeterCharge}</Text>
                </View>

                <View style={styles.slabRow}>
                  <View style={styles.slabRowLeft}>
                    <View style={[styles.slabBullet, styles.bulletSanitation]} />
                    <Text style={styles.slabNameText}>Sanitation & Sewage Surcharge (10%)</Text>
                  </View>
                  <Text style={styles.slabAmountVal}>₹{myReading.sanitationCharge}</Text>
                </View>

                <View style={[styles.slabRow, styles.slabTotalRow]}>
                  <Text style={styles.slabTotalLabel}>Total Water Dues</Text>
                  <Text style={styles.slabTotalAmount}>₹{myReading.totalAmount}</Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Historical Trend & Water Conservation Tips */}
          <View style={[styles.twoColRow, isDesktop ? styles.twoColRowDesktop : styles.twoColRowStack]}>
            {/* 5-Month Consumption Trend */}
            <View style={styles.colLeft}>
              <Card
                title="5-Month Consumption Trend"
                subtitle="Historical monthly water draw (kL)"
              >
                <View style={styles.chartContainer}>
                  {history.map((h, i) => {
                    const isLatest = i === history.length - 1;
                    const maxVal = 26;
                    const barHeightPct = Math.round((h.consumptionKL / maxVal) * 100);

                    return (
                      <View key={h.month} style={styles.chartBarCol}>
                        <Text style={styles.chartBarValueText}>{h.consumptionKL}kL</Text>
                        <View style={styles.chartTrack}>
                          <View
                            style={[
                              styles.chartFill,
                              { height: `${barHeightPct}%` },
                              isLatest && styles.chartFillActive,
                            ]}
                          />
                        </View>
                        <Text style={[styles.chartMonthText, isLatest && styles.chartMonthTextActive]}>
                          {h.month.split(' ')[0]}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.conservationAlertBox}>
                  <Text style={styles.conservationAlertIcon}>🌱</Text>
                  <View style={styles.conservationAlertContent}>
                    <Text style={styles.conservationAlertTitle}>Great Job Conserving Water!</Text>
                    <Text style={styles.conservationAlertDesc}>
                      Your September draw of 18.2 kL is 7.1% lower than August (19.6 kL), saving approx ₹38 and 1,400 litres.
                    </Text>
                  </View>
                </View>
              </Card>
            </View>

            {/* Smart Water Insights & Leaks */}
            <View style={styles.colRight}>
              <Card title="Society Water Conservation Tips" subtitle="Best practices for high-rise living">
                <View style={styles.tipsList}>
                  <View style={styles.tipItem}>
                    <Text style={styles.tipEmoji}>🚿</Text>
                    <View style={styles.tipContent}>
                      <Text style={styles.tipTitle}>Install Low-Flow Aerators</Text>
                      <Text style={styles.tipDesc}>
                        Adding simple ₹120 aerators to kitchen & basin faucets saves up to 40% water without reducing pressure.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tipItem}>
                    <Text style={styles.tipEmoji}>🚽</Text>
                    <View style={styles.tipContent}>
                      <Text style={styles.tipTitle}>Check Dual-Flush Valves</Text>
                      <Text style={styles.tipDesc}>
                        A silent flapper leak can waste up to 200 litres a day, easily pushing your bill into Tier 3 tariffs.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tipItem}>
                    <Text style={styles.tipEmoji}>💧</Text>
                    <View style={styles.tipContent}>
                      <Text style={styles.tipTitle}>Report Common Line Seepage</Text>
                      <Text style={styles.tipDesc}>
                        If you notice dampness in the shaft or duct area, log a maintenance ticket immediately.
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            </View>
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* 2. METER READER / "RECORD WATER METERS" VIEW                     */}
      {/* ============================================================== */}
      {activeTab === 'meter-reader' && canRecordMeter && (
        <View style={styles.meterReaderContainer}>
          {/* Quick Metrics */}
          <View style={[styles.summaryStatRow, isMobile && styles.summaryStatRowMobile]}>
            <Card padding="md" variant="elevated" style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Flats</Text>
              <Text style={styles.summaryVal}>128 Units</Text>
              <Text style={styles.summarySub}>Sub-Metered</Text>
            </Card>

            <Card padding="md" variant="elevated" style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Readings Logged</Text>
              <Text style={[styles.summaryVal, styles.successColor]}>
                {summary.readingsRecorded} Flats
              </Text>
              <Text style={styles.summarySub}>92% Recorded for Cycle 18</Text>
            </Card>

            <Card padding="md" variant="elevated" style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Pending Readings</Text>
              <Text style={[styles.summaryVal, styles.warningColor]}>
                {summary.readingsPending} Flats
              </Text>
              <Text style={styles.summarySub}>Tower D Pending</Text>
            </Card>

            <Card padding="md" variant="elevated" style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Consumption</Text>
              <Text style={styles.summaryVal}>{summary.totalConsumptionKL} kL</Text>
              <Text style={styles.summarySub}>Average 17.5 kL / flat</Text>
            </Card>
          </View>

          {/* Search & Tower Filter Control Bar */}
          <View style={styles.controlBar}>
            <View style={styles.searchBox}>
              <TextInput
                placeholder="Search flat (e.g. B-402, D-105) or resident..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor={colors.neutral[400]}
              />
            </View>

            {/* Block Chips */}
            <View style={styles.blockFiltersRow}>
              {['all', 'Tower A', 'Tower B', 'Tower C', 'Tower D'].map((block) => (
                <Pressable
                  key={block}
                  onPress={() => setSelectedBlock(block)}
                  style={[
                    styles.blockChip,
                    selectedBlock === block && styles.blockChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.blockChipText,
                      selectedBlock === block && styles.blockChipTextActive,
                    ]}
                  >
                    {block === 'all' ? 'All Wings' : block}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Flats Meter Reading List */}
          <View style={styles.meterReadingsList}>
            {filteredReadings.map((reading) => {
              const hasRecorded = reading.currentReading > 0;
              const isExcessive = reading.consumptionKL >= 30;

              return (
                <View key={reading.id} style={styles.meterItemCard}>
                  <View style={styles.meterCardTop}>
                    <View style={styles.meterFlatTag}>
                      <Text style={styles.flatTagTitle}>{reading.flatNumber}</Text>
                      <Text style={styles.flatTagSub}>{reading.block}</Text>
                    </View>

                    <View style={styles.meterResidentCol}>
                      <Text style={styles.residentNameText}>{reading.residentName}</Text>
                      <Text style={styles.meterNumberText}>
                        Meter #{reading.meterNumber} • Prev: {reading.previousReading} kL
                      </Text>
                    </View>

                    <View style={styles.meterReadingMetricsCol}>
                      {hasRecorded ? (
                        <>
                          <View style={styles.consumptionPillRow}>
                            <Text style={styles.meterConsumptionText}>
                              {reading.consumptionKL} kL
                            </Text>
                            {isExcessive && (
                              <StatusBadge status="danger" label="HIGH USE" size="sm" showDot={false} />
                            )}
                          </View>
                          <Text style={styles.meterBilledAmt}>₹{reading.totalAmount}</Text>
                        </>
                      ) : (
                        <StatusBadge status="warning" label="PENDING ENTRY" size="sm" />
                      )}
                    </View>

                    <View style={styles.meterActionsCol}>
                      <Button
                        title={hasRecorded ? 'Edit Reading' : '+ Enter Reading'}
                        variant={hasRecorded ? 'outline' : 'primary'}
                        size="sm"
                        onPress={() => {
                          setRecordingModalReading(reading);
                          setInputCurrentReading(
                            reading.currentReading > 0 ? reading.currentReading.toString() : ''
                          );
                          setInputMeterStatus(reading.meterStatus);
                          setInputNotes(reading.readingNotes || '');
                        }}
                      />
                    </View>
                  </View>

                  {/* Notes / Reader Footprint */}
                  <View style={styles.meterCardBottom}>
                    <Text style={styles.meterFootprintText}>
                      Status: <Text style={styles.boldText}>{reading.meterStatus.toUpperCase()}</Text> •{' '}
                      {reading.recordedAt} by {reading.recordedBy}
                    </Text>
                    {reading.readingNotes && (
                      <Text style={styles.meterNotesText} numberOfLines={1}>
                        Note: {reading.readingNotes}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* 3. SLAB TARIFF CONFIGURATION VIEW (`WATER_MANAGE_SLABS`)       */}
      {/* ============================================================== */}
      {activeTab === 'slabs-tariff' && canManageSlabs && (
        <View style={styles.tariffViewContainer}>
          <Card
            title="Volumetric Slab Rates & Tariff Policy"
            subtitle={`Current rules configured for ${user?.societyName || 'ApniSociety'}`}
            action={
              <Button
                title="Edit Slabs & Rates"
                variant="primary"
                size="sm"
                onPress={() => {
                  const initial: Record<string, string> = {};
                  tariff.slabs.forEach((s) => {
                    initial[s.id] = s.ratePerKL.toString();
                  });
                  setSlabRates(initial);
                  setInputFixedMeterFee(tariff.fixedMeterCharge.toString());
                  setInputSanitationPercent(tariff.sanitationSurchargePercent.toString());
                  setShowTariffModal(true);
                }}
              />
            }
          >
            {/* Slabs Grid */}
            <View style={styles.tariffSlabsList}>
              {tariff.slabs.map((slab, idx) => (
                <View key={slab.id} style={styles.tariffSlabCard}>
                  <View style={styles.slabHeaderRow}>
                    <View style={styles.slabBadgeBox}>
                      <Text style={styles.slabBadgeNum}>Tier {idx + 1}</Text>
                    </View>
                    <Text style={styles.slabRateBig}>₹{slab.ratePerKL}</Text>
                    <Text style={styles.slabPerKL}>/ kL</Text>
                  </View>

                  <Text style={styles.slabCardTitle}>{slab.name}</Text>
                  <Text style={styles.slabRangeText}>
                    Volume:{' '}
                    <Text style={styles.boldText}>
                      {slab.minKL} kL - {slab.maxKL !== null ? `${slab.maxKL} kL` : 'Unlimited'}
                    </Text>
                  </Text>
                  <Text style={styles.slabDescText}>{slab.description}</Text>
                </View>
              ))}
            </View>

            {/* Surcharges Box */}
            <View style={styles.surchargeBox}>
              <View style={styles.surchargeItem}>
                <Text style={styles.surchargeLabel}>Fixed Meter Maintenance Charge:</Text>
                <Text style={styles.surchargeVal}>₹{tariff.fixedMeterCharge} / month</Text>
              </View>
              <View style={styles.surchargeItem}>
                <Text style={styles.surchargeLabel}>Sanitation & Sewage Treatment Plant (STP) Surcharge:</Text>
                <Text style={styles.surchargeVal}>{tariff.sanitationSurchargePercent}% on volumetric total</Text>
              </View>
              <View style={styles.surchargeItem}>
                <Text style={styles.surchargeLabel}>Last Revised & Approved By:</Text>
                <Text style={styles.surchargeVal}>{tariff.lastUpdatedBy} on {tariff.effectiveDate}</Text>
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* ============================================================== */}
      {/* 4. SOCIETY WATER SUPPLY MIX & ANALYTICS                        */}
      {/* ============================================================== */}
      {activeTab === 'supply-analytics' && (
        <View style={styles.supplyViewContainer}>
          <Card
            title="Monthly Society Water Inflow & Source Mix"
            subtitle="September 2026 Water Auditing & Sourcing"
          >
            <View style={[styles.sourcesGrid, isMobile && styles.sourcesGridMobile]}>
              <View style={styles.sourceCard}>
                <Text style={styles.sourceEmoji}>🏞️</Text>
                <Text style={styles.sourceName}>Deep Tube Borewells</Text>
                <Text style={styles.sourceVal}>{summary.borewellSupplyKL} kL</Text>
                <Text style={styles.sourcePct}>52% of total supply</Text>
                <Text style={styles.sourceSub}>3 society deep borewells operating within daily extraction norms</Text>
              </View>

              <View style={styles.sourceCard}>
                <Text style={styles.sourceEmoji}>🏛️</Text>
                <Text style={styles.sourceName}>Municipal Supply (DJB)</Text>
                <Text style={styles.sourceVal}>{summary.municipalSupplyKL} kL</Text>
                <Text style={styles.sourcePct}>25% of total supply</Text>
                <Text style={styles.sourceSub}>Standard piped supply received between 5:30 AM - 8:30 AM daily</Text>
              </View>

              <View style={styles.sourceCard}>
                <Text style={styles.sourceEmoji}>🚛</Text>
                <Text style={styles.sourceName}>Commercial Water Tankers</Text>
                <Text style={styles.sourceVal}>{summary.tankerSupplyKL} kL</Text>
                <Text style={styles.sourcePct}>23% of total supply</Text>
                <Text style={styles.sourceSub}>Procured during peak dry spells to replenish overhead fire & domestic tanks</Text>
              </View>
            </View>

            {/* Collection Health for Water */}
            <View style={styles.waterCollectionCard}>
              <View style={styles.waterCollectionHeader}>
                <View>
                  <Text style={styles.waterCollectionTitle}>Water Revenue & Collection Health</Text>
                  <Text style={styles.waterCollectionSub}>
                    Total Billed: ₹{summary.totalBilledAmount.toLocaleString('en-IN')} • Total Collected: ₹{summary.totalCollectedAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <StatusBadge
                  status="paid"
                  label={`${summary.collectionRate}% Recovered`}
                  size="md"
                />
              </View>

              <View style={styles.waterProgressTrack}>
                <View
                  style={[
                    styles.waterProgressFill,
                    { width: `${Math.min(100, summary.collectionRate)}%` },
                  ]}
                />
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* ============================================================== */}
      {/* 5. MODAL: RECORD / EDIT METER READING                           */}
      {/* ============================================================== */}
      <Modal
        visible={!!recordingModalReading}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isSavingReading) setRecordingModalReading(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {recordingModalReading && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Record Water Meter</Text>
                    <Text style={styles.modalSubtitle}>
                      Flat {recordingModalReading.flatNumber} • {recordingModalReading.residentName}
                    </Text>
                  </View>
                  <Pressable
                    disabled={isSavingReading}
                    onPress={() => setRecordingModalReading(null)}
                    style={styles.closeBtn}
                  >
                    <Text style={styles.closeBtnText}>✕</Text>
                  </Pressable>
                </View>

                {/* Meter Details */}
                <View style={styles.meterDetailsCallout}>
                  <View style={styles.calloutRow}>
                    <Text style={styles.calloutLabel}>Meter Serial Number:</Text>
                    <Text style={styles.calloutVal}>{recordingModalReading.meterNumber}</Text>
                  </View>
                  <View style={styles.calloutRow}>
                    <Text style={styles.calloutLabel}>Previous Cycle Reading:</Text>
                    <Text style={styles.calloutVal}>{recordingModalReading.previousReading} kL</Text>
                  </View>
                </View>

                {/* Current Reading Input */}
                <Text style={styles.fieldLabel}>Current Meter Reading (kL)</Text>
                <TextInput
                  value={inputCurrentReading}
                  onChangeText={setInputCurrentReading}
                  placeholder={`Must be ≥ ${recordingModalReading.previousReading}`}
                  keyboardType="numeric"
                  style={styles.textInput}
                  placeholderTextColor={colors.neutral[400]}
                />

                {/* Live Preview Box */}
                {liveConsumption > 0 && (
                  <View style={styles.liveCalcPreview}>
                    <View style={styles.liveCalcRow}>
                      <Text style={styles.liveCalcLabel}>Calculated Consumption:</Text>
                      <Text style={styles.liveCalcHighlight}>{liveConsumption} kL</Text>
                    </View>
                    <View style={styles.liveCalcRow}>
                      <Text style={styles.liveCalcLabel}>Calculated Water Bill:</Text>
                      <Text style={styles.liveCalcAmount}>₹{liveBillCalc.totalAmount}</Text>
                    </View>
                  </View>
                )}

                {/* Meter Condition */}
                <Text style={styles.fieldLabel}>Meter Condition Status</Text>
                <View style={styles.conditionTabsRow}>
                  {(['normal', 'faulty', 'locked', 'unreachable'] as const).map((cond) => (
                    <Pressable
                      key={cond}
                      onPress={() => setInputMeterStatus(cond)}
                      style={[
                        styles.conditionTab,
                        inputMeterStatus === cond && styles.conditionTabActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.conditionTabText,
                          inputMeterStatus === cond && styles.conditionTabTextActive,
                        ]}
                      >
                        {cond.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Notes Input */}
                <Text style={styles.fieldLabel}>Field Notes / Observations</Text>
                <TextInput
                  value={inputNotes}
                  onChangeText={setInputNotes}
                  placeholder="e.g. Verified dial, no leaks visible..."
                  style={styles.textInput}
                  placeholderTextColor={colors.neutral[400]}
                />

                <View style={styles.modalActions}>
                  <Button
                    title={isSavingReading ? 'Saving Reading...' : 'Save & Calculate Bill'}
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isSavingReading}
                    onPress={handleSaveMeterReading}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* 6. MODAL: EDIT TARIFF SLABS                                     */}
      {/* ============================================================== */}
      <Modal
        visible={showTariffModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isSavingTariff) setShowTariffModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Configure Volumetric Tariff</Text>
                <Text style={styles.modalSubtitle}>Update per-kL slab rates and fixed charges</Text>
              </View>
              <Pressable
                disabled={isSavingTariff}
                onPress={() => setShowTariffModal(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.formScroll}>
              {tariff.slabs.map((s) => (
                <View key={s.id} style={styles.slabInputRow}>
                  <View style={styles.slabInputInfo}>
                    <Text style={styles.slabInputTitle}>{s.name}</Text>
                    <Text style={styles.slabInputRange}>
                      {s.minKL} - {s.maxKL !== null ? `${s.maxKL} kL` : 'Unlimited'}
                    </Text>
                  </View>
                  <View style={styles.rateInputWrap}>
                    <Text style={styles.rupeePrefix}>₹</Text>
                    <TextInput
                      value={slabRates[s.id] || ''}
                      onChangeText={(val) =>
                        setSlabRates((prev) => ({ ...prev, [s.id]: val }))
                      }
                      keyboardType="numeric"
                      style={styles.smallRateInput}
                    />
                    <Text style={styles.perKLSuffix}>/kL</Text>
                  </View>
                </View>
              ))}

              <View style={styles.formDivider} />

              <Text style={styles.fieldLabel}>Fixed Meter Service Fee (₹ / month)</Text>
              <TextInput
                value={inputFixedMeterFee}
                onChangeText={setInputFixedMeterFee}
                keyboardType="numeric"
                style={styles.textInput}
              />

              <Text style={styles.fieldLabel}>Sanitation & STP Surcharge (%)</Text>
              <TextInput
                value={inputSanitationPercent}
                onChangeText={setInputSanitationPercent}
                keyboardType="numeric"
                style={styles.textInput}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title={isSavingTariff ? 'Saving Tariff...' : 'Save Tariff Policy'}
                variant="primary"
                size="lg"
                fullWidth
                loading={isSavingTariff}
                onPress={handleSaveTariff}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* 7. MODAL: WATER BILL ONLINE PAYMENT                            */}
      {/* ============================================================== */}
      <Modal
        visible={!!paymentModalBill}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isProcessingPayment) setPaymentModalBill(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {paymentModalBill && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Pay Water Bill</Text>
                    <Text style={styles.modalSubtitle}>
                      {paymentModalBill.month} • Flat {paymentModalBill.flatNumber}
                    </Text>
                  </View>
                  <Pressable
                    disabled={isProcessingPayment}
                    onPress={() => setPaymentModalBill(null)}
                    style={styles.closeBtn}
                  >
                    <Text style={styles.closeBtnText}>✕</Text>
                  </Pressable>
                </View>

                {/* Amount Callout */}
                <View style={styles.modalAmountBanner}>
                  <Text style={styles.modalAmountLabel}>Total Water Bill</Text>
                  <Text style={styles.modalAmountValue}>₹{paymentModalBill.totalAmount}</Text>
                  <Text style={styles.modalAmountSub}>
                    {paymentModalBill.consumptionKL} kL Consumption
                  </Text>
                </View>

                {/* Method selector */}
                <Text style={styles.methodSelectTitle}>Select Payment Method:</Text>
                <View style={styles.paymentMethodRow}>
                  <Pressable
                    onPress={() => setSelectedPaymentMethod('UPI')}
                    style={[
                      styles.methodTab,
                      selectedPaymentMethod === 'UPI' && styles.methodTabActive,
                    ]}
                  >
                    <Text style={styles.methodIcon}>⚡</Text>
                    <Text
                      style={[
                        styles.methodLabel,
                        selectedPaymentMethod === 'UPI' && styles.methodLabelActive,
                      ]}
                    >
                      Instant UPI
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedPaymentMethod('NetBanking')}
                    style={[
                      styles.methodTab,
                      selectedPaymentMethod === 'NetBanking' && styles.methodTabActive,
                    ]}
                  >
                    <Text style={styles.methodIcon}>🏦</Text>
                    <Text
                      style={[
                        styles.methodLabel,
                        selectedPaymentMethod === 'NetBanking' && styles.methodLabelActive,
                      ]}
                    >
                      NetBanking
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedPaymentMethod('Card')}
                    style={[
                      styles.methodTab,
                      selectedPaymentMethod === 'Card' && styles.methodTabActive,
                    ]}
                  >
                    <Text style={styles.methodIcon}>💳</Text>
                    <Text
                      style={[
                        styles.methodLabel,
                        selectedPaymentMethod === 'Card' && styles.methodLabelActive,
                      ]}
                    >
                      Debit/Card
                    </Text>
                  </Pressable>
                </View>

                {/* Sub-options for UPI */}
                {selectedPaymentMethod === 'UPI' && (
                  <View style={styles.subOptionsBox}>
                    <Text style={styles.subOptionsTitle}>Choose UPI App:</Text>
                    <View style={styles.upiAppsGrid}>
                      {(['GPay', 'PhonePe', 'Paytm', 'BHIM'] as const).map((app) => (
                        <Pressable
                          key={app}
                          onPress={() => setSelectedUpiApp(app)}
                          style={[
                            styles.upiAppPill,
                            selectedUpiApp === app && styles.upiAppPillActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.upiAppText,
                              selectedUpiApp === app && styles.upiAppTextActive,
                            ]}
                          >
                            {app}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* Sub-options for NetBanking */}
                {selectedPaymentMethod === 'NetBanking' && (
                  <View style={styles.subOptionsBox}>
                    <Text style={styles.subOptionsTitle}>Choose Bank:</Text>
                    <View style={styles.upiAppsGrid}>
                      {(['HDFC', 'SBI', 'ICICI', 'Axis'] as const).map((bank) => (
                        <Pressable
                          key={bank}
                          onPress={() => setSelectedBank(bank)}
                          style={[
                            styles.upiAppPill,
                            selectedBank === bank && styles.upiAppPillActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.upiAppText,
                              selectedBank === bank && styles.upiAppTextActive,
                            ]}
                          >
                            {bank}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {selectedPaymentMethod === 'Card' && (
                  <View style={styles.subOptionsBox}>
                    <Text style={styles.subOptionsNotice}>
                      Simulated RuPay / VISA / Mastercard gateway. No real charges processed.
                    </Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <Button
                    title={
                      isProcessingPayment
                        ? 'Confirming Transaction...'
                        : `Pay ₹${paymentModalBill.totalAmount}`
                    }
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isProcessingPayment}
                    onPress={handleConfirmPayment}
                  />
                  <Text style={styles.secureText}>
                    🔒 256-bit Encrypted Society Water Payment Gateway
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* 8. MODAL: WATER BILL OFFICIAL RECEIPT                           */}
      {/* ============================================================== */}
      <Modal
        visible={!!activeReceipt}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveReceipt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, styles.receiptBox]}>
            {activeReceipt && (
              <>
                <View style={styles.receiptHeader}>
                  <View style={styles.receiptBrandRow}>
                    <Text style={styles.receiptBrandTitle}>{APP_NAME}</Text>
                    <StatusBadge status="paid" label="VERIFIED RECEIPT" size="sm" />
                  </View>
                  <Text style={styles.receiptSocietyTitle}>
                    {user?.societyName || 'Shanti Heights RWA'} ({user?.societyCode || 'SH-402'})
                  </Text>
                  <Text style={styles.receiptSubtext}>
                    Official Water Sub-Meter Acknowledgement
                  </Text>
                </View>

                {/* Receipt Grid */}
                <View style={styles.receiptMetaGrid}>
                  <View style={styles.receiptMetaCol}>
                    <Text style={styles.metaLabel}>Receipt Number:</Text>
                    <Text style={styles.metaVal}>{activeReceipt.receiptNumber}</Text>
                  </View>
                  <View style={styles.receiptMetaCol}>
                    <Text style={styles.metaLabel}>Date & Time:</Text>
                    <Text style={styles.metaVal}>{activeReceipt.date}</Text>
                  </View>
                  <View style={styles.receiptMetaCol}>
                    <Text style={styles.metaLabel}>Flat / Unit:</Text>
                    <Text style={styles.metaVal}>
                      {activeReceipt.flatNumber} ({activeReceipt.block})
                    </Text>
                  </View>
                  <View style={styles.receiptMetaCol}>
                    <Text style={styles.metaLabel}>Resident:</Text>
                    <Text style={styles.metaVal}>{activeReceipt.residentName}</Text>
                  </View>
                  <View style={styles.receiptMetaCol}>
                    <Text style={styles.metaLabel}>Meter Serial Number:</Text>
                    <Text style={styles.metaVal}>{activeReceipt.meterNumber}</Text>
                  </View>
                  <View style={styles.receiptMetaCol}>
                    <Text style={styles.metaLabel}>Total Consumption:</Text>
                    <Text style={styles.metaVal}>{activeReceipt.consumptionKL} kL</Text>
                  </View>
                  <View style={styles.receiptMetaCol}>
                    <Text style={styles.metaLabel}>Payment Mode:</Text>
                    <Text style={styles.metaVal}>{activeReceipt.paymentMethod}</Text>
                  </View>
                  <View style={styles.receiptMetaCol}>
                    <Text style={styles.metaLabel}>Transaction Ref:</Text>
                    <Text style={styles.metaVal}>{activeReceipt.transactionId}</Text>
                  </View>
                </View>

                {/* Slabs breakdown in receipt */}
                <View style={styles.receiptTable}>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableHead}>Tariff Component</Text>
                    <Text style={styles.receiptTableHead}>Amount (₹)</Text>
                  </View>
                  {activeReceipt.breakdown.slabItems.map((item, idx) => (
                    <View key={idx} style={styles.receiptTableRow}>
                      <Text style={styles.receiptTableCell}>
                        {item.slabName} ({item.kl} kL @ ₹{item.rate})
                      </Text>
                      <Text style={styles.receiptTableCell}>₹{item.amount}</Text>
                    </View>
                  ))}
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableCell}>Fixed Meter Maintenance Charge</Text>
                    <Text style={styles.receiptTableCell}>₹{activeReceipt.breakdown.fixedMeterCharge}</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableCell}>Sanitation & STP Surcharge</Text>
                    <Text style={styles.receiptTableCell}>₹{activeReceipt.breakdown.sanitationCharge}</Text>
                  </View>
                  <View style={[styles.receiptTableRow, styles.receiptTableTotalRow]}>
                    <Text style={styles.receiptTableTotalText}>Total Amount Paid:</Text>
                    <Text style={styles.receiptTableTotalText}>₹{activeReceipt.amount}</Text>
                  </View>
                </View>

                <View style={styles.receiptStampBox}>
                  <Text style={styles.receiptStampText}>✓ OFFICIAL DIGITAL WATER RECEIPT</Text>
                  <Text style={styles.receiptStampSub}>
                    Issued automatically upon verified payment clearance.
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <Button
                    title="Done / Close"
                    variant="primary"
                    fullWidth
                    onPress={() => setActiveReceipt(null)}
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
    backgroundColor: colors.success.main,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  toastText: {
    color: colors.text.inverse,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  header: {
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerLeft: {
    flex: 1,
    minWidth: 280,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[500],
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.full,
    padding: 3,
    flexWrap: 'wrap',
    gap: 2,
  },
  tabButton: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  tabButtonActive: {
    backgroundColor: colors.primary[600],
  },
  tabButtonText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.neutral[600],
  },
  tabButtonTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },

  // Resident / My Meter Styles
  residentViewContainer: {
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.surface,
  },
  heroMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginBottom: spacing.md,
  },
  consumptionBadgeCol: {
    alignItems: 'flex-start',
  },
  heroMetricLabel: {
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.neutral[500],
    fontWeight: typography.weights.semibold,
  },
  consumptionValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 2,
  },
  consumptionBigVal: {
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
    letterSpacing: -1,
  },
  consumptionUnit: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.primary[600],
  },
  dailyAverageText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[600],
  },
  readingDialBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    minWidth: 210,
    gap: 4,
  },
  dialMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  dialLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
  },
  dialVal: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[800],
  },
  dialValCurrent: {
    color: colors.primary[700],
  },
  dialConditionText: {
    fontSize: typography.sizes.xs,
    color: colors.success.main,
    fontWeight: typography.weights.semibold,
  },
  dialDateSub: {
    fontSize: typography.sizes.xs - 2,
    color: colors.neutral[400],
    marginTop: 4,
  },
  heroPayCol: {
    alignItems: 'flex-end',
  },
  heroAmountLabel: {
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.neutral[500],
    fontWeight: typography.weights.semibold,
  },
  heroAmountHighlight: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  heroDueSub: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    marginBottom: spacing.xs + 2,
  },
  heroPayBtn: {
    minWidth: 140,
  },

  // Slab Breakdown Section
  slabBreakdownBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  slabBreakdownHeader: {
    marginBottom: spacing.sm,
  },
  breakdownTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  breakdownSub: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
  },
  slabGrid: {
    gap: spacing.xs + 2,
  },
  slabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slabRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  slabBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
  },
  bulletFixed: {
    backgroundColor: colors.neutral[400],
  },
  bulletSanitation: {
    backgroundColor: colors.info.main,
  },
  slabNameText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[700],
  },
  slabRatePill: {
    fontSize: typography.sizes.xs - 1,
    color: colors.primary[700],
    backgroundColor: colors.primary[50],
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  slabAmountVal: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[800],
  },
  slabTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  slabTotalLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  slabTotalAmount: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },

  // Two Column Trends & Tips
  twoColRow: {
    gap: spacing.lg,
  },
  twoColRowDesktop: {
    flexDirection: 'row',
  },
  twoColRowStack: {
    flexDirection: 'column',
  },
  colLeft: {
    flex: 1.1,
  },
  colRight: {
    flex: 0.9,
  },

  // Chart
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginBottom: spacing.md,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  chartBarValueText: {
    fontSize: typography.sizes.xs - 2,
    color: colors.neutral[500],
    fontWeight: typography.weights.medium,
  },
  chartTrack: {
    width: 28,
    height: 80,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  chartFill: {
    width: '100%',
    backgroundColor: colors.primary[300],
    borderRadius: borderRadius.sm,
  },
  chartFillActive: {
    backgroundColor: colors.primary[600],
  },
  chartMonthText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[500],
  },
  chartMonthTextActive: {
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },
  conservationAlertBox: {
    flexDirection: 'row',
    backgroundColor: colors.success.background,
    borderColor: colors.success.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    gap: spacing.sm,
    alignItems: 'center',
  },
  conservationAlertIcon: {
    fontSize: 22,
  },
  conservationAlertContent: {
    flex: 1,
  },
  conservationAlertTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.success.text,
  },
  conservationAlertDesc: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[700],
    marginTop: 2,
    lineHeight: 16,
  },

  // Tips
  tipsList: {
    gap: spacing.sm + 2,
  },
  tipItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  tipEmoji: {
    fontSize: 20,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  tipDesc: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    marginTop: 2,
    lineHeight: 16,
  },

  // Meter Reader View Styles
  meterReaderContainer: {
    gap: spacing.md,
  },
  summaryStatRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryStatRowMobile: {
    flexDirection: 'column',
  },
  summaryCard: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    fontWeight: typography.weights.medium,
  },
  summaryVal: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginVertical: 2,
  },
  summarySub: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[400],
  },
  successColor: {
    color: colors.success.main,
  },
  warningColor: {
    color: colors.warning.main,
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  searchBox: {
    flex: 1,
    minWidth: 260,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  blockFiltersRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  blockChip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface,
  },
  blockChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  blockChipText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
  },
  blockChipTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },

  // Meter Reading Cards
  meterReadingsList: {
    gap: spacing.sm,
  },
  meterItemCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  meterCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  meterFlatTag: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    minWidth: 64,
  },
  flatTagTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary[800],
  },
  flatTagSub: {
    fontSize: typography.sizes.xs - 2,
    color: colors.primary[600],
  },
  meterResidentCol: {
    flex: 1,
    minWidth: 180,
  },
  residentNameText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  meterNumberText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  meterReadingMetricsCol: {
    alignItems: 'flex-end',
    minWidth: 110,
  },
  consumptionPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meterConsumptionText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  meterBilledAmt: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  meterActionsCol: {
    alignItems: 'flex-end',
  },
  meterCardBottom: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.xs + 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  meterFootprintText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[400],
  },
  meterNotesText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.warning.main,
    fontStyle: 'italic',
  },
  boldText: {
    fontWeight: typography.weights.semibold,
    color: colors.neutral[800],
  },

  // Tariff View Styles
  tariffViewContainer: {
    gap: spacing.lg,
  },
  tariffSlabsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  tariffSlabCard: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flex: 1,
    minWidth: 200,
  },
  slabHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  slabBadgeBox: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  slabBadgeNum: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
    color: colors.primary[800],
  },
  slabRateBig: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  slabPerKL: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    marginLeft: 2,
  },
  slabCardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  slabRangeText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    marginBottom: 4,
  },
  slabDescText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[400],
    lineHeight: 16,
  },
  surchargeBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.xs + 2,
  },
  surchargeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  surchargeLabel: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[600],
  },
  surchargeVal: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },

  // Supply Analytics
  supplyViewContainer: {
    gap: spacing.lg,
  },
  sourcesGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sourcesGridMobile: {
    flexDirection: 'column',
  },
  sourceCard: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  sourceEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  sourceName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  sourceVal: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
    marginVertical: 2,
  },
  sourcePct: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.success.main,
    marginBottom: 4,
  },
  sourceSub: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[500],
    lineHeight: 16,
  },
  waterCollectionCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  waterCollectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  waterCollectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  waterCollectionSub: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  waterProgressTrack: {
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  waterProgressFill: {
    height: '100%',
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full,
  },

  // Modals Shared
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[500],
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeBtnText: {
    fontSize: typography.sizes.lg,
    color: colors.neutral[500],
  },
  meterDetailsCallout: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
    gap: 4,
  },
  calloutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calloutLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
  },
  calloutVal: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[800],
  },
  fieldLabel: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[700],
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  liveCalcPreview: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
    gap: 4,
  },
  liveCalcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveCalcLabel: {
    fontSize: typography.sizes.xs + 1,
    color: colors.primary[900],
  },
  liveCalcHighlight: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary[800],
  },
  liveCalcAmount: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.primary[800],
  },
  conditionTabsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  conditionTab: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
  },
  conditionTabActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  conditionTabText: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
    color: colors.neutral[600],
  },
  conditionTabTextActive: {
    color: colors.text.inverse,
  },
  modalActions: {
    marginTop: spacing.xs,
  },

  // Tariff Edit Modal
  formScroll: {
    maxHeight: 340,
    marginBottom: spacing.md,
  },
  slabInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  slabInputInfo: {
    flex: 1,
  },
  slabInputTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  slabInputRange: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[400],
  },
  rateInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rupeePrefix: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  smallRateInput: {
    width: 64,
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: 4,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    fontWeight: typography.weights.bold,
  },
  perKLSuffix: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
  },
  formDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.sm,
  },

  // Payment Modal
  modalAmountBanner: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalAmountLabel: {
    fontSize: typography.sizes.xs,
    color: colors.primary[700],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalAmountValue: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.primary[900],
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  modalAmountSub: {
    fontSize: typography.sizes.xs,
    color: colors.primary[600],
  },
  methodSelectTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[700],
    marginBottom: spacing.xs,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  methodTab: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
  },
  methodTabActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  methodIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  methodLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
  },
  methodLabelActive: {
    color: colors.primary[700],
    fontWeight: typography.weights.semibold,
  },
  subOptionsBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  subOptionsTitle: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    marginBottom: spacing.xs,
  },
  upiAppsGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  upiAppPill: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  upiAppPillActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[100],
  },
  upiAppText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.medium,
    color: colors.neutral[700],
  },
  upiAppTextActive: {
    color: colors.primary[800],
    fontWeight: typography.weights.bold,
  },
  subOptionsNotice: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[500],
    fontStyle: 'italic',
  },
  secureText: {
    fontSize: typography.sizes.xs - 2,
    color: colors.neutral[400],
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Receipt Modal
  receiptBox: {
    maxWidth: 540,
  },
  receiptHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
  },
  receiptBrandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  receiptBrandTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary[800],
  },
  receiptSocietyTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  receiptSubtext: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[400],
  },
  receiptMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.xs + 4,
    marginBottom: spacing.md,
  },
  receiptMetaCol: {
    width: '46%',
  },
  metaLabel: {
    fontSize: typography.sizes.xs - 2,
    color: colors.neutral[500],
    textTransform: 'uppercase',
  },
  metaVal: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginTop: 1,
  },
  receiptTable: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  receiptTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  receiptTableHead: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.neutral[700],
  },
  receiptTableCell: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
  },
  receiptTableTotalRow: {
    backgroundColor: colors.neutral[100],
    borderBottomWidth: 0,
  },
  receiptTableTotalText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  receiptStampBox: {
    backgroundColor: colors.success.background,
    borderColor: colors.success.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  receiptStampText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.success.text,
  },
  receiptStampSub: {
    fontSize: typography.sizes.xs - 2,
    color: colors.neutral[500],
    marginTop: 2,
  },
});
