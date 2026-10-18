import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firestoreDatabaseId as required by skill guidelines
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validation connection test on startup as mandated by skill
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'connection_health'));
    return true;
  } catch (error) {
    // If not found or permissions, it still reached the server
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline connection check failed.');
      return false;
    }
    return true;
  }
}

/**
 * Synchronizes newly created Society, its President, and clean configuration to Firestore.
 * When a new society is registered, its database is created in Firestore without dummy data.
 * All subsequent entries will be performed by the society committee.
 */
export async function syncNewSocietyToFirestore(
  society: any,
  presidentUser: any,
  welcomeNotice?: any
): Promise<void> {
  try {
    // 1. Record Society Document
    const societyDocRef = doc(db, 'societies', society.id);
    await setDoc(societyDocRef, {
      id: society.id,
      name: society.name,
      code: society.code,
      registrationNumber: society.registrationNumber || '',
      city: society.city || '',
      state: society.state || '',
      totalUnits: Number(society.totalUnits) || 120,
      presidentName: society.presidentName,
      presidentEmail: society.presidentEmail,
      presidentPhone: society.presidentPhone,
      isCleanProduction: true,
      status: 'active',
      createdAt: society.createdAt || new Date().toISOString(),
    });

    // 2. Record President User Profile
    if (presidentUser && presidentUser.id) {
      const userDocRef = doc(db, 'users', presidentUser.id);
      await setDoc(userDocRef, {
        uid: presidentUser.id,
        name: presidentUser.name,
        email: presidentUser.email,
        phone: presidentUser.phone,
        role: 'president',
        unitNumber: presidentUser.flatNumber || 'A-101',
        createdAt: new Date().toISOString(),
      });

      // 3. Record President in Members Directory
      const memberDocRef = doc(db, 'members', presidentUser.id);
      await setDoc(memberDocRef, {
        id: presidentUser.id,
        name: presidentUser.name,
        unitNumber: presidentUser.flatNumber || 'A-101',
        type: 'committee',
        phone: presidentUser.phone,
        email: presidentUser.email,
        verificationStatus: 'verified',
        createdAt: new Date().toISOString(),
      });
    }

    // 4. Record Welcome Announcement if provided
    if (welcomeNotice && welcomeNotice.id) {
      const noticeDocRef = doc(db, 'announcements', welcomeNotice.id);
      await setDoc(noticeDocRef, {
        id: welcomeNotice.id,
        title: welcomeNotice.title,
        content: welcomeNotice.message,
        priority: 'normal',
        sender: 'President',
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `societies/${society.id}`);
  }
}

