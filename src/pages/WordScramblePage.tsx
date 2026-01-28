import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { editions } from '../data/vocabulary';
import { useProgress } from '../contexts/ProgressContext';
import { showBackButton, hideMainButton, haptic } from '../lib/telegram';
import { Word } from '../types';
import { Trophy, RotateCcw, RefreshCw, Shuffle, Check, X } from 'lucide-react';

const LANG_KEY = 'sozyola_tg_lang';
const GAME_SIZE = 10;

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function shuffleLetters(word: string): string[] {
  const letters = word.toUpperCase().split('');
  for (let attempt = 0; attempt < 20; attempt++) {
    const shuffled = shuffleArray(letters);
    if (shuffled.join('') !== letters.join('')) return shuffled;
  }
  return [...letters].reverse();
}

interface ScrambleItem {
  word: string;
  clue: string;
  scrambled: string[];
}

export const WordScramblePage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId, unitId } = useParams<{ bookId: string; unitId: string }>();
  const { saveResult, addWordsLearned, setLastStudied, updateStreak } = useProgress();
  const [lang] = useState(() => localStorage.getItem(LANG_KEY) || 'uz');

  const edition = editions.find(e => e.id === Number(bookId));
  const unit = edition?.units.find(u => u.id === Number(unitId));
  const words = unit?.words || [];

  const getClue = useCallback((w: Word) => {
    if (lang === 'ru' && w.meaningRu) return w.meaningRu;
    return w.meaning;
  }, [lang]);

  const [items, setItems] = useState<ScrambleItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerSlots, setAnswerSlots] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [completed, setCompleted] = useState(false);

  // Initialize game
  const initGame = useCallback(() => {
    const shuffled = shuffleArray(words).slice(0, Math.min(GAME_SIZE, words.length));
    const newItems: ScrambleItem[] = shuffled.map(w => ({
      word: w.word.toUpperCase(),
      clue: getClue(w),
      scrambled: shuffleLetters(w.word),
    }));
    setItems(newItems);
    setCurrentIndex(0);
    setAnswerSlots(new Array(newItems[0]?.word.length || 0).fill(null));
    setShowResult(false);
    setIsCorrect(false);
    setResults([]);
    setCompleted(false);
  }, [words, getClue]);

  useEffect(() => {
    if (words.length > 0) initGame();
  }, [words, initGame]);

  useEffect(() => {
    showBackButton(() => navigate(`/unit/${bookId}/${unitId}`));
    hideMainButton();
    if (edition && unit) {
      setLastStudied(edition.id, unit.id);
      updateStreak();
    }
  }, [navigate, bookId, unitId, edition, unit, setLastStudied, updateStreak]);

  const current = items[currentIndex];
  const usedIndices = new Set(answerSlots.filter(i => i !== null) as number[]);

  const handleLetterTap = (scrambledIndex: number) => {
    if (showResult || usedIndices.has(scrambledIndex)) return;
    
    const emptyIdx = answerSlots.indexOf(null);
    if (emptyIdx === -1) return;
    
    const newSlots = [...answerSlots];
    newSlots[emptyIdx] = scrambledIndex;
    setAnswerSlots(newSlots);
    haptic.impact('light');
  };

  const handleSlotTap = (slotIndex: number) => {
    if (showResult || answerSlots[slotIndex] === null) return;
    
    const newSlots = [...answerSlots];
    newSlots[slotIndex] = null;
    setAnswerSlots(newSlots);
    haptic.impact('light');
  };

  const handleCheck = () => {
    if (!current) return;
    const userWord = answerSlots.map(i => i !== null ? current.scrambled[i] : '').join('');
    const correct = userWord === current.word;
    setIsCorrect(correct);
    setShowResult(true);
    haptic.notification(correct ? 'success' : 'error');
  };

  const handleNext = () => {
    const newResults = [...results, isCorrect];
    setResults(newResults);
    setShowResult(false);

    if (currentIndex + 1 < items.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setAnswerSlots(new Array(items[nextIdx].word.length).fill(null));
    } else {
      // Complete
      const score = newResults.filter(Boolean).length;
      const total = newResults.length;
      const percentage = Math.round((score / total) * 100);
      
      if (edition && unit) {
        saveResult(edition.id, unit.id, {
          score, total, percentage, date: new Date().toISOString()
        });
        addWordsLearned(score);
      }
      setCompleted(true);
      haptic.notification(percentage >= 80 ? 'success' : 'warning');
    }
  };

  const clearAnswer = () => {
    setAnswerSlots(new Array(current?.word.length || 0).fill(null));
    haptic.impact('medium');
  };

  if (!edition || !unit || items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p style={{ color: 'var(--tg-hint)' }}>Loading...</p>
      </div>
    );
  }

  if (completed) {
    const score = results.filter(Boolean).length;
    const total = results.length;
    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 80;

    return (
      <div className="h-full flex flex-col items-center justify-center px-6 pb-6 safe-area-bottom">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ 
            background: passed 
              ? 'linear-gradient(135deg, #22c55e, #10b981)' 
              : 'linear-gradient(135deg, #f59e0b, #f97316)',
          }}
        >
          <Shuffle size={36} color="white" />
        </motion.div>

        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--tg-text)' }}>
          {lang === 'uz' ? "So'z jumboq tugadi!" : 'Word Scramble Complete!'}
        </h2>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-5xl font-extrabold mb-4"
          style={{ color: passed ? '#22c55e' : '#f59e0b' }}
        >
          {percentage}%
        </motion.div>

        <div className="flex gap-8 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{score}</div>
            <div className="text-xs" style={{ color: 'var(--tg-hint)' }}>
              {lang === 'uz' ? "To'g'ri" : 'Correct'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#ef4444' }}>{total - score}</div>
            <div className="text-xs" style={{ color: 'var(--tg-hint)' }}>
              {lang === 'uz' ? "Noto'g'ri" : 'Incorrect'}
            </div>
          </div>
        </div>

        {/* Review words */}
        <div className="w-full max-w-[300px] mb-6 max-h-40 overflow-y-auto">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-lg mb-1"
              style={{ backgroundColor: results[i] ? '#22c55e15' : '#ef444415' }}
            >
              {results[i] ? (
                <Check size={14} style={{ color: '#22c55e' }} />
              ) : (
                <X size={14} style={{ color: '#ef4444' }} />
              )}
              <span className="text-sm font-medium" style={{ color: 'var(--tg-text)' }}>
                {item.word}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 w-full max-w-[280px]">
          <button
            onClick={initGame}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
          >
            <RefreshCw size={18} />
            {lang === 'uz' ? 'Qayta o\'ynash' : 'Play Again'}
          </button>
          <button
            onClick={() => navigate(`/unit/${bookId}/${unitId}`)}
            className="w-full py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
            style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
          >
            {lang === 'uz' ? "Bo'limga qaytish" : 'Back to Unit'}
          </button>
        </div>
      </div>
    );
  }

  const allFilled = answerSlots.every(s => s !== null);
  const progress = ((currentIndex + 1) / items.length) * 100;

  return (
    <div className="h-full flex flex-col px-4 pt-2 pb-6 safe-area-bottom">
      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium" style={{ color: 'var(--tg-hint)' }}>
            {currentIndex + 1} / {items.length}
          </span>
          <span className="text-xs" style={{ color: '#22c55e' }}>
            ✓ {results.filter(Boolean).length}
          </span>
        </div>
        <div 
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--tg-secondary-bg)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: 'var(--tg-button)' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Clue */}
      <div className="text-center mb-4">
        <p className="text-xs uppercase tracking-wider mb-2 font-medium" style={{ color: 'var(--tg-section-header)' }}>
          {lang === 'uz' ? "Harflarni to'g'ri joylashtiring" : 'Unscramble the word'}
        </p>
        <p className="text-lg font-semibold" style={{ color: 'var(--tg-text)' }}>
          {current.clue}
        </p>
      </div>

      {/* Answer slots */}
      <div className="flex justify-center gap-1.5 mb-6 flex-wrap">
        {answerSlots.map((slotValue, i) => (
          <motion.button
            key={`slot-${i}`}
            onClick={() => handleSlotTap(i)}
            className="w-10 h-12 rounded-lg flex items-center justify-center text-lg font-bold"
            style={{
              backgroundColor: showResult 
                ? (isCorrect ? '#22c55e20' : '#ef444420')
                : slotValue !== null 
                  ? 'var(--tg-button)' 
                  : 'var(--tg-secondary-bg)',
              color: showResult
                ? (isCorrect ? '#22c55e' : '#ef4444')
                : slotValue !== null 
                  ? 'var(--tg-button-text)' 
                  : 'var(--tg-hint)',
              border: `2px solid ${showResult 
                ? (isCorrect ? '#22c55e' : '#ef4444')
                : slotValue !== null 
                  ? 'var(--tg-button)' 
                  : 'var(--tg-secondary-bg)'}`,
            }}
            whileTap={{ scale: 0.95 }}
          >
            {slotValue !== null ? current.scrambled[slotValue] : ''}
          </motion.button>
        ))}
      </div>

      {/* Show correct answer if wrong */}
      <AnimatePresence>
        {showResult && !isCorrect && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center mb-4"
          >
            <p className="text-sm" style={{ color: 'var(--tg-hint)' }}>
              {lang === 'uz' ? "To'g'ri javob:" : 'Correct answer:'}
            </p>
            <p className="text-lg font-bold text-green-500">{current.word}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrambled letters */}
      {!showResult && (
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {current.scrambled.map((letter, i) => {
            const isUsed = usedIndices.has(i);
            return (
              <motion.button
                key={`letter-${i}`}
                onClick={() => handleLetterTap(i)}
                disabled={isUsed}
                className="w-10 h-12 rounded-lg flex items-center justify-center text-lg font-bold transition-all"
                style={{
                  backgroundColor: isUsed ? 'var(--tg-secondary-bg)' : 'var(--tg-section-bg)',
                  color: isUsed ? 'var(--tg-hint)' : 'var(--tg-text)',
                  opacity: isUsed ? 0.4 : 1,
                  border: '1px solid var(--tg-secondary-bg)',
                }}
                whileTap={{ scale: isUsed ? 1 : 0.95 }}
              >
                {letter}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-auto flex gap-3">
        {!showResult ? (
          <>
            <button
              onClick={clearAnswer}
              className="py-3 px-4 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
              style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-subtitle)' }}
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={handleCheck}
              disabled={!allFilled}
              className="flex-1 py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform disabled:opacity-40"
              style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
            >
              {lang === 'uz' ? 'Tekshirish' : 'Check'}
            </button>
          </>
        ) : (
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
            style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
          >
            {currentIndex < items.length - 1 
              ? (lang === 'uz' ? "Keyingi so'z →" : 'Next Word →')
              : (lang === 'uz' ? 'Natijalarni ko\'rish' : 'See Results')}
          </button>
        )}
      </div>
    </div>
  );
};
