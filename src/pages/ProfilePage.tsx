import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, BookOpen, Brain, Flame, Star, Calendar, Target, ChevronRight, Share2 } from 'lucide-react';
import { haptic } from '../lib/telegram';
import { useProgress } from '../contexts/ProgressContext';
import { editions } from '../data/vocabulary';
import { hideBackButton, hideMainButton, getTelegramUser } from '../lib/telegram';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { progress } = useProgress();

  useEffect(() => {
    hideBackButton();
    hideMainButton();
  }, []);

  const tgUser = getTelegramUser();
  const totalWords = editions.reduce((acc, ed) => acc + ed.units.reduce((a, u) => a + u.words.length, 0), 0);
  const quizzesCompleted = Object.keys(progress.results).length;
  const totalUnits = editions.reduce((acc, ed) => acc + ed.units.length, 0);

  // Calculate level based on words learned
  const level = useMemo(() => {
    const w = progress.wordsLearned || 0;
    if (w >= 3000) return { name: 'Master', emoji: '👑', color: '#f59e0b' };
    if (w >= 2000) return { name: 'Expert', emoji: '🏆', color: '#8b5cf6' };
    if (w >= 1000) return { name: 'Advanced', emoji: '⭐', color: '#3b82f6' };
    if (w >= 500) return { name: 'Intermediate', emoji: '📖', color: '#22c55e' };
    if (w >= 100) return { name: 'Beginner', emoji: '🌱', color: '#10b981' };
    return { name: 'Newcomer', emoji: '👋', color: '#6b7280' };
  }, [progress.wordsLearned]);

  // Achievements
  const achievements = useMemo(() => {
    const list = [];
    const w = progress.wordsLearned || 0;
    const s = progress.streak.count;

    if (w >= 1) list.push({ icon: '🎯', label: 'First Word', desc: 'Learned your first word' });
    if (w >= 50) list.push({ icon: '📚', label: '50 Words', desc: 'Half a century of words!' });
    if (w >= 100) list.push({ icon: '💯', label: 'Century', desc: '100 words learned' });
    if (w >= 500) list.push({ icon: '🔥', label: 'Word Machine', desc: '500 words mastered' });
    if (w >= 1000) list.push({ icon: '🏆', label: 'Vocabulary Pro', desc: '1000 words conquered' });
    if (s >= 3) list.push({ icon: '🔥', label: '3-Day Streak', desc: 'Consistent learner!' });
    if (s >= 7) list.push({ icon: '⚡', label: 'Week Warrior', desc: '7 days straight!' });
    if (s >= 30) list.push({ icon: '👑', label: 'Monthly Master', desc: '30-day streak!' });
    if (quizzesCompleted >= 1) list.push({ icon: '🧠', label: 'Quiz Taker', desc: 'First quiz completed' });
    if (quizzesCompleted >= 10) list.push({ icon: '🎓', label: 'Quiz Expert', desc: '10 quizzes done' });
    if ((progress.favorites || []).length >= 5) list.push({ icon: '❤️', label: 'Collector', desc: '5 favorite words' });

    return list;
  }, [progress.wordsLearned, progress.streak.count, quizzesCompleted, progress.favorites]);

  const unearned = 11 - achievements.length;

  // Share progress
  const shareProgress = async () => {
    const text = `📚 So'z Yodla Progress Report!\n\n` +
      `🎯 Level: ${level.emoji} ${level.name}\n` +
      `📖 Words Learned: ${progress.wordsLearned || 0}\n` +
      `🔥 Streak: ${progress.streak.count} days\n` +
      `🏆 Achievements: ${achievements.length}/11\n\n` +
      `#SozYodla #LearningEnglish`;
    
    haptic.impact('light');
    
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(text);
        haptic.notification('success');
        alert('Progress copied to clipboard!');
      } catch {
        // Clipboard not available
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-2">
      {/* Profile header */}
      <div className="px-4 pt-4 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-4"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: `${level.color}20`, color: level.color }}
          >
            {tgUser?.first_name?.[0]?.toUpperCase() || level.emoji}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: 'var(--tg-text)' }}>
              {tgUser ? `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}` : 'Learner'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg">{level.emoji}</span>
              <span className="text-sm font-medium" style={{ color: level.color }}>
                {level.name}
              </span>
            </div>
          </div>
          <button
            onClick={shareProgress}
            className="p-2.5 rounded-xl active:scale-95 transition-transform"
            style={{ backgroundColor: 'var(--tg-secondary-bg)' }}
          >
            <Share2 size={20} style={{ color: 'var(--tg-hint)' }} />
          </button>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { icon: BookOpen, label: 'Words Learned', value: progress.wordsLearned || 0, color: '#3b82f6' },
            { icon: Flame, label: 'Day Streak', value: progress.streak.count, color: '#f59e0b' },
            { icon: Brain, label: 'Quizzes Done', value: quizzesCompleted, color: '#8b5cf6' },
            { icon: Star, label: 'Favorites', value: (progress.favorites || []).length, color: '#ef4444' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-xl"
              style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
            >
              <stat.icon size={18} style={{ color: stat.color }} />
              <p className="text-lg font-bold mt-1" style={{ color: 'var(--tg-text)' }}>{stat.value}</p>
              <p className="text-xs" style={{ color: 'var(--tg-hint)' }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Progress to total */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl p-4 mb-4"
          style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--tg-text)' }}>
              Overall Progress
            </span>
            <span className="text-xs font-bold" style={{ color: 'var(--tg-button)' }}>
              {Math.round(((progress.wordsLearned || 0) / totalWords) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--tg-secondary-bg)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, ((progress.wordsLearned || 0) / totalWords) * 100)}%`,
                backgroundColor: 'var(--tg-button)',
              }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--tg-hint)' }}>
            {progress.wordsLearned || 0} of {totalWords} words
          </p>
        </motion.div>
      </div>

      {/* Achievements */}
      <div className="px-4">
        <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--tg-section-header)' }}>
          Achievements ({achievements.length}/11)
        </h2>
        <div className="space-y-1.5 mb-4">
          {achievements.map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
            >
              <span className="text-xl">{a.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--tg-text)' }}>{a.label}</p>
                <p className="text-xs" style={{ color: 'var(--tg-hint)' }}>{a.desc}</p>
              </div>
            </motion.div>
          ))}
          {unearned > 0 && (
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)', opacity: 0.5 }}
            >
              <span className="text-xl">🔒</span>
              <p className="text-sm" style={{ color: 'var(--tg-hint)' }}>
                {unearned} more achievement{unearned > 1 ? 's' : ''} to unlock
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Quick links */}
      <div className="px-4 mb-4">
        <h2 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--tg-section-header)' }}>
          Quick Links
        </h2>
        <div className="space-y-1.5">
          {[
            { path: '/achievements', label: 'Achievements', icon: '🏅', desc: 'Unlock badges and rewards' },
            { path: '/daily-challenges', label: 'Daily Challenges', icon: '🎯', desc: 'Complete tasks for rewards' },
            { path: '/history', label: 'Practice History', icon: '📜', desc: 'View past sessions' },
            { path: '/leaderboard', label: 'Leaderboard', icon: '🏆', desc: 'Compete with others' },
            { path: '/stats', label: 'Statistics', icon: '📊', desc: 'Detailed progress' },
            { path: '/favorites', label: 'My Favorites', icon: '❤️', desc: 'Saved words' },
            { path: '/settings', label: 'Settings', icon: '⚙️', desc: 'Goals, language, reset' },
          ].map(link => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="w-full flex items-center gap-3 p-3 rounded-xl active:opacity-80"
              style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
            >
              <span className="text-lg">{link.icon}</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold" style={{ color: 'var(--tg-text)' }}>{link.label}</p>
                <p className="text-xs" style={{ color: 'var(--tg-hint)' }}>{link.desc}</p>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--tg-hint)' }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
