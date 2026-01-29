import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Gift, CheckCircle, Lock, Star, Zap, Brain, BookOpen } from 'lucide-react';
import { haptic } from '../lib/telegram';
import { useProgress } from '../contexts/ProgressContext';

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  reward: number;
  type: 'words' | 'quiz' | 'streak' | 'review' | 'challenge';
}

const DAILY_CHALLENGES: Challenge[] = [
  { id: 'learn-10', title: 'Word Explorer', description: 'Learn 10 new words', icon: '📚', target: 10, reward: 50, type: 'words' },
  { id: 'learn-20', title: 'Vocabulary Builder', description: 'Learn 20 new words', icon: '📖', target: 20, reward: 100, type: 'words' },
  { id: 'quiz-3', title: 'Quiz Master', description: 'Complete 3 quizzes', icon: '🧠', target: 3, reward: 75, type: 'quiz' },
  { id: 'review-15', title: 'Memory Keeper', description: 'Review 15 words', icon: '🔄', target: 15, reward: 60, type: 'review' },
  { id: 'challenge-100', title: 'Speed Demon', description: 'Score 100+ in Challenge', icon: '⚡', target: 100, reward: 80, type: 'challenge' },
  { id: 'streak-maintain', title: 'Consistency King', description: 'Maintain your streak', icon: '🔥', target: 1, reward: 40, type: 'streak' },
];

const STORAGE_KEY = 'sozyola_daily_challenges';

interface DailyProgress {
  date: string;
  completed: string[];
  progress: Record<string, number>;
  claimed: string[];
}

export default function DailyChallengesPage() {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toISOString().split('T')[0];
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) return parsed;
    }
    return { date: today, completed: [], progress: {}, claimed: [] };
  });

  // Today's challenges (rotate based on day)
  const todaysChallenges = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    // Pick 4 challenges for today
    const shuffled = [...DAILY_CHALLENGES].sort((a, b) => {
      const hashA = (dayOfYear * 17 + a.id.charCodeAt(0)) % 100;
      const hashB = (dayOfYear * 17 + b.id.charCodeAt(0)) % 100;
      return hashA - hashB;
    });
    return shuffled.slice(0, 4);
  }, []);

  // Calculate progress for each challenge
  const getChallengeProgress = (challenge: Challenge): number => {
    switch (challenge.type) {
      case 'words':
        return progress.dailyGoal.wordsToday || 0;
      case 'quiz':
        return dailyProgress.progress['quiz'] || 0;
      case 'review':
        return dailyProgress.progress['review'] || 0;
      case 'challenge':
        return dailyProgress.progress['challenge'] || 0;
      case 'streak':
        return progress.streak.count > 0 ? 1 : 0;
      default:
        return 0;
    }
  };

  const isCompleted = (challenge: Challenge): boolean => {
    return getChallengeProgress(challenge) >= challenge.target;
  };

  const isClaimed = (challenge: Challenge): boolean => {
    return dailyProgress.claimed.includes(challenge.id);
  };

  const claimReward = (challenge: Challenge) => {
    if (!isCompleted(challenge) || isClaimed(challenge)) return;
    
    haptic.notification('success');
    
    setDailyProgress(prev => ({
      ...prev,
      claimed: [...prev.claimed, challenge.id],
    }));
    
    // Save to localStorage
    const updated = {
      ...dailyProgress,
      claimed: [...dailyProgress.claimed, challenge.id],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Time until reset
  const [timeUntilReset, setTimeUntilReset] = useState('');
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeUntilReset(`${hours}h ${minutes}m`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const totalRewards = todaysChallenges
    .filter(c => isClaimed(c))
    .reduce((sum, c) => sum + c.reward, 0);

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
            <Calendar className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold text-[var(--tg-theme-text-color)]">
              Daily Challenges
            </h1>
          </div>
        </div>
      </div>

      {/* Reset timer */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)]">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-[var(--tg-theme-text-color)]">Resets in</span>
          </div>
          <span className="font-bold text-[var(--tg-theme-button-color)]">{timeUntilReset}</span>
        </div>
      </div>

      {/* Total rewards */}
      <div className="px-4 mb-4">
        <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-[var(--tg-theme-text-color)]">Today's Rewards</span>
            </div>
            <span className="text-xl font-bold text-yellow-500">+{totalRewards} pts</span>
          </div>
        </div>
      </div>

      {/* Challenges list */}
      <div className="px-4 space-y-3">
        {todaysChallenges.map((challenge) => {
          const currentProgress = getChallengeProgress(challenge);
          const completed = isCompleted(challenge);
          const claimed = isClaimed(challenge);
          const percent = Math.min(100, (currentProgress / challenge.target) * 100);

          return (
            <div
              key={challenge.id}
              className={`p-4 rounded-xl border ${
                claimed
                  ? 'bg-green-500/10 border-green-500/30'
                  : completed
                  ? 'bg-[var(--tg-theme-secondary-bg-color)] border-[var(--tg-theme-button-color)]'
                  : 'bg-[var(--tg-theme-secondary-bg-color)] border-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{challenge.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[var(--tg-theme-text-color)]">
                      {challenge.title}
                    </h3>
                    {claimed && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </div>
                  <p className="text-sm text-[var(--tg-theme-hint-color)]">{challenge.description}</p>
                  
                  {/* Progress bar */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[var(--tg-theme-hint-color)]">
                        {currentProgress}/{challenge.target}
                      </span>
                      <span className="text-yellow-500 font-medium">+{challenge.reward} pts</span>
                    </div>
                    <div className="h-2 bg-[var(--tg-theme-bg-color)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          claimed ? 'bg-green-500' : completed ? 'bg-[var(--tg-theme-button-color)]' : 'bg-blue-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Claim button */}
                {completed && !claimed && (
                  <button
                    onClick={() => claimReward(challenge)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] text-sm font-medium"
                  >
                    Claim
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="px-4 mt-6">
        <h2 className="text-sm font-semibold text-[var(--tg-theme-hint-color)] uppercase tracking-wider mb-3">
          Tips
        </h2>
        <div className="space-y-2 text-sm text-[var(--tg-theme-hint-color)]">
          <p>• Complete challenges before reset to earn bonus points</p>
          <p>• Challenges refresh daily with new goals</p>
          <p>• Build streaks for extra rewards</p>
        </div>
      </div>
    </div>
  );
}
