import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { editions } from '../data/vocabulary';
import { useProgress } from '../contexts/ProgressContext';
import { showBackButton, hideMainButton, haptic } from '../lib/telegram';
import { Word } from '../types';
import { Trophy, RefreshCw, FileText, Check, X, RotateCcw } from 'lucide-react';

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

interface SentenceItem {
  word: string;
  sentence: string;
  beforeBlank: string;
  afterBlank: string;
}

function createBlankedSentence(word: string, example: string): { before: string; after: string } | null {
  const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  const match = example.match(regex);
  if (!match || match.index === undefined) return null;
  return {
    before: example.slice(0, match.index),
    after: example.slice(match.index + match[0].length),
  };
}

export const FillBlankPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId, unitId } = useParams<{ bookId: string; unitId: string }>();
  const { saveResult, addWordsLearned, setLastStudied, updateStreak } = useProgress();
  const [lang] = useState(() => localStorage.getItem(LANG_KEY) || 'uz');

  const edition = editions.find(e => e.id === Number(bookId));
  const unit = edition?.units.find(u => u.id === Number(unitId));
  const words = unit?.words || [];

  const [sentences, setSentences] = useState<SentenceItem[]>([]);
  const [wordBank, setWordBank] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [filledWord, setFilledWord] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [usedWords, setUsedWords] = useState<Word[]>([]);

  // Build sentences
  const initGame = useCallback((wordsToUse?: Word[]) => {
    const sourceWords = wordsToUse || words;
    const eligible: SentenceItem[] = [];
    const usedWordList: Word[] = [];
    const shuffledWords = shuffleArray(sourceWords);
    
    for (const w of shuffledWords) {
      if (eligible.length >= GAME_SIZE) break;
      const result = createBlankedSentence(w.word, w.example);
      if (result) {
        eligible.push({
          word: w.word.toLowerCase(),
          sentence: w.example,
          beforeBlank: result.before,
          afterBlank: result.after,
        });
        usedWordList.push(w);
      }
    }
    
    setSentences(eligible);
    setUsedWords(usedWordList);
    // Create word bank with extra wrong words
    const correctWords = eligible.map(s => s.word);
    const wrongWords = shuffleArray(words.filter(w => !correctWords.includes(w.word.toLowerCase())))
      .slice(0, 3)
      .map(w => w.word.toLowerCase());
    setWordBank(shuffleArray([...correctWords.slice(0, 4), ...wrongWords]));
    
    setCurrentIndex(0);
    setSelectedWord(null);
    setFilledWord(null);
    setShowResult(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setCompleted(false);
    setResults([]);
  }, [words]);

  // Retry only incorrect words
  const retryIncorrect = useCallback(() => {
    const wrongWords = usedWords.filter((_, i) => !results[i]);
    if (wrongWords.length > 0) {
      initGame(wrongWords);
    }
  }, [usedWords, results, initGame]);

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

  const current = sentences[currentIndex];

  const handleWordSelect = (word: string) => {
    if (showResult) return;
    
    if (filledWord === word) {
      // Deselect
      setFilledWord(null);
      setSelectedWord(null);
    } else if (filledWord === null) {
      // Fill the blank
      setFilledWord(word);
      setSelectedWord(word);
    }
    haptic.impact('light');
  };

  const handleCheck = () => {
    if (!filledWord || !current) return;
    const correct = filledWord === current.word;
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      haptic.notification('success');
      setCorrectCount(c => c + 1);
    } else {
      haptic.notification('error');
      setIncorrectCount(c => c + 1);
    }
  };

  const handleNext = () => {
    const newResults = [...results, isCorrect];
    setResults(newResults);
    setShowResult(false);
    setFilledWord(null);
    setSelectedWord(null);
    
    // Update word bank - remove used word, maybe add a new one
    const newBank = wordBank.filter(w => w !== current.word);
    if (currentIndex + 1 < sentences.length && sentences[currentIndex + 1]) {
      // Make sure the next correct word is in the bank
      const nextWord = sentences[currentIndex + 1].word;
      if (!newBank.includes(nextWord)) {
        newBank.push(nextWord);
      }
    }
    setWordBank(shuffleArray(newBank));

    if (currentIndex + 1 < sentences.length) {
      setCurrentIndex(i => i + 1);
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

  if (!edition || !unit || sentences.length === 0) {
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
          <FileText size={36} color="white" />
        </motion.div>

        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--tg-text)' }}>
          {lang === 'uz' ? "Bo'sh joyni to'ldirish tugadi!" : 'Fill in Blank Complete!'}
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

        <div className="flex flex-col gap-3 w-full max-w-[280px]">
          {total - score > 0 && (
            <button
              onClick={retryIncorrect}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ backgroundColor: '#f59e0b', color: 'white' }}
            >
              <RotateCcw size={18} />
              {lang === 'uz' ? `Xato so'zlarni qaytadan (${total - score})` : `Retry Incorrect (${total - score})`}
            </button>
          )}
          <button
            onClick={() => initGame()}
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

  const progress = ((currentIndex + 1) / sentences.length) * 100;

  return (
    <div className="h-full flex flex-col px-4 pt-2 pb-6 safe-area-bottom">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium" style={{ color: 'var(--tg-hint)' }}>
            {currentIndex + 1} / {sentences.length}
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

      {/* Instruction */}
      <p className="text-xs uppercase tracking-wider mb-3 font-medium text-center" style={{ color: 'var(--tg-section-header)' }}>
        {lang === 'uz' ? "Bo'sh joyni to'ldiring" : 'Fill in the blank'}
      </p>

      {/* Sentence with blank */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="p-4 rounded-xl mb-4"
          style={{ backgroundColor: 'var(--tg-section-bg)' }}
        >
          <p className="text-base leading-relaxed" style={{ color: 'var(--tg-text)' }}>
            {current.beforeBlank}
            <span
              className="inline-block mx-1 px-3 py-1 rounded-lg min-w-[80px] text-center font-semibold"
              style={{
                backgroundColor: showResult
                  ? (isCorrect ? '#22c55e20' : '#ef444420')
                  : filledWord
                    ? 'var(--tg-button)'
                    : 'var(--tg-secondary-bg)',
                color: showResult
                  ? (isCorrect ? '#22c55e' : '#ef4444')
                  : filledWord
                    ? 'var(--tg-button-text)'
                    : 'var(--tg-hint)',
                border: `2px dashed ${showResult
                  ? (isCorrect ? '#22c55e' : '#ef4444')
                  : filledWord
                    ? 'var(--tg-button)'
                    : 'var(--tg-hint)'}`,
              }}
            >
              {filledWord || '______'}
            </span>
            {current.afterBlank}
          </p>
        </motion.div>
      </AnimatePresence>

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

      {/* Word bank */}
      {!showResult && (
        <div className="flex-1">
          <p className="text-xs mb-2 font-medium" style={{ color: 'var(--tg-hint)' }}>
            {lang === 'uz' ? "So'zlardan birini tanlang:" : 'Choose a word:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {wordBank.map((word, i) => {
              const isSelected = selectedWord === word;
              const isUsed = filledWord === word;
              return (
                <motion.button
                  key={`${word}-${i}`}
                  onClick={() => handleWordSelect(word)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    backgroundColor: isSelected || isUsed ? 'var(--tg-button)' : 'var(--tg-section-bg)',
                    color: isSelected || isUsed ? 'var(--tg-button-text)' : 'var(--tg-text)',
                    opacity: isUsed && !isSelected ? 0.4 : 1,
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {word}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-auto pt-4">
        {!showResult ? (
          <button
            onClick={handleCheck}
            disabled={!filledWord}
            className="w-full py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform disabled:opacity-40"
            style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
          >
            {lang === 'uz' ? 'Tekshirish' : 'Check'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
            style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
          >
            {currentIndex < sentences.length - 1 
              ? (lang === 'uz' ? 'Keyingi →' : 'Next →')
              : (lang === 'uz' ? 'Natijalarni ko\'rish' : 'See Results')}
          </button>
        )}
      </div>
    </div>
  );
};
