import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { haptic } from '../lib/telegram';
import { Globe, ArrowLeft, ArrowRight, Check, User, Briefcase, Lock, Eye, EyeOff, X } from 'lucide-react';

const translations = {
  uz: {
    title: "So'z Yodla",
    subtitle_signup: "Hisobingizni yarating",
    subtitle_signin: "Taraqqiyotingizni sinxronlash uchun kiring",
    // Onboarding steps
    step1_title: "Ismingizni kiriting",
    step1_subtitle: "Boshqa foydalanuvchilar sizni qanday ko'rishadi",
    step2_title: "Kasbingizni tanlang",
    step2_subtitle: "Bu bizga tajribangizni moslashtirish imkonini beradi",
    step3_title: "Hisob ma'lumotlarini kiriting",
    step3_subtitle: "Xavfsiz kirish uchun",
    // Fields
    display_name: "Ismingiz",
    username: "Foydalanuvchi nomi",
    password: "Parol",
    confirm_password: "Parolni tasdiqlang",
    // Professions
    student: "O'quvchi / Talaba",
    teacher: "O'qituvchi",
    professional: "Mutaxassis",
    self_learner: "Mustaqil o'rganuvchi",
    other: "Boshqa",
    // Errors
    error_fill: "Iltimos, barcha maydonlarni to'ldiring",
    error_name: "Ism kamida 2 ta belgidan iborat bo'lishi kerak",
    error_password: "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
    error_password_match: "Parollar mos kelmaydi",
    error_profession: "Iltimos, kasbingizni tanlang",
    // Buttons
    next: "Keyingi",
    back: "Orqaga",
    create_account: "Hisob yaratish",
    sign_in: "Kirish",
    creating: "Hisob yaratilmoqda...",
    signing_in: "Kirilmoqda...",
    have_account: "Hisobingiz bormi? Kiring",
    no_account: "Hisobingiz yo'qmi? Ro'yxatdan o'ting",
    or_continue: "yoki davom eting",
    skip: "Orqaga",
  },
  en: {
    title: "So'z Yodla",
    subtitle_signup: "Create your account",
    subtitle_signin: "Sign in to sync your progress",
    // Onboarding steps
    step1_title: "What's your name?",
    step1_subtitle: "This is how other users will see you",
    step2_title: "What's your profession?",
    step2_subtitle: "This helps us personalize your experience",
    step3_title: "Create your login",
    step3_subtitle: "For secure access to your account",
    // Fields
    display_name: "Your name",
    username: "Username",
    password: "Password",
    confirm_password: "Confirm password",
    // Professions
    student: "Student",
    teacher: "Teacher",
    professional: "Professional",
    self_learner: "Self-learner",
    other: "Other",
    // Errors
    error_fill: "Please fill in all fields",
    error_name: "Name must be at least 2 characters",
    error_password: "Password must be at least 6 characters",
    error_password_match: "Passwords do not match",
    error_profession: "Please select your profession",
    // Buttons
    next: "Next",
    back: "Back",
    create_account: "Create Account",
    sign_in: "Sign In",
    creating: "Creating account...",
    signing_in: "Signing in...",
    have_account: "Already have an account? Sign in",
    no_account: "Don't have an account? Sign up",
    or_continue: "or continue",
    skip: "Go Back",
  },
};

type Profession = 'student' | 'teacher' | 'professional' | 'self_learner' | 'other';

const professionIcons: Record<Profession, string> = {
  student: '🎓',
  teacher: '👨‍🏫',
  professional: '💼',
  self_learner: '📚',
  other: '🌟',
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [step, setStep] = useState(1); // 1: Name, 2: Profession, 3: Credentials
  
  // Form data
  const [displayName, setDisplayName] = useState('');
  const [profession, setProfession] = useState<Profession | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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

  const validateStep = (currentStep: number): boolean => {
    setError(null);
    
    if (currentStep === 1) {
      if (displayName.trim().length < 2) {
        setError(t.error_name);
        haptic.notification('error');
        return false;
      }
    } else if (currentStep === 2) {
      if (!profession) {
        setError(t.error_profession);
        haptic.notification('error');
        return false;
      }
    } else if (currentStep === 3) {
      if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
        setError(t.error_fill);
        haptic.notification('error');
        return false;
      }
      if (password.length < 6) {
        setError(t.error_password);
        haptic.notification('error');
        return false;
      }
      if (password !== confirmPassword) {
        setError(t.error_password_match);
        haptic.notification('error');
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      haptic.impact('light');
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    haptic.impact('light');
    setError(null);
    setStep(step - 1);
  };

  const handleSignup = async () => {
    if (!validateStep(3)) return;
    
    haptic.impact('light');
    setError(null);
    setLoading(true);

    // Store additional user data in localStorage before signup
    const userData = {
      displayName: displayName.trim(),
      profession: profession,
    };
    localStorage.setItem('sozyola_user_data', JSON.stringify(userData));

    const result = await signup(username.trim(), password, displayName.trim());
    setLoading(false);

    if (result.error) {
      setError(result.error);
      haptic.notification('error');
    } else {
      haptic.notification('success');
      navigate(-1); // Go back after successful signup
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic.impact('light');
    
    if (!username.trim() || !password.trim()) {
      setError(t.error_fill);
      haptic.notification('error');
      return;
    }

    setError(null);
    setLoading(true);

    const result = await login(username.trim(), password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      haptic.notification('error');
    } else {
      haptic.notification('success');
      navigate(-1); // Go back after successful login
    }
  };

  const handleGoBack = () => {
    haptic.impact('light');
    navigate(-1);
  };

  const resetSignup = () => {
    setStep(1);
    setDisplayName('');
    setProfession(null);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
  };

  // Sign In Form
  if (!isSignup) {
    return (
      <div
        className="h-full w-full flex flex-col items-center justify-center px-6"
        style={{ backgroundColor: 'var(--tg-bg)' }}
      >
        {/* Language toggle */}
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
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">📚</div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--tg-text)' }}>{t.title}</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--tg-hint)' }}>{t.subtitle_signin}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="text"
              placeholder={t.username}
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
            />
            <input
              type="password"
              placeholder={t.password}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
            />

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xs text-center px-2 py-2 rounded-lg"
                style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
              >{error}</motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
            >
              {loading ? t.signing_in : t.sign_in}
            </button>
          </form>

          <div className="text-center mt-5">
            <button
              onClick={() => { haptic.selection(); setIsSignup(true); resetSignup(); }}
              className="text-sm"
              style={{ color: 'var(--tg-link)' }}
            >{t.no_account}</button>
          </div>

          <div className="text-center mt-6">
            <p className="text-xs mb-2" style={{ color: 'var(--tg-hint)' }}>— {t.or_continue} —</p>
            <button
              onClick={handleGoBack}
              className="text-sm px-4 py-2 rounded-xl active:scale-95 transition-transform"
              style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
            >{t.skip}</button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Sign Up - Multi-step onboarding
  return (
    <div
      className="h-full w-full flex flex-col px-6 py-8"
      style={{ backgroundColor: 'var(--tg-bg)' }}
    >
      {/* Language toggle */}
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

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mt-8 mb-6">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${i === step ? 'w-8' : 'w-2'}`}
            style={{
              backgroundColor: i <= step ? 'var(--tg-button)' : 'var(--tg-secondary-bg)',
            }}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {/* Step 1: Name */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--tg-button)', opacity: 0.1 }}>
                  <User size={32} style={{ color: 'var(--tg-button)' }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--tg-text)' }}>{t.step1_title}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--tg-hint)' }}>{t.step1_subtitle}</p>
              </div>

              <div className="flex-1">
                <input
                  type="text"
                  placeholder={t.display_name}
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl text-base outline-none text-center"
                  style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
                  autoFocus
                />
                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-xs text-center mt-3 px-2 py-2 rounded-lg"
                    style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
                  >{error}</motion.p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Profession */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--tg-button)', opacity: 0.1 }}>
                  <Briefcase size={32} style={{ color: 'var(--tg-button)' }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--tg-text)' }}>{t.step2_title}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--tg-hint)' }}>{t.step2_subtitle}</p>
              </div>

              <div className="flex-1 space-y-2">
                {(['student', 'teacher', 'professional', 'self_learner', 'other'] as Profession[]).map(p => (
                  <button
                    key={p}
                    onClick={() => { 
                      haptic.selection(); 
                      setProfession(p); 
                      // Auto-advance to next step after brief delay for visual feedback
                      setTimeout(() => {
                        haptic.impact('light');
                        setStep(3);
                      }, 200);
                    }}
                    className="w-full p-4 rounded-xl flex items-center gap-3 transition-all"
                    style={{
                      backgroundColor: profession === p ? 'var(--tg-button)' : 'var(--tg-secondary-bg)',
                      color: profession === p ? 'var(--tg-button-text)' : 'var(--tg-text)',
                      borderColor: profession === p ? 'var(--tg-button)' : 'transparent',
                      borderWidth: '2px',
                    }}
                  >
                    <span className="text-2xl">{professionIcons[p]}</span>
                    <span className="font-medium">{t[p]}</span>
                    {profession === p && <Check size={20} className="ml-auto" />}
                  </button>
                ))}
                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-xs text-center mt-3 px-2 py-2 rounded-lg"
                    style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
                  >{error}</motion.p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Credentials */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--tg-button)', opacity: 0.1 }}>
                  <Lock size={32} style={{ color: 'var(--tg-button)' }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--tg-text)' }}>{t.step3_title}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--tg-hint)' }}>{t.step3_subtitle}</p>
              </div>

              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  placeholder={t.username}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t.password}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  >
                    {showPassword ? <EyeOff size={18} style={{ color: 'var(--tg-hint)' }} /> : <Eye size={18} style={{ color: 'var(--tg-hint)' }} />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t.confirm_password}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  >
                    {showConfirmPassword ? <EyeOff size={18} style={{ color: 'var(--tg-hint)' }} /> : <Eye size={18} style={{ color: 'var(--tg-hint)' }} />}
                  </button>
                </div>
                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-xs text-center px-2 py-2 rounded-lg"
                    style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
                  >{error}</motion.p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
            >
              <ArrowLeft size={18} />
              {t.back}
            </button>
          ) : (
            <button
              onClick={() => { setIsSignup(false); resetSignup(); }}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
            >
              {t.have_account}
            </button>
          )}
          
          {step < 3 ? (
            <button
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
            >
              {t.next}
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSignup}
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
            >
              {loading ? t.creating : t.create_account}
              {!loading && <Check size={18} />}
            </button>
          )}
        </div>

        {/* Go Back option */}
        <div className="text-center mt-4">
          <button
            onClick={handleGoBack}
            className="text-sm"
            style={{ color: 'var(--tg-hint)' }}
          >{t.skip}</button>
        </div>
      </div>
    </div>
  );
};
