import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, User, SessionInfo, WalletBalance } from './api-client';

interface AuthContextType {
  user: User | null;
  session: SessionInfo | null;
  walletBalance: WalletBalance | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEmailVerified: boolean;
  mfaRequired: boolean;
  refreshUser: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ mfaRequired: boolean; user?: User | null }>;
  verifyMfa: (code: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    acceptTerms: boolean;
    acceptPrivacy: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);

  const refreshWallet = useCallback(async () => {
    try {
      const bal = await api.wallet.getBalance();
      setWalletBalance(bal);
    } catch {
      // Ignora falha de carteira se não logado
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.auth.me();
      setUser(data.user);
      setSession(data.session || null);
      setMfaRequired(false);
      // Carrega saldo em conjunto
      try {
        const bal = await api.wallet.getBalance();
        setWalletBalance(bal);
      } catch {
        // Falha silenciosa no saldo
      }
    } catch {
      setUser(null);
      setSession(null);
      setWalletBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    if (res.mfaRequired) {
      setMfaRequired(true);
      return { mfaRequired: true, user: null };
    }
    setUser(res.user);
    setMfaRequired(false);
    await refreshWallet();
    return { mfaRequired: false, user: res.user };
  };

  const verifyMfa = async (code: string) => {
    const res = await api.auth.verifyMfa(code);
    setUser(res.user);
    setMfaRequired(false);
    await refreshUser();
  };

  const register = async (data: {
    email: string;
    password: string;
    fullName: string;
    acceptTerms: boolean;
    acceptPrivacy: boolean;
  }) => {
    await api.auth.register(data);
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } finally {
      setUser(null);
      setSession(null);
      setWalletBalance(null);
      setMfaRequired(false);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = !!user?.roles?.includes('admin') || user?.email?.toLowerCase() === 'apacessoria25@gmail.com';
  const isEmailVerified = !!user?.emailVerified;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        walletBalance,
        isLoading,
        isAuthenticated,
        isAdmin,
        isEmailVerified,
        mfaRequired,
        refreshUser,
        refreshWallet,
        login,
        verifyMfa,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
