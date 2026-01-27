import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Brain, Pen, ArrowRight } from 'lucide-react';
import { editions } from '../data/vocabulary';
import { useProgress } from '../contexts/ProgressContext';
import { showBackButton, hideMainButton } from '../lib/telegram';

export const UnitPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId, unitId } = useParams<{ bookId: string; unitId: string }>();
  const { progress } = useProgress();

  const edition = editions.find(e => e.id === Number(bookId));
  const unit = edition?.units.find(u => u.id === Number(unitId));

  useEffect(() => {
    showBackButton(() => navigate(`/book/${bookId}`));
    hideMainButton();
  }, [navigate, bookId]);

  if (!edition || !unit) {
    return (
      <div className="h-full flex items-center justify-center">
        <p style={{ color: 'var(--tg-hint)' }}>Unit not found</p>
      </div>
    );
  }

  const result = progress.results[`${edition.id}-${unit.id}`];

  const modes = [
    {
      id: 'flashcards',
      label: 'Flashcards',
      desc: 'Swipe through word cards',
      icon: BookOpen,
      color: '#3b82f6',
      path: `/flashcards/${bookId}/${unitId}`,
    },
    {
      id: 'quiz',
      label: 'Quiz',
      desc: 'Multiple choice questions',
      icon: Brain,
      color: '#8b5cf6',
      path: `/quiz/${bookId}/${unitId}`,
    },
    {
      id: 'recall',
      label: 'Word Recall',
      desc: 'Type the correct word',
      icon: Pen,
      color: '#f59e0b',
      path: `/recall/${bookId}/${unitId}`,
    },
  ];

  return (
    <div className="h-full overflow-y-auto pb-6 safe-area-bottom">
      <div className="px-4 pt-4">
        {/* Unit header */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
        >
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--tg-text)' }}>
            {unit.title}
          </h1>
          <p className="text-sm mb-3" style={{ color: 'var(--tg-subtitle)' }}>
            {edition.title} • {unit.words.length} words
          </p>
          {result && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: result.percentage >= 80 ? '#22c55e20' : '#f59e0b20',
                color: result.percentage >= 80 ? '#22c55e' : '#f59e0b',
              }}
            >
              Best: {result.percentage}% ({result.score}/{result.total})
            </div>
          )}
        </div>

        {/* Word preview */}
        <div className="mb-5">
          <h2 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--tg-section-header)' }}>
            Words in this unit
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {unit.words.slice(0, 15).map((w) => (
              <span
                key={w.word}
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
              >
                {w.word}
              </span>
            ))}
            {unit.words.length > 15 && (
              <span
                className="px-2.5 py-1 rounded-full text-xs"
                style={{ color: 'var(--tg-hint)' }}
              >
                +{unit.words.length - 15} more
              </span>
            )}
          </div>
        </div>

        {/* Exercise modes */}
        <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--tg-section-header)' }}>
          Start Practicing
        </h2>
        <div className="space-y-2">
          {modes.map((mode, i) => (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(mode.path)}
              className="w-full flex items-center gap-3 p-4 rounded-xl"
              style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${mode.color}20` }}
              >
                <mode.icon size={20} style={{ color: mode.color }} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold" style={{ color: 'var(--tg-text)' }}>
                  {mode.label}
                </p>
                <p className="text-xs" style={{ color: 'var(--tg-hint)' }}>{mode.desc}</p>
              </div>
              <ArrowRight size={18} style={{ color: mode.color }} />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
