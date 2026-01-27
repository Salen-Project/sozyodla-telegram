import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { editions } from '../data/vocabulary';
import { useProgress } from '../contexts/ProgressContext';
import { ProgressBar } from '../components/ProgressBar';
import { showBackButton, hideMainButton, haptic } from '../lib/telegram';
import { Word } from '../types';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Eye } from 'lucide-react';

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const RecallPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId, unitId } = useParams<{ bookId: string; unitId: string }>();
  const { saveResult, addWordsLearned, setLastStudied, updateStreak } = useProgress();

  const edition = editions.find(e => e.id === Number(bookId));
  const unit = edition?.units.find(u => u.id === Number(unitId));
  const words = unit?.words || [];

  const shuffledWords = useMemo(() => shuffleArray(words), [words]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | 'revealed' | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    showBackButton(() => navigate(`/unit/${bookId}/${unitId}`));
    hideMainButton();
    if (edition && unit) {
      setLastStudied(edition.id, unit.id);
      updateStreak();
    }
  }, [navigate, bookId, unitId, edition, unit, setLastStudied, updateStreak]);

  useEffect(() => {
    if (!result && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, result]);

  const currentWord: Word | undefined = shuffledWords[currentIndex];

  const checkAnswer = useCallback(() => {
    if (!currentWord || !input.trim()) return;

    const isCorrect = input.trim().toLowerCase() === currentWord.word.toLowerCase();
    setResult(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      haptic.notification('success');
      setScore(s => s + 1);
    } else {
      haptic.notification('error');
    }
  }, [input, currentWord]);

  const revealAnswer = useCallback(() => {
    setResult('revealed');
    haptic.impact('medium');
  }, []);

  const goNext = useCallback(() => {
    if (currentIndex < shuffledWords.length - 1) {
      setCurrentIndex(i => i + 1);
      setInput('');
      setResult(null);
    } else {
      const total = shuffledWords.length;
      const percentage = Math.round((score / total) * 100);

      if (edition && unit) {
        saveResult(edition.id, unit.id, {
          score,
          total,
          percentage,
          date: new Date().toISOString(),
        });
        addWordsLearned(score);
      }
      setCompleted(true);
      haptic.notification('success');
    }
  }, [currentIndex, shuffledWords.length, score, edition, unit, saveResult, addWordsLearned]);

  if (!edition || !unit || words.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p style={{ color: 'var(--tg-hint)' }}>No words found</p>
      </div>
    );
  }

  if (completed) {
    const percentage = Math.round((score / shuffledWords.length) * 100);
    const isGreat = percentage >= 80;

    return (
      <div className="h-full flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mb-5"
        >
          <CheckCircle size={64} className={isGreat ? 'text-green-500' : 'text-yellow-500'} />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--tg-text)' }}>
          {isGreat ? 'Amazing Recall! 🧠' : 'Good Effort! 💪'}
        </h2>
        <div
          className="text-4xl font-bold mb-2"
          style={{ color: isGreat ? '#22c55e' : '#f59e0b' }}
        >
          {percentage}%
        </div>
        <p className="text-sm mb-6" style={{ color: 'var(--tg-subtitle)' }}>
          {score} out of {shuffledWords.length} recalled correctly
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setInput('');
              setResult(null);
              setScore(0);
              setCompleted(false);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
          >
            <RotateCcw size={16} /> Retry
          </button>
          <button
            onClick={() => navigate(`/unit/${bookId}/${unitId}`)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
          >
            Done <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col px-4 pt-4 pb-6 safe-area-bottom">
      <ProgressBar current={currentIndex + 1} total={shuffledWords.length} label="Progress" />

      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Clue */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm text-center mb-6"
          >
            <p className="text-xs uppercase tracking-wider mb-3 font-medium" style={{ color: 'var(--tg-section-header)' }}>
              Type the English word for:
            </p>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--tg-text)' }}>
              {currentWord?.meaning}
            </h2>
            {currentWord?.meaningRu && (
              <p className="text-sm mb-2" style={{ color: 'var(--tg-subtitle)' }}>
                ({currentWord.meaningRu})
              </p>
            )}
            <p className="text-sm leading-relaxed" style={{ color: 'var(--tg-hint)' }}>
              {currentWord?.definition}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Input */}
        <div className="w-full max-w-sm">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (result) goNext();
                  else checkAnswer();
                }
              }}
              disabled={result !== null}
              placeholder="Type the word..."
              className="w-full px-4 py-3.5 rounded-xl text-center text-lg font-medium outline-none"
              style={{
                backgroundColor: 'var(--tg-secondary-bg)',
                color: 'var(--tg-text)',
                border: `2px solid ${
                  result === 'correct' ? '#22c55e' :
                  result === 'wrong' ? '#ef4444' :
                  result === 'revealed' ? '#f59e0b' :
                  'transparent'
                }`,
              }}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-center"
              >
                {result === 'correct' ? (
                  <div className="flex items-center justify-center gap-2 text-green-500">
                    <CheckCircle size={18} />
                    <span className="text-sm font-semibold">Correct!</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center gap-2 text-red-500 mb-1">
                      <XCircle size={18} />
                      <span className="text-sm font-semibold">
                        {result === 'revealed' ? 'Answer revealed' : 'Incorrect'}
                      </span>
                    </div>
                    <p className="text-sm font-bold" style={{ color: 'var(--tg-text)' }}>
                      Correct answer: <span className="text-green-500">{currentWord?.word}</span>
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="flex gap-3 mt-4">
        {result === null ? (
          <>
            <button
              onClick={revealAnswer}
              className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
              style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-subtitle)' }}
            >
              <Eye size={16} /> Reveal
            </button>
            <button
              onClick={checkAnswer}
              disabled={!input.trim()}
              className="flex-1 py-3 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-40"
              style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
            >
              Check
            </button>
          </>
        ) : (
          <button
            onClick={goNext}
            className="w-full py-3.5 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
            style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
          >
            {currentIndex < shuffledWords.length - 1 ? 'Next Word →' : 'See Results'}
          </button>
        )}
      </div>
    </div>
  );
};
