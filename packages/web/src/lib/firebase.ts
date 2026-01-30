import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { env } from "./env";

// Check if we have valid Firebase credentials
const hasValidFirebaseConfig = Boolean(
  env.firebase.apiKey &&
  env.firebase.apiKey !== "your-api-key" &&
  env.firebase.projectId
);

const firebaseConfig = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId: env.firebase.appId,
};

// ============================================================================
// MOCK AUTH FOR LOCAL DEVELOPMENT
// ============================================================================

interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  photoURL: string | null;
  getIdToken: () => Promise<string>;
}

const MOCK_STORAGE_KEY = "mock_auth_user";
let mockCurrentUser: MockUser | null = null;
let mockAuthListeners: ((user: MockUser | null) => void)[] = [];

function createMockUser(email: string, displayName?: string): MockUser {
  const uid = `mock-uid-${email.replace(/[^a-z0-9]/gi, "-")}`;
  return {
    uid,
    email,
    displayName: displayName || email.split("@")[0],
    emailVerified: true,
    photoURL: null,
    // Encode user info in mock token so API can decode it
    getIdToken: async () => `mock-token::${uid}::${email}`,
  };
}

function loadMockUser(): MockUser | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(MOCK_STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      getIdToken: async () => `mock-token::${parsed.uid}::${parsed.email}`,
    };
  }
  return null;
}

function saveMockUser(user: MockUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    const { getIdToken, ...serializable } = user;
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(serializable));
  } else {
    localStorage.removeItem(MOCK_STORAGE_KEY);
  }
}

function notifyMockListeners(user: MockUser | null) {
  mockAuthListeners.forEach((cb) => cb(user));
}

// Initialize mock user from storage
if (typeof window !== "undefined" && !hasValidFirebaseConfig) {
  mockCurrentUser = loadMockUser();
  // Notify listeners on next tick
  setTimeout(() => notifyMockListeners(mockCurrentUser), 0);
}

// Mock auth functions
const mockAuth = {
  signInWithEmail: async (email: string, _password: string) => {
    const user = createMockUser(email);
    mockCurrentUser = user;
    saveMockUser(user);
    notifyMockListeners(user);
    return { user };
  },
  signUpWithEmail: async (email: string, _password: string, displayName?: string) => {
    const user = createMockUser(email, displayName);
    mockCurrentUser = user;
    saveMockUser(user);
    notifyMockListeners(user);
    return { user };
  },
  signInWithGoogle: async () => {
    const user = createMockUser("demo@example.com", "Demo User");
    mockCurrentUser = user;
    saveMockUser(user);
    notifyMockListeners(user);
    return { user };
  },
  signOut: async () => {
    mockCurrentUser = null;
    saveMockUser(null);
    notifyMockListeners(null);
  },
  resetPassword: async (_email: string) => {
    console.log("[Mock Auth] Password reset email would be sent");
  },
  getIdToken: async () => {
    if (!mockCurrentUser) return null;
    return mockCurrentUser.getIdToken();
  },
  onAuthChange: (callback: (user: MockUser | null) => void) => {
    mockAuthListeners.push(callback);
    // Immediately call with current user
    callback(mockCurrentUser);
    // Return unsubscribe function
    return () => {
      mockAuthListeners = mockAuthListeners.filter((cb) => cb !== callback);
    };
  },
  getCurrentUser: () => mockCurrentUser,
};

// ============================================================================
// REAL FIREBASE AUTH
// ============================================================================

let app: FirebaseApp;
let auth: Auth;

if (typeof window !== "undefined" && hasValidFirebaseConfig) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
}

// Log which auth mode is active
if (typeof window !== "undefined") {
  if (hasValidFirebaseConfig) {
    console.log("🔥 Using Firebase Authentication");
  } else {
    console.log("🔧 Using Mock Authentication (no Firebase credentials configured)");
  }
}

// ============================================================================
// EXPORTED AUTH FUNCTIONS (automatically use mock or real Firebase)
// ============================================================================

export async function signInWithEmail(email: string, password: string) {
  if (!hasValidFirebaseConfig) {
    return mockAuth.signInWithEmail(email, password);
  }
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
) {
  if (!hasValidFirebaseConfig) {
    return mockAuth.signUpWithEmail(email, password, displayName);
  }
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }
  return credential;
}

export async function signInWithGoogle() {
  if (!hasValidFirebaseConfig) {
    return mockAuth.signInWithGoogle();
  }
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signOut() {
  if (!hasValidFirebaseConfig) {
    return mockAuth.signOut();
  }
  return firebaseSignOut(auth);
}

export async function resetPassword(email: string) {
  if (!hasValidFirebaseConfig) {
    return mockAuth.resetPassword(email);
  }
  return sendPasswordResetEmail(auth, email);
}

export async function getIdToken(): Promise<string | null> {
  if (!hasValidFirebaseConfig) {
    return mockAuth.getIdToken();
  }
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export function onAuthChange(callback: (user: User | MockUser | null) => void) {
  if (!hasValidFirebaseConfig) {
    return mockAuth.onAuthChange(callback);
  }
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | MockUser | null {
  if (!hasValidFirebaseConfig) {
    return mockAuth.getCurrentUser();
  }
  return auth?.currentUser || null;
}

export { auth };
