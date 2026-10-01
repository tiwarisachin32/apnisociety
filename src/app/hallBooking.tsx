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
import { Button, Card, FileUpload, StatusBadge } from '../components/ui';
import { APP_NAME, PERMISSIONS } from '../constants/app';
import { borderRadius, colors, shadows, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useResponsive } from '../hooks/useResponsive';
import {
  cancelHallBooking,
  checkSlotAvailability,
  createHallBooking,
  getAllHallBookings,
  getHallBookingSummary,
  getUserHallBookings,
  processSecurityDepositRefund,
  reviewHallBooking,
  SLOT_INFO,
  SOCIETY_FACILITIES,
} from '../services/mockHallBooking';
import {
  BookingSlot,
  EventType,
  FacilityType,
  HallBooking,
  NewBookingPayload,
  SocietyFacility,
} from '../types/hallBooking';

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  birthday_party: '🎂 Birthday Party',
  anniversary: '💍 Anniversary Celebration',
  pooja_religious: '🪔 Pooja / Religious Ceremony',
  wedding_sangeet: '🎉 Sangeet / Pre-Wedding',
  cultural_gathering: '🎭 Society Cultural Event',
  workshop_meeting: '💼 Workshop / Corporate Meeting',
  other: '🎈 Private Gathering',
};

export interface HallBookingScreenProps {
  onNavigateToDashboard?: () => void;
  onNavigateToMaintenance?: () => void;
}

export default function HallBookingScreen({
  onNavigateToDashboard,
  onNavigateToMaintenance,
}: HallBookingScreenProps) {
  const { user, hasPermission } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // RBAC checks
  const canBook = hasPermission(PERMISSIONS.HALL_BOOK);
  const canApprove = hasPermission(PERMISSIONS.HALL_APPROVE);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'venues' | 'calendar' | 'my_bookings' | 'approvals' | 'rules'>('venues');

  // Bookings & Summary state
  const [allBookings, setAllBookings] = useState<HallBooking[]>(() => getAllHallBookings());
  const [summary, setSummary] = useState(() => getHallBookingSummary(user?.id));

  // Selected date for calendar view (default today + 1)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [selectedDate, setSelectedDate] = useState<string>(
    tomorrow.toISOString().split('T')[0]
  );
  const [selectedVenueFilter, setSelectedVenueFilter] = useState<FacilityType | 'all'>('all');

  // Modals state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [preSelectedVenue, setPreSelectedVenue] = useState<FacilityType>('community_hall');
  const [preSelectedDate, setPreSelectedDate] = useState<string>(selectedDate);
  const [preSelectedSlot, setPreSelectedSlot] = useState<BookingSlot>('evening');

  // Form State for Booking
  const [formVenue, setFormVenue] = useState<FacilityType>('community_hall');
  const [formDate, setFormDate] = useState<string>(selectedDate);
  const [formSlot, setFormSlot] = useState<BookingSlot>('evening');
  const [formEventType, setFormEventType] = useState<EventType>('birthday_party');
  const [formEventTitle, setFormEventTitle] = useState('');
  const [formGuests, setFormGuests] = useState('50');
  const [formSoundSystem, setFormSoundSystem] = useState(true);
  const [formCateringPermit, setFormCateringPermit] = useState(true);
  const [formSpecialRequests, setFormSpecialRequests] = useState('');
  const [formAttachmentName, setFormAttachmentName] = useState('');
  const [formAttachmentUrl, setFormAttachmentUrl] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'UPI' | 'Card' | 'NetBanking'>('UPI');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Gate Pass & Voucher Modal
  const [selectedGatePass, setSelectedGatePass] = useState<HallBooking | null>(null);

  // Review Modal for Committee
  const [selectedReviewBooking, setSelectedReviewBooking] = useState<HallBooking | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  // Refund Deposit Modal
  const [selectedRefundBooking, setSelectedRefundBooking] = useState<HallBooking | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundUtr, setRefundUtr] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  const reloadData = () => {
    setAllBookings(getAllHallBookings());
    setSummary(getHallBookingSummary(user?.id));
  };

  const myBookings = user ? allBookings.filter((b) => b.userId === user.id) : [];
  const pendingApprovals = allBookings.filter((b) => b.status === 'pending_approval');

  // Open booking modal helper
  const handleOpenBooking = (venueId?: FacilityType, date?: string, slot?: BookingSlot) => {
    setFormVenue(venueId || 'community_hall');
    if (date) setFormDate(date);
    if (slot) setFormSlot(slot);
    setBookingError('');
    setShowBookingModal(true);
  };

  // Submit Booking Handler
  const handleSubmitBooking = async () => {
    if (!formEventTitle.trim()) {
      setBookingError('Please enter an event title / celebration purpose.');
      return;
    }
    const guestNum = parseInt(formGuests, 10);
    if (isNaN(guestNum) || guestNum <= 0) {
      setBookingError('Please specify expected guest count.');
      return;
    }

    const facility = SOCIETY_FACILITIES.find((f) => f.id === formVenue);
    if (facility && guestNum > facility.capacity) {
      setBookingError(`Guest count exceeds venue maximum capacity (${facility.capacity} guests).`);
      return;
    }

    setIsSubmittingBooking(true);
    setBookingError('');

    try {
      const payload: NewBookingPayload = {
        facilityId: formVenue,
        date: formDate,
        slot: formSlot,
        eventType: formEventType,
        eventTitle: formEventTitle.trim(),
        expectedGuests: guestNum,
        soundSystemRequired: formSoundSystem,
        cateringPermit: formCateringPermit,
        specialRequests: formSpecialRequests.trim() || undefined,
        paymentMethod: formPaymentMethod,
      };

      const newBooking = await createHallBooking(payload, {
        id: user?.id || 'user-curr',
        name: user?.name || 'Resident',
        roleTitle: user?.roleTitle || 'Owner (Resident)',
        flatNumber: user?.flatNumber || 'Flat B-402',
        phone: user?.phone || '9876543210',
      });

      reloadData();
      setIsSubmittingBooking(false);
      setShowBookingModal(false);
      setFormEventTitle('');
      setFormSpecialRequests('');
      setFormAttachmentName('');
      setFormAttachmentUrl('');
      // Open Gate Pass immediately
      setSelectedGatePass(newBooking);
      setActiveTab('my_bookings');
    } catch (err: any) {
      setIsSubmittingBooking(false);
      setBookingError(err.message || 'Slot is unavailable for selected date.');
    }
  };

  // Committee Action Handler
  const handleReviewAction = async (action: 'confirmed' | 'rejected') => {
    if (!selectedReviewBooking) return;
    setIsReviewing(true);
    try {
      await reviewHallBooking(
        selectedReviewBooking.id,
        action,
        `${user?.name || 'Committee'} (${user?.roleTitle || 'Managing Committee'})`,
        reviewNotes.trim()
      );
      reloadData();
      setIsReviewing(false);
      setSelectedReviewBooking(null);
      setReviewNotes('');
    } catch {
      setIsReviewing(false);
    }
  };

  // Refund Deposit Handler
  const handleConfirmRefund = async () => {
    if (!selectedRefundBooking) return;
    const amt = parseFloat(refundAmount);
    if (isNaN(amt) || amt <= 0) return;

    setIsRefunding(true);
    try {
      const ref = refundUtr.trim() || `IMPS-REF-${Date.now().toString().slice(-6)}`;
      await processSecurityDepositRefund(selectedRefundBooking.id, amt, ref);
      reloadData();
      setIsRefunding(false);
      setSelectedRefundBooking(null);
      setRefundAmount('');
      setRefundUtr('');
    } catch {
      setIsRefunding(false);
    }
  };

  // Cancel Booking Handler
  const handleCancelBooking = async (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking? Security deposit will be refunded.')) {
      await cancelHallBooking(bookingId);
      reloadData();
    }
  };

  // Calculate live fees for form
  const currentFormFacility = SOCIETY_FACILITIES.find((f) => f.id === formVenue) || SOCIETY_FACILITIES[0];
  const currentRent = currentFormFacility.rates[formSlot];
  const currentDeposit = currentFormFacility.securityDeposit;
  const currentCleaning = currentFormFacility.cleaningFee;
  const currentTotal = currentRent + currentDeposit + currentCleaning;

  // If user has neither permission
  if (!canBook && !canApprove && !hasPermission(PERMISSIONS.HALL_VIEW_CALENDAR)) {
    return (
      <ScreenContainer maxWidth={640}>
        <Card title="Hall Booking Access Restricted" subtitle="Permission required">
          <View style={{ padding: spacing.md }}>
            <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 20 }}>
              Your current persona ({user?.roleTitle || 'User'}) does not hold permissions to view or book community facilities.
            </Text>
          </View>
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.badgeRow}>
            <View style={styles.headerPill}>
              <Text style={styles.headerPillText}>FACILITY & HALL DESK</Text>
            </View>
            <View style={styles.societyTag}>
              <Text style={styles.societyTagText}>{APP_NAME} Clubhouse</Text>
            </View>
          </View>
          <Text style={styles.title}>Community Hall & Facility Booking</Text>
          <Text style={styles.subtitle}>
            Reserve society banquet halls, party lawns, barbecue decks, and executive conference rooms with live slot verification and digital gate entry passes.
          </Text>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Active Bookings (This Month)</Text>
              <Text style={[styles.metricValue, { color: colors.primary[700] }]}>
                {summary.totalBookingsThisMonth} Bookings
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Upcoming Confirmed</Text>
              <Text style={[styles.metricValue, { color: colors.success.text }]}>
                {summary.upcomingConfirmedCount} Events
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Pending Scrutiny</Text>
              <Text style={[styles.metricValue, { color: colors.warning.text }]}>
                {summary.pendingApprovalsCount} Requests
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Security Deposits in Escrow</Text>
              <Text style={styles.metricValue}>
                ₹{summary.securityDepositsHeld.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons Top */}
        <View style={styles.headerActions}>
          {canBook && (
            <Button
              title="+ Book a Venue Now"
              variant="primary"
              size="md"
              onPress={() => handleOpenBooking()}
            />
          )}
          {canApprove && pendingApprovals.length > 0 && (
            <Button
              title={`⚖️ Review Requests (${pendingApprovals.length})`}
              variant="secondary"
              size="md"
              onPress={() => setActiveTab('approvals')}
            />
          )}
        </View>
      </View>

      {/* Primary Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tabButton, activeTab === 'venues' && styles.tabButtonActive]}
          onPress={() => setActiveTab('venues')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'venues' && styles.tabButtonTextActive]}>
            🏛️ Venues & Tariffs ({SOCIETY_FACILITIES.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === 'calendar' && styles.tabButtonActive]}
          onPress={() => setActiveTab('calendar')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'calendar' && styles.tabButtonTextActive]}>
            📅 Availability Calendar
          </Text>
        </Pressable>

        {canBook && (
          <Pressable
            style={[styles.tabButton, activeTab === 'my_bookings' && styles.tabButtonActive]}
            onPress={() => setActiveTab('my_bookings')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'my_bookings' && styles.tabButtonTextActive]}>
              🎟️ My Bookings ({myBookings.length})
            </Text>
          </Pressable>
        )}

        {canApprove && (
          <Pressable
            style={[styles.tabButton, activeTab === 'approvals' && styles.tabButtonActive]}
            onPress={() => setActiveTab('approvals')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'approvals' && styles.tabButtonTextActive]}>
              ⚖️ Approvals & Refunds {pendingApprovals.length > 0 && `(${pendingApprovals.length})`}
            </Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.tabButton, activeTab === 'rules' && styles.tabButtonActive]}
          onPress={() => setActiveTab('rules')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'rules' && styles.tabButtonTextActive]}>
            📜 Rules & Sound Policy
          </Text>
        </Pressable>
      </View>

      {/* ========================================================================= */}
      {/* TAB 1: VENUES & TARIFFS */}
      {/* ========================================================================= */}
      {activeTab === 'venues' && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Clubhouse Venues & Event Spaces</Text>
              <Text style={styles.sectionSubtitle}>
                Select an indoor or outdoor venue below to inspect capacity, amenities and tariffs.
              </Text>
            </View>
          </View>

          <View style={styles.venuesGrid}>
            {SOCIETY_FACILITIES.map((facility) => (
              <Card key={facility.id} variant="elevated" style={styles.venueCard}>
                <View style={styles.venueHeaderRow}>
                  <View>
                    <Text style={styles.venueTitle}>{facility.name}</Text>
                    <Text style={styles.venueTagline}>{facility.tagline}</Text>
                  </View>
                  <View style={styles.capacityBadge}>
                    <Text style={styles.capacityBadgeText}>👥 Max {facility.capacity} Guests</Text>
                  </View>
                </View>

                {/* Rates Table */}
                <View style={styles.ratesTable}>
                  <View style={styles.rateCol}>
                    <Text style={styles.rateSlotTitle}>Morning Slot</Text>
                    <Text style={styles.rateTime}>09:00 AM – 02:00 PM</Text>
                    <Text style={styles.rateAmount}>₹{facility.rates.morning.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={[styles.rateCol, styles.rateColHighlight]}>
                    <Text style={[styles.rateSlotTitle, { color: colors.primary[700] }]}>Evening Slot</Text>
                    <Text style={styles.rateTime}>04:00 PM – 10:30 PM</Text>
                    <Text style={[styles.rateAmount, { color: colors.primary[800] }]}>
                      ₹{facility.rates.evening.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.rateCol}>
                    <Text style={styles.rateSlotTitle}>Full Day</Text>
                    <Text style={styles.rateTime}>09:00 AM – 10:30 PM</Text>
                    <Text style={styles.rateAmount}>₹{facility.rates.full_day.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                <View style={styles.depositNotice}>
                  <Text style={styles.depositNoticeText}>
                    Refundable Security Deposit: <Text style={styles.boldText}>₹{facility.securityDeposit.toLocaleString('en-IN')}</Text> • Post-Event Cleaning: ₹{facility.cleaningFee}
                  </Text>
                </View>

                {/* Amenities Chips */}
                <Text style={styles.amenitiesHeader}>Included Facility Amenities:</Text>
                <View style={styles.amenitiesGrid}>
                  {facility.amenities.map((amenity, idx) => (
                    <View key={idx} style={styles.amenityChip}>
                      <Text style={styles.amenityChipText}>✓ {amenity}</Text>
                    </View>
                  ))}
                </View>

                {/* Footer Action */}
                <View style={styles.venueCardFooter}>
                  <Button
                    title="Check Availability Calendar"
                    variant="outline"
                    size="sm"
                    onPress={() => {
                      setSelectedVenueFilter(facility.id);
                      setActiveTab('calendar');
                    }}
                  />
                  {canBook && (
                    <Button
                      title="Book This Venue →"
                      variant="primary"
                      size="sm"
                      onPress={() => handleOpenBooking(facility.id)}
                    />
                  )}
                </View>
              </Card>
            ))}
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AVAILABILITY CALENDAR */}
      {/* ========================================================================= */}
      {activeTab === 'calendar' && (
        <View style={styles.sectionContainer}>
          <Card variant="outlined" style={styles.calendarControlCard}>
            <View style={styles.calendarControlRow}>
              {/* Date Input Selector */}
              <View style={styles.datePickerCol}>
                <Text style={styles.inputLabel}>Select Event Date (YYYY-MM-DD):</Text>
                <TextInput
                  style={styles.dateInput}
                  value={selectedDate}
                  onChangeText={setSelectedDate}
                  placeholder="2026-10-04"
                />
              </View>

              {/* Quick Date Pills */}
              <View style={styles.quickDateRow}>
                {[
                  { label: 'Tomorrow', offset: 1 },
                  { label: 'This Saturday', offset: 5 },
                  { label: 'This Sunday', offset: 6 },
                  { label: 'Next Weekend', offset: 12 },
                ].map((item, idx) => {
                  const d = new Date();
                  d.setDate(d.getDate() + item.offset);
                  const dateStr = d.toISOString().split('T')[0];
                  const isSel = selectedDate === dateStr;
                  return (
                    <Pressable
                      key={idx}
                      style={[styles.quickDateChip, isSel && styles.quickDateChipActive]}
                      onPress={() => setSelectedDate(dateStr)}
                    >
                      <Text style={[styles.quickDateText, isSel && styles.quickDateTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Card>

          {/* Availability Matrix for Selected Date */}
          <View style={styles.matrixHeaderRow}>
            <Text style={styles.sectionTitle}>
              Venue Slot Availability for {selectedDate}
            </Text>
          </View>

          <View style={styles.matrixList}>
            {SOCIETY_FACILITIES.map((facility) => {
              const morningAvail = checkSlotAvailability(facility.id, selectedDate, 'morning');
              const eveningAvail = checkSlotAvailability(facility.id, selectedDate, 'evening');
              const fullDayAvail = checkSlotAvailability(facility.id, selectedDate, 'full_day');

              return (
                <Card key={facility.id} variant="elevated" style={styles.matrixCard}>
                  <View style={styles.matrixCardHeader}>
                    <View>
                      <Text style={styles.matrixVenueTitle}>{facility.name}</Text>
                      <Text style={styles.matrixVenueCap}>Capacity: {facility.capacity} guests</Text>
                    </View>
                    {canBook && (
                      <Button
                        title="Book Venue"
                        variant="secondary"
                        size="sm"
                        onPress={() => handleOpenBooking(facility.id, selectedDate)}
                      />
                    )}
                  </View>

                  <View style={styles.slotsRow}>
                    {/* Morning Slot */}
                    <View
                      style={[
                        styles.slotCard,
                        morningAvail.isAvailable ? styles.slotCardAvailable : styles.slotCardBooked,
                      ]}
                    >
                      <View style={styles.slotTopRow}>
                        <Text style={styles.slotName}>Morning Slot</Text>
                        <Text
                          style={[
                            styles.slotBadge,
                            morningAvail.isAvailable ? styles.slotBadgeAvail : styles.slotBadgeBooked,
                          ]}
                        >
                          {morningAvail.isAvailable ? '🟢 AVAILABLE' : '🔴 BOOKED'}
                        </Text>
                      </View>
                      <Text style={styles.slotTiming}>09:00 AM – 02:00 PM</Text>
                      <Text style={styles.slotPrice}>₹{facility.rates.morning.toLocaleString('en-IN')}</Text>

                      {morningAvail.isAvailable ? (
                        canBook && (
                          <Button
                            title="Reserve Slot"
                            variant="primary"
                            size="sm"
                            onPress={() => handleOpenBooking(facility.id, selectedDate, 'morning')}
                            style={{ marginTop: spacing.xs }}
                          />
                        )
                      ) : (
                        <Text style={styles.bookedByText}>
                          Reserved: {morningAvail.existingBooking?.eventTitle} ({morningAvail.existingBooking?.userFlat})
                        </Text>
                      )}
                    </View>

                    {/* Evening Slot */}
                    <View
                      style={[
                        styles.slotCard,
                        eveningAvail.isAvailable ? styles.slotCardAvailable : styles.slotCardBooked,
                      ]}
                    >
                      <View style={styles.slotTopRow}>
                        <Text style={styles.slotName}>Evening Slot</Text>
                        <Text
                          style={[
                            styles.slotBadge,
                            eveningAvail.isAvailable ? styles.slotBadgeAvail : styles.slotBadgeBooked,
                          ]}
                        >
                          {eveningAvail.isAvailable ? '🟢 AVAILABLE' : '🔴 BOOKED'}
                        </Text>
                      </View>
                      <Text style={styles.slotTiming}>04:00 PM – 10:30 PM</Text>
                      <Text style={styles.slotPrice}>₹{facility.rates.evening.toLocaleString('en-IN')}</Text>

                      {eveningAvail.isAvailable ? (
                        canBook && (
                          <Button
                            title="Reserve Slot"
                            variant="primary"
                            size="sm"
                            onPress={() => handleOpenBooking(facility.id, selectedDate, 'evening')}
                            style={{ marginTop: spacing.xs }}
                          />
                        )
                      ) : (
                        <Text style={styles.bookedByText}>
                          Reserved: {eveningAvail.existingBooking?.eventTitle} ({eveningAvail.existingBooking?.userFlat})
                        </Text>
                      )}
                    </View>

                    {/* Full Day Slot */}
                    <View
                      style={[
                        styles.slotCard,
                        fullDayAvail.isAvailable ? styles.slotCardAvailable : styles.slotCardBooked,
                      ]}
                    >
                      <View style={styles.slotTopRow}>
                        <Text style={styles.slotName}>Full Day Slot</Text>
                        <Text
                          style={[
                            styles.slotBadge,
                            fullDayAvail.isAvailable ? styles.slotBadgeAvail : styles.slotBadgeBooked,
                          ]}
                        >
                          {fullDayAvail.isAvailable ? '🟢 AVAILABLE' : '🔴 UNAVAILABLE'}
                        </Text>
                      </View>
                      <Text style={styles.slotTiming}>09:00 AM – 10:30 PM</Text>
                      <Text style={styles.slotPrice}>₹{facility.rates.full_day.toLocaleString('en-IN')}</Text>

                      {fullDayAvail.isAvailable ? (
                        canBook && (
                          <Button
                            title="Reserve Full Day"
                            variant="outline"
                            size="sm"
                            onPress={() => handleOpenBooking(facility.id, selectedDate, 'full_day')}
                            style={{ marginTop: spacing.xs }}
                          />
                        )
                      ) : (
                        <Text style={styles.bookedByText}>
                          Slot conflict with partial day booking
                        </Text>
                      )}
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MY BOOKINGS */}
      {/* ========================================================================= */}
      {activeTab === 'my_bookings' && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>My Clubhouse & Facility Bookings</Text>
              <Text style={styles.sectionSubtitle}>
                Showing reservations for {user?.name || 'Resident'} ({user?.flatNumber || 'Flat B-402'})
              </Text>
            </View>
            {canBook && (
              <Button
                title="+ New Booking"
                variant="primary"
                size="sm"
                onPress={() => handleOpenBooking()}
              />
            )}
          </View>

          {myBookings.length === 0 ? (
            <Card variant="flat" style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptyDesc}>
                You have not booked any community hall or event venue yet. Celebrate birthdays, anniversaries or get-togethers in ApniSociety clubhouse.
              </Text>
              {canBook && (
                <Button
                  title="Explore Venues & Book Now"
                  variant="primary"
                  size="md"
                  onPress={() => handleOpenBooking()}
                  style={{ marginTop: spacing.md }}
                />
              )}
            </Card>
          ) : (
            <View style={styles.bookingsList}>
              {myBookings.map((booking) => (
                <Card key={booking.id} variant="elevated" style={styles.bookingCard}>
                  <View style={styles.bookingCardHeader}>
                    <View>
                      <Text style={styles.bookingNumber}>{booking.bookingNumber}</Text>
                      <Text style={styles.bookingFacilityName}>{booking.facilityName}</Text>
                    </View>
                    <StatusBadge
                      status={
                        booking.status === 'confirmed'
                          ? 'success'
                          : booking.status === 'pending_approval'
                          ? 'warning'
                          : booking.status === 'completed'
                          ? 'neutral'
                          : 'danger'
                      }
                      label={
                        booking.status === 'confirmed'
                          ? 'Confirmed & Passes Active'
                          : booking.status === 'pending_approval'
                          ? 'Awaiting Committee Approval'
                          : booking.status === 'completed'
                          ? 'Event Completed'
                          : 'Cancelled'
                      }
                    />
                  </View>

                  <Text style={styles.bookingEventTitle}>{booking.eventTitle}</Text>

                  <View style={styles.bookingMetaTable}>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>Date & Time Slot</Text>
                      <Text style={styles.metaValue}>📅 {booking.date}</Text>
                      <Text style={styles.metaSubValue}>{booking.slotLabel}</Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>Expected Guests</Text>
                      <Text style={styles.metaValue}>👥 {booking.expectedGuests} Guests</Text>
                      <Text style={styles.metaSubValue}>
                        {booking.cateringPermit ? 'Catering Permit Issued' : 'No External Catering'}
                      </Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>Rent + Security Deposit</Text>
                      <Text style={styles.metaValue}>
                        ₹{booking.totalAmount.toLocaleString('en-IN')} (Paid via {booking.paymentMethod})
                      </Text>
                      <Text style={styles.metaSubValue}>
                        Deposit: ₹{booking.securityDeposit.toLocaleString('en-IN')}{' '}
                        {booking.depositRefundStatus === 'refunded' ? '(Refunded)' : '(Held in Escrow)'}
                      </Text>
                    </View>
                  </View>

                  {/* Gate Pass Code banner */}
                  <View style={styles.gatePassNotice}>
                    <Text style={styles.gatePassNoticeText}>
                      Security Gate Entry Pass Code:{' '}
                      <Text style={styles.gatePassCodeText}>{booking.gatePassCode}</Text>
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.bookingCardFooter}>
                    <Text style={styles.bookedDateText}>Booked on {booking.bookedAt}</Text>
                    <View style={styles.cardActionsGroup}>
                      <Button
                        title="Digital Gate Pass 🎟️"
                        variant="secondary"
                        size="sm"
                        onPress={() => setSelectedGatePass(booking)}
                      />
                      {booking.status === 'pending_approval' && (
                        <Button
                          title="Cancel Booking"
                          variant="ghost"
                          size="sm"
                          onPress={() => handleCancelBooking(booking.id)}
                        />
                      )}
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: COMMITTEE APPROVALS & REFUNDS */}
      {/* ========================================================================= */}
      {activeTab === 'approvals' && canApprove && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Managing Committee Scrutiny & Refunds</Text>
              <Text style={styles.sectionSubtitle}>
                Review resident booking requests, verify maintenance dues clearance, and process post-event deposit refunds.
              </Text>
            </View>
          </View>

          {/* Pending Approval Requests */}
          <Text style={styles.subSectionTitle}>
            Pending Booking Requests ({pendingApprovals.length})
          </Text>

          {pendingApprovals.length === 0 ? (
            <Card variant="flat" style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyTitle}>All Bookings Scrutinized</Text>
              <Text style={styles.emptyDesc}>
                There are no pending hall booking applications awaiting committee confirmation.
              </Text>
            </Card>
          ) : (
            <View style={styles.bookingsList}>
              {pendingApprovals.map((booking) => (
                <Card key={booking.id} variant="elevated" style={styles.bookingCard}>
                  <View style={styles.bookingCardHeader}>
                    <View>
                      <Text style={styles.bookingNumber}>{booking.bookingNumber}</Text>
                      <Text style={styles.bookingFacilityName}>{booking.facilityName}</Text>
                    </View>
                    <StatusBadge status="pending" label="Pending Committee Scrutiny" />
                  </View>

                  <View style={styles.applicantBanner}>
                    <Text style={styles.applicantText}>
                      Applicant: <Text style={styles.boldText}>{booking.userName}</Text> ({booking.userRole}) • Flat {booking.userFlat} • Phone: {booking.userPhone}
                    </Text>
                    <Text style={styles.duesClearedBadge}>✓ Maintenance Dues Cleared</Text>
                  </View>

                  <Text style={styles.bookingEventTitle}>{booking.eventTitle}</Text>

                  <View style={styles.bookingMetaTable}>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>Date & Time Slot</Text>
                      <Text style={styles.metaValue}>📅 {booking.date}</Text>
                      <Text style={styles.metaSubValue}>{booking.slotLabel}</Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>Expected Guests</Text>
                      <Text style={styles.metaValue}>👥 {booking.expectedGuests} Guests</Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>Total Paid in Escrow</Text>
                      <Text style={styles.metaValue}>₹{booking.totalAmount.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>

                  {booking.specialRequests ? (
                    <View style={styles.specialReqBox}>
                      <Text style={styles.specialReqTitle}>Special Requests / Notes:</Text>
                      <Text style={styles.specialReqText}>"{booking.specialRequests}"</Text>
                    </View>
                  ) : null}

                  <View style={styles.bookingCardFooter}>
                    <Text style={styles.bookedDateText}>Submitted on {booking.bookedAt}</Text>
                    <View style={styles.cardActionsGroup}>
                      <Button
                        title="❌ Reject"
                        variant="danger"
                        size="sm"
                        onPress={() => {
                          setSelectedReviewBooking(booking);
                          setReviewNotes('Rejected: Conflicting society committee event.');
                        }}
                      />
                      <Button
                        title="✓ Approve & Issue Pass"
                        variant="primary"
                        size="sm"
                        onPress={() => {
                          setSelectedReviewBooking(booking);
                          setReviewNotes('Maintenance dues verified. Sound policy briefed. Approved.');
                        }}
                      />
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}

          {/* Deposit Refund Desk for Confirmed / Completed Bookings */}
          <View style={{ marginTop: spacing.xl }}>
            <Text style={styles.subSectionTitle}>Security Deposit Escrow & Refund Desk</Text>
            <Text style={styles.sectionSubtitle}>
              Release refundable security deposit (₹5,000 / ₹6,000) back to residents once post-event facility cleanliness has been inspected by housekeeping supervisor.
            </Text>

            <View style={[styles.bookingsList, { marginTop: spacing.md }]}>
              {allBookings
                .filter((b) => b.status === 'confirmed' || b.status === 'completed')
                .map((booking) => (
                  <Card key={booking.id} variant="outlined" style={styles.depositCard}>
                    <View style={styles.depositCardRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.depositCardTitle}>
                          {booking.bookingNumber} • {booking.facilityName}
                        </Text>
                        <Text style={styles.depositCardSub}>
                          Host: <Text style={styles.boldText}>{booking.userName}</Text> ({booking.userFlat}) • Event: {booking.date} ({booking.eventTitle})
                        </Text>
                        <Text style={styles.depositStatusLine}>
                          Security Deposit:{' '}
                          <Text style={styles.boldText}>₹{booking.securityDeposit.toLocaleString('en-IN')}</Text> • Status:{' '}
                          {booking.depositRefundStatus === 'refunded' ? (
                            <Text style={{ color: colors.success.text, fontWeight: typography.weights.bold }}>
                              ✓ Full Refund Issued (Ref: {booking.depositRefundRef})
                            </Text>
                          ) : booking.depositRefundStatus === 'partially_deducted' ? (
                            <Text style={{ color: colors.warning.text, fontWeight: typography.weights.bold }}>
                              ⚠️ Adjusted Refund (₹{booking.depositRefundAmount})
                            </Text>
                          ) : (
                            <Text style={{ color: colors.primary[700], fontWeight: typography.weights.bold }}>
                              Held in Escrow (Ready for Inspection & Release)
                            </Text>
                          )}
                        </Text>
                      </View>

                      {booking.depositRefundStatus === 'pending' && (
                        <Button
                          title="Process Deposit Refund 💳"
                          variant="secondary"
                          size="sm"
                          onPress={() => {
                            setSelectedRefundBooking(booking);
                            setRefundAmount(booking.securityDeposit.toString());
                            setRefundUtr(`IMPS-REF-${Date.now().toString().slice(-6)}`);
                          }}
                        />
                      )}
                    </View>
                  </Card>
                ))}
            </View>
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: RULES & SOUND POLICY */}
      {/* ========================================================================= */}
      {activeTab === 'rules' && (
        <View style={styles.sectionContainer}>
          <Card variant="elevated" style={styles.policyCard}>
            <View style={styles.policyHeader}>
              <Text style={styles.policyIcon}>🔊</Text>
              <View>
                <Text style={styles.policyTitle}>Clubhouse & Facility Booking Bye-Laws</Text>
                <Text style={styles.policySubtitle}>
                  Applicable to all Residents, Tenants & Commercial Decorator Vendors
                </Text>
              </View>
            </View>

            <View style={styles.rulesList}>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleBullet}>1️⃣</Text>
                <View style={styles.ruleContent}>
                  <Text style={styles.ruleHeading}>Strict Sound Curfew (10:00 PM Sharp)</Text>
                  <Text style={styles.ruleDesc}>
                    Under city residential noise pollution regulations, all amplified music, DJ systems, and public loudspeakers must be switched off by 10:00 PM. Sound levels must not exceed 65 dB at the boundary fence.
                  </Text>
                </View>
              </View>

              <View style={styles.ruleItem}>
                <Text style={styles.ruleBullet}>2️⃣</Text>
                <View style={styles.ruleContent}>
                  <Text style={styles.ruleHeading}>Security Deposit & Cleanliness Audit</Text>
                  <Text style={styles.ruleDesc}>
                    The refundable security deposit (₹5,000 for Community Hall, ₹6,000 for Lawn) is credited back within 24 hours of event conclusion, subject to inspection confirming no wall damage, broken furniture, or unsegregated garbage.
                  </Text>
                </View>
              </View>

              <View style={styles.ruleItem}>
                <Text style={styles.ruleBullet}>3️⃣</Text>
                <View style={styles.ruleContent}>
                  <Text style={styles.ruleHeading}>Catering & Waste Management</Text>
                  <Text style={styles.ruleDesc}>
                    Catering vendors must bring their own garbage bags and deposit food waste in the designated society organic composter pit near Gate 2. Open flame cooking cylinders are restricted to the designated outdoor pantry stall.
                  </Text>
                </View>
              </View>

              <View style={styles.ruleItem}>
                <Text style={styles.ruleBullet}>4️⃣</Text>
                <View style={styles.ruleContent}>
                  <Text style={styles.ruleHeading}>Digital Gate Entry Pass Verification</Text>
                  <Text style={styles.ruleDesc}>
                    Every confirmed reservation receives an official Security Gate Pass code. Outside caterers and guest vehicles must present this gate code for hassle-free entry at Gate 1 and Gate 2.
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: NEW BOOKING RESERVATION */}
      {/* ========================================================================= */}
      <Modal
        visible={showBookingModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isSubmittingBooking) setShowBookingModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Reserve Society Event Facility</Text>
                <Text style={styles.modalSubtitle}>
                  Host: {user?.name || 'Resident'} ({user?.flatNumber || 'Flat B-402'})
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  if (!isSubmittingBooking) setShowBookingModal(false);
                }}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {bookingError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠️ {bookingError}</Text>
                </View>
              ) : null}

              {/* Venue Selection */}
              <Text style={styles.inputLabel}>1. Select Clubhouse Venue *</Text>
              <View style={styles.venuePickerRow}>
                {SOCIETY_FACILITIES.map((facility) => {
                  const isSel = formVenue === facility.id;
                  return (
                    <Pressable
                      key={facility.id}
                      style={[styles.venuePickerChip, isSel && styles.venuePickerChipActive]}
                      onPress={() => setFormVenue(facility.id)}
                    >
                      <Text style={[styles.venuePickerName, isSel && styles.venuePickerNameActive]}>
                        {facility.name}
                      </Text>
                      <Text style={styles.venuePickerCap}>Capacity: {facility.capacity} guests</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Date & Slot */}
              <View style={[styles.twoColRow, isMobile && styles.twoColRowMobile]}>
                <View style={styles.twoColItem}>
                  <Text style={styles.inputLabel}>2. Event Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formDate}
                    onChangeText={setFormDate}
                    placeholder="2026-10-04"
                  />
                </View>
                <View style={styles.twoColItem}>
                  <Text style={styles.inputLabel}>3. Time Slot *</Text>
                  <View style={styles.slotToggleGroup}>
                    {(['morning', 'evening', 'full_day'] as const).map((s) => (
                      <Pressable
                        key={s}
                        style={[styles.slotToggleBtn, formSlot === s && styles.slotToggleBtnActive]}
                        onPress={() => setFormSlot(s)}
                      >
                        <Text
                          style={[
                            styles.slotToggleText,
                            formSlot === s && styles.slotToggleTextActive,
                          ]}
                        >
                          {s === 'morning' ? 'Morning' : s === 'evening' ? 'Evening' : 'Full Day'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              {/* Event Type & Expected Guests */}
              <View style={[styles.twoColRow, isMobile && styles.twoColRowMobile]}>
                <View style={styles.twoColItem}>
                  <Text style={styles.inputLabel}>4. Event Category *</Text>
                  <View style={styles.eventTypePicker}>
                    {Object.entries(EVENT_TYPE_LABELS).map(([k, label]) => (
                      <Pressable
                        key={k}
                        style={[
                          styles.eventTypeChip,
                          formEventType === k && styles.eventTypeChipActive,
                        ]}
                        onPress={() => setFormEventType(k as EventType)}
                      >
                        <Text
                          style={[
                            styles.eventTypeChipText,
                            formEventType === k && styles.eventTypeChipTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.twoColItem}>
                  <Text style={styles.inputLabel}>5. Expected Guests *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formGuests}
                    onChangeText={setFormGuests}
                    keyboardType="numeric"
                    placeholder="e.g. 80"
                  />
                  <Text style={styles.inputHint}>
                    Max capacity: {currentFormFacility.capacity} guests
                  </Text>
                </View>
              </View>

              {/* Event Title */}
              <Text style={styles.inputLabel}>6. Celebration / Event Title *</Text>
              <TextInput
                style={styles.modalInput}
                value={formEventTitle}
                onChangeText={setFormEventTitle}
                placeholder="e.g. Aarav's 5th Birthday & Family Dinner"
              />

              {/* Permits & Checkboxes */}
              <Text style={styles.inputLabel}>7. Permits & Sound Requisites</Text>
              <View style={styles.checkboxRow}>
                <Pressable
                  style={styles.checkboxItem}
                  onPress={() => setFormSoundSystem(!formSoundSystem)}
                >
                  <Text style={styles.checkIcon}>{formSoundSystem ? '☑️' : '⬜'}</Text>
                  <Text style={styles.checkLabel}>Audio Mic & Hall Sound System (Cutoff 10 PM)</Text>
                </Pressable>
                <Pressable
                  style={styles.checkboxItem}
                  onPress={() => setFormCateringPermit(!formCateringPermit)}
                >
                  <Text style={styles.checkIcon}>{formCateringPermit ? '☑️' : '⬜'}</Text>
                  <Text style={styles.checkLabel}>Commercial Catering & Decorator Gate Pass</Text>
                </Pressable>
              </View>

              {/* Special Requests */}
              <Text style={styles.inputLabel}>8. Special Arrangements / Setup Notes</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={formSpecialRequests}
                onChangeText={setFormSpecialRequests}
                placeholder="Any special table layout, power requirements, or extra chairs..."
                multiline
                numberOfLines={2}
              />

              {/* Event Invitation / ID Proof / Guest List Document Upload */}
              <FileUpload
                label="9. Event Invitation Card / ID Proof / Guest List (Optional)"
                description="Upload digital invitation card, resident ID proof, or decorator permit request"
                accept="image/*,.pdf,.doc,.docx"
                currentFileName={formAttachmentName}
                currentFileUrl={formAttachmentUrl}
                onFileSelect={(file) => {
                  setFormAttachmentName(file.name);
                  if (file.dataUrl) setFormAttachmentUrl(file.dataUrl);
                }}
                onClear={() => {
                  setFormAttachmentName('');
                  setFormAttachmentUrl('');
                }}
              />

              {/* Fee Breakdown Box */}
              <View style={styles.feeBreakdownCard}>
                <Text style={styles.feeBreakdownTitle}>Tariff & Deposit Breakdown:</Text>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Venue Rent ({SLOT_INFO[formSlot].label}):</Text>
                  <Text style={styles.feeVal}>₹{currentRent.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Refundable Security Deposit:</Text>
                  <Text style={styles.feeVal}>₹{currentDeposit.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Post-Event Deep Cleaning Fee:</Text>
                  <Text style={styles.feeVal}>₹{currentCleaning.toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.feeRow, styles.feeTotalRow]}>
                  <Text style={styles.feeTotalLabel}>Total Amount Payable:</Text>
                  <Text style={styles.feeTotalVal}>₹{currentTotal.toLocaleString('en-IN')}</Text>
                </View>
                <Text style={styles.feeDepositNote}>
                  * Security deposit of ₹{currentDeposit.toLocaleString('en-IN')} will be refunded to your account within 24 hours of event completion.
                </Text>
              </View>

              {/* Payment Rail */}
              <Text style={styles.inputLabel}>Payment Method *</Text>
              <View style={styles.paymentRailRow}>
                {(['UPI', 'Card', 'NetBanking'] as const).map((method) => (
                  <Pressable
                    key={method}
                    style={[
                      styles.paymentRailBtn,
                      formPaymentMethod === method && styles.paymentRailBtnActive,
                    ]}
                    onPress={() => setFormPaymentMethod(method)}
                  >
                    <Text
                      style={[
                        styles.paymentRailBtnText,
                        formPaymentMethod === method && styles.paymentRailBtnTextActive,
                      ]}
                    >
                      {method === 'UPI' ? '📱 UPI (GPay/PhonePe)' : method === 'Card' ? '💳 Debit / Credit Card' : '🏦 NetBanking'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="ghost"
                size="md"
                onPress={() => setShowBookingModal(false)}
                disabled={isSubmittingBooking}
              />
              <Button
                title={isSubmittingBooking ? 'Securing Slot...' : `Pay ₹${currentTotal.toLocaleString('en-IN')} & Confirm →`}
                variant="primary"
                size="md"
                onPress={handleSubmitBooking}
                disabled={isSubmittingBooking}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: DIGITAL GATE PASS & CONFIRMATION SLIP */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedGatePass}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedGatePass(null)}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.gatePassContainer}>
            <View style={styles.gatePassHeader}>
              <View>
                <Text style={styles.gatePassOrgTitle}>{APP_NAME} CLUBHOUSE</Text>
                <Text style={styles.gatePassDocTitle}>OFFICIAL EVENT GATE ENTRY PASS</Text>
              </View>
              <Pressable onPress={() => setSelectedGatePass(null)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.gatePassScroll} showsVerticalScrollIndicator={false}>
              {/* QR & Code Box */}
              <View style={styles.qrCard}>
                <View style={styles.qrIconBox}>
                  <Text style={styles.qrCodeIcon}>🏁</Text>
                  <Text style={styles.qrVerifiedText}>SECURITY AUTHORIZED</Text>
                </View>
                <View style={styles.passCodeBox}>
                  <Text style={styles.passCodeLabel}>Security Entry Pass Code:</Text>
                  <Text style={styles.passCodeBig}>{selectedGatePass?.gatePassCode}</Text>
                  <Text style={styles.passBookingNum}>Booking Ref: {selectedGatePass?.bookingNumber}</Text>
                </View>
              </View>

              {/* Event Particulars */}
              <View style={styles.passMetaTable}>
                <View style={styles.passMetaRow}>
                  <Text style={styles.passMetaLabel}>Reserved Venue:</Text>
                  <Text style={styles.passMetaVal}>{selectedGatePass?.facilityName}</Text>
                </View>
                <View style={styles.passMetaRow}>
                  <Text style={styles.passMetaLabel}>Event Title:</Text>
                  <Text style={styles.passMetaVal}>{selectedGatePass?.eventTitle}</Text>
                </View>
                <View style={styles.passMetaRow}>
                  <Text style={styles.passMetaLabel}>Date & Slot:</Text>
                  <Text style={styles.passMetaVal}>
                    {selectedGatePass?.date} • {selectedGatePass?.slotLabel}
                  </Text>
                </View>
                <View style={styles.passMetaRow}>
                  <Text style={styles.passMetaLabel}>Host / Resident:</Text>
                  <Text style={styles.passMetaVal}>
                    {selectedGatePass?.userName} ({selectedGatePass?.userFlat})
                  </Text>
                </View>
                <View style={styles.passMetaRow}>
                  <Text style={styles.passMetaLabel}>Expected Guests:</Text>
                  <Text style={styles.passMetaVal}>
                    {selectedGatePass?.expectedGuests} Guests (Gate 1 & Gate 2 authorized)
                  </Text>
                </View>
                <View style={styles.passMetaRow}>
                  <Text style={styles.passMetaLabel}>Commercial Permits:</Text>
                  <Text style={styles.passMetaVal}>
                    {selectedGatePass?.cateringPermit ? '✓ Catering & Vendor Vehicle Pass Active' : 'No External Commercial Setup'}
                  </Text>
                </View>
              </View>

              {/* Security Guard Instructions */}
              <View style={styles.guardInstructions}>
                <Text style={styles.guardInstTitle}>Instructions for Society Security Staff:</Text>
                <Text style={styles.guardInstLine}>
                  1. Allow entry to guest four-wheelers subject to parking capacity behind Tower C & D.
                </Text>
                <Text style={styles.guardInstLine}>
                  2. Commercial catering vehicles must unload at Gate 2 service ramp.
                </Text>
                <Text style={styles.guardInstLine}>
                  3. Strictly enforce 10:00 PM music curfew without exception.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Close"
                variant="ghost"
                size="md"
                onPress={() => setSelectedGatePass(null)}
              />
              <Button
                title="🖨️ Print / Download Gate Pass"
                variant="primary"
                size="md"
                onPress={() => alert('Gate pass PDF download initiated.')}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: COMMITTEE REVIEW MODAL */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedReviewBooking}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isReviewing) setSelectedReviewBooking(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Scrutinize Hall Booking Application</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedReviewBooking?.bookingNumber} • Applicant: {selectedReviewBooking?.userName} ({selectedReviewBooking?.userFlat})
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  if (!isReviewing) setSelectedReviewBooking(null);
                }}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              <View style={styles.reviewSummaryBox}>
                <Text style={styles.reviewSummaryTitle}>{selectedReviewBooking?.eventTitle}</Text>
                <Text style={styles.reviewSummarySub}>
                  Venue: {selectedReviewBooking?.facilityName}
                </Text>
                <Text style={styles.reviewSummarySub}>
                  Date: {selectedReviewBooking?.date} • {selectedReviewBooking?.slotLabel}
                </Text>
                <Text style={styles.reviewSummarySub}>
                  Expected Attendance: {selectedReviewBooking?.expectedGuests} Guests
                </Text>
                <Text style={styles.reviewSummarySub}>
                  Total Paid: ₹{selectedReviewBooking?.totalAmount.toLocaleString('en-IN')} (Deposit: ₹{selectedReviewBooking?.securityDeposit.toLocaleString('en-IN')})
                </Text>
              </View>

              <Text style={styles.inputLabel}>Committee Review Notes</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={reviewNotes}
                onChangeText={setReviewNotes}
                placeholder="Notes on maintenance dues clearance, catering guidelines..."
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="ghost"
                size="md"
                onPress={() => setSelectedReviewBooking(null)}
                disabled={isReviewing}
              />
              <Button
                title="Reject Request"
                variant="danger"
                size="md"
                onPress={() => handleReviewAction('rejected')}
                disabled={isReviewing}
              />
              <Button
                title="Confirm & Issue Gate Pass"
                variant="primary"
                size="md"
                onPress={() => handleReviewAction('confirmed')}
                disabled={isReviewing}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: PROCESS DEPOSIT REFUND */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedRefundBooking}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isRefunding) setSelectedRefundBooking(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Release Security Deposit</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedRefundBooking?.bookingNumber} • Host: {selectedRefundBooking?.userName} ({selectedRefundBooking?.userFlat})
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  if (!isRefunding) setSelectedRefundBooking(null);
                }}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              <View style={styles.reviewSummaryBox}>
                <Text style={styles.reviewSummaryTitle}>
                  Original Security Deposit Held: ₹{selectedRefundBooking?.securityDeposit.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.reviewSummarySub}>
                  Venue: {selectedRefundBooking?.facilityName} (Event Date: {selectedRefundBooking?.date})
                </Text>
              </View>

              <Text style={styles.inputLabel}>Refund Amount (₹) *</Text>
              <TextInput
                style={styles.modalInput}
                value={refundAmount}
                onChangeText={setRefundAmount}
                keyboardType="numeric"
                placeholder="5000"
              />
              <Text style={styles.inputHint}>
                Enter full amount (₹{selectedRefundBooking?.securityDeposit}) or adjusted amount if cleaning deductions apply.
              </Text>

              <Text style={styles.inputLabel}>Bank IMPS / UPI Reference # *</Text>
              <TextInput
                style={styles.modalInput}
                value={refundUtr}
                onChangeText={setRefundUtr}
                placeholder="IMPS-REF-992100"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="ghost"
                size="md"
                onPress={() => setSelectedRefundBooking(null)}
                disabled={isRefunding}
              />
              <Button
                title={isRefunding ? 'Processing...' : 'Confirm Deposit Refund →'}
                variant="primary"
                size="md"
                onPress={handleConfirmRefund}
                disabled={isRefunding}
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
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerPill: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  headerPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
    letterSpacing: 0.5,
  },
  societyTag: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  societyTagText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    fontWeight: typography.weights.medium,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  metricItem: {
    flex: 1,
    minWidth: 140,
  },
  metricLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    fontWeight: typography.weights.medium,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tabsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tabButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tabButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  tabButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  tabButtonTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },
  sectionContainer: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  subSectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  venuesGrid: {
    gap: spacing.md,
  },
  venueCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  venueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  venueTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  venueTagline: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  capacityBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  capacityBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primary[700],
  },
  ratesTable: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginVertical: spacing.sm,
  },
  rateCol: {
    flex: 1,
    minWidth: 120,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  rateColHighlight: {
    backgroundColor: '#eff6ff',
    borderColor: colors.primary[200],
  },
  rateSlotTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  rateTime: {
    fontSize: 10,
    color: colors.neutral[500],
    marginVertical: 2,
  },
  rateAmount: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  depositNotice: {
    backgroundColor: '#fffbeb',
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  depositNoticeText: {
    fontSize: typography.sizes.xs,
    color: '#92400e',
    textAlign: 'center',
  },
  boldText: {
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  amenitiesHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  amenityChip: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  amenityChipText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  venueCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border.light,
  },
  calendarControlCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  calendarControlRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  datePickerCol: {
    flex: 1,
    minWidth: 200,
  },
  dateInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    minHeight: 40,
  },
  quickDateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  quickDateChip: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  quickDateChipActive: {
    backgroundColor: colors.primary[600],
  },
  quickDateText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[700],
    fontWeight: typography.weights.medium,
  },
  quickDateTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.bold,
  },
  matrixHeaderRow: {
    marginBottom: spacing.sm,
  },
  matrixList: {
    gap: spacing.md,
  },
  matrixCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  matrixCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  matrixVenueTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  matrixVenueCap: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slotCard: {
    flex: 1,
    minWidth: 180,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  slotCardAvailable: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  slotCardBooked: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  slotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  slotName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  slotBadge: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  slotBadgeAvail: {
    color: colors.success.text,
  },
  slotBadgeBooked: {
    color: colors.danger.text,
  },
  slotTiming: {
    fontSize: 11,
    color: colors.neutral[600],
  },
  slotPrice: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginVertical: 4,
  },
  bookedByText: {
    fontSize: 10,
    color: colors.danger.text,
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyCard: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptyDesc: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 400,
  },
  bookingsList: {
    gap: spacing.md,
  },
  bookingCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  bookingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  bookingNumber: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    fontWeight: typography.weights.medium,
  },
  bookingFacilityName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  bookingEventTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.primary[800],
    marginVertical: 4,
  },
  bookingMetaTable: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.xs,
  },
  metaCol: {
    flex: 1,
    minWidth: 140,
  },
  metaLabel: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  metaValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  metaSubValue: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: 1,
  },
  gatePassNotice: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  gatePassNoticeText: {
    fontSize: typography.sizes.xs,
    color: colors.primary[900],
  },
  gatePassCodeText: {
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  bookingCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderColor: colors.border.light,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  bookedDateText: {
    fontSize: 11,
    color: colors.neutral[400],
  },
  cardActionsGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  applicantBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  applicantText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  duesClearedBadge: {
    fontSize: 11,
    color: colors.success.text,
    fontWeight: typography.weights.bold,
  },
  specialReqBox: {
    backgroundColor: '#fffbeb',
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  specialReqTitle: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#92400e',
  },
  specialReqText: {
    fontSize: 11,
    color: '#78350f',
    fontStyle: 'italic',
  },
  depositCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  depositCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  depositCardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  depositCardSub: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  depositStatusLine: {
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
    marginTop: 4,
  },
  policyCard: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  policyIcon: {
    fontSize: 32,
  },
  policyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  policySubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  rulesList: {
    gap: spacing.lg,
  },
  ruleItem: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  ruleBullet: {
    fontSize: 20,
  },
  ruleContent: {
    flex: 1,
  },
  ruleHeading: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  ruleDesc: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
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
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    padding: spacing.lg,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border.light,
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
  modalCloseBtn: {
    padding: spacing.xs,
  },
  modalCloseText: {
    fontSize: 18,
    color: colors.neutral[400],
    fontWeight: typography.weights.bold,
  },
  modalScrollBody: {
    maxHeight: 520,
  },
  errorBanner: {
    backgroundColor: colors.danger.background,
    borderWidth: 1,
    borderColor: colors.danger.border,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    color: colors.danger.text,
    fontWeight: typography.weights.medium,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    minHeight: 40,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  venuePickerRow: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  venuePickerChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  venuePickerChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: colors.primary[500],
  },
  venuePickerName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  venuePickerNameActive: {
    color: colors.primary[800],
  },
  venuePickerCap: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  twoColRowMobile: {
    flexDirection: 'column',
    gap: 0,
  },
  twoColItem: {
    flex: 1,
  },
  slotToggleGroup: {
    flexDirection: 'row',
    gap: 4,
    minHeight: 40,
    alignItems: 'center',
  },
  slotToggleBtn: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
  },
  slotToggleBtnActive: {
    backgroundColor: colors.primary[600],
  },
  slotToggleText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[700],
    fontWeight: typography.weights.medium,
  },
  slotToggleTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.bold,
  },
  eventTypePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  eventTypeChip: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  eventTypeChipActive: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[500],
  },
  eventTypeChipText: {
    fontSize: 10,
    color: colors.neutral[700],
  },
  eventTypeChipTextActive: {
    color: colors.primary[800],
    fontWeight: typography.weights.bold,
  },
  checkboxRow: {
    gap: spacing.xs,
    marginTop: 4,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  checkIcon: {
    fontSize: 14,
  },
  checkLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
  },
  feeBreakdownCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.md,
    gap: 4,
  },
  feeBreakdownTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.neutral[600],
    marginBottom: 4,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feeLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  feeVal: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  feeTotalRow: {
    borderTopWidth: 1,
    borderColor: colors.border.light,
    paddingTop: 6,
    marginTop: 4,
  },
  feeTotalLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary[900],
  },
  feeTotalVal: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },
  feeDepositNote: {
    fontSize: 10,
    color: colors.neutral[500],
    fontStyle: 'italic',
    marginTop: 4,
  },
  paymentRailRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  paymentRailBtn: {
    flex: 1,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
  },
  paymentRailBtnActive: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  paymentRailBtnText: {
    fontSize: 11,
    color: colors.neutral[700],
    fontWeight: typography.weights.medium,
  },
  paymentRailBtnTextActive: {
    color: colors.primary[800],
    fontWeight: typography.weights.bold,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border.light,
  },
  gatePassContainer: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '92%',
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  gatePassHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderColor: colors.border.light,
    paddingBottom: spacing.sm,
  },
  gatePassOrgTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  gatePassDocTitle: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
    letterSpacing: 0.5,
  },
  gatePassScroll: {
    maxHeight: 480,
  },
  qrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  qrIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  qrCodeIcon: {
    fontSize: 32,
  },
  qrVerifiedText: {
    fontSize: 8,
    fontWeight: typography.weights.bold,
    color: colors.success.text,
    marginTop: 2,
  },
  passCodeBox: {
    flex: 1,
  },
  passCodeLabel: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  passCodeBig: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary[800],
    letterSpacing: 1.5,
  },
  passBookingNum: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: 2,
  },
  passMetaTable: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: 6,
  },
  passMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  passMetaLabel: {
    width: 140,
    fontSize: 11,
    color: colors.neutral[500],
    fontWeight: typography.weights.medium,
  },
  passMetaVal: {
    flex: 1,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  guardInstructions: {
    backgroundColor: '#eff6ff',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: 4,
  },
  guardInstTitle: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.primary[900],
  },
  guardInstLine: {
    fontSize: 10,
    color: colors.primary[800],
    lineHeight: 14,
  },
  reviewSummaryBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: 4,
  },
  reviewSummaryTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  reviewSummarySub: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
});
