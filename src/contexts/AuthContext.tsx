import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider, OWNER_EMAIL } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isOwner: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email === OWNER_EMAIL && currentUser.emailVerified) {
        setUser(currentUser);
      } else {
        if (currentUser) {
          // Unathorized, log them out
          firebaseSignOut(auth);
        }
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email !== OWNER_EMAIL) {
        await firebaseSignOut(auth);
        alert("This account is not authorized.");
      }
    } catch (error) {
      console.error("Auth error", error);
    }
  };

  const signOut = () => firebaseSignOut(auth);

  const isOwner = user?.email === OWNER_EMAIL;

  return (
    <AuthContext.Provider value={{ user, loading, isOwner, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
