import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Lock, Check, Star, Trophy, Flame, BookOpen, Brain, Target, Zap, Heart, Crown } from 'lucide-react';
import { haptic } from '../lib/telegram';
import { useProgress } from '../contexts/ProgressContext';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'streak' | 'mastery' | 'social';
  condition: (progress: any) => boolean;
  progress: (progress: any) => { current: number; target: number };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const ACHIEVEMENTS: Achievement[] = [
  // Learning achievements
  {
    id: 'first-word',
    title: 'First Step',
    description: 'Learn your first word',
    icon: '🎯',
    category: 'learning',
    condition: (p) => (p.wordsLearned || 0) >= 1,
    progress: (p) => ({ current: p.wordsLearned || 0, target: 1 }),
    rarity: 'common',
  },
  {
    id: 'words-50',
    title: 'Word Collector',
    description: 'Learn 50 words',
    icon: '📚',
    category: 'learning',
    condition: (p) => (p.wordsLearned || 0) >= 50,
    progress: (p) => ({ current: Math.min(50, p.wordsLearned || 0), target: 50 }),
    rarity: 'common',
  },
  {
    id: 'words-100',
    title: 'Century Club',
    description: 'Learn 100 words',
    icon: '💯',
    category: 'learning',
    condition: (p) => (p.wordsLearned || 0) >= 100,
    progress: (p) => ({ current: Math.min(100, p.wordsLearned || 0), target: 100 }),
    rarity: 'common',
  },
  {
    id: 'words-500',
    title: 'Vocabulary Builder',
    description: 'Learn 500 words',
    icon: '📖',
    category: 'learning',
    condition: (p) => (p.wordsLearned || 0) >= 500,
    progress: (p) => ({ current: Math.min(500, p.wordsLearned || 0), target: 500 }),
    rarity: 'rare',
  },
  {
    id: 'words-1000',
    title: 'Word Master',
    description: 'Learn 1000 words',
    icon: '🏆',
    category: 'learning',
    condition: (p) => (p.wordsLearned || 0) >= 1000,
    progress: (p) => ({ current: Math.min(1000, p.wordsLearned || 0), target: 1000 }),
    rarity: 'epic',
  },
  {
    id: 'words-2000',
    title: 'Vocabulary Virtuoso',
    description: 'Learn 2000 words',
    icon: '👑',
    category: 'learning',
    condition: (p) => (p.wordsLearned || 0) >= 2000,
    progress: (p) => ({ current: Math.min(2000, p.wordsLearned || 0), target: 2000 }),
    rarity: 'legendary',
  },
  {
    id: 'words-4000',
    title: 'Language Legend',
    description: 'Learn all 4000 words',
    icon: '🌟',
    category: 'learning',
    condition: (p) => (p.wordsLearned || 0) >= 4000,
    progress: (p) => ({ current: Math.min(4000, p.wordsLearned || 0), target: 4000 }),
    rarity: 'legendary',
  },
  
  // Streak achievements
  {
    id: 'streak-3',
    title: 'Getting Started',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    category: 'streak',
    condition: (p) => (p.streak?.count || 0) >= 3,
    progress: (p) => ({ current: Math.min(3, p.streak?.count || 0), target: 3 }),
    rarity: 'common',
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '⚡',
    category: 'streak',
    condition: (p) => (p.streak?.count || 0) >= 7,
    progress: (p) => ({ current: Math.min(7, p.streak?.count || 0), target: 7 }),
    rarity: 'common',
  },
  {
    id: 'streak-14',
    title: 'Two Week Champion',
    description: 'Maintain a 14-day streak',
    icon: '💪',
    category: 'streak',
    condition: (p) => (p.streak?.count || 0) >= 14,
    progress: (p) => ({ current: Math.min(14, p.streak?.count || 0), target: 14 }),
    rarity: 'rare',
  },
  {
    id: 'streak-30',
    title: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '🌙',
    category: 'streak',
    condition: (p) => (p.streak?.count || 0) >= 30,
    progress: (p) => ({ current: Math.min(30, p.streak?.count || 0), target: 30 }),
    rarity: 'epic',
  },
  {
    id: 'streak-100',
    title: 'Unstoppable',
    description: 'Maintain a 100-day streak',
    icon: '🔱',
    category: 'streak',
    condition: (p) => (p.streak?.count || 0) >= 100,
    progress: (p) => ({ current: Math.min(100, p.streak?.count || 0), target: 100 }),
    rarity: 'legendary',
  },
  
  // Mastery achievements
  {
    id: 'quiz-1',
    title: 'Quiz Taker',
    description: 'Complete your first quiz',
    icon: '🧠',
    category: 'mastery',
    condition: (p) => Object.keys(p.results || {}).length >= 1,
    progress: (p) => ({ current: Math.min(1, Object.keys(p.results || {}).length), target: 1 }),
    rarity: 'common',
  },
  {
    id: 'quiz-10',
    title: 'Quiz Expert',
    description: 'Complete 10 quizzes',
    icon: '🎓',
    category: 'mastery',
    condition: (p) => Object.keys(p.results || {}).length >= 10,
    progress: (p) => ({ current: Math.min(10, Object.keys(p.results || {}).length), target: 10 }),
    rarity: 'rare',
  },
  {
    id: 'quiz-50',
    title: 'Quiz Champion',
    description: 'Complete 50 quizzes',
    icon: '🏅',
    category: 'mastery',
    condition: (p) => Object.keys(p.results || {}).length >= 50,
    progress: (p) => ({ current: Math.min(50, Object.keys(p.results || {}).length), target: 50 }),
    rarity: 'epic',
  },
  
  // Social achievements
  {
    id: 'favorites-5',
    title: 'Collector',
    description: 'Save 5 favorite words',
    icon: '❤️',
    category: 'social',
    condition: (p) => (p.favorites?.length || 0) >= 5,
    progress: (p) => ({ current: Math.min(5, p.favorites?.length || 0), target: 5 }),
    rarity: 'common',
  },
  {
    id: 'favorites-25',
    title: 'Word Curator',
    description: 'Save 25 favorite words',
    icon: '💎',
    category: 'social',
    condition: (p) => (p.favorites?.length || 0) >= 25,
    progress: (p) => ({ current: Math.min(25, p.favorites?.length || 0), target: 25 }),
    rarity: 'rare',
  },
];

const RARITY_COLORS = {
  common: { bg: 'from-gray-500/20 to-gray-400/20', border: 'border-gray-500/30', text: 'text-gray-400' },
  rare: { bg: 'from-blue-500/20 to-blue-400/20', border: 'border-blue-500/30', text: 'text-blue-400' },
  epic: { bg: 'from-purple-500/20 to-purple-400/20', border: 'border-purple-500/30', text: 'text-purple-400' },
  legendary: { bg: 'from-yellow-500/20 to-orange-400/20', border: 'border-yellow-500/30', text: 'text-yellow-400' },
};

const CATEGORY_LABELS = {
  learning: { label: 'Learning', icon: BookOpen, color: 'text-blue-500' },
  streak: { label: 'Streaks', icon: Flame, color: 'text-orange-500' },
  mastery: { label: 'Mastery', icon: Brain, color: 'text-purple-500' },
  social: { label: 'Collection', icon: Heart, color: 'text-pink-500' },
};

export default function AchievementsPage() {
  const navigate = useNavigate();
  const { progress } = useProgress();

  const { unlocked, total, byCategory } = useMemo(() => {
    const unlockedList = ACHIEVEMENTS.filter(a => a.condition(progress));
    const grouped = {
      learning: ACHIEVEMENTS.filter(a => a.category === 'learning'),
      streak: ACHIEVEMENTS.filter(a => a.category === 'streak'),
      mastery: ACHIEVEMENTS.filter(a => a.category === 'mastery'),
      social: ACHIEVEMENTS.filter(a => a.category === 'social'),
    };
    return {
      unlocked: unlockedList.length,
      total: ACHIEVEMENTS.length,
      byCategory: grouped,
    };
  }, [progress]);

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--tg-theme-bg-color)] border-b border-[var(--tg-theme-hint-color)]/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-[var(--tg-theme-secondary-bg-color)]"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--tg-theme-text-color)]" />
          </button>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-500" />
            <h1 className="text-xl font-bold text-[var(--tg-theme-text-color)]">
              Achievements
            </h1>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 py-4">
        <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-[var(--tg-theme-hint-color)]">Unlocked</p>
                <p className="text-2xl font-bold text-[var(--tg-theme-text-color)]">
                  {unlocked}/{total}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-[var(--tg-theme-hint-color)]">Completion</p>
              <p className="text-2xl font-bold text-yellow-500">
                {Math.round((unlocked / total) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      {(Object.keys(byCategory) as Array<keyof typeof byCategory>).map(category => {
        const { label, icon: Icon, color } = CATEGORY_LABELS[category];
        const achievements = byCategory[category];
        const unlockedInCategory = achievements.filter(a => a.condition(progress)).length;

        return (
          <div key={category} className="px-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${color}`} />
                <h2 className="font-semibold text-[var(--tg-theme-text-color)]">{label}</h2>
              </div>
              <span className="text-sm text-[var(--tg-theme-hint-color)]">
                {unlockedInCategory}/{achievements.length}
              </span>
            </div>

            <div className="space-y-2">
              {achievements.map(achievement => {
                const isUnlocked = achievement.condition(progress);
                const { current, target } = achievement.progress(progress);
                const percent = Math.min(100, (current / target) * 100);
                const colors = RARITY_COLORS[achievement.rarity];

                return (
                  <div
                    key={achievement.id}
                    className={`p-3 rounded-xl border bg-gradient-to-r ${colors.bg} ${colors.border} ${
                      !isUnlocked ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {isUnlocked ? achievement.icon : '🔒'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[var(--tg-theme-text-color)] truncate">
                            {achievement.title}
                          </h3>
                          {isUnlocked && <Check className="w-4 h-4 text-green-500 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-[var(--tg-theme-hint-color)]">
                          {achievement.description}
                        </p>
                        {!isUnlocked && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-[var(--tg-theme-bg-color)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[var(--tg-theme-button-color)] rounded-full transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <p className="text-xs text-[var(--tg-theme-hint-color)] mt-1">
                              {current}/{target}
                            </p>
                          </div>
                        )}
                      </div>
                      <span className={`text-xs font-medium ${colors.text} capitalize`}>
                        {achievement.rarity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
