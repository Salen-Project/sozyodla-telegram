import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { editions } from '../data/vocabulary';
import { useProgress } from '../contexts/ProgressContext';
import { FlashCard } from '../components/FlashCard';
import { showBackButton, hideMainButton, haptic } from '../lib/telegram';
import { CheckCircle } from 'lucide-react';

export const FlashcardsPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId, unitId } = useParams<{ bookId: string; unitId: string }>();
  const { addWordsLearned, toggleFavorite, isFavorite, setLastStudied, updateStreak } = useProgress();

  const edition = editions.find(e => e.id === Number(bookId));
  const unit = edition?.units.find(u => u.id === Number(unitId));
  const words = unit?.words || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [knownWords, setKnownWords] = useState<Set<number>>(new Set());
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    showBackButton(() => navigate(`/unit/${bookId}/${unitId}`));
    hideMainButton();
    if (edition && unit) {
      setLastStudied(edition.id, unit.id);
      updateStreak();
    }
  }, [navigate, bookId, unitId, edition, unit, setLastStudied, updateStreak]);

  const goNext = useCallback(() => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setCompleted(true);
      addWordsLearned(knownWords.size);
      haptic.notification('success');
    }
  }, [currentIndex, words.length, knownWords.size, addWordsLearned]);

  const handleSwipeRight = useCallback(() => {
    setKnownWords(prev => new Set(prev).add(currentIndex));
    goNext();
  }, [currentIndex, goNext]);

  const handleSwipeLeft = useCallback(() => {
    goNext();
  }, [goNext]);

  if (!edition || !unit || words.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p style={{ color: 'var(--tg-hint)' }}>No words found</p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <CheckCircle size={72} className="text-green-500" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--tg-text)' }}>
          Complete! 🎉
        </h2>
        <p className="text-sm mb-1" style={{ color: 'var(--tg-subtitle)' }}>
          You reviewed all {words.length} words
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--tg-hint)' }}>
          Known: {knownWords.size} • Review: {words.length - knownWords.size}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setKnownWords(new Set());
              setCompleted(false);
            }}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
          >
            Restart
          </button>
          <button
            onClick={() => navigate(`/unit/${bookId}/${unitId}`)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
          >
            Back to Unit
          </button>
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <div className="h-full flex flex-col px-4 pt-4 pb-6 safe-area-bottom">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex items-center"
        >
          <FlashCard
            word={currentWord}
            index={currentIndex}
            total={words.length}
            isFavorite={isFavorite(edition.id, unit.id, currentWord.word)}
            onToggleFavorite={() => toggleFavorite(edition.id, unit.id, currentWord.word)}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
          />
        </motion.div>
      </AnimatePresence>

      {/* Bottom navigation */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={handleSwipeLeft}
          className="flex-1 py-3 rounded-xl text-sm font-semibold max-w-[140px] active:scale-95 transition-transform"
          style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
        >
          ✗ Review
        </button>
        <button
          onClick={handleSwipeRight}
          className="flex-1 py-3 rounded-xl text-sm font-semibold max-w-[140px] active:scale-95 transition-transform"
          style={{ backgroundColor: '#22c55e20', color: '#22c55e' }}
        >
          ✓ Know it
        </button>
      </div>
    </div>
  );
};
