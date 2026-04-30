'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { UserBrief } from './api';

interface UserContextValue {
  user: UserBrief | null;
  setUser: (u: UserBrief | null) => void;
  loading: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);
const STORAGE_KEY = 'loyalty_hub_user';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserBrief | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setUserState(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const setUser = (u: UserBrief | null) => {
    setUserState(u);
    try {
      if (u) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser должен использоваться внутри UserProvider');
  return ctx;
}
