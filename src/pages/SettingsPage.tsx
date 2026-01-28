import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Globe, Trash2, Info, CheckCircle } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { hideBackButton, hideMainButton } from '../lib/telegram';

const LANG_KEY = 'sozyola_tg_lang';
const GOAL_OPTIONS = [10, 15, 20, 30, 50];

export const SettingsPage: React.FC = () => {
  const { progress, setDailyGoalTarget, resetProgress } = useProgress();
  const [lang, setLang] = useState<string>(() => localStorage.getItem(LANG_KEY) || 'uz');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    hideBackButton();
    hideMainButton();
  }, []);

  const handleLangChange = (newLang: string) => {
    setLang(newLang);
    localStorage.setItem(LANG_KEY, newLang);
    flashSaved();
  };

  const handleGoalChange = (target: number) => {
    setDailyGoalTarget(target);
    flashSaved();
  };

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleReset = () => {
    if (showResetConfirm) {
      resetProgress();
      setShowResetConfirm(false);
      flashSaved();
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 5000);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-6">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--tg-text)' }}>
          Settings ⚙️
        </h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Daily Goal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4"
          style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Target size={18} style={{ color: 'var(--tg-button)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--tg-text)' }}>
              Daily Goal
            </span>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--tg-hint)' }}>
            How many words do you want to learn per day?
          </p>
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map(g => (
              <button
                key={g}
                onClick={() => handleGoalChange(g)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
                style={{
                  backgroundColor: progress.dailyGoal.target === g ? 'var(--tg-button)' : 'var(--tg-secondary-bg)',
                  color: progress.dailyGoal.target === g ? 'var(--tg-button-text)' : 'var(--tg-text)',
                }}
              >
                {g} words
              </button>
            ))}
          </div>
        </motion.div>

        {/* Translation Language */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl p-4"
          style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Globe size={18} style={{ color: 'var(--tg-button)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--tg-text)' }}>
              Translation Language
            </span>
          </div>
          <div className="flex gap-2">
            {[
              { id: 'uz', label: '🇺🇿 Uzbek', flag: '🇺🇿' },
              { id: 'ru', label: '🇷🇺 Russian', flag: '🇷🇺' },
            ].map(l => (
              <button
                key={l.id}
                onClick={() => handleLangChange(l.id)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95"
                style={{
                  backgroundColor: lang === l.id ? 'var(--tg-button)' : 'var(--tg-secondary-bg)',
                  color: lang === l.id ? 'var(--tg-button-text)' : 'var(--tg-text)',
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl p-4"
          style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Info size={18} style={{ color: 'var(--tg-button)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--tg-text)' }}>
              Your Stats
            </span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Words Learned', value: progress.wordsLearned || 0 },
              { label: 'Current Streak', value: `${progress.streak.count} days` },
              { label: 'Quizzes Completed', value: Object.keys(progress.results).length },
              { label: 'Favorites', value: (progress.favorites || []).length },
              { label: 'Daily Goal', value: `${progress.dailyGoal.wordsToday}/${progress.dailyGoal.target}` },
            ].map(stat => (
              <div key={stat.label} className="flex items-center justify-between py-1">
                <span className="text-sm" style={{ color: 'var(--tg-subtitle)' }}>{stat.label}</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--tg-text)' }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Reset */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl p-4"
          style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
        >
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium active:scale-95 transition-all"
            style={{
              backgroundColor: showResetConfirm ? '#ef444420' : 'var(--tg-secondary-bg)',
              color: showResetConfirm ? '#ef4444' : 'var(--tg-destructive)',
            }}
          >
            <Trash2 size={16} />
            {showResetConfirm ? 'Tap again to confirm reset' : 'Reset All Progress'}
          </button>
        </motion.div>

        {/* Version */}
        <p className="text-center text-xs py-2" style={{ color: 'var(--tg-hint)', opacity: 0.6 }}>
          SOZYOLA v1.0.0 • Made with ❤️
        </p>
      </div>

      {/* Saved toast */}
      {saved && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg"
          style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)', left: '50%', transform: 'translateX(-50%)' }}
        >
          <CheckCircle size={16} />
          <span className="text-sm font-medium">Saved!</span>
        </motion.div>
      )}
    </div>
  );
};
