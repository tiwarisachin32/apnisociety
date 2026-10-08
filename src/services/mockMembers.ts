import {
  MemberSummaryMetrics,
  NewMemberPayload,
  SocietyMember,
  SocietyStaffMember,
  SocietyUnit,
  VehicleDetail,
} from '../types/members';
import { generateRealSocietyUnits, getSocietyStorageKey, isSocietyCleanData } from './dataManager';
import { getActiveSocietyId, getSocietyConfig } from './societyConfig';

const STORAGE_MEMBERS_KEY = 'apnisociety_members_data';
const STORAGE_STAFF_KEY = 'apnisociety_staff_data';
const STORAGE_UNITS_KEY = 'apnisociety_units_data';

export const INITIAL_MEMBERS: SocietyMember[] = [
  {
    id: 'user-003',
    name: 'Col. S. K. Verma',
    email: 'president@apnisociety.com',
    phone: '9876543212',
    alternatePhone: '9811223344',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    residentType: 'committee',
    block: 'Tower C',
    flatNumber: 'C-101',
    intercomNumber: '3101',
    parkingSlots: ['P-01', 'P-02'],
    isCommitteeMember: true,
    committeeRole: 'president',
    committeeRoleTitle: 'President (RWA Management Committee)',
    committeeBio: 'Veteran Army veteran leading community welfare, transparent governance, and capital projects.',
    committeePriorityOrder: 1,
    verificationStatus: 'verified',
    moveInDate: '2019-03-15',
    bloodGroup: 'O+',
    emergencyContact: {
      name: 'Mrs. Sarita Verma',
      relation: 'Spouse',
      phone: '9876543299',
    },
    vehicles: [
      {
        id: 'veh-01',
        type: 'four_wheeler',
        registrationNumber: 'DL 01 AB 1971',
        makeModel: 'Toyota Innova Crysta (Silver)',
        parkingSlot: 'P-01',
        rfidTag: 'RFID-C101-A',
      },
      {
        id: 'veh-02',
        type: 'two_wheeler',
        registrationNumber: 'DL 01 XY 4422',
        makeModel: 'Royal Enfield Classic 350',
        parkingSlot: 'P-02',
        rfidTag: 'RFID-C101-B',
      },
    ],
    familyMembers: [
      { id: 'fam-01', name: 'Sarita Verma', relation: 'Spouse', phone: '9876543299', isEmergencyContact: true },
      { id: 'fam-02', name: 'Major Siddharth Verma', relation: 'Son', isEmergencyContact: false },
    ],
    hasPets: false,
    notes: 'Available for resident consultations every Saturday 10:00 AM - 12:00 PM at Society Office.',
  },
  {
    id: 'user-005',
    name: 'Meera Joshi',
    email: 'vicepresident@apnisociety.com',
    phone: '9876543214',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    residentType: 'committee',
    block: 'Tower D',
    flatNumber: 'D-302',
    intercomNumber: '4302',
    parkingSlots: ['P-34'],
    isCommitteeMember: true,
    committeeRole: 'vice_president',
    committeeRoleTitle: 'Vice President (Operations & Civil Works)',
    committeeBio: 'Senior Infrastructure Consultant overseeing lift modernization, water tank hygiene, and security protocols.',
    committeePriorityOrder: 2,
    verificationStatus: 'verified',
    moveInDate: '2020-07-10',
    bloodGroup: 'A+',
    emergencyContact: {
      name: 'Nikhil Joshi',
      relation: 'Spouse',
      phone: '9876500112',
    },
    vehicles: [
      {
        id: 'veh-03',
        type: 'four_wheeler',
        registrationNumber: 'DL 03 CD 8890',
        makeModel: 'Hyundai Creta (White)',
        parkingSlot: 'P-34',
        rfidTag: 'RFID-D302-A',
      },
    ],
    familyMembers: [
      { id: 'fam-03', name: 'Nikhil Joshi', relation: 'Spouse', phone: '9876500112', isEmergencyContact: true },
      { id: 'fam-04', name: 'Aarav Joshi', relation: 'Son', isEmergencyContact: false },
    ],
    hasPets: true,
    petDetails: 'Golden Retriever (Buddy) - Fully vaccinated',
  },
  {
    id: 'user-004',
    name: 'Amit Saxena',
    email: 'treasurer@apnisociety.com',
    phone: '9876543213',
    alternatePhone: '9820011223',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    residentType: 'committee',
    block: 'Tower B',
    flatNumber: 'B-104',
    intercomNumber: '2104',
    parkingSlots: ['P-14'],
    isCommitteeMember: true,
    committeeRole: 'treasurer',
    committeeRoleTitle: 'Treasurer (Accounts, Audits & Billing)',
    committeeBio: 'Chartered Accountant overseeing society budget, quarterly statutory audits, and sinking fund investments.',
    committeePriorityOrder: 3,
    verificationStatus: 'verified',
    moveInDate: '2019-11-20',
    bloodGroup: 'B+',
    emergencyContact: {
      name: 'Pooja Saxena',
      relation: 'Spouse',
      phone: '9876511223',
    },
    vehicles: [
      {
        id: 'veh-04',
        type: 'four_wheeler',
        registrationNumber: 'DL 02 EF 4567',
        makeModel: 'Honda City (Dark Grey)',
        parkingSlot: 'P-14',
        rfidTag: 'RFID-B104-A',
      },
    ],
    familyMembers: [
      { id: 'fam-05', name: 'Pooja Saxena', relation: 'Spouse', phone: '9876511223', isEmergencyContact: true },
    ],
    hasPets: false,
  },
  {
    id: 'user-006',
    name: 'Dr. Ananya Sen',
    email: 'secretary@apnisociety.com',
    phone: '9876543220',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    residentType: 'committee',
    block: 'Tower A',
    flatNumber: 'A-501',
    intercomNumber: '1501',
    parkingSlots: ['P-51'],
    isCommitteeMember: true,
    committeeRole: 'general_secretary',
    committeeRoleTitle: 'General Secretary (Documentation & Legal)',
    committeeBio: 'Professor and legal liaison handling AGM minutes, registrar compliance, and vendor contracts.',
    committeePriorityOrder: 4,
    verificationStatus: 'verified',
    moveInDate: '2021-01-05',
    bloodGroup: 'AB+',
    emergencyContact: {
      name: 'Prof. Debashis Sen',
      relation: 'Father',
      phone: '9876522334',
    },
    vehicles: [
      {
        id: 'veh-05',
        type: 'ev',
        registrationNumber: 'DL 01 EV 2024',
        makeModel: 'Tata Nexon EV (Teal Blue)',
        parkingSlot: 'P-51',
        rfidTag: 'RFID-A501-EV',
      },
    ],
    familyMembers: [
      { id: 'fam-06', name: 'Prof. Debashis Sen', relation: 'Father', phone: '9876522334', isEmergencyContact: true },
    ],
    hasPets: false,
  },
  {
    id: 'user-007',
    name: 'Rajesh Khurana',
    email: 'security.lead@apnisociety.com',
    phone: '9876543225',
    residentType: 'committee',
    block: 'Tower C',
    flatNumber: 'C-304',
    intercomNumber: '3304',
    parkingSlots: ['P-29'],
    isCommitteeMember: true,
    committeeRole: 'security_lead',
    committeeRoleTitle: 'Joint Secretary (Security & Access Control)',
    committeeBio: 'Managing gate biometric registers, CCTV monitoring, visitor protocols, and intercom lines.',
    committeePriorityOrder: 5,
    verificationStatus: 'verified',
    moveInDate: '2020-02-14',
    bloodGroup: 'O+',
    emergencyContact: {
      name: 'Geeta Khurana',
      relation: 'Spouse',
      phone: '9876533445',
    },
    vehicles: [
      {
        id: 'veh-06',
        type: 'four_wheeler',
        registrationNumber: 'DL 07 GH 7890',
        makeModel: 'Maruti Suzuki Brezza (Red)',
        parkingSlot: 'P-29',
        rfidTag: 'RFID-C304-A',
      },
    ],
    familyMembers: [
      { id: 'fam-07', name: 'Geeta Khurana', relation: 'Spouse', isEmergencyContact: true },
    ],
    hasPets: false,
  },
  {
    id: 'user-008',
    name: 'Sunita Narang',
    email: 'events@apnisociety.com',
    phone: '9876543228',
    residentType: 'committee',
    block: 'Tower B',
    flatNumber: 'B-203',
    intercomNumber: '2203',
    parkingSlots: ['P-21'],
    isCommitteeMember: true,
    committeeRole: 'cultural_head',
    committeeRoleTitle: 'Cultural & Sports Committee Lead',
    committeeBio: 'Organizing Diwali Mela, Independence Day celebrations, sports tournaments, and community gatherings.',
    committeePriorityOrder: 6,
    verificationStatus: 'verified',
    moveInDate: '2021-08-12',
    bloodGroup: 'B+',
    emergencyContact: {
      name: 'Deepak Narang',
      relation: 'Spouse',
      phone: '9876544556',
    },
    vehicles: [
      {
        id: 'veh-07',
        type: 'two_wheeler',
        registrationNumber: 'DL 05 JK 1122',
        makeModel: 'TVS Jupiter 125',
        parkingSlot: 'P-21',
      },
    ],
    familyMembers: [
      { id: 'fam-08', name: 'Deepak Narang', relation: 'Spouse', isEmergencyContact: true },
      { id: 'fam-09', name: 'Kavya Narang', relation: 'Daughter', isEmergencyContact: false },
    ],
    hasPets: false,
  },
  {
    id: 'user-001',
    name: 'Rahul Sharma',
    email: 'rahul.owner@apnisociety.com',
    phone: '9876543210',
    alternatePhone: '9810098100',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    residentType: 'owner',
    block: 'Tower B',
    flatNumber: 'B-402',
    intercomNumber: '2402',
    parkingSlots: ['P-42', 'B1-12'],
    isCommitteeMember: false,
    verificationStatus: 'verified',
    moveInDate: '2022-04-01',
    bloodGroup: 'B+',
    emergencyContact: {
      name: 'Sneha Sharma',
      relation: 'Spouse',
      phone: '9876555667',
    },
    vehicles: [
      {
        id: 'veh-08',
        type: 'four_wheeler',
        registrationNumber: 'DL 08 AB 1234',
        makeModel: 'Kia Seltos (Gravity Grey)',
        parkingSlot: 'P-42',
        rfidTag: 'RFID-B402-A',
      },
      {
        id: 'veh-09',
        type: 'two_wheeler',
        registrationNumber: 'DL 08 CD 5678',
        makeModel: 'Ather 450X EV (Space Grey)',
        parkingSlot: 'B1-12',
        rfidTag: 'RFID-B402-B',
      },
    ],
    familyMembers: [
      { id: 'fam-10', name: 'Sneha Sharma', relation: 'Spouse', phone: '9876555667', isEmergencyContact: true },
      { id: 'fam-11', name: 'Vihaan Sharma', relation: 'Son', isEmergencyContact: false },
    ],
    hasPets: true,
    petDetails: 'Beagle puppy (Leo), vaccinated on 10 Aug 2026',
    notes: 'Member of Green Energy society initiative.',
  },
  {
    id: 'user-002',
    name: 'Priya Patel',
    email: 'priya.tenant@apnisociety.com',
    phone: '9876543211',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    residentType: 'tenant',
    block: 'Tower A',
    flatNumber: 'A-201',
    intercomNumber: '1201',
    parkingSlots: ['P-19'],
    isCommitteeMember: false,
    verificationStatus: 'verified',
    moveInDate: '2025-05-01',
    leaseExpiryDate: '2027-04-30',
    bloodGroup: 'O+',
    emergencyContact: {
      name: 'Karan Patel',
      relation: 'Brother',
      phone: '9876566778',
    },
    vehicles: [
      {
        id: 'veh-10',
        type: 'two_wheeler',
        registrationNumber: 'DL 04 EF 9012',
        makeModel: 'Honda Activa 6G (Matte Black)',
        parkingSlot: 'P-19',
        rfidTag: 'RFID-A201-A',
      },
    ],
    familyMembers: [
      { id: 'fam-12', name: 'Ritu Patel', relation: 'Roommate', phone: '9876577889', isEmergencyContact: false },
    ],
    hasPets: false,
    notes: 'Registered tenant with verified police verification on record.',
  },
  {
    id: 'user-009',
    name: 'Vikramaditya Malhotra',
    email: 'v.malhotra@consulting.com',
    phone: '9876543231',
    residentType: 'owner',
    block: 'Tower A',
    flatNumber: 'A-302',
    intercomNumber: '1302',
    parkingSlots: ['P-31'],
    isCommitteeMember: false,
    verificationStatus: 'verified',
    moveInDate: '2020-09-18',
    bloodGroup: 'A-',
    emergencyContact: {
      name: 'Rupal Malhotra',
      relation: 'Spouse',
      phone: '9876588990',
    },
    vehicles: [
      {
        id: 'veh-11',
        type: 'four_wheeler',
        registrationNumber: 'DL 02 MN 3344',
        makeModel: 'Skoda Slavia (Carbon Steel)',
        parkingSlot: 'P-31',
        rfidTag: 'RFID-A302-A',
      },
    ],
    familyMembers: [
      { id: 'fam-13', name: 'Rupal Malhotra', relation: 'Spouse', isEmergencyContact: true },
      { id: 'fam-14', name: 'Arya Malhotra', relation: 'Daughter', isEmergencyContact: false },
    ],
    hasPets: false,
  },
  {
    id: 'user-010',
    name: 'Farhan Akhtar & Zainab',
    email: 'farhan.akhtar@creative.in',
    phone: '9876543240',
    residentType: 'tenant',
    block: 'Tower C',
    flatNumber: 'C-202',
    intercomNumber: '3202',
    parkingSlots: ['P-26'],
    isCommitteeMember: false,
    verificationStatus: 'verified',
    moveInDate: '2025-02-01',
    leaseExpiryDate: '2027-01-31',
    bloodGroup: 'AB+',
    emergencyContact: {
      name: 'Zainab Akhtar',
      relation: 'Spouse',
      phone: '9876599001',
    },
    vehicles: [
      {
        id: 'veh-12',
        type: 'four_wheeler',
        registrationNumber: 'MH 02 PQ 8899',
        makeModel: 'Volkswagen Taigun (Curcuma Yellow)',
        parkingSlot: 'P-26',
      },
    ],
    familyMembers: [
      { id: 'fam-15', name: 'Zainab Akhtar', relation: 'Spouse', phone: '9876599001', isEmergencyContact: true },
    ],
    hasPets: true,
    petDetails: 'Persian Cat (Snowy)',
  },
  {
    id: 'user-011',
    name: 'Jaspreet Singh',
    email: 'jaspreet.singh@logistics.com',
    phone: '9876543245',
    residentType: 'owner',
    block: 'Tower D',
    flatNumber: 'D-101',
    intercomNumber: '4101',
    parkingSlots: ['P-11', 'P-12'],
    isCommitteeMember: false,
    verificationStatus: 'verified',
    moveInDate: '2019-06-10',
    bloodGroup: 'B+',
    emergencyContact: {
      name: 'Harpreet Kaur',
      relation: 'Spouse',
      phone: '9876500223',
    },
    vehicles: [
      {
        id: 'veh-13',
        type: 'four_wheeler',
        registrationNumber: 'DL 01 ST 4455',
        makeModel: 'Mahindra XUV700 (Midnight Black)',
        parkingSlot: 'P-11',
      },
    ],
    familyMembers: [
      { id: 'fam-16', name: 'Harpreet Kaur', relation: 'Spouse', isEmergencyContact: true },
      { id: 'fam-17', name: 'Gurkirat Singh', relation: 'Son', isEmergencyContact: false },
    ],
    hasPets: false,
  },
  {
    id: 'user-012',
    name: 'Kavita Radhakrishnan',
    email: 'kavita.rk@finance.co',
    phone: '9876543250',
    residentType: 'owner',
    block: 'Tower D',
    flatNumber: 'D-404',
    intercomNumber: '4404',
    parkingSlots: ['P-48'],
    isCommitteeMember: false,
    verificationStatus: 'verified',
    moveInDate: '2023-10-15',
    bloodGroup: 'O-',
    emergencyContact: {
      name: 'R. Radhakrishnan',
      relation: 'Father',
      phone: '9876500334',
    },
    vehicles: [
      {
        id: 'veh-14',
        type: 'two_wheeler',
        registrationNumber: 'KA 03 VW 6677',
        makeModel: 'Ola S1 Pro (Coral Glam)',
        parkingSlot: 'P-48',
      },
    ],
    familyMembers: [],
    hasPets: false,
  },
  {
    id: 'user-013',
    name: 'Rohan Deshmukh',
    email: 'rohan.tech@startup.io',
    phone: '9876543255',
    residentType: 'tenant',
    block: 'Tower A',
    flatNumber: 'A-404',
    intercomNumber: '1404',
    parkingSlots: ['P-39'],
    isCommitteeMember: false,
    verificationStatus: 'verified',
    moveInDate: '2026-01-10',
    leaseExpiryDate: '2026-12-31',
    bloodGroup: 'B+',
    emergencyContact: {
      name: 'Sunil Deshmukh',
      relation: 'Father',
      phone: '9876500445',
    },
    vehicles: [
      {
        id: 'veh-15',
        type: 'four_wheeler',
        registrationNumber: 'MH 12 YZ 1212',
        makeModel: 'Tata Altroz (White)',
        parkingSlot: 'P-39',
      },
    ],
    familyMembers: [],
    hasPets: false,
  },
  {
    id: 'user-014',
    name: 'Smt. Pushpa Devi',
    email: 'pushpadevi.elder@apnisociety.com',
    phone: '9876543260',
    residentType: 'owner',
    block: 'Tower B',
    flatNumber: 'B-301',
    intercomNumber: '2301',
    parkingSlots: ['P-27'],
    isCommitteeMember: false,
    verificationStatus: 'verified',
    moveInDate: '2019-01-10',
    bloodGroup: 'O+',
    emergencyContact: {
      name: 'Manish Goyal',
      relation: 'Son',
      phone: '9810012345',
    },
    vehicles: [],
    familyMembers: [
      { id: 'fam-18', name: 'Manish Goyal', relation: 'Son', phone: '9810012345', isEmergencyContact: true },
    ],
    hasPets: false,
    notes: 'Senior citizen living alone; emergency priority contact marked with security gate.',
  },
  {
    id: 'user-015',
    name: 'Tanvi Shah',
    email: 'tanvi.shah99@gmail.com',
    phone: '9876543270',
    residentType: 'tenant',
    block: 'Tower C',
    flatNumber: 'C-402',
    intercomNumber: '3402',
    parkingSlots: ['P-44'],
    isCommitteeMember: false,
    verificationStatus: 'pending_verification',
    moveInDate: '2026-09-25',
    leaseExpiryDate: '2027-09-24',
    bloodGroup: 'A+',
    emergencyContact: {
      name: 'Bhavin Shah',
      relation: 'Brother',
      phone: '9876500556',
    },
    vehicles: [
      {
        id: 'veh-16',
        type: 'two_wheeler',
        registrationNumber: 'GJ 01 ZA 9900',
        makeModel: 'Suzuki Access 125',
        parkingSlot: 'P-44',
      },
    ],
    familyMembers: [],
    hasPets: false,
    notes: 'Recently moved in; rent agreement submitted, police verification awaiting committee sign-off.',
  },
];

export const INITIAL_STAFF: SocietyStaffMember[] = [
  {
    id: 'staff-01',
    name: 'Ram Bahadur Thapa',
    category: 'security',
    categoryTitle: 'Head Security Supervisor',
    phone: '9876501001',
    shift: 'Day Shift (07:00 AM - 07:00 PM)',
    gateAssigned: 'Gate 1 (Main Entrance & Boom Barrier)',
    policeVerified: true,
    badgeNumber: 'SEC-001',
    joiningDate: '2021-04-10',
    emergencyContact: '9876501099',
  },
  {
    id: 'staff-02',
    name: 'Jitendra Kumar',
    category: 'security',
    categoryTitle: 'Night Security Guard',
    phone: '9876501002',
    shift: 'Night Shift (07:00 PM - 07:00 AM)',
    gateAssigned: 'Gate 1 (Main Entrance)',
    policeVerified: true,
    badgeNumber: 'SEC-002',
    joiningDate: '2022-08-15',
    emergencyContact: '9876501098',
  },
  {
    id: 'staff-03',
    name: 'Rameshwar Yadav',
    category: 'electrician',
    categoryTitle: 'Licensed Senior Electrician & DG Operator',
    phone: '9876501003',
    shift: 'General Shift (08:30 AM - 05:30 PM)',
    policeVerified: true,
    badgeNumber: 'TECH-101',
    joiningDate: '2020-03-01',
    emergencyContact: '9876501097',
  },
  {
    id: 'staff-04',
    name: 'Santosh Kumar',
    category: 'plumber',
    categoryTitle: 'Society Plumber & Overhead Pump Tech',
    phone: '9876501004',
    shift: 'Morning & Evening (06:00 AM - 02:00 PM, on call)',
    policeVerified: true,
    badgeNumber: 'TECH-102',
    joiningDate: '2021-11-20',
    emergencyContact: '9876501096',
  },
  {
    id: 'staff-05',
    name: 'Sunita Bai',
    category: 'housekeeping',
    categoryTitle: 'Housekeeping & Waste Segregation Lead',
    phone: '9876501005',
    shift: 'Morning Shift (07:00 AM - 03:00 PM)',
    policeVerified: true,
    badgeNumber: 'HK-201',
    joiningDate: '2022-01-15',
    emergencyContact: '9876501095',
  },
  {
    id: 'staff-06',
    name: 'Baldev Singh',
    category: 'manager',
    categoryTitle: 'Estate & Facility Operations Manager',
    phone: '9876501006',
    shift: 'Office Shift (09:00 AM - 06:00 PM, Tue-Sun)',
    gateAssigned: 'RWA Estate Office (Clubhouse Ground Floor)',
    policeVerified: true,
    badgeNumber: 'MGT-001',
    joiningDate: '2019-01-01',
    emergencyContact: '9876501094',
  },
];

export const INITIAL_UNITS: SocietyUnit[] = [
  {
    id: 'unit-a101',
    block: 'Tower A',
    flatNumber: 'A-101',
    floor: 1,
    areaSqFt: 1450,
    occupancyStatus: 'vacant',
    parkingSlots: ['P-03'],
    maintenanceDueAmount: 0,
    ownerName: 'Sunil Kulkarni (NRI)',
    ownerContact: 'sunil.kulkarni@gmail.com',
  },
  {
    id: 'unit-a201',
    block: 'Tower A',
    flatNumber: 'A-201',
    floor: 2,
    areaSqFt: 1450,
    occupancyStatus: 'rented',
    primaryResidentId: 'user-002',
    primaryResidentName: 'Priya Patel',
    ownerName: 'Vivek Singhal',
    ownerContact: '9811009988',
    parkingSlots: ['P-19'],
    maintenanceDueAmount: 0,
  },
  {
    id: 'unit-a302',
    block: 'Tower A',
    flatNumber: 'A-302',
    floor: 3,
    areaSqFt: 1850,
    occupancyStatus: 'owner_occupied',
    primaryResidentId: 'user-009',
    primaryResidentName: 'Vikramaditya Malhotra',
    parkingSlots: ['P-31'],
    maintenanceDueAmount: 0,
  },
  {
    id: 'unit-a404',
    block: 'Tower A',
    flatNumber: 'A-404',
    floor: 4,
    areaSqFt: 1450,
    occupancyStatus: 'rented',
    primaryResidentId: 'user-013',
    primaryResidentName: 'Rohan Deshmukh',
    ownerName: 'Deepak Roy',
    parkingSlots: ['P-39'],
    maintenanceDueAmount: 3850,
  },
  {
    id: 'unit-a501',
    block: 'Tower A',
    flatNumber: 'A-501',
    floor: 5,
    areaSqFt: 2200,
    occupancyStatus: 'owner_occupied',
    primaryResidentId: 'user-006',
    primaryResidentName: 'Dr. Ananya Sen',
    parkingSlots: ['P-51'],
    maintenanceDueAmount: 0,
  },
  {
    id: 'unit-b104',
    block: 'Tower B',
    flatNumber: 'B-104',
    floor: 1,
    areaSqFt: 1850,
    occupancyStatus: 'owner_occupied',
    primaryResidentId: 'user-004',
    primaryResidentName: 'Amit Saxena',
    parkingSlots: ['P-14'],
    maintenanceDueAmount: 0,
  },
  {
    id: 'unit-b201',
    block: 'Tower B',
    flatNumber: 'B-201',
    floor: 2,
    areaSqFt: 1450,
    occupancyStatus: 'vacant',
    parkingSlots: ['P-18'],
    maintenanceDueAmount: 1200,
    ownerName: 'Arvind & Neha Gupta',
    ownerContact: '9822001122',
  },
  {
    id: 'unit-b203',
    block: 'Tower B',
    flatNumber: 'B-203',
    floor: 2,
    areaSqFt: 1850,
    occupancyStatus: 'owner_occupied',
    primaryResidentId: 'user-008',
    primaryResidentName: 'Sunita Narang',
    parkingSlots: ['P-21'],
    maintenanceDueAmount: 0,
  },
  {
    id: 'unit-b301',
    block: 'Tower B',
    flatNumber: 'B-301',
    floor: 3,
    areaSqFt: 1450,
    occupancyStatus: 'owner_occupied',
    primaryResidentId: 'user-014',
    primaryResidentName: 'Smt. Pushpa Devi',
    parkingSlots: ['P-27'],
    maintenanceDueAmount: 0,
  },
  {
    id: 'unit-b402',
    block: 'Tower B',
    flatNumber: 'B-402',
    floor: 4,
    areaSqFt: 1850,
    occupancyStatus: 'owner_occupied',
    primaryResidentId: 'user-001',
    primaryResidentName: 'Rahul Sharma',
    parkingSlots: ['P-42', 'B1-12'],
    maintenanceDueAmount: 0,
  },
  {
    id: 'unit-c101',
    block: 'Tower C',
    flatNumber: 'C-101',
    floor: 1,
    areaSqFt: 2200,
    occupancyStatus: 'owner_occupied',
    primaryResidentId: 'user-003',
    primaryResidentName: 'Col. S. K. Verma',
    parkingSlots: ['P-01', 'P-02'],
    maintenanceDueAmount: 0,
  },
  {
    id: 'unit-c202',
    block: 'Tower C',
    flatNumber: 'C-202',
    floor: 2,
    areaSqFt: 1450,
    occupancyStatus: 'rented',
    primaryResidentId: 'user-010',
    primaryResidentName: 'Farhan Akhtar & Zainab',
    ownerName: 'Manish Bhatia',
    parkingSlots: ['P-26'],
    maintenanceDueAmount: 0,
  },
  {
    id: 'unit-c304',
    block: 'Tower C',
    flatNumber: 'C-304',
    floor: 3,
    areaSqFt: 1850,
    occupancyStatus: 'owner_occupied',
    primaryResidentId: 'user-007',
    primaryResidentName: 'Rajesh Khurana',
    parkingSlots: ['P-29'],
    maintenanceDueAmount: 0,
  },
  {
    id: 'unit-c402',
    block: 'Tower C',
    flatNumber: 'C-402',
    floor: 4,
    areaSqFt: 1450,
    occupancyStatus: 'rented',
    primaryResidentId: 'user-015',
    primaryResidentName: 'Tanvi Shah',
    ownerName: 'Sudhir Mehra',
    parkingSlots: ['P-44'],
    maintenanceDueAmount: 0,
  },
  {
    id: 'unit-d101',
    block: 'Tower D',
    flatNumber: 'D-101',
    floor: 1,
    areaSqFt: 1850,
    occupancyStatus: 'owner_occupied',
    primaryResidentId: 'user-011',
    primaryResidentName: 'Jaspreet Singh',
    parkingSlots: ['P-11', 'P-12'],
    maintenanceDueAmount: 0,
  },
  {
    id: 'unit-d302',
    block: 'Tower D',
    flatNumber: 'D-302',
    floor: 3,
    areaSqFt: 2200,
    occupancyStatus: 'owner_occupied',
    primaryResidentId: 'user-005',
    primaryResidentName: 'Meera Joshi',
    parkingSlots: ['P-34'],
    maintenanceDueAmount: 0,
  },
  {
    id: 'unit-d404',
    block: 'Tower D',
    flatNumber: 'D-404',
    floor: 4,
    areaSqFt: 1850,
    occupancyStatus: 'owner_occupied',
    primaryResidentId: 'user-012',
    primaryResidentName: 'Kavita Radhakrishnan',
    parkingSlots: ['P-48'],
    maintenanceDueAmount: 0,
  },
];

export function getStoredMembers(): SocietyMember[] {
  if (typeof window === 'undefined') return INITIAL_MEMBERS;
  try {
    const activeId = getActiveSocietyId();
    const key = getSocietyStorageKey(STORAGE_MEMBERS_KEY, activeId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isSocietyCleanData(activeId)) {
        // Return the onboarded president if exists in custom users
        const customRaw = localStorage.getItem('apnisociety_custom_users');
        if (customRaw) {
          const customUsers = JSON.parse(customRaw);
          const pres = customUsers.find((u: any) => u.societyId === activeId);
          if (pres) {
            const presMember: SocietyMember = {
              id: pres.id,
              name: pres.name,
              email: pres.email,
              phone: pres.phone,
              flatNumber: pres.flatNumber || 'A-101',
              block: pres.block || 'Tower A',
              intercomNumber: '1001',
              parkingSlots: ['P-01'],
              residentType: 'committee',
              isCommitteeMember: true,
              committeeRole: 'president',
              committeeRoleTitle: pres.roleTitle || 'President',
              verificationStatus: 'verified',
              moveInDate: new Date().toISOString().split('T')[0],
              vehicles: [],
              familyMembers: [],
              hasPets: false,
              emergencyContact: {
                name: 'Society Office',
                relation: 'Administration',
                phone: pres.phone,
              },
            };
            return [presMember];
          }
        }
        return [];
      }
      localStorage.setItem(key, JSON.stringify(INITIAL_MEMBERS));
      return INITIAL_MEMBERS;
    }
    return JSON.parse(raw);
  } catch {
    return isSocietyCleanData(getActiveSocietyId()) ? [] : INITIAL_MEMBERS;
  }
}

export function saveMembers(members: SocietyMember[]): void {
  if (typeof window === 'undefined') return;
  try {
    const activeId = getActiveSocietyId();
    const key = getSocietyStorageKey(STORAGE_MEMBERS_KEY, activeId);
    localStorage.setItem(key, JSON.stringify(members));
  } catch {
    // Ignore storage errors
  }
}

export function getStoredStaff(): SocietyStaffMember[] {
  if (typeof window === 'undefined') return isSocietyCleanData() ? [] : INITIAL_STAFF;
  try {
    const activeId = getActiveSocietyId();
    const key = getSocietyStorageKey(STORAGE_STAFF_KEY, activeId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isSocietyCleanData(activeId)) return [];
      localStorage.setItem(key, JSON.stringify(INITIAL_STAFF));
      return INITIAL_STAFF;
    }
    return JSON.parse(raw);
  } catch {
    return isSocietyCleanData(getActiveSocietyId()) ? [] : INITIAL_STAFF;
  }
}

export function saveStaff(staff: SocietyStaffMember[]): void {
  if (typeof window === 'undefined') return;
  try {
    const activeId = getActiveSocietyId();
    const key = getSocietyStorageKey(STORAGE_STAFF_KEY, activeId);
    localStorage.setItem(key, JSON.stringify(staff));
  } catch {}
}

export function getStoredUnits(): SocietyUnit[] {
  if (typeof window === 'undefined') return isSocietyCleanData() ? [] : INITIAL_UNITS;
  try {
    const activeId = getActiveSocietyId();
    const key = getSocietyStorageKey(STORAGE_UNITS_KEY, activeId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (isSocietyCleanData(activeId)) {
        const config = getSocietyConfig();
        const units = generateRealSocietyUnits(config);
        localStorage.setItem(key, JSON.stringify(units));
        return units;
      }
      localStorage.setItem(key, JSON.stringify(INITIAL_UNITS));
      return INITIAL_UNITS;
    }
    return JSON.parse(raw);
  } catch {
    return isSocietyCleanData(getActiveSocietyId()) ? [] : INITIAL_UNITS;
  }
}

export function saveUnits(units: SocietyUnit[]): void {
  if (typeof window === 'undefined') return;
  try {
    const activeId = getActiveSocietyId();
    const key = getSocietyStorageKey(STORAGE_UNITS_KEY, activeId);
    localStorage.setItem(key, JSON.stringify(units));
  } catch {
    // Ignore storage errors
  }
}

export function getAllMembers(): SocietyMember[] {
  return getStoredMembers();
}

export function getMemberById(id: string): SocietyMember | undefined {
  const members = getStoredMembers();
  return members.find((m) => m.id === id);
}

export function getCommitteeMembers(): SocietyMember[] {
  const members = getStoredMembers();
  return members
    .filter((m) => m.isCommitteeMember)
    .sort((a, b) => (a.committeePriorityOrder || 99) - (b.committeePriorityOrder || 99));
}

export function getAllStaff(): SocietyStaffMember[] {
  return getStoredStaff();
}

export function getAllUnits(): SocietyUnit[] {
  return getStoredUnits();
}

export function getMemberSummaryMetrics(): MemberSummaryMetrics {
  const members = getStoredMembers();
  const staff = getStoredStaff();
  const units = getStoredUnits();

  const totalMembers = members.length;
  const totalFlats = units.length;
  const ownerOccupiedCount = units.filter((u) => u.occupancyStatus === 'owner_occupied').length;
  const tenantCount = units.filter((u) => u.occupancyStatus === 'rented').length;
  const vacantCount = units.filter((u) => u.occupancyStatus === 'vacant').length;
  const committeeCount = members.filter((m) => m.isCommitteeMember).length;
  const pendingVerificationCount = members.filter((m) => m.verificationStatus === 'pending_verification').length;
  const activeStaffCount = staff.length;
  const registeredVehiclesCount = members.reduce((sum, m) => sum + (m.vehicles?.length || 0), 0);

  return {
    totalMembers,
    totalFlats,
    ownerOccupiedCount,
    tenantCount,
    vacantCount,
    committeeCount,
    pendingVerificationCount,
    activeStaffCount,
    registeredVehiclesCount,
  };
}

export function addMember(payload: NewMemberPayload): SocietyMember {
  const members = getStoredMembers();
  const newId = `user-${Date.now()}`;

  const vehicles: VehicleDetail[] = [];
  if (payload.vehicleNumber && payload.vehicleNumber.trim()) {
    vehicles.push({
      id: `veh-${Date.now()}`,
      type: payload.vehicleType || 'four_wheeler',
      registrationNumber: payload.vehicleNumber.trim().toUpperCase(),
      makeModel: payload.vehicleModel || 'Registered Vehicle',
      parkingSlot: payload.parkingSlot || 'Assigned Slot',
    });
  }

  const roleTitleMap: Record<string, string> = {
    president: 'President (Management Committee)',
    vice_president: 'Vice President (Operations)',
    treasurer: 'Treasurer (Accounts & Finance)',
    general_secretary: 'General Secretary',
    joint_secretary: 'Joint Secretary',
    cultural_head: 'Cultural & Sports Lead',
    security_lead: 'Security & Access Lead',
    committee_member: 'Committee Member',
  };

  const newMember: SocietyMember = {
    id: newId,
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone.trim(),
    residentType: payload.residentType,
    block: payload.block,
    flatNumber: payload.flatNumber.trim().toUpperCase(),
    intercomNumber: payload.intercomNumber || `${payload.flatNumber.replace(/\D/g, '')}`,
    parkingSlots: payload.parkingSlot ? [payload.parkingSlot.trim().toUpperCase()] : [],
    isCommitteeMember: Boolean(payload.isCommitteeMember),
    committeeRole: payload.committeeRole,
    committeeRoleTitle: payload.committeeRole ? roleTitleMap[payload.committeeRole] : undefined,
    verificationStatus: 'verified',
    moveInDate: payload.moveInDate || new Date().toISOString().split('T')[0],
    leaseExpiryDate: payload.leaseExpiryDate,
    bloodGroup: payload.bloodGroup,
    hasPets: Boolean(payload.hasPets),
    emergencyContact: {
      name: payload.emergencyContactName?.trim() || 'Next of Kin',
      relation: payload.emergencyContactRelation?.trim() || 'Family',
      phone: payload.emergencyContactPhone?.trim() || payload.phone.trim(),
    },
    vehicles,
    familyMembers: [],
  };

  const updated = [newMember, ...members];
  saveMembers(updated);

  // Update corresponding unit occupancy if matching flat found
  const units = getStoredUnits();
  const matchedUnitIndex = units.findIndex(
    (u) => u.flatNumber.toLowerCase() === payload.flatNumber.trim().toLowerCase()
  );
  if (matchedUnitIndex >= 0) {
    units[matchedUnitIndex].occupancyStatus =
      payload.residentType === 'tenant' ? 'rented' : 'owner_occupied';
    units[matchedUnitIndex].primaryResidentId = newId;
    units[matchedUnitIndex].primaryResidentName = payload.name.trim();
    saveUnits([...units]);
  }

  return newMember;
}

export function updateMember(id: string, updates: Partial<SocietyMember>): SocietyMember {
  const members = getStoredMembers();
  const index = members.findIndex((m) => m.id === id);
  if (index === -1) {
    throw new Error(`Member ${id} not found`);
  }

  const updatedMember = { ...members[index], ...updates };
  members[index] = updatedMember;
  saveMembers([...members]);
  return updatedMember;
}

export function verifyMember(id: string): SocietyMember {
  return updateMember(id, { verificationStatus: 'verified' });
}

export function rejectMember(id: string): SocietyMember {
  return updateMember(id, { verificationStatus: 'rejected' });
}

export function deleteMember(id: string): void {
  const members = getStoredMembers();
  const filtered = members.filter((m) => m.id !== id);
  saveMembers(filtered);
}

export function resetDemoMembers(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_MEMBERS_KEY);
    localStorage.removeItem(STORAGE_STAFF_KEY);
    localStorage.removeItem(STORAGE_UNITS_KEY);
  }
}
