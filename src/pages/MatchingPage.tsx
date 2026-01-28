import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { editions } from '../data/vocabulary';
import { useProgress } from '../contexts/ProgressContext';
import { showBackButton, hideMainButton, haptic } from '../lib/telegram';
import { Trophy, RotateCcw, Clock, Zap, RefreshCw } from 'lucide-react';
import { Word } from '../types';

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const LANG_KEY = 'sozyola_tg_lang';
const GAME_SIZE = 8; // Number of pairs to match

export const MatchingPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId, unitId } = useParams<{ bookId: string; unitId: string }>();
  const { saveResult, addWordsLearned, setLastStudied, updateStreak } = useProgress();
  const [lang] = useState(() => localStorage.getItem(LANG_KEY) || 'uz');

  const edition = editions.find(e => e.id === Number(bookId));
  const unit = edition?.units.find(u => u.id === Number(unitId));
  const words = unit?.words || [];

  // Take words for matching (max GAME_SIZE)
  const gameWords = useMemo(() => shuffleArray(words).slice(0, Math.min(GAME_SIZE, words.length)), [words]);
  const [shuffledWords, setShuffledWords] = useState<Word[]>([]);
  const [shuffledMeanings, setShuffledMeanings] = useState<Word[]>([]);

  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  
  // Timer
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // Initialize game
  useEffect(() => {
    if (gameWords.length > 0) {
      setShuffledWords(shuffleArray([...gameWords]));
      setShuffledMeanings(shuffleArray([...gameWords]));
      setStartTime(Date.now());
    }
  }, [gameWords]);

  // Timer effect
  useEffect(() => {
    if (!completed && shuffledWords.length > 0) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [completed, startTime, shuffledWords.length]);

  useEffect(() => {
    showBackButton(() => navigate(`/unit/${bookId}/${unitId}`));
    hideMainButton();
    if (edition && unit) {
      setLastStudied(edition.id, unit.id);
      updateStreak();
    }
  }, [navigate, bookId, unitId, edition, unit, setLastStudied, updateStreak]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
        // Game complete!
        setCompleted(true);
        haptic.notification('success');
        
        // Calculate score (penalty for mistakes)
        const baseScore = gameWords.length;
        const penalizedScore = Math.max(0, baseScore - Math.floor(mistakes / 2));
        const percentage = Math.round((penalizedScore / baseScore) * 100);
        
        if (edition && unit) {
          saveResult(edition.id, unit.id, {
            score: penalizedScore,
            total: baseScore,
            percentage,
            date: new Date().toISOString()
          });
          addWordsLearned(gameWords.length);
        }
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
  }, [shuffledWords, shuffledMeanings, matched, gameWords, edition, unit, mistakes, saveResult, addWordsLearned]);

  const handleWordClick = (idx: number) => {
    if (matched.has(shuffledWords[idx].word) || wrongPair) return;
    setSelectedWord(idx);
    if (selectedMeaning !== null) {
      checkMatch(idx, selectedMeaning);
    }
  };

  const handleMeaningClick = (idx: number) => {
    if (matched.has(shuffledMeanings[idx].word) || wrongPair) return;
    setSelectedMeaning(idx);
    if (selectedWord !== null) {
      checkMatch(selectedWord, idx);
    }
  };

  const restartGame = useCallback(() => {
    const newGameWords = shuffleArray(words).slice(0, Math.min(GAME_SIZE, words.length));
    setShuffledWords(shuffleArray([...newGameWords]));
    setShuffledMeanings(shuffleArray([...newGameWords]));
    setMatched(new Set());
    setSelectedWord(null);
    setSelectedMeaning(null);
    setMistakes(0);
    setCompleted(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    haptic.impact('medium');
  }, [words]);

  if (!edition || !unit) {
    return (
      <div className="h-full flex items-center justify-center">
        <p style={{ color: 'var(--tg-hint)' }}>Loading...</p>
      </div>
    );
  }

  if (completed) {
    const baseScore = gameWords.length;
    const penalizedScore = Math.max(0, baseScore - Math.floor(mistakes / 2));
    const percentage = Math.round((penalizedScore / baseScore) * 100);
    const isPerfect = mistakes === 0;
    const isGreat = percentage >= 80;

    return (
      <div className="h-full flex flex-col items-center justify-center px-6 pb-6 safe-area-bottom">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ 
            background: isPerfect 
              ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' 
              : isGreat
                ? 'linear-gradient(135deg, #22c55e, #10b981)'
                : 'linear-gradient(135deg, #3b82f6, #6366f1)',
            boxShadow: isPerfect ? '0 0 30px rgba(251, 191, 36, 0.4)' : undefined
          }}
        >
          {isPerfect ? (
            <Trophy size={36} color="white" />
          ) : (
            <Zap size={36} color="white" />
          )}
        </motion.div>

        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--tg-text)' }}>
          {isPerfect 
            ? (lang === 'uz' ? 'Mukammal!' : 'Perfect!')
            : (lang === 'uz' ? 'Ajoyib!' : 'Great Job!')}
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--tg-subtitle)' }}>
          {lang === 'uz' ? 'Barcha juftliklar topildi!' : 'All pairs matched!'}
        </p>

        {/* Stats */}
        <div className="flex gap-6 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock size={16} style={{ color: 'var(--tg-hint)' }} />
              <span className="text-xl font-bold" style={{ color: 'var(--tg-text)' }}>
                {formatTime(elapsedTime)}
              </span>
            </div>
            <div className="text-xs" style={{ color: 'var(--tg-hint)' }}>
              {lang === 'uz' ? 'Vaqt' : 'Time'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: mistakes === 0 ? '#22c55e' : '#f59e0b' }}>
              {mistakes}
            </div>
            <div className="text-xs" style={{ color: 'var(--tg-hint)' }}>
              {lang === 'uz' ? 'Xatolar' : 'Mistakes'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: '#22c55e' }}>
              {gameWords.length}
            </div>
            <div className="text-xs" style={{ color: 'var(--tg-hint)' }}>
              {lang === 'uz' ? 'Juftliklar' : 'Pairs'}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 w-full max-w-[280px]">
          <button
            onClick={restartGame}
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

  const getMeaning = (w: Word) => lang === 'ru' && w.meaningRu ? w.meaningRu : w.meaning;
  const progress = (matched.size / gameWords.length) * 100;

  return (
    <div className="h-full flex flex-col px-4 pt-2 pb-4 safe-area-bottom">
      {/* Header with timer and stats */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Zap size={18} style={{ color: 'var(--tg-button)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--tg-text)' }}>
              {lang === 'uz' ? "Juftliklarni top" : 'Match the Pairs'}
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--tg-secondary-bg)' }}>
            <Clock size={14} style={{ color: 'var(--tg-hint)' }} />
            <span className="text-sm font-mono font-medium" style={{ color: 'var(--tg-text)' }}>
              {formatTime(elapsedTime)}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs" style={{ color: 'var(--tg-hint)' }}>
            {matched.size}/{gameWords.length} {lang === 'uz' ? 'topildi' : 'matched'}
          </span>
          <span className="text-xs" style={{ color: mistakes > 0 ? '#f59e0b' : 'var(--tg-hint)' }}>
            {mistakes} {lang === 'uz' ? 'xato' : 'mistakes'}
          </span>
        </div>
        
        {/* Progress bar */}
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

      {/* Game area */}
      <div className="flex-1 flex gap-2 overflow-hidden">
        {/* Words column */}
        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
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
                className="w-full py-2.5 px-2 rounded-xl text-sm font-semibold text-center transition-all"
                style={{
                  backgroundColor: isMatched ? '#22c55e20' : isSelected ? 'var(--tg-button)' : isWrong ? '#ef444420' : 'var(--tg-section-bg)',
                  color: isMatched ? '#22c55e' : isSelected ? 'var(--tg-button-text)' : isWrong ? '#ef4444' : 'var(--tg-text)',
                  border: `1px solid ${isSelected ? 'var(--tg-button)' : 'var(--tg-secondary-bg)'}`,
                  minHeight: '44px',
                }}
              >
                {w.word}
              </motion.button>
            );
          })}
        </div>

        {/* Meanings column */}
        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
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
                className="w-full py-2.5 px-2 rounded-xl text-xs text-center transition-all leading-tight"
                style={{
                  backgroundColor: isMatched ? '#22c55e20' : isSelected ? 'var(--tg-button)' : isWrong ? '#ef444420' : 'var(--tg-section-bg)',
                  color: isMatched ? '#22c55e' : isSelected ? 'var(--tg-button-text)' : isWrong ? '#ef4444' : 'var(--tg-text)',
                  border: `1px solid ${isSelected ? 'var(--tg-button)' : 'var(--tg-secondary-bg)'}`,
                  minHeight: '44px',
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
