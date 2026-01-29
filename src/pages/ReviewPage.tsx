import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock, Brain, Zap, Volume2 } from 'lucide-react';
import { haptic } from '../lib/telegram';
import { useProgress } from '../contexts/ProgressContext';
import { editions } from '../data/vocabulary';
import { getWordImageUrl } from '../lib/images';

interface ReviewWord {
  word: string;
  meaning: string;
  definition: string;
  example: string;
  image?: string;
  editionId: number;
  unitId: number;
  lastReviewed?: number;
  nextReview?: number;
  level: number; // 0-5 spaced repetition level
}

export default function ReviewPage() {
  const navigate = useNavigate();
  const { progress, saveResult, addWordsLearned } = useProgress();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewWords, setReviewWords] = useState<ReviewWord[]>([]);
  const [completed, setCompleted] = useState(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });

  // Get words that need review
  const wordsToReview = useMemo(() => {
    const words: ReviewWord[] = [];
    const now = Date.now();
    const reviewStorage = JSON.parse(localStorage.getItem('sozyola_review') || '{}');

    // Get all words from units user has interacted with
    Object.entries(progress.results).forEach(([key, result]) => {
      const [editionId, unitId] = key.split('-').map(Number);
      const edition = editions.find(e => e.id === editionId);
      const unit = edition?.units.find(u => u.id === unitId);
      
      if (unit) {
        unit.words.forEach(w => {
          const wordKey = `${editionId}-${unitId}-${w.word}`;
          const reviewData = reviewStorage[wordKey] || { level: 0, lastReviewed: 0 };
          
          // Calculate next review time based on level (spaced repetition intervals)
          const intervals = [0, 1, 3, 7, 14, 30]; // days
          const nextReview = reviewData.lastReviewed + (intervals[reviewData.level] || 30) * 24 * 60 * 60 * 1000;
          
          if (now >= nextReview || reviewData.level === 0) {
            words.push({
              word: w.word,
              meaning: w.meaning,
              definition: w.definition,
              example: w.example,
              image: w.image,
              editionId,
              unitId,
              lastReviewed: reviewData.lastReviewed,
              nextReview,
              level: reviewData.level,
            });
          }
        });
      }
    });

    // Shuffle and limit to 20 words per session
    return words
      .sort(() => Math.random() - 0.5)
      .slice(0, 20);
  }, [progress.results]);

  useEffect(() => {
    setReviewWords(wordsToReview);
  }, [wordsToReview]);

  const currentWord = reviewWords[currentIndex];

  const handleAnswer = (correct: boolean) => {
    haptic.impact('light');
    
    const wordKey = `${currentWord.editionId}-${currentWord.unitId}-${currentWord.word}`;
    const reviewStorage = JSON.parse(localStorage.getItem('sozyola_review') || '{}');
    
    // Update spaced repetition level
    const currentLevel = reviewStorage[wordKey]?.level || 0;
    const newLevel = correct 
      ? Math.min(currentLevel + 1, 5) 
      : Math.max(currentLevel - 1, 0);
    
    reviewStorage[wordKey] = {
      level: newLevel,
      lastReviewed: Date.now(),
    };
    
    localStorage.setItem('sozyola_review', JSON.stringify(reviewStorage));
    
    setStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1),
    }));

    if (correct) {
      addWordsLearned(1);
    }

    // Move to next word
    if (currentIndex < reviewWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      setCompleted(true);
      haptic.notification('success');
    }
  };

  const speakWord = () => {
    if ('speechSynthesis' in window && currentWord) {
      haptic.impact('light');
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  if (reviewWords.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--tg-theme-bg-color)] flex flex-col items-center justify-center p-6 text-center">
        <Brain className="w-16 h-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold text-[var(--tg-theme-text-color)] mb-2">
          All caught up! 🎉
        </h1>
        <p className="text-[var(--tg-theme-hint-color)] mb-6">
          No words need review right now. Study some new words first!
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] font-medium"
        >
          Go Study
        </button>
      </div>
    );
  }

  if (completed) {
    const accuracy = Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100);
    return (
      <div className="min-h-screen bg-[var(--tg-theme-bg-color)] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">
          {accuracy >= 80 ? '🏆' : accuracy >= 60 ? '⭐' : '💪'}
        </div>
        <h1 className="text-2xl font-bold text-[var(--tg-theme-text-color)] mb-2">
          Review Complete!
        </h1>
        <p className="text-[var(--tg-theme-hint-color)] mb-6">
          You reviewed {stats.correct + stats.incorrect} words
        </p>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-6">
          <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/30">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[var(--tg-theme-text-color)]">{stats.correct}</p>
            <p className="text-xs text-[var(--tg-theme-hint-color)]">Correct</p>
          </div>
          <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30">
            <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[var(--tg-theme-text-color)]">{stats.incorrect}</p>
            <p className="text-xs text-[var(--tg-theme-hint-color)]">To Review</p>
          </div>
        </div>
        
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)] font-medium"
          >
            Home
          </button>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setShowAnswer(false);
              setCompleted(false);
              setStats({ correct: 0, incorrect: 0 });
            }}
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] font-medium"
          >
            Review Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--tg-theme-hint-color)]/20">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-[var(--tg-theme-secondary-bg-color)]"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--tg-theme-text-color)]" />
        </button>
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-purple-500" />
          <span className="font-semibold text-[var(--tg-theme-text-color)]">Review</span>
        </div>
        <div className="text-sm text-[var(--tg-theme-hint-color)]">
          {currentIndex + 1}/{reviewWords.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--tg-theme-secondary-bg-color)]">
        <div
          className="h-full bg-purple-500 transition-all"
          style={{ width: `${((currentIndex + 1) / reviewWords.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Spaced repetition level indicator */}
          <div className="flex items-center gap-1 mb-4">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < (currentWord?.level || 0) ? 'bg-purple-500' : 'bg-[var(--tg-theme-secondary-bg-color)]'
                }`}
              />
            ))}
            <span className="text-xs text-[var(--tg-theme-hint-color)] ml-2">
              Level {currentWord?.level || 0}
            </span>
          </div>

          {/* Word card */}
          <div
            onClick={() => !showAnswer && setShowAnswer(true)}
            className="w-full max-w-sm p-6 rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] text-center cursor-pointer"
          >
            {currentWord?.image && (
              <img
                src={getWordImageUrl(currentWord.image) || ''}
                alt={currentWord.word}
                className="w-32 h-32 object-cover rounded-xl mx-auto mb-4"
              />
            )}
            
            <div className="flex items-center justify-center gap-2 mb-2">
              <h2 className="text-3xl font-bold text-[var(--tg-theme-text-color)]">
                {currentWord?.word}
              </h2>
              <button
                onClick={(e) => { e.stopPropagation(); speakWord(); }}
                className="p-2 rounded-full hover:bg-[var(--tg-theme-bg-color)]"
              >
                <Volume2 className="w-5 h-5 text-[var(--tg-theme-hint-color)]" />
              </button>
            </div>

            {showAnswer ? (
              <div className="mt-4 space-y-3">
                <p className="text-lg text-[var(--tg-theme-button-color)] font-medium">
                  {currentWord?.meaning}
                </p>
                <p className="text-sm text-[var(--tg-theme-hint-color)]">
                  {currentWord?.definition}
                </p>
                <p className="text-sm italic text-[var(--tg-theme-hint-color)]">
                  "{currentWord?.example}"
                </p>
              </div>
            ) : (
              <p className="text-sm text-[var(--tg-theme-hint-color)] mt-4">
                Tap to reveal meaning
              </p>
            )}
          </div>
        </div>

        {/* Answer buttons */}
        {showAnswer && (
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => handleAnswer(false)}
              className="flex-1 py-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-500 font-semibold flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Again
            </button>
            <button
              onClick={() => handleAnswer(true)}
              className="flex-1 py-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-500 font-semibold flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Got it!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
