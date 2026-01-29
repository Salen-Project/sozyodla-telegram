import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, usernameToEmail, emailToUsername } from '../lib/supabase';

interface AuthUser {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isSkipped: boolean;
  login: (username: string, password: string) => Promise<{ error: string | null }>;
  signup: (username: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  skipAuth: () => void;
}

const SKIP_AUTH_KEY = 'sozyola_auth_skipped';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSkipped, setIsSkipped] = useState(() => {
    return localStorage.getItem(SKIP_AUTH_KEY) === 'true';
  });

  const transformUser = (supabaseUser: User | null): AuthUser | null => {
    if (!supabaseUser || !supabaseUser.email) return null;
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      username: emailToUsername(supabaseUser.email),
    };
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        setSession(existingSession);
        setUser(transformUser(existingSession?.user ?? null));
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(transformUser(newSession?.user ?? null));
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (username: string, password: string): Promise<{ error: string | null }> => {
    try {
      const email = usernameToEmail(username);
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Invalid username or password' };
        }
        return { error: error.message };
      }
      // Clear skipped state on successful login
      setIsSkipped(false);
      localStorage.removeItem(SKIP_AUTH_KEY);
      return { error: null };
    } catch {
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const signup = async (username: string, password: string): Promise<{ error: string | null }> => {
    try {
      const email = usernameToEmail(username);
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        if (error.message.includes('User already registered')) {
          return { error: 'Username is already taken' };
        }
        if (error.message.includes('Password should be at least')) {
          return { error: 'Password must be at least 6 characters' };
        }
        return { error: error.message };
      }

      if (data?.user?.identities?.length === 0) {
        return { error: 'Username is already taken' };
      }

      if (data?.session) {
        // Clear skipped state on successful signup
        setIsSkipped(false);
        localStorage.removeItem(SKIP_AUTH_KEY);
        return { error: null };
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        return { error: loginError.message };
      }
      // Clear skipped state on successful signup
      setIsSkipped(false);
      localStorage.removeItem(SKIP_AUTH_KEY);
      return { error: null };
    } catch {
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsSkipped(false);
      
      // Clear ALL local storage to ensure clean slate for new user
      const keysToRemove = [
        SKIP_AUTH_KEY,
        'sozyola_tg_progress',
        'sozyola_tg_unlocks', 
        'sozyola_daily_challenges',
        'sozyola_review',
        'sozyola_lang',
        'sozyola_tg_lang',
        'sozyola-tg-auth',
        'lastVisited',
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Force page reload to reset all React state
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const skipAuth = () => {
    setIsSkipped(true);
    localStorage.setItem(SKIP_AUTH_KEY, 'true');
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isSkipped, login, signup, logout, skipAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
