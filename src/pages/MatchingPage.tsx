import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { editions } from '../data/vocabulary';
import { useProgress } from '../contexts/ProgressContext';
import { showBackButton, hideMainButton, haptic } from '../lib/telegram';
import { Trophy, RotateCcw } from 'lucide-react';

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const LANG_KEY = 'sozyola_tg_lang';

export const MatchingPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId, unitId } = useParams<{ bookId: string; unitId: string }>();
  const { addWordsLearned, setLastStudied, updateStreak } = useProgress();
  const [lang] = useState(() => localStorage.getItem(LANG_KEY) || 'uz');

  const edition = editions.find(e => e.id === Number(bookId));
  const unit = edition?.units.find(u => u.id === Number(unitId));
  const words = unit?.words || [];

  // Take 6 words for matching
  const gameWords = useMemo(() => shuffleArray(words).slice(0, 6), [words]);
  const shuffledWords = useMemo(() => shuffleArray([...gameWords]), [gameWords]);
  const shuffledMeanings = useMemo(() => shuffleArray([...gameWords]), [gameWords]);

  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => {
    showBackButton(() => navigate(`/unit/${bookId}/${unitId}`));
    hideMainButton();
    if (edition && unit) {
      setLastStudied(edition.id, unit.id);
      updateStreak();
    }
  }, [navigate, bookId, unitId, edition, unit, setLastStudied, updateStreak]);

  const checkMatch = useCallback((wordIdx: number, meaningIdx: number) => {
    const word = shuffledWords[wordIdx];
    const meaning = shuffledMeanings[meaningIdx];

    if (word.word === meaning.word) {
      // Correct match!
      haptic.notification('success');
      const newMatched = new Set(matched);
      newMatched.add(word.word);
      setMatched(newMatched);
      setSelectedWord(null);
      setSelectedMeaning(null);

      if (newMatched.size === gameWords.length) {
        setCompleted(true);
        addWordsLearned(gameWords.length);
        haptic.notification('success');
      }
    } else {
      // Wrong match
      haptic.notification('error');
      setMistakes(m => m + 1);
      setWrongPair(`${wordIdx}-${meaningIdx}`);
      setTimeout(() => {
        setWrongPair(null);
        setSelectedWord(null);
        setSelectedMeaning(null);
      }, 600);
    }
  }, [shuffledWords, shuffledMeanings, matched, gameWords, addWordsLearned]);

  const handleWordClick = (idx: number) => {
    if (matched.has(shuffledWords[idx].word)) return;
    setSelectedWord(idx);
    if (selectedMeaning !== null) {
      checkMatch(idx, selectedMeaning);
    }
  };

  const handleMeaningClick = (idx: number) => {
    if (matched.has(shuffledMeanings[idx].word)) return;
    setSelectedMeaning(idx);
    if (selectedWord !== null) {
      checkMatch(selectedWord, idx);
    }
  };

  if (!edition || !unit) {
    return (
      <div className="h-full flex items-center justify-center">
        <p style={{ color: 'var(--tg-hint)' }}>Not found</p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <Trophy size={64} className="text-yellow-500" />
        </motion.div>
        <h2 className="text-2xl font-bold mt-4 mb-2" style={{ color: 'var(--tg-text)' }}>
          All Matched! 🎉
        </h2>
        <p className="text-sm mb-1" style={{ color: 'var(--tg-subtitle)' }}>
          {gameWords.length} pairs matched
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--tg-hint)' }}>
          Mistakes: {mistakes}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
          >
            <RotateCcw size={16} /> Again
          </button>
          <button
            onClick={() => navigate(`/unit/${bookId}/${unitId}`)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  const getMeaning = (w: typeof gameWords[0]) => lang === 'ru' && w.meaningRu ? w.meaningRu : w.meaning;

  return (
    <div className="h-full flex flex-col px-4 pt-4 pb-4">
      <div className="mb-3">
        <h2 className="text-lg font-bold" style={{ color: 'var(--tg-text)' }}>Match the pairs</h2>
        <p className="text-xs" style={{ color: 'var(--tg-hint)' }}>
          {matched.size}/{gameWords.length} matched • {mistakes} mistakes
        </p>
      </div>

      <div className="flex-1 flex gap-3">
        {/* Words column */}
        <div className="flex-1 space-y-2">
          {shuffledWords.map((w, i) => {
            const isMatched = matched.has(w.word);
            const isSelected = selectedWord === i;
            const isWrong = wrongPair?.startsWith(`${i}-`);
            return (
              <motion.button
                key={`w-${i}`}
                animate={{
                  scale: isWrong ? [1, 0.95, 1] : 1,
                  opacity: isMatched ? 0.4 : 1,
                }}
                onClick={() => handleWordClick(i)}
                disabled={isMatched}
                className="w-full py-3 px-3 rounded-xl text-sm font-semibold text-center transition-all"
                style={{
                  backgroundColor: isMatched ? '#22c55e20' : isSelected ? 'var(--tg-button)' : isWrong ? '#ef444420' : 'var(--tg-section-bg)',
                  color: isMatched ? '#22c55e' : isSelected ? 'var(--tg-button-text)' : isWrong ? '#ef4444' : 'var(--tg-text)',
                  border: `1px solid ${isSelected ? 'var(--tg-button)' : 'var(--tg-secondary-bg)'}`,
                }}
              >
                {w.word}
              </motion.button>
            );
          })}
        </div>

        {/* Meanings column */}
        <div className="flex-1 space-y-2">
          {shuffledMeanings.map((w, i) => {
            const isMatched = matched.has(w.word);
            const isSelected = selectedMeaning === i;
            const isWrong = wrongPair?.endsWith(`-${i}`);
            return (
              <motion.button
                key={`m-${i}`}
                animate={{
                  scale: isWrong ? [1, 0.95, 1] : 1,
                  opacity: isMatched ? 0.4 : 1,
                }}
                onClick={() => handleMeaningClick(i)}
                disabled={isMatched}
                className="w-full py-3 px-3 rounded-xl text-sm text-center transition-all"
                style={{
                  backgroundColor: isMatched ? '#22c55e20' : isSelected ? 'var(--tg-button)' : isWrong ? '#ef444420' : 'var(--tg-section-bg)',
                  color: isMatched ? '#22c55e' : isSelected ? 'var(--tg-button-text)' : isWrong ? '#ef4444' : 'var(--tg-text)',
                  border: `1px solid ${isSelected ? 'var(--tg-button)' : 'var(--tg-secondary-bg)'}`,
                }}
              >
                {getMeaning(w)}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
