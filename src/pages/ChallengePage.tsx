import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Timer, Zap, Trophy, Star, CheckCircle, XCircle } from 'lucide-react';
import { haptic } from '../lib/telegram';
import { useProgress } from '../contexts/ProgressContext';
import { editions } from '../data/vocabulary';
import { Word } from '../types';

const CHALLENGE_TIME = 60; // seconds
const POINTS_CORRECT = 10;
const POINTS_STREAK_BONUS = 5;

interface ChallengeQuestion {
  word: Word;
  options: string[];
  correctIndex: number;
}

export default function ChallengePage() {
  const navigate = useNavigate();
  const { progress, addWordsLearned } = useProgress();
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [timeLeft, setTimeLeft] = useState(CHALLENGE_TIME);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<ChallengeQuestion | null>(null);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Get all words from all books
  const allWords = useMemo(() => {
    const words: Word[] = [];
    editions.forEach(ed => ed.units.forEach(u => words.push(...u.words)));
    return words;
  }, []);

  const generateQuestion = useCallback((): ChallengeQuestion => {
    const randomIndex = Math.floor(Math.random() * allWords.length);
    const word = allWords[randomIndex];
    
    // Get 3 wrong options
    const wrongOptions: string[] = [];
    while (wrongOptions.length < 3) {
      const randWord = allWords[Math.floor(Math.random() * allWords.length)];
      if (randWord.meaning !== word.meaning && !wrongOptions.includes(randWord.meaning)) {
        wrongOptions.push(randWord.meaning);
      }
    }
    
    // Shuffle options with correct answer
    const options = [...wrongOptions, word.meaning].sort(() => Math.random() - 0.5);
    const correctIndex = options.indexOf(word.meaning);
    
    return { word, options, correctIndex };
  }, [allWords]);

  // Timer effect
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('finished');
          haptic.notification('warning');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameState]);

  // Generate first question when game starts
  useEffect(() => {
    if (gameState === 'playing' && !currentQuestion) {
      setCurrentQuestion(generateQuestion());
    }
  }, [gameState, currentQuestion, generateQuestion]);

  const startGame = () => {
    haptic.impact('medium');
    setGameState('playing');
    setTimeLeft(CHALLENGE_TIME);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setQuestionsAnswered(0);
    setCorrectAnswers(0);
    setCurrentQuestion(generateQuestion());
    setShowFeedback(null);
    setSelectedIndex(null);
  };

  const handleAnswer = (index: number) => {
    if (showFeedback) return;
    
    setSelectedIndex(index);
    const isCorrect = index === currentQuestion?.correctIndex;
    
    if (isCorrect) {
      haptic.notification('success');
      const streakBonus = streak >= 3 ? POINTS_STREAK_BONUS : 0;
      setScore(prev => prev + POINTS_CORRECT + streakBonus);
      setStreak(prev => prev + 1);
      setMaxStreak(prev => Math.max(prev, streak + 1));
      setCorrectAnswers(prev => prev + 1);
      addWordsLearned(1);
      setShowFeedback('correct');
    } else {
      haptic.notification('error');
      setStreak(0);
      setShowFeedback('wrong');
    }
    
    setQuestionsAnswered(prev => prev + 1);
    
    // Move to next question after brief delay
    setTimeout(() => {
      setShowFeedback(null);
      setSelectedIndex(null);
      setCurrentQuestion(generateQuestion());
    }, 500);
  };

  if (gameState === 'ready') {
    return (
      <div className="min-h-screen bg-[var(--tg-theme-bg-color)] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 flex items-center border-b border-[var(--tg-theme-hint-color)]/20">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-[var(--tg-theme-secondary-bg-color)]"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--tg-theme-text-color)]" />
          </button>
          <div className="flex-1 flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold text-[var(--tg-theme-text-color)]">Speed Challenge</span>
          </div>
          <div className="w-9" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-6xl mb-4">⚡</div>
          <h1 className="text-2xl font-bold text-[var(--tg-theme-text-color)] mb-2">
            Speed Challenge
          </h1>
          <p className="text-[var(--tg-theme-hint-color)] mb-6 max-w-xs">
            Answer as many questions as you can in {CHALLENGE_TIME} seconds!
          </p>
          
          <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-sm">
            <div className="p-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color)]">
              <Timer className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-[var(--tg-theme-text-color)]">{CHALLENGE_TIME}s</p>
              <p className="text-xs text-[var(--tg-theme-hint-color)]">Time Limit</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color)]">
              <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-[var(--tg-theme-text-color)]">+{POINTS_CORRECT}</p>
              <p className="text-xs text-[var(--tg-theme-hint-color)]">Per Answer</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color)]">
              <Zap className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-[var(--tg-theme-text-color)]">+{POINTS_STREAK_BONUS}</p>
              <p className="text-xs text-[var(--tg-theme-hint-color)]">Streak Bonus</p>
            </div>
          </div>
          
          <button
            onClick={startGame}
            className="px-8 py-4 rounded-xl bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] font-bold text-lg flex items-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Start Challenge
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;
    return (
      <div className="min-h-screen bg-[var(--tg-theme-bg-color)] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">
          {score >= 200 ? '🏆' : score >= 100 ? '⭐' : '💪'}
        </div>
        <h1 className="text-2xl font-bold text-[var(--tg-theme-text-color)] mb-2">
          Challenge Complete!
        </h1>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
            <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[var(--tg-theme-text-color)]">{score}</p>
            <p className="text-xs text-[var(--tg-theme-hint-color)]">Score</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
            <CheckCircle className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[var(--tg-theme-text-color)]">{correctAnswers}/{questionsAnswered}</p>
            <p className="text-xs text-[var(--tg-theme-hint-color)]">Correct ({accuracy}%)</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color)]">
            <Zap className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[var(--tg-theme-text-color)]">{maxStreak}</p>
            <p className="text-xs text-[var(--tg-theme-hint-color)]">Best Streak</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--tg-theme-secondary-bg-color)]">
            <Timer className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[var(--tg-theme-text-color)]">{questionsAnswered}</p>
            <p className="text-xs text-[var(--tg-theme-hint-color)]">Questions</p>
          </div>
        </div>
        
        <div className="flex gap-3 w-full max-w-sm">
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)] font-medium"
          >
            Home
          </button>
          <button
            onClick={startGame}
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] font-medium flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)] flex flex-col">
      {/* Header with timer */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--tg-theme-hint-color)]/20">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          <span className="font-bold text-[var(--tg-theme-text-color)]">{streak}x</span>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
          timeLeft <= 10 ? 'bg-red-500/20 text-red-500' : 'bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]'
        }`}>
          <Timer className="w-4 h-4" />
          <span className="font-bold tabular-nums">{timeLeft}s</span>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="font-bold text-[var(--tg-theme-text-color)]">{score}</span>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 p-4 flex flex-col">
        {currentQuestion && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-sm text-[var(--tg-theme-hint-color)] mb-2">What does this word mean?</p>
              <h2 className="text-3xl font-bold text-[var(--tg-theme-text-color)] mb-8">
                {currentQuestion.word.word}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedIndex === index;
                const isCorrect = index === currentQuestion.correctIndex;
                let bgColor = 'bg-[var(--tg-theme-secondary-bg-color)]';
                let borderColor = 'border-transparent';
                
                if (showFeedback) {
                  if (isCorrect) {
                    bgColor = 'bg-green-500/20';
                    borderColor = 'border-green-500';
                  } else if (isSelected && !isCorrect) {
                    bgColor = 'bg-red-500/20';
                    borderColor = 'border-red-500';
                  }
                }
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={!!showFeedback}
                    className={`w-full p-4 rounded-xl border-2 ${bgColor} ${borderColor} text-left transition-all ${
                      !showFeedback ? 'active:scale-98' : ''
                    }`}
                  >
                    <p className="font-medium text-[var(--tg-theme-text-color)]">{option}</p>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
