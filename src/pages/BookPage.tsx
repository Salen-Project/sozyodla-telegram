import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Lock, CheckCircle } from 'lucide-react';
import { editions } from '../data/vocabulary';
import { useProgress } from '../contexts/ProgressContext';
import { showBackButton, hideMainButton } from '../lib/telegram';

export const BookPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId: string }>();
  const { progress, isUnitUnlocked } = useProgress();

  const edition = editions.find(e => e.id === Number(bookId));

  useEffect(() => {
    showBackButton(() => navigate('/'));
    hideMainButton();
    return () => {};
  }, [navigate]);

  if (!edition) {
    return (
      <div className="h-full flex items-center justify-center">
        <p style={{ color: 'var(--tg-hint)' }}>Book not found</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-6 safe-area-bottom">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div
          className={`w-full h-24 rounded-2xl bg-gradient-to-br ${edition.color} flex items-center justify-center mb-4`}
        >
          <h1 className="text-xl font-bold text-white text-center px-4">
            {edition.title}
          </h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--tg-subtitle)' }}>
          {edition.description}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--tg-hint)' }}>
          {edition.units.length} units • {edition.units.reduce((a, u) => a + u.words.length, 0)} words
        </p>
      </div>

      {/* Units */}
      <div className="px-4 space-y-2">
        {edition.units.map((unit, i) => {
          const result = progress.results[`${edition.id}-${unit.id}`];
          const unlocked = isUnitUnlocked(edition.id, unit.id);

          return (
            <motion.button
              key={unit.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileTap={unlocked ? { scale: 0.98 } : undefined}
              onClick={() => unlocked && navigate(`/unit/${edition.id}/${unit.id}`)}
              disabled={!unlocked}
              className="w-full flex items-center gap-3 p-4 rounded-xl transition-opacity"
              style={{
                backgroundColor: 'var(--tg-section-bg)',
                border: '1px solid var(--tg-secondary-bg)',
                opacity: unlocked ? 1 : 0.5,
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{
                  backgroundColor: result
                    ? '#22c55e20'
                    : unlocked
                    ? 'var(--tg-secondary-bg)'
                    : 'var(--tg-secondary-bg)',
                  color: result ? '#22c55e' : 'var(--tg-text)',
                }}
              >
                {result ? <CheckCircle size={20} /> : unit.id}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--tg-text)' }}>
                  {unit.title}
                </p>
                <p className="text-xs" style={{ color: 'var(--tg-hint)' }}>
                  {unit.words.length} words
                  {result && ` • ${result.percentage}%`}
                </p>
              </div>
              {unlocked ? (
                <ChevronRight size={18} style={{ color: 'var(--tg-hint)' }} />
              ) : (
                <Lock size={16} style={{ color: 'var(--tg-hint)' }} />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
