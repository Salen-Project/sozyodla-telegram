import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { editions } from '../data/vocabulary';
import { useProgress } from '../contexts/ProgressContext';
import { FlashCard } from '../components/FlashCard';
import { showBackButton, hideMainButton, haptic } from '../lib/telegram';
import { CheckCircle, RotateCcw, RefreshCw, Trophy, XCircle, Volume2 } from 'lucide-react';
import { Word } from '../types';

const LANG_KEY = 'sozyola_tg_lang';

export const FlashcardsPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId, unitId } = useParams<{ bookId: string; unitId: string }>();
  const { saveResult, addWordsLearned, toggleFavorite, isFavorite, setLastStudied, updateStreak } = useProgress();

  const edition = editions.find(e => e.id === Number(bookId));
  const unit = edition?.units.find(u => u.id === Number(unitId));

  const [lang] = useState(() => localStorage.getItem(LANG_KEY) || 'uz');
  const [cards, setCards] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [incorrectWords, setIncorrectWords] = useState<Word[]>([]);
  const [completed, setCompleted] = useState(false);
  const [isRetryMode, setIsRetryMode] = useState(false);

  // Shuffle words on mount
  useEffect(() => {
    if (unit) {
      const shuffled = [...unit.words].sort(() => Math.random() - 0.5);
      setCards(shuffled);
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

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.85;
      speechSynthesis.speak(u);
    }
  }, []);

  const finishSession = useCallback((finalCorrectCount: number) => {
    setCompleted(true);
    
    if (!isRetryMode && edition && unit) {
      const total = cards.length;
      const percentage = Math.round((finalCorrectCount / total) * 100);
      
      saveResult(edition.id, unit.id, {
        score: finalCorrectCount,
        total,
        percentage,
        date: new Date().toISOString()
      });
      
      addWordsLearned(finalCorrectCount);
    }
    
    haptic.notification(finalCorrectCount >= cards.length * 0.8 ? 'success' : 'warning');
  }, [isRetryMode, edition, unit, cards.length, saveResult, addWordsLearned]);

  const goNext = useCallback((newCorrectCount: number) => {
    if (currentIndex < cards.length - 1) {
      setTimeout(() => setCurrentIndex(i => i + 1), 150);
    } else {
      finishSession(newCorrectCount);
    }
  }, [currentIndex, cards.length, finishSession]);

  const handleCorrect = useCallback(() => {
    haptic.impact('light');
    const newCorrectCount = correctCount + 1;
    setCorrectCount(newCorrectCount);
    goNext(newCorrectCount);
  }, [correctCount, goNext]);

  const handleIncorrect = useCallback(() => {
    haptic.impact('medium');
    setIncorrectCount(c => c + 1);
    setIncorrectWords(prev => [...prev, cards[currentIndex]]);
    goNext(correctCount);
  }, [cards, currentIndex, correctCount, goNext]);

  const startRetry = useCallback(() => {
    const shuffled = [...incorrectWords].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIncorrectWords([]);
    setCompleted(false);
    setIsRetryMode(true);
    haptic.impact('medium');
  }, [incorrectWords]);

  const restartAll = useCallback(() => {
    if (unit) {
      const shuffled = [...unit.words].sort(() => Math.random() - 0.5);
      setCards(shuffled);
    }
    setCurrentIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIncorrectWords([]);
    setCompleted(false);
    setIsRetryMode(false);
    haptic.impact('medium');
  }, [unit]);

  if (!edition || !unit || cards.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p style={{ color: 'var(--tg-hint)' }}>Loading...</p>
      </div>
    );
  }

  if (completed) {
    const total = cards.length;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const passed = percentage >= 80;

    return (
      <div className="h-full flex flex-col items-center justify-center px-6 pb-6 safe-area-bottom">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mb-4"
        >
          {passed ? (
            <Trophy size={72} style={{ color: '#22c55e' }} />
          ) : (
            <CheckCircle size={72} style={{ color: '#f59e0b' }} />
          )}
        </motion.div>

        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--tg-text)' }}>
          {isRetryMode 
            ? (lang === 'uz' ? 'Qayta urinish tugadi!' : 'Retry Complete!')
            : (lang === 'uz' ? 'Kartochkalar tugadi!' : 'Flashcards Complete!')}
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
              ? (lang === 'uz' ? "Ajoyib! Siz bu so'zlarni o'zlashtirdingiz." : "Great job! You've mastered these words.")
              : (lang === 'uz' ? "Mashq qilishda davom eting!" : "Keep practicing!")}
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

  const currentWord = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="h-full flex flex-col px-4 pt-2 pb-6 safe-area-bottom">
      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium" style={{ color: 'var(--tg-hint)' }}>
            {isRetryMode 
              ? (lang === 'uz' ? 'Qayta urinish' : 'Retry Mode')
              : `${currentIndex + 1} / ${cards.length}`}
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

      {/* Flash card */}
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
            total={cards.length}
            isFavorite={isFavorite(edition.id, unit.id, currentWord.word)}
            onToggleFavorite={() => toggleFavorite(edition.id, unit.id, currentWord.word)}
            onSwipeLeft={handleIncorrect}
            onSwipeRight={handleCorrect}
          />
        </motion.div>
      </AnimatePresence>

      {/* Bottom navigation */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={handleIncorrect}
          className="flex-1 py-3 rounded-xl text-sm font-semibold max-w-[140px] active:scale-95 transition-transform flex items-center justify-center gap-2"
          style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
        >
          <XCircle size={18} />
          {lang === 'uz' ? 'Bilmayman' : 'Review'}
        </button>
        <button
          onClick={() => speak(currentWord.word)}
          className="w-12 h-12 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
          style={{ backgroundColor: 'var(--tg-secondary-bg)' }}
        >
          <Volume2 size={20} style={{ color: 'var(--tg-button)' }} />
        </button>
        <button
          onClick={handleCorrect}
          className="flex-1 py-3 rounded-xl text-sm font-semibold max-w-[140px] active:scale-95 transition-transform flex items-center justify-center gap-2"
          style={{ backgroundColor: '#22c55e20', color: '#22c55e' }}
        >
          <CheckCircle size={18} />
          {lang === 'uz' ? 'Bilaman' : 'Know it'}
        </button>
      </div>
    </div>
  );
};
