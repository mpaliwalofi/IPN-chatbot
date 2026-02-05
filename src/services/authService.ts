import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { firebaseConfig } from '../config/firebase';

// Initialize Firebase
let app;
let auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Create a fallback auth object
  auth = null as any;
}

// Auth functions
export const authService = {
  // Login
  login: async (email: string, password: string) => {
    if (!auth) {
      return { success: false, error: 'Firebase not initialized' };
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Logout
  logout: async () => {
    if (!auth) {
      return { success: false, error: 'Firebase not initialized' };
    }
    
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Create employee account (admin only)
  createEmployee: async (email: string, password: string) => {
    if (!auth) {
      return { success: false, error: 'Firebase not initialized' };
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser: (): User | null => {
    if (!auth) return null;
    return auth.currentUser;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    if (!auth) return false;
    return auth.currentUser !== null;
  }
};

export { auth, onAuthStateChanged };