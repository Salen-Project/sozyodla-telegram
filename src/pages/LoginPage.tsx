import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { haptic } from '../lib/telegram';

export const LoginPage: React.FC = () => {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic.impact('light');
    
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      haptic.notification('error');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      haptic.notification('error');
      return;
    }

    setError(null);
    setLoading(true);

    const result = isSignup
      ? await signup(username.trim(), password)
      : await login(username.trim(), password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      haptic.notification('error');
    } else {
      haptic.notification('success');
    }
  };

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: 'var(--tg-bg)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📚</div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--tg-text)' }}>
            SozYodla
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--tg-hint)' }}>
            {isSignup ? 'Create your account' : 'Sign in to sync your progress'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                backgroundColor: 'var(--tg-secondary-bg)',
                color: 'var(--tg-text)',
                border: '1px solid transparent',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--tg-button)'}
              onBlur={e => e.target.style.borderColor = 'transparent'}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                backgroundColor: 'var(--tg-secondary-bg)',
                color: 'var(--tg-text)',
                border: '1px solid transparent',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--tg-button)'}
              onBlur={e => e.target.style.borderColor = 'transparent'}
            />
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-center px-2 py-2 rounded-lg"
              style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
            >
              {error}
            </motion.p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              backgroundColor: 'var(--tg-button)',
              color: 'var(--tg-button-text)',
            }}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {isSignup ? 'Creating account...' : 'Signing in...'}
              </span>
            ) : (
              isSignup ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        {/* Toggle login/signup */}
        <div className="text-center mt-5">
          <button
            onClick={() => { haptic.selection(); setIsSignup(!isSignup); setError(null); }}
            className="text-sm"
            style={{ color: 'var(--tg-link)' }}
          >
            {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
