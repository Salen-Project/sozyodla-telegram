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
  login: (username: string, password: string) => Promise<{ error: string | null }>;
  signup: (username: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        return { error: null };
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        return { error: loginError.message };
      }
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
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, login, signup, logout }}>
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
