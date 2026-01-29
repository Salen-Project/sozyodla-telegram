import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Crown, Flame, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { supabase } from '../lib/supabase';

interface LeaderboardEntry {
  id: string;
  username: string;
  total_score: number;
  words_learned: number;
  streak: number;
  rank?: number;
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { progress } = useProgress();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'all' | 'week' | 'today'>('all');
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Fetch leaderboard from Supabase
      const { data, error } = await supabase
        .from('user_progress')
        .select('user_id, total_score, words_learned, streak')
        .order('total_score', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get usernames
      const entries: LeaderboardEntry[] = (data || []).map((entry, index) => ({
        id: entry.user_id,
        username: `User ${entry.user_id.slice(0, 6)}`, // Anonymous usernames
        total_score: entry.total_score || 0,
        words_learned: entry.words_learned || 0,
        streak: entry.streak || 0,
        rank: index + 1,
      }));

      setLeaderboard(entries);

      // Find user's rank
      if (user) {
        const rank = entries.findIndex(e => e.id === user.id) + 1;
        setUserRank(rank > 0 ? rank : null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Generate mock data for demo
      const mockData: LeaderboardEntry[] = [
        { id: '1', username: 'WordMaster', total_score: 15420, words_learned: 2500, streak: 45 },
        { id: '2', username: 'VocabKing', total_score: 12350, words_learned: 2100, streak: 32 },
        { id: '3', username: 'LearnerPro', total_score: 10890, words_learned: 1800, streak: 28 },
        { id: '4', username: 'StudyBee', total_score: 9540, words_learned: 1600, streak: 21 },
        { id: '5', username: 'BrainBoost', total_score: 8720, words_learned: 1450, streak: 19 },
        { id: '6', username: 'QuickMind', total_score: 7650, words_learned: 1280, streak: 15 },
        { id: '7', username: 'SmartOwl', total_score: 6890, words_learned: 1150, streak: 12 },
        { id: '8', username: 'WordWizard', total_score: 5430, words_learned: 920, streak: 9 },
        { id: '9', username: 'LearnFast', total_score: 4210, words_learned: 710, streak: 7 },
        { id: '10', username: 'VocabPro', total_score: 3650, words_learned: 620, streak: 5 },
      ].map((e, i) => ({ ...e, rank: i + 1 }));
      setLeaderboard(mockData);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-400 font-bold">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-300/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-orange-500/20 border-amber-600/30';
      default:
        return 'bg-[var(--tg-theme-secondary-bg-color)] border-transparent';
    }
  };

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
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h1 className="text-xl font-bold text-[var(--tg-theme-text-color)]">
              Leaderboard
            </h1>
          </div>
        </div>
      </div>

      {/* Time filter */}
      <div className="px-4 py-3 flex gap-2">
        {(['all', 'week', 'today'] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              timeframe === tf
                ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]'
                : 'bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-hint-color)]'
            }`}
          >
            {tf === 'all' ? 'All Time' : tf === 'week' ? 'This Week' : 'Today'}
          </button>
        ))}
      </div>

      {/* User's rank card */}
      {user && (
        <div className="mx-4 mb-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--tg-theme-button-color)] flex items-center justify-center">
                <Star className="w-5 h-5 text-[var(--tg-theme-button-text-color)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--tg-theme-hint-color)]">Your Rank</p>
                <p className="text-xl font-bold text-[var(--tg-theme-text-color)]">
                  {userRank ? `#${userRank}` : 'Unranked'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-[var(--tg-theme-hint-color)]">Score</p>
              <p className="text-xl font-bold text-[var(--tg-theme-text-color)]">
                {(progress.wordsLearned * 10).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard list */}
      <div className="px-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-[var(--tg-theme-button-color)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          leaderboard.map((entry) => (
            <div
              key={entry.id}
              className={`p-4 rounded-xl border ${getRankBg(entry.rank || 0)} ${
                entry.id === user?.id ? 'ring-2 ring-[var(--tg-theme-button-color)]' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                {getRankIcon(entry.rank || 0)}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--tg-theme-text-color)] truncate">
                    {entry.username}
                    {entry.id === user?.id && (
                      <span className="ml-2 text-xs bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[var(--tg-theme-hint-color)]">
                    <span>📚 {entry.words_learned} words</span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      {entry.streak} days
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[var(--tg-theme-text-color)]">
                    {entry.total_score.toLocaleString()}
                  </p>
                  <p className="text-xs text-[var(--tg-theme-hint-color)]">points</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
