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
  type AuthError
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
  logout: () => Promise<void>;
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
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      const error = err as AuthError;
      setError(getFirebaseErrorMessage(error));
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

  // Helper function to get user-friendly error messages
  const getFirebaseErrorMessage = (error: AuthError): string => {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-disabled':
        return 'Account disabled';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/email-already-in-use':
        return 'Email already in use';
      case 'auth/weak-password':
        return 'Password is too weak';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  const value = {
    user,
    seller,
    login,
    signup,
    logout,
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