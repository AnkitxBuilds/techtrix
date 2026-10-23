import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  deleteUser,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrorHandler';
import { UserRole } from '../types';

export interface UserProfileDoc {
  id: string;
  email: string;
  role: UserRole;
  entityId?: string;
  displayName?: string;
  orgName?: string;
  createdAt: string;
}

/**
 * Format Firebase Auth and Firestore errors into clear, user-friendly messages.
 */
export function formatAuthError(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  if (typeof error === 'string') {
    if (
      error.includes('permission-denied') ||
      error.includes('Missing or insufficient permissions') ||
      error.includes('"operationType":"create"')
    ) {
      return 'Unauthorized profile creation: You do not have permission to register this profile in Firestore. Check security rules.';
    }
    return error;
  }

  const code: string = error.code || '';
  const message: string = error.message || '';

  // 1. Duplicate email
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Please sign in instead.';
  }

  // 2. Weak password
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters including letters and numbers.';
  }

  // 3. Disabled authentication providers
  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password authentication is currently disabled in your Firebase project. An administrator must enable Email/Password under Firebase Console -> Authentication -> Sign-in method. You may also use Google Sign In below.';
  }

  // 4. Cancelled Google sign-in
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Google sign-in was cancelled before completion. Please try again.';
  }

  // 5. Unauthorized Firestore writes
  if (
    code === 'permission-denied' ||
    message.includes('permission-denied') ||
    message.includes('Missing or insufficient permissions') ||
    message.includes('"operationType":"create"')
  ) {
    return 'Unauthorized profile creation: You do not have permission to register this profile in Firestore. Check security rules.';
  }

  // Additional common Firebase Auth errors
  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
  }

  if (code === 'auth/invalid-email') {
    return 'Invalid email address format. Please enter a valid email.';
  }

  if (
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-credential'
  ) {
    return 'Invalid email or password. Please verify your credentials and try again.';
  }

  if (code === 'auth/too-many-requests') {
    return 'Access temporarily blocked due to too many failed attempts. Please try again later.';
  }

  if (code === 'auth/network-request-failed') {
    return 'Network connection error. Please verify your internet connection and try again.';
  }

  if (code === 'auth/user-disabled') {
    return 'This account has been disabled. Please contact an administrator.';
  }

  if (message.startsWith('Firebase: ')) {
    return message.replace(/^Firebase:\s*/, '').replace(/\s*\([a-z0-9\/-]+\)\.?$/i, '').trim();
  }

  return message || 'An error occurred during authentication. Please try again.';
}

/**
 * Check if a user is explicitly provisioned in the /admins collection in Firestore.
 * Admin privileges are NEVER granted based on email match alone.
 */
export async function checkIsAdmin(uid: string): Promise<boolean> {
  if (!uid) return false;
  try {
    const adminRef = doc(db, 'admins', uid);
    const snap = await getDoc(adminRef);
    return snap.exists();
  } catch {
    return false;
  }
}

export async function getUserProfile(uid: string): Promise<UserProfileDoc | null> {
  const userRef = doc(db, 'users', uid);
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      // Check if user is an accredited admin in the admins collection
      const isAdmin = await checkIsAdmin(uid);
      if (isAdmin) {
        return {
          id: uid,
          email: auth.currentUser?.email || '',
          role: 'admin',
          displayName: auth.currentUser?.displayName || 'System Admin',
          createdAt: new Date().toISOString(),
        };
      }
      return null;
    }
    const data = snap.data() as UserProfileDoc;
    // Check if user has an active admin record
    const isAdmin = await checkIsAdmin(uid);
    if (isAdmin) {
      data.role = 'admin';
    }
    return data;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<UserProfileDoc | null> {
  const cleanEmail = (email || '').trim();
  let cred;
  try {
    cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
  } catch (authError: any) {
    throw new Error(formatAuthError(authError));
  }

  let profile = await getUserProfile(cred.user.uid);
  if (!profile) {
    const isAdmin = await checkIsAdmin(cred.user.uid);
    profile = {
      id: cred.user.uid,
      email: cred.user.email || cleanEmail,
      role: isAdmin ? 'admin' : 'donor',
      displayName: cred.user.displayName || cleanEmail.split('@')[0],
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'users', cred.user.uid), profile);
    } catch (firestoreError: any) {
      throw new Error(formatAuthError(firestoreError));
    }
  }
  return profile;
}

export async function registerWithEmail(
  email: string,
  pass: string,
  role: 'donor' | 'recipient',
  entityId?: string,
  displayName?: string,
  orgName?: string
): Promise<UserProfileDoc> {
  const cleanEmail = (email || '').trim();
  if (!cleanEmail) {
    throw new Error('Please provide a valid email address.');
  }

  if (!pass || pass.length < 6) {
    throw new Error('Password is too weak. Please use at least 6 characters including letters and numbers.');
  }

  // Strict role enforcement: users cannot self-assign admin privileges
  if (role !== 'donor' && role !== 'recipient') {
    throw new Error('Invalid registration role. Only donor and recipient roles are allowed.');
  }

  // Step 1: Create user in Firebase Authentication
  let cred;
  try {
    cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  } catch (authError: any) {
    throw new Error(formatAuthError(authError));
  }

  // Step 2: Prepare user profile document (UID matches Auth UID)
  const profile: UserProfileDoc = {
    id: cred.user.uid,
    email: cred.user.email || cleanEmail,
    role: role, // Strictly 'donor' | 'recipient' - no email matching for admin
    entityId: entityId || '',
    displayName: displayName?.trim() || (cred.user.displayName || cleanEmail.split('@')[0]),
    ...(orgName?.trim() ? { orgName: orgName.trim() } : {}),
    createdAt: new Date().toISOString(),
  };

  // Step 3: Write profile to Firestore
  try {
    await setDoc(doc(db, 'users', cred.user.uid), profile);
  } catch (firestoreError: any) {
    // Account recovery: Firebase Auth created the account, but Firestore profile write failed.
    // Clean up the orphaned Firebase Auth account so the user is not locked out with an uninitialized record.
    try {
      await deleteUser(cred.user);
    } catch (deleteErr) {
      console.error('Failed to clean up orphaned Firebase Auth account after profile write failure:', deleteErr);
    }

    throw new Error(formatAuthError(firestoreError));
  }

  return profile;
}

export async function loginWithGoogle(
  desiredRole?: UserRole,
  desiredOrgName?: string
): Promise<UserProfileDoc | null> {
  const provider = new GoogleAuthProvider();
  let cred;
  try {
    cred = await signInWithPopup(auth, provider);
  } catch (authError: any) {
    throw new Error(formatAuthError(authError));
  }

  let profile = await getUserProfile(cred.user.uid);
  if (!profile) {
    const email = cred.user.email || '';
    const isAdmin = await checkIsAdmin(cred.user.uid);
    const assignedRole: UserRole = isAdmin
      ? 'admin'
      : (desiredRole === 'recipient' ? 'recipient' : 'donor');

    profile = {
      id: cred.user.uid,
      email,
      role: assignedRole,
      displayName: cred.user.displayName || (email ? email.split('@')[0] : 'Google User'),
      ...(desiredOrgName?.trim() ? { orgName: desiredOrgName.trim() } : {}),
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'users', cred.user.uid), profile);
    } catch (firestoreError: any) {
      throw new Error(formatAuthError(firestoreError));
    }
  }
  return profile;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
