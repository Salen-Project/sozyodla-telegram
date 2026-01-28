import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { editions } from '../data/vocabulary';
import { useProgress } from '../contexts/ProgressContext';
import { showBackButton, hideMainButton, haptic } from '../lib/telegram';
import { getWordImageUrl } from '../lib/images';
import { Word } from '../types';
import { Trophy, RotateCcw, ArrowRight, RefreshCw, ListChecks } from 'lucide-react';

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const LANG_KEY = 'sozyola_tg_lang';

interface MCQuestion {
  word: Word;
  options: string[];
  correctIndex: number;
  imageUrl: string | null;
}

export const MultipleChoicePage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId, unitId } = useParams<{ bookId: string; unitId: string }>();
  const { saveResult, addWordsLearned, setLastStudied, updateStreak } = useProgress();
  const [lang] = useState(() => localStorage.getItem(LANG_KEY) || 'uz');

  const edition = editions.find(e => e.id === Number(bookId));
  const unit = edition?.units.find(u => u.id === Number(unitId));
  const words = unit?.words || [];

  const getMeaning = useCallback((w: Word) => lang === 'ru' && w.meaningRu ? w.meaningRu : w.meaning, [lang]);

  const [gameWords, setGameWords] = useState<Word[]>([]);
  const [questions, setQuestions] = useState<MCQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [incorrectWords, setIncorrectWords] = useState<Word[]>([]);
  const [completed, setCompleted] = useState(false);
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Initialize game
  const initializeGame = useCallback((wordList: Word[]) => {
    const shuffled = shuffleArray(wordList);
    setGameWords(shuffled);
    
    const qs: MCQuestion[] = shuffled.map(word => {
      const wrongWords = words.filter(w => w.word !== word.word);
      const wrongOptions = shuffleArray(wrongWords).slice(0, 3).map(w => getMeaning(w));
      const allOptions = shuffleArray([...wrongOptions, getMeaning(word)]);
      return {
        word,
        options: allOptions,
        correctIndex: allOptions.indexOf(getMeaning(word)),
        imageUrl: getWordImageUrl(word.image),
      };
    });
    
    setQuestions(qs);
    setCurrentQ(0);
    setSelectedIndex(null);
    setIsCorrect(null);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIncorrectWords([]);
    setCompleted(false);
    setImgError(false);
  }, [words, getMeaning]);

  useEffect(() => {
    if (words.length > 0) {
      initializeGame(words);
    }
  }, [words, initializeGame]);

  useEffect(() => {
    showBackButton(() => navigate(`/unit/${bookId}/${unitId}`));
    hideMainButton();
    if (edition && unit) {
      setLastStudied(edition.id, unit.id);
      updateStreak();
    }
  }, [navigate, bookId, unitId, edition, unit, setLastStudied, updateStreak]);

  // Reset img error on question change
  useEffect(() => { setImgError(false); }, [currentQ]);

  const handleSelect = useCallback((index: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(index);
    const correct = index === questions[currentQ].correctIndex;
    setIsCorrect(correct);
    
    if (correct) {
      haptic.notification('success');
      setCorrectCount(c => c + 1);
    } else {
      haptic.notification('error');
      setIncorrectCount(c => c + 1);
      setIncorrectWords(prev => [...prev, questions[currentQ].word]);
    }
  }, [selectedIndex, currentQ, questions]);

  const handleNext = useCallback(() => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
      setSelectedIndex(null);
      setIsCorrect(null);
    } else {
      // Finish
      if (edition && unit && !isRetryMode) {
        const percentage = Math.round((correctCount / questions.length) * 100);
        saveResult(edition.id, unit.id, {
          score: correctCount, 
          total: questions.length, 
          percentage, 
          date: new Date().toISOString(),
        });
        addWordsLearned(correctCount);
      }
      setCompleted(true);
      haptic.notification(correctCount >= questions.length * 0.8 ? 'success' : 'warning');
    }
  }, [currentQ, questions.length, correctCount, edition, unit, isRetryMode, saveResult, addWordsLearned]);

  const startRetry = useCallback(() => {
    setIsRetryMode(true);
    initializeGame(incorrectWords);
    haptic.impact('medium');
  }, [incorrectWords, initializeGame]);

  const restartAll = useCallback(() => {
    setIsRetryMode(false);
    initializeGame(words);
    haptic.impact('medium');
  }, [words, initializeGame]);

  if (!edition || !unit || words.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p style={{ color: 'var(--tg-hint)' }}>Loading...</p>
      </div>
    );
  }

  if (completed) {
    const total = questions.length;
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
          <ListChecks size={36} color="white" />
        </motion.div>

        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--tg-text)' }}>
          {isRetryMode 
            ? (lang === 'uz' ? 'Qayta urinish tugadi!' : 'Retry Complete!')
            : (lang === 'uz' ? 'Test tugadi!' : 'Quiz Complete!')}
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
              ? (lang === 'uz' ? "Ajoyib natija! Davom eting." : "Excellent! Keep it up.")
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

  if (questions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p style={{ color: 'var(--tg-hint)' }}>Loading...</p>
      </div>
    );
  }

  const question = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  return (
    <div className="h-full flex flex-col px-4 pt-2 pb-6 safe-area-bottom">
      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium" style={{ color: 'var(--tg-hint)' }}>
            {isRetryMode 
              ? (lang === 'uz' ? 'Qayta urinish' : 'Retry Mode')
              : `${currentQ + 1} / ${questions.length}`}
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
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Image */}
        {question.imageUrl && !imgError && (
          <div className="w-full h-32 rounded-xl overflow-hidden mb-3" style={{ backgroundColor: 'var(--tg-secondary-bg)' }}>
            <img
              src={question.imageUrl}
              alt={question.word.word}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          </div>
        )}

        <div className="mb-4">
          <p className="text-xs uppercase tracking-wider mb-2 font-medium" style={{ color: 'var(--tg-section-header)' }}>
            {lang === 'uz' ? "To'g'ri ma'noni tanlang" : 'Choose the correct meaning'}
          </p>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--tg-text)' }}>
            {question.word.word}
          </h2>
          {question.word.partOfSpeech && (
            <span className="text-xs mt-1 inline-block" style={{ color: 'var(--tg-hint)' }}>
              ({question.word.partOfSpeech})
            </span>
          )}
        </div>

        <div className="space-y-2 flex-1">
          {question.options.map((option, i) => {
            const isSelected = selectedIndex === i;
            const showCorrect = selectedIndex !== null && i === question.correctIndex;
            const showWrong = isSelected && !isCorrect;

            return (
              <motion.button
                key={`${currentQ}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleSelect(i)}
                disabled={selectedIndex !== null}
                className="w-full text-left p-3.5 rounded-xl text-sm transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: showCorrect ? '#22c55e15' : showWrong ? '#ef444415' : isSelected ? 'var(--tg-button)' : 'var(--tg-section-bg)',
                  color: showCorrect ? '#22c55e' : showWrong ? '#ef4444' : isSelected ? 'var(--tg-button-text)' : 'var(--tg-text)',
                  border: `2px solid ${showCorrect ? '#22c55e' : showWrong ? '#ef4444' : isSelected ? 'var(--tg-button)' : 'var(--tg-secondary-bg)'}`,
                }}
              >
                <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {option}
              </motion.button>
            );
          })}
        </div>

        {selectedIndex !== null && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleNext}
            className="w-full py-3.5 rounded-xl text-sm font-semibold mt-4 active:scale-[0.98] transition-transform"
            style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
          >
            {currentQ < questions.length - 1 
              ? (lang === 'uz' ? 'Keyingi savol →' : 'Next Question →')
              : (lang === 'uz' ? 'Natijalarni ko\'rish' : 'See Results')}
          </motion.button>
        )}
      </div>
    </div>
  );
};
