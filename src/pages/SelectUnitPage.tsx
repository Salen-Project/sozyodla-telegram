import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { editions } from '../data/vocabulary';
import { showBackButton, hideMainButton } from '../lib/telegram';

export const SelectUnitPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useParams<{ mode: string }>();

  useEffect(() => {
    showBackButton(() => navigate('/'));
    hideMainButton();
  }, [navigate]);

  const modeLabels: Record<string, string> = {
    flashcards: 'Flashcards',
    quiz: 'Quiz',
    recall: 'Word Recall',
  };

  return (
    <div className="h-full overflow-y-auto pb-6 safe-area-bottom">
      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--tg-text)' }}>
          {modeLabels[mode || ''] || 'Select Unit'}
        </h1>
        <p className="text-sm mb-4" style={{ color: 'var(--tg-subtitle)' }}>
          Choose a book and unit to practice
        </p>

        {editions.map((edition) => (
          <div key={edition.id} className="mb-5">
            <h2
              className="text-xs font-semibold mb-2 uppercase tracking-wider"
              style={{ color: 'var(--tg-section-header)' }}
            >
              {edition.title}
            </h2>
            <div className="space-y-1.5">
              {edition.units.filter(u => u.id <= 3).map((unit, i) => (
                <motion.button
                  key={`${edition.id}-${unit.id}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/${mode}/${edition.id}/${unit.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
                >
                  <div
                    className={`w-9 h-9 rounded-lg bg-gradient-to-br ${edition.color} flex items-center justify-center text-white text-xs font-bold`}
                  >
                    {unit.id}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium" style={{ color: 'var(--tg-text)' }}>
                      {unit.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--tg-hint)' }}>
                      {unit.words.length} words
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--tg-hint)' }} />
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
