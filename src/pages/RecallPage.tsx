import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { editions } from '../data/vocabulary';
import { useProgress } from '../contexts/ProgressContext';
import { showBackButton, hideMainButton, haptic } from '../lib/telegram';
import { Word } from '../types';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Eye, Lightbulb, Trophy, RefreshCw, Keyboard } from 'lucide-react';

const LANG_KEY = 'sozyola_tg_lang';

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

  const [lang] = useState(() => localStorage.getItem(LANG_KEY) || 'uz');
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | 'revealed' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [incorrectWords, setIncorrectWords] = useState<Word[]>([]);
  const [completed, setCompleted] = useState(false);
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize shuffled words
  useEffect(() => {
    if (unit) {
      setWords(shuffleArray(unit.words));
    }
  }, [unit]);

  useEffect(() => {
    showBackButton(() => navigate(`/unit/${bookId}/${unitId}`));
    hideMainButton();
    if (edition && unit) {
      setLastStudied(edition.id, unit.id);
      updateStreak();
    }
  }, [navigate, bookId, unitId, edition, unit, setLastStudied, updateStreak]);

  // Auto-focus input
  useEffect(() => {
    if (!result && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, result]);

  const currentWord: Word | undefined = words[currentIndex];

  // Get hint: first letter + underscores + last letter
  const getHint = useCallback((): string => {
    if (!currentWord) return '';
    const word = currentWord.word;
    if (word.length <= 2) return word[0] + '_';
    return word[0] + '_'.repeat(word.length - 2) + word[word.length - 1];
  }, [currentWord]);

  // Normalize answer for comparison
  const normalizeAnswer = (str: string): string => {
    return str.toLowerCase().trim().replace(/[^a-z]/g, '');
  };

  const checkAnswer = useCallback(() => {
    if (!currentWord || !input.trim()) return;

    const userAnswer = normalizeAnswer(input);
    const correctAnswer = normalizeAnswer(currentWord.word);
    const isCorrect = userAnswer === correctAnswer;

    setResult(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      haptic.notification('success');
      setCorrectCount(c => c + 1);
    } else {
      haptic.notification('error');
      setIncorrectCount(c => c + 1);
      setIncorrectWords(prev => [...prev, currentWord]);
    }
  }, [input, currentWord]);

  const revealAnswer = useCallback(() => {
    if (!currentWord) return;
    setResult('revealed');
    setIncorrectCount(c => c + 1);
    setIncorrectWords(prev => [...prev, currentWord]);
    haptic.impact('medium');
  }, [currentWord]);

  const goNext = useCallback(() => {
    setShowHint(false);
    
    if (currentIndex < words.length - 1) {
      setCurrentIndex(i => i + 1);
      setInput('');
      setResult(null);
    } else {
      // Finish session
      const total = words.length;
      const percentage = Math.round((correctCount / total) * 100);

      if (edition && unit && !isRetryMode) {
        saveResult(edition.id, unit.id, {
          score: correctCount,
          total,
          percentage,
          date: new Date().toISOString(),
        });
        addWordsLearned(correctCount);
      }
      
      setCompleted(true);
      haptic.notification(percentage >= 80 ? 'success' : 'warning');
    }
  }, [currentIndex, words.length, correctCount, edition, unit, isRetryMode, saveResult, addWordsLearned]);

  const startRetry = useCallback(() => {
    const shuffled = shuffleArray(incorrectWords);
    setWords(shuffled);
    setCurrentIndex(0);
    setInput('');
    setResult(null);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIncorrectWords([]);
    setCompleted(false);
    setIsRetryMode(true);
    setShowHint(false);
    haptic.impact('medium');
  }, [incorrectWords]);

  const restartAll = useCallback(() => {
    if (unit) {
      setWords(shuffleArray(unit.words));
    }
    setCurrentIndex(0);
    setInput('');
    setResult(null);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIncorrectWords([]);
    setCompleted(false);
    setIsRetryMode(false);
    setShowHint(false);
    haptic.impact('medium');
  }, [unit]);

  if (!edition || !unit || words.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p style={{ color: 'var(--tg-hint)' }}>Loading...</p>
      </div>
    );
  }

  if (completed) {
    const total = words.length;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
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
            boxShadow: passed ? '0 0 30px rgba(34, 197, 94, 0.4)' : '0 0 30px rgba(245, 158, 11, 0.4)'
          }}
        >
          <Keyboard size={36} color="white" />
        </motion.div>

        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--tg-text)' }}>
          {isRetryMode 
            ? (lang === 'uz' ? 'Qayta urinish tugadi!' : 'Retry Complete!')
            : (lang === 'uz' ? "So'zni eslab qolish tugadi!" : 'Word Recall Complete!')}
        </h2>

        {/* Big percentage */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-5xl font-extrabold mb-4"
          style={{ color: passed ? '#22c55e' : '#f59e0b' }}
        >
          {percentage}%
        </motion.div>

        {/* Stats */}
        <div className="flex gap-8 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{correctCount}</div>
            <div className="text-xs" style={{ color: 'var(--tg-hint)' }}>
              {lang === 'uz' ? "To'g'ri" : 'Correct'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#ef4444' }}>{incorrectCount}</div>
            <div className="text-xs" style={{ color: 'var(--tg-hint)' }}>
              {lang === 'uz' ? "Noto'g'ri" : 'Incorrect'}
            </div>
          </div>
        </div>

        {/* Feedback message */}
        <div 
          className="px-4 py-3 rounded-xl mb-6 text-center"
          style={{ 
            backgroundColor: passed ? '#22c55e20' : '#f59e0b20',
            maxWidth: '280px'
          }}
        >
          <p className="text-sm font-medium" style={{ color: passed ? '#22c55e' : '#f59e0b' }}>
            {passed 
              ? (lang === 'uz' ? "Ajoyib xotira! Davom eting." : "Great memory! Keep it up.")
              : (lang === 'uz' ? "Mashq qilishda davom eting!" : "Keep practicing to improve!")}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 w-full max-w-[280px]">
          {incorrectWords.length > 0 && (
            <button
              onClick={startRetry}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
            >
              <RotateCcw size={18} />
              {lang === 'uz' 
                ? `Xatolarni mashq qilish (${incorrectWords.length})` 
                : `Practice Incorrect (${incorrectWords.length})`}
            </button>
          )}
          <button
            onClick={restartAll}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
          >
            <RefreshCw size={18} />
            {lang === 'uz' ? 'Qaytadan boshlash' : 'Start Over'}
          </button>
          <button
            onClick={() => navigate(`/unit/${bookId}/${unitId}`)}
            className="w-full py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
            style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-hint)' }}
          >
            {lang === 'uz' ? "Bo'limga qaytish" : 'Back to Unit'}
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="h-full flex flex-col px-4 pt-2 pb-6 safe-area-bottom">
      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium" style={{ color: 'var(--tg-hint)' }}>
            {isRetryMode 
              ? (lang === 'uz' ? 'Qayta urinish' : 'Retry Mode')
              : `${currentIndex + 1} / ${words.length}`}
          </span>
          <div className="flex gap-2 text-xs">
            <span style={{ color: '#22c55e' }}>✓ {correctCount}</span>
            <span style={{ color: '#ef4444' }}>✗ {incorrectCount}</span>
          </div>
        </div>
        <div 
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--tg-secondary-bg)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: 'var(--tg-button)' }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

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
              {lang === 'uz' ? "Inglizcha so'zni yozing:" : 'Type the English word for:'}
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
            
            {/* Hint */}
            {showHint && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 px-3 py-2 rounded-lg inline-block"
                style={{ backgroundColor: '#f59e0b20' }}
              >
                <p className="text-sm font-mono font-bold tracking-widest" style={{ color: '#f59e0b' }}>
                  {getHint()}
                </p>
              </motion.div>
            )}
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
              placeholder={lang === 'uz' ? "So'zni yozing..." : "Type the word..."}
              className="w-full px-4 py-3.5 rounded-xl text-center text-lg font-medium outline-none"
              style={{
                backgroundColor: 'var(--tg-secondary-bg)',
                color: 'var(--tg-text)',
                border: `2px solid ${
                  result === 'correct' ? '#22c55e' :
                  result === 'wrong' || result === 'revealed' ? '#ef4444' :
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
                    <span className="text-sm font-semibold">
                      {lang === 'uz' ? "To'g'ri!" : 'Correct!'}
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center gap-2 text-red-500 mb-1">
                      <XCircle size={18} />
                      <span className="text-sm font-semibold">
                        {result === 'revealed' 
                          ? (lang === 'uz' ? 'Javob ko\'rsatildi' : 'Answer revealed')
                          : (lang === 'uz' ? "Noto'g'ri" : 'Incorrect')}
                      </span>
                    </div>
                    <p className="text-sm font-bold" style={{ color: 'var(--tg-text)' }}>
                      {lang === 'uz' ? "To'g'ri javob: " : 'Correct answer: '}
                      <span className="text-green-500">{currentWord?.word}</span>
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
            {!showHint ? (
              <button
                onClick={() => setShowHint(true)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
                style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}
              >
                <Lightbulb size={16} />
              </button>
            ) : (
              <button
                onClick={revealAnswer}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
                style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-subtitle)' }}
              >
                <Eye size={16} />
              </button>
            )}
            <button
              onClick={checkAnswer}
              disabled={!input.trim()}
              className="flex-1 py-3 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-40"
              style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
            >
              {lang === 'uz' ? 'Tekshirish' : 'Check'}
            </button>
          </>
        ) : (
          <button
            onClick={goNext}
            className="w-full py-3.5 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
            style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
          >
            {currentIndex < words.length - 1 
              ? (lang === 'uz' ? "Keyingi so'z →" : 'Next Word →')
              : (lang === 'uz' ? 'Natijalarni ko\'rish' : 'See Results')}
          </button>
        )}
      </div>
    </div>
  );
};
