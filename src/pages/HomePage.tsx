import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, ChevronRight, Zap, PlayCircle, Sparkles, Volume2 } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { editions } from '../data/vocabulary';
import { StreakBadge } from '../components/StreakBadge';
import { ProgressBar } from '../components/ProgressBar';
import { hideBackButton, hideMainButton, haptic } from '../lib/telegram';
import { Word } from '../types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { progress, updateStreak } = useProgress();

  useEffect(() => {
    hideBackButton();
    hideMainButton();
    updateStreak();
  }, [updateStreak]);

  const totalWords = editions.reduce((acc, ed) => acc + ed.units.reduce((a, u) => a + u.words.length, 0), 0);
  const goalPercent = progress.dailyGoal.target > 0
    ? Math.min(100, Math.round((progress.dailyGoal.wordsToday / progress.dailyGoal.target) * 100))
    : 0;

  // Word of the Day - deterministic based on date
  const wordOfTheDay = useMemo<Word | null>(() => {
    const allWords: Word[] = [];
    editions.forEach(ed => ed.units.forEach(u => allWords.push(...u.words)));
    if (allWords.length === 0) return null;
    
    // Generate a consistent index based on date
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const index = (dayOfYear * 17 + today.getFullYear()) % allWords.length; // 17 is arbitrary prime for better distribution
    return allWords[index];
  }, []);

  const speakWord = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
    haptic.selection();
  };

  return (
    <div className="h-full overflow-y-auto pb-2">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--tg-text)' }}>
              SOZYOLA 📚
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--tg-subtitle)' }}>
              Learn vocabulary the smart way
            </p>
          </div>
          <StreakBadge count={progress.streak.count} />
        </div>

        {/* Daily goal card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 mb-4"
          style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap size={18} style={{ color: 'var(--tg-button)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--tg-text)' }}>
                Daily Goal
              </span>
            </div>
            <span className="text-xs font-bold" style={{ color: 'var(--tg-button)' }}>
              {goalPercent}%
            </span>
          </div>
          <ProgressBar
            current={progress.dailyGoal.wordsToday}
            total={progress.dailyGoal.target}
          />
          <p className="text-xs mt-2" style={{ color: 'var(--tg-hint)' }}>
            {progress.dailyGoal.wordsToday} / {progress.dailyGoal.target} words today
          </p>
        </motion.div>

        {/* Word of the Day */}
        {wordOfTheDay && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-4 mb-4"
            style={{ 
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15))',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: '#8b5cf6' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8b5cf6' }}>
                  Word of the Day
                </span>
              </div>
              <button 
                onClick={() => speakWord(wordOfTheDay.word)}
                className="p-1.5 rounded-full active:scale-90 transition-transform"
                style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}
              >
                <Volume2 size={14} style={{ color: '#8b5cf6' }} />
              </button>
            </div>
            <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--tg-text)' }}>
              {wordOfTheDay.word}
            </h3>
            <p className="text-sm mb-2" style={{ color: 'var(--tg-subtitle)' }}>
              {wordOfTheDay.meaning}
            </p>
            <p className="text-xs italic" style={{ color: 'var(--tg-hint)' }}>
              "{wordOfTheDay.example}"
            </p>
          </motion.div>
        )}

        {/* Continue Learning */}
        {progress.lastStudied && (() => {
          const ed = editions.find(e => e.id === progress.lastStudied!.editionId);
          const un = ed?.units.find(u => u.id === progress.lastStudied!.unitId);
          if (!ed || !un) return null;
          return (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/unit/${ed.id}/${un.id}`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl mb-4 active:opacity-80"
              style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
            >
              <PlayCircle size={24} />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">Continue Learning</p>
                <p className="text-xs opacity-80">{ed.title} · Unit {un.id}</p>
              </div>
              <ChevronRight size={18} />
            </motion.button>
          );
        })()}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: 'Learned', value: progress.wordsLearned || 0, icon: '📖' },
            { label: 'Total', value: totalWords, icon: '📚' },
            { label: 'Streak', value: `${progress.streak.count}d`, icon: '🔥' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl p-3 text-center"
              style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
            >
              <span className="text-lg">{stat.icon}</span>
              <p className="text-lg font-bold mt-1" style={{ color: 'var(--tg-text)' }}>
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: 'var(--tg-hint)' }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Books / Editions */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--tg-section-header)' }}>
            Books
          </h2>
          <Trophy size={16} style={{ color: 'var(--tg-hint)' }} />
        </div>
        <div className="space-y-2">
          {editions.map((edition, i) => {
            const completedUnits = edition.units.filter(
              u => progress.results[`${edition.id}-${u.id}`]
            ).length;
            return (
              <motion.button
                key={edition.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/book/${edition.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl active:opacity-80"
                style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${edition.color} flex items-center justify-center text-white font-bold text-lg shadow-sm`}
                >
                  {edition.id}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--tg-text)' }}>
                    {edition.title}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--tg-hint)' }}>
                    {completedUnits}/{edition.units.length} units • {edition.units.reduce((a, u) => a + u.words.length, 0)} words
                  </p>
                </div>
                <ChevronRight size={18} style={{ color: 'var(--tg-hint)' }} />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
