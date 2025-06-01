/* eslint-disable react-refresh/only-export-components */
// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase.config';
import {
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type AuthError,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface Seller {
  id: string;
  name: string;
  email: string;
  phone?: string;
  storeName?: string;
  storeLogo?: string;
  storeBanner?: string;
  businessAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  businessType?: string;
  taxId?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  socialMedia?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  seller: Seller | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateSellerProfile: (sellerData: Partial<Seller>) => Promise<void>;
  error: string | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch seller data whenever user changes
  useEffect(() => {
    const fetchSellerData = async () => {
      if (user) {
        try {
          const sellerRef = doc(db, 'sellers', user.uid);
          const sellerDoc = await getDoc(sellerRef);
          
          if (sellerDoc.exists()) {
            const sellerData = sellerDoc.data();
            setSeller({ 
              ...sellerData as Seller, 
              id: sellerDoc.id,
              createdAt: sellerData.createdAt?.toDate() || new Date(),
              updatedAt: sellerData.updatedAt?.toDate() || new Date()
            });
          } else {
            // Create seller document if it doesn't exist
            const sellerData: Omit<Seller, 'id'> = {
              name: user.displayName || user.email?.split('@')[0] || 'Seller',
              email: user.email || '',
              isProfileComplete: false,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            await setDoc(sellerRef, sellerData);
            setSeller({ ...sellerData, id: user.uid });
          }
        } catch (err) {
          console.error('Error fetching seller data:', err);
          setError('Failed to fetch seller data');
        }
      } else {
        setSeller(null);
      }
    };

    fetchSellerData();
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Attempting login with:', { email }); // Log attempt (without password for security)
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      const error = err as AuthError;
      console.error('Login error details:', {
        code: error.code,
        message: error.message,
        email: email
      });
      const errorMessage = getFirebaseErrorMessage(error);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create seller document
      const sellerData: Omit<Seller, 'id'> = {
        name,
        email,
        isProfileComplete: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add to sellers collection
      await setDoc(doc(db, 'sellers', user.uid), sellerData);

      navigate('/dashboard');
    } catch (err) {
      const error = err as AuthError;
      setError(getFirebaseErrorMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateSellerProfile = async (sellerData: Partial<Seller>) => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    try {
      const sellerRef = doc(db, 'sellers', user.uid);
      const updatedData = {
        ...sellerData,
        updatedAt: new Date()
      };

      // Check if profile is complete
      const isComplete = checkProfileCompletion({
        ...seller,
        ...sellerData
      } as Seller);

      await updateDoc(sellerRef, {
        ...updatedData,
        isProfileComplete: isComplete
      });

      // Update local state
      setSeller(prev => prev ? { ...prev, ...updatedData, isProfileComplete: isComplete } : null);
    } catch (err) {
      console.error('Error updating seller profile:', err);
      throw err;
    }
  };

  const checkProfileCompletion = (seller: Seller): boolean => {
    return !!(
      seller.name &&
      seller.email &&
      seller.phone &&
      seller.storeName &&
      seller.businessAddress?.street &&
      seller.businessAddress?.city &&
      seller.businessAddress?.state &&
      seller.businessAddress?.country &&
      seller.businessAddress?.zipCode &&
      seller.businessType &&
      seller.taxId &&
      seller.bankDetails?.bankName &&
      seller.bankDetails?.accountNumber &&
      seller.bankDetails?.accountName
    );
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setSeller(null);
      navigate('/login');
    } catch (err) {
      const error = err as AuthError;
      setError(getFirebaseErrorMessage(error));
      throw error;
    }
  };

  // Add Google login function
  const loginWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if seller profile exists
      const sellerDoc = await getDoc(doc(db, 'sellers', result.user.uid));
      
      if (!sellerDoc.exists()) {
        // Create new seller profile
        const newSeller: Seller = {
          id: result.user.uid,
          name: result.user.displayName || '',
          email: result.user.email || '',
          isProfileComplete: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(doc(db, 'sellers', result.user.uid), newSeller);
        setSeller(newSeller);
      } else {
        const sellerData = sellerDoc.data() as Seller;
        setSeller(sellerData);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError(getFirebaseErrorMessage(error as AuthError));
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Attempting to send password reset email to:', email);
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin + '/login', // This will redirect back to login page after reset
        handleCodeInApp: true
      });
      console.log('Password reset email sent successfully');
      setError('Password reset email sent. Please check your inbox and spam folder.');
    } catch (err) {
      const error = err as AuthError;
      console.error('Password reset error details:', {
        code: error.code,
        message: error.message,
        email: email,
        fullError: error
      });
      
      // Handle specific error cases
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address. Please sign up first.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        const errorMessage = getFirebaseErrorMessage(error);
        setError(errorMessage);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get user-friendly error messages
  const getFirebaseErrorMessage = (error: AuthError): string => {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support';
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up first';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials and try again';
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please try logging in';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection';
      case 'auth/operation-not-allowed':
        return 'Email/password sign in is not enabled. Please contact support';
      default:
        console.error('Firebase auth error:', {
          code: error.code,
          message: error.message,
          fullError: error
        });
        return 'An error occurred during sign in. Please try again';
    }
  };

  const value = {
    user,
    seller,
    login,
    signup,
    loginWithGoogle,
    logout,
    resetPassword,
    updateSellerProfile,
    error,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};