import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, TrendingUp, CheckCircle, XCircle, BookOpen, Brain, RotateCcw } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { editions } from '../data/vocabulary';

interface HistoryEntry {
  date: string;
  editionId: number;
  unitId: number;
  bookTitle: string;
  unitTitle: string;
  score: number;
  total: number;
  mode: string;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');

  // Build history from results
  const history = useMemo(() => {
    const entries: HistoryEntry[] = [];
    
    Object.entries(progress.results).forEach(([key, result]) => {
      const [editionId, unitId] = key.split('-').map(Number);
      const edition = editions.find(e => e.id === editionId);
      const unit = edition?.units.find(u => u.id === unitId);
      
      if (edition && unit && result) {
        entries.push({
          date: result.date || new Date().toISOString(),
          editionId,
          unitId,
          bookTitle: edition.title,
          unitTitle: `Unit ${unit.id}`,
          score: result.score || 0,
          total: result.total || unit.words.length,
          mode: 'quiz',
        });
      }
    });
    
    // Sort by date descending
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [progress.results]);

  // Filter by time period
  const filteredHistory = useMemo(() => {
    const now = new Date();
    return history.filter(entry => {
      const entryDate = new Date(entry.date);
      switch (filter) {
        case 'week':
          return now.getTime() - entryDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
        case 'month':
          return now.getTime() - entryDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
        default:
          return true;
      }
    });
  }, [history, filter]);

  // Group by date
  const groupedHistory = useMemo(() => {
    const groups: Record<string, HistoryEntry[]> = {};
    filteredHistory.forEach(entry => {
      const date = new Date(entry.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(entry);
    });
    return groups;
  }, [filteredHistory]);

  // Stats
  const stats = useMemo(() => {
    const totalSessions = filteredHistory.length;
    const totalCorrect = filteredHistory.reduce((sum, e) => sum + e.score, 0);
    const totalQuestions = filteredHistory.reduce((sum, e) => sum + e.total, 0);
    const avgAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    return { totalSessions, totalCorrect, totalQuestions, avgAccuracy };
  }, [filteredHistory]);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'flashcards': return '🃏';
      case 'quiz': return '🧠';
      case 'recall': return '💭';
      case 'matching': return '🔗';
      case 'multiple-choice': return '📝';
      case 'scramble': return '🔀';
      case 'fill-blank': return '📋';
      default: return '📚';
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
            <Clock className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold text-[var(--tg-theme-text-color)]">
              Practice History
            </h1>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="px-4 py-3 flex gap-2">
        {(['all', 'week', 'month'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]'
                : 'bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-hint-color)]'
            }`}
          >
            {f === 'all' ? 'All Time' : f === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* Stats summary */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color)]">
            <BookOpen className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-[var(--tg-theme-text-color)]">{stats.totalSessions}</p>
            <p className="text-xs text-[var(--tg-theme-hint-color)]">Sessions</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color)]">
            <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
            <p className="text-2xl font-bold text-[var(--tg-theme-text-color)]">{stats.avgAccuracy}%</p>
            <p className="text-xs text-[var(--tg-theme-hint-color)]">Avg Accuracy</p>
          </div>
        </div>
      </div>

      {/* History list */}
      {Object.keys(groupedHistory).length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Brain className="w-12 h-12 text-[var(--tg-theme-hint-color)] mx-auto mb-3" />
          <p className="text-[var(--tg-theme-hint-color)]">No practice history yet</p>
          <p className="text-sm text-[var(--tg-theme-hint-color)] mt-1">Complete a quiz to see your progress</p>
        </div>
      ) : (
        <div className="px-4 space-y-6">
          {Object.entries(groupedHistory).map(([date, entries]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-[var(--tg-theme-hint-color)]" />
                <h3 className="text-sm font-semibold text-[var(--tg-theme-hint-color)]">{date}</h3>
              </div>
              <div className="space-y-2">
                {entries.map((entry, index) => {
                  const percent = Math.round((entry.score / entry.total) * 100);
                  return (
                    <button
                      key={index}
                      onClick={() => navigate(`/unit/${entry.editionId}/${entry.unitId}`)}
                      className="w-full p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getModeIcon(entry.mode)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--tg-theme-text-color)] truncate">
                            {entry.bookTitle}
                          </p>
                          <p className="text-xs text-[var(--tg-theme-hint-color)]">
                            {entry.unitTitle} • {formatTime(entry.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${percent >= 80 ? 'text-green-500' : percent >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {percent}%
                          </p>
                          <p className="text-xs text-[var(--tg-theme-hint-color)]">
                            {entry.score}/{entry.total}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
