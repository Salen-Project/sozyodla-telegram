import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sozyola-tg-auth',
    flowType: 'pkce',
  },
});

// Email domain for username to email conversion
export const EMAIL_DOMAIN = 'vocab.app';

// Convert username to email format
export const usernameToEmail = (username: string): string => {
  return `${username.toLowerCase().trim()}@${EMAIL_DOMAIN}`;
};

// Extract username from email
export const emailToUsername = (email: string): string => {
  return email.split('@')[0];
};
