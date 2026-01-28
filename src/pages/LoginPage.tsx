import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { haptic } from '../lib/telegram';
import { Globe } from 'lucide-react';

const translations = {
  uz: {
    title: "So'z Yodla",
    subtitle_signup: "Hisobingizni yarating",
    subtitle_signin: "Taraqqiyotingizni sinxronlash uchun kiring",
    username: "Foydalanuvchi nomi",
    password: "Parol",
    error_fill: "Iltimos, barcha maydonlarni to'ldiring",
    error_password: "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
    create_account: "Hisob yaratish",
    sign_in: "Kirish",
    creating: "Hisob yaratilmoqda...",
    signing_in: "Kirilmoqda...",
    have_account: "Hisobingiz bormi? Kiring",
    no_account: "Hisobingiz yo'qmi? Ro'yxatdan o'ting",
    or_continue: "yoki davom eting",
    skip: "Hisobsiz davom etish",
  },
  en: {
    title: "SozYodla",
    subtitle_signup: "Create your account",
    subtitle_signin: "Sign in to sync your progress",
    username: "Username",
    password: "Password",
    error_fill: "Please fill in all fields",
    error_password: "Password must be at least 6 characters",
    create_account: "Create Account",
    sign_in: "Sign In",
    creating: "Creating account...",
    signing_in: "Signing in...",
    have_account: "Already have an account? Sign in",
    no_account: "Don't have an account? Sign up",
    or_continue: "or continue",
    skip: "Continue without account",
  },
};

export const LoginPage: React.FC = () => {
  const { login, signup, skipAuth } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'uz' | 'en'>(() => {
    const stored = localStorage.getItem('sozyola_lang');
    return (stored === 'en' ? 'en' : 'uz');
  });

  const t = translations[lang];

  const toggleLang = () => {
    const newLang = lang === 'uz' ? 'en' : 'uz';
    setLang(newLang);
    localStorage.setItem('sozyola_lang', newLang);
    haptic.selection();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic.impact('light');
    
    if (!username.trim() || !password.trim()) {
      setError(t.error_fill);
      haptic.notification('error');
      return;
    }
    if (password.length < 6) {
      setError(t.error_password);
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

  const handleSkip = () => {
    haptic.impact('light');
    skipAuth();
  };

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: 'var(--tg-bg)' }}
    >
      {/* Language toggle - top right */}
      <button
        onClick={toggleLang}
        className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
        style={{ backgroundColor: 'var(--tg-secondary-bg)' }}
      >
        <Globe size={16} style={{ color: 'var(--tg-hint)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--tg-text)' }}>
          {lang === 'uz' ? "O'zbek" : 'English'}
        </span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📚</div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--tg-text)' }}>
            {t.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--tg-hint)' }}>
            {isSignup ? t.subtitle_signup : t.subtitle_signin}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              placeholder={t.username}
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
              placeholder={t.password}
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
                {isSignup ? t.creating : t.signing_in}
              </span>
            ) : (
              isSignup ? t.create_account : t.sign_in
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
            {isSignup ? t.have_account : t.no_account}
          </button>
        </div>

        {/* Skip option */}
        <div className="text-center mt-6">
          <p className="text-xs mb-2" style={{ color: 'var(--tg-hint)' }}>
            — {t.or_continue} —
          </p>
          <button
            onClick={handleSkip}
            className="text-sm px-4 py-2 rounded-xl active:scale-95 transition-transform"
            style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
          >
            {t.skip}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
