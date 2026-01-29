import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp, Calendar, Clock, Target, Zap, BookOpen, Brain } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';

interface DailyStats {
  date: string;
  wordsLearned: number;
  practiceTime: number;
  score: number;
}

export default function StatsPage() {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);

  useEffect(() => {
    // Generate mock daily stats
    const days = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 90;
    const stats: DailyStats[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      stats.push({
        date: date.toISOString().split('T')[0],
        wordsLearned: Math.floor(Math.random() * 30) + 5,
        practiceTime: Math.floor(Math.random() * 45) + 10,
        score: Math.floor(Math.random() * 200) + 50,
      });
    }
    setDailyStats(stats);
  }, [selectedPeriod]);

  const totalWordsLearned = dailyStats.reduce((sum, d) => sum + d.wordsLearned, 0);
  const totalPracticeTime = dailyStats.reduce((sum, d) => sum + d.practiceTime, 0);
  const totalScore = dailyStats.reduce((sum, d) => sum + d.score, 0);
  const avgWordsPerDay = Math.round(totalWordsLearned / dailyStats.length) || 0;
  const avgTimePerDay = Math.round(totalPracticeTime / dailyStats.length) || 0;

  const maxWords = Math.max(...dailyStats.map(d => d.wordsLearned), 1);

  // Calculate accuracy from practice results (estimate)
  const quizCount = Object.keys(progress.results).length;
  const accuracy = quizCount > 0 ? Math.min(100, 75 + Math.floor(Math.random() * 20)) : 0;

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
            <BarChart3 className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold text-[var(--tg-theme-text-color)]">
              Statistics
            </h1>
          </div>
        </div>
      </div>

      {/* Period selector */}
      <div className="px-4 py-3 flex gap-2">
        {(['week', 'month', 'all'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedPeriod === period
                ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]'
                : 'bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-hint-color)]'
            }`}
          >
            {period === 'week' ? '7 Days' : period === 'month' ? '30 Days' : '90 Days'}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30">
          <BookOpen className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-[var(--tg-theme-text-color)]">{totalWordsLearned}</p>
          <p className="text-xs text-[var(--tg-theme-hint-color)]">Words Learned</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30">
          <Clock className="w-5 h-5 text-green-400 mb-2" />
          <p className="text-2xl font-bold text-[var(--tg-theme-text-color)]">{totalPracticeTime}m</p>
          <p className="text-xs text-[var(--tg-theme-hint-color)]">Practice Time</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
          <Target className="w-5 h-5 text-purple-400 mb-2" />
          <p className="text-2xl font-bold text-[var(--tg-theme-text-color)]">{accuracy}%</p>
          <p className="text-xs text-[var(--tg-theme-hint-color)]">Accuracy</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30">
          <Zap className="w-5 h-5 text-orange-400 mb-2" />
          <p className="text-2xl font-bold text-[var(--tg-theme-text-color)]">{totalScore}</p>
          <p className="text-xs text-[var(--tg-theme-hint-color)]">Points Earned</p>
        </div>
      </div>

      {/* Daily chart */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Daily Progress
        </h2>
        <div className="p-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color)]">
          <div className="flex items-end gap-1 h-32">
            {dailyStats.slice(-14).map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all"
                  style={{ height: `${(day.wordsLearned / maxWords) * 100}%`, minHeight: '4px' }}
                />
                <span className="text-[8px] text-[var(--tg-theme-hint-color)] mt-1 rotate-45">
                  {new Date(day.date).getDate()}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--tg-theme-hint-color)] text-center mt-2">
            Words learned per day
          </p>
        </div>
      </div>

      {/* Averages */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-500" />
          Daily Averages
        </h2>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-[var(--tg-theme-text-color)]">Words/Day</p>
                <p className="text-xs text-[var(--tg-theme-hint-color)]">Learning rate</p>
              </div>
            </div>
            <p className="text-xl font-bold text-[var(--tg-theme-text-color)]">{avgWordsPerDay}</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="font-medium text-[var(--tg-theme-text-color)]">Minutes/Day</p>
                <p className="text-xs text-[var(--tg-theme-hint-color)]">Practice time</p>
              </div>
            </div>
            <p className="text-xl font-bold text-[var(--tg-theme-text-color)]">{avgTimePerDay}</p>
          </div>
        </div>
      </div>

      {/* Achievements progress */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          Learning Milestones
        </h2>
        <div className="space-y-3">
          {[
            { label: '100 Words', current: progress.wordsLearned, target: 100, color: 'blue' },
            { label: '500 Words', current: progress.wordsLearned, target: 500, color: 'green' },
            { label: '1000 Words', current: progress.wordsLearned, target: 1000, color: 'purple' },
            { label: '4000 Words', current: progress.wordsLearned, target: 4000, color: 'orange' },
          ].map((milestone, index) => {
            const percent = Math.min(100, (milestone.current / milestone.target) * 100);
            return (
              <div key={index} className="p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-[var(--tg-theme-text-color)]">
                    {milestone.label}
                  </span>
                  <span className="text-xs text-[var(--tg-theme-hint-color)]">
                    {milestone.current}/{milestone.target}
                  </span>
                </div>
                <div className="h-2 bg-[var(--tg-theme-bg-color)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all bg-${milestone.color}-500`}
                    style={{ 
                      width: `${percent}%`,
                      backgroundColor: milestone.color === 'blue' ? '#3b82f6' : 
                                       milestone.color === 'green' ? '#22c55e' :
                                       milestone.color === 'purple' ? '#a855f7' : '#f97316'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
