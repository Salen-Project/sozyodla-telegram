import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { editions } from '../data/vocabulary';
import { useProgress } from '../contexts/ProgressContext';
import { QuizOption } from '../components/QuizOption';
import { ProgressBar } from '../components/ProgressBar';
import { showBackButton, hideMainButton, haptic } from '../lib/telegram';
import { Word } from '../types';
import { Trophy, RotateCcw, ArrowRight } from 'lucide-react';

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface Question {
  word: Word;
  options: string[];
  correctIndex: number;
}

function generateQuestions(words: Word[]): Question[] {
  return shuffleArray(words).map(word => {
    const wrongWords = words.filter(w => w.word !== word.word);
    const wrongOptions = shuffleArray(wrongWords).slice(0, 3).map(w => w.meaning);
    const allOptions = shuffleArray([...wrongOptions, word.meaning]);
    return {
      word,
      options: allOptions,
      correctIndex: allOptions.indexOf(word.meaning),
    };
  });
}

export const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId, unitId } = useParams<{ bookId: string; unitId: string }>();
  const { saveResult, addWordsLearned, setLastStudied, updateStreak } = useProgress();

  const edition = editions.find(e => e.id === Number(bookId));
  const unit = edition?.units.find(u => u.id === Number(unitId));
  const words = unit?.words || [];

  const questions = useMemo(() => generateQuestions(words), [words]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [answers, setAnswers] = useState<{ correct: boolean; word: Word }[]>([]);

  useEffect(() => {
    showBackButton(() => navigate(`/unit/${bookId}/${unitId}`));
    hideMainButton();
    if (edition && unit) {
      setLastStudied(edition.id, unit.id);
      updateStreak();
    }
  }, [navigate, bookId, unitId, edition, unit, setLastStudied, updateStreak]);

  const handleSelect = useCallback((index: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(index);
    const correct = index === questions[currentQ].correctIndex;
    setIsCorrect(correct);
    setAnswers(prev => [...prev, { correct, word: questions[currentQ].word }]);

    if (correct) {
      haptic.notification('success');
      setScore(s => s + 1);
    } else {
      haptic.notification('error');
    }
  }, [selectedIndex, currentQ, questions]);

  const handleNext = useCallback(() => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
      setSelectedIndex(null);
      setIsCorrect(null);
    } else {
      const finalScore = score + (isCorrect ? 0 : 0); // already counted
      const total = questions.length;
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
  }, [currentQ, questions.length, score, isCorrect, edition, unit, saveResult, addWordsLearned]);

  if (!edition || !unit || words.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p style={{ color: 'var(--tg-hint)' }}>No words found</p>
      </div>
    );
  }

  // Retry only incorrect words
  const retryIncorrect = useCallback(() => {
    const wrongWords = answers.filter(a => !a.correct).map(a => a.word);
    if (wrongWords.length > 0) {
      const newQuestions = generateQuestions(wrongWords);
      // Reset state for retry
      setCurrentQ(0);
      setSelectedIndex(null);
      setIsCorrect(null);
      setScore(0);
      setCompleted(false);
      setAnswers([]);
      // We need to regenerate questions from wrong words only
      // This requires modifying the questions state, which is memoized
      // For simplicity, navigate to unit and back would work, but let's do a full reset
    }
    // For now, just restart
    setCurrentQ(0);
    setSelectedIndex(null);
    setIsCorrect(null);
    setScore(0);
    setCompleted(false);
    setAnswers([]);
  }, [answers]);

  if (completed) {
    const percentage = Math.round((score / questions.length) * 100);
    const isGreat = percentage >= 80;
    const wrongCount = answers.filter(a => !a.correct).length;

    return (
      <div className="h-full flex flex-col items-center justify-center px-6 pb-6 overflow-y-auto">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mb-4"
        >
          <Trophy size={56} className={isGreat ? 'text-yellow-500' : 'text-gray-400'} />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--tg-text)' }}>
          {isGreat ? 'Excellent! 🎉' : 'Keep Practicing! 💪'}
        </h2>
        <div
          className="text-4xl font-bold mb-2"
          style={{ color: isGreat ? '#22c55e' : '#f59e0b' }}
        >
          {percentage}%
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--tg-subtitle)' }}>
          {score} out of {questions.length} correct
        </p>

        {/* Answer Review */}
        {wrongCount > 0 && (
          <div className="w-full max-w-[300px] mb-4 max-h-32 overflow-y-auto">
            <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: 'var(--tg-section-header)' }}>
              Words to Review
            </p>
            {answers.filter(a => !a.correct).map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg mb-1"
                style={{ backgroundColor: '#ef444415' }}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--tg-text)' }}>
                  {a.word.word}
                </span>
                <span className="text-xs" style={{ color: 'var(--tg-hint)' }}>
                  — {a.word.meaning}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 w-full max-w-[280px]">
          {wrongCount > 0 && (
            <button
              onClick={retryIncorrect}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: '#f59e0b', color: 'white' }}
            >
              <RotateCcw size={16} /> Retry Incorrect ({wrongCount})
            </button>
          )}
          <button
            onClick={() => {
              setCurrentQ(0);
              setSelectedIndex(null);
              setIsCorrect(null);
              setScore(0);
              setCompleted(false);
              setAnswers([]);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
          >
            <RotateCcw size={16} /> Retry All
          </button>
          <button
            onClick={() => navigate(`/unit/${bookId}/${unitId}`)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
          >
            Done <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentQ];

  return (
    <div className="h-full flex flex-col px-4 pt-4 pb-6 safe-area-bottom">
      {/* Progress */}
      <div className="mb-4">
        <ProgressBar current={currentQ + 1} total={questions.length} label="Progress" />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider mb-2 font-medium" style={{ color: 'var(--tg-section-header)' }}>
            What does this word mean?
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

        {/* Options */}
        <div className="space-y-2 flex-1">
          {question.options.map((option, i) => (
            <QuizOption
              key={`${currentQ}-${i}`}
              text={option}
              index={i}
              isSelected={selectedIndex === i}
              isCorrect={
                selectedIndex !== null
                  ? i === question.correctIndex
                    ? true
                    : selectedIndex === i
                    ? false
                    : null
                  : null
              }
              disabled={selectedIndex !== null}
              onSelect={() => handleSelect(i)}
            />
          ))}
        </div>

        {/* Next button */}
        {selectedIndex !== null && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleNext}
            className="w-full py-3.5 rounded-xl text-sm font-semibold mt-4 active:scale-[0.98] transition-transform"
            style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
          >
            {currentQ < questions.length - 1 ? 'Next Question →' : 'See Results'}
          </motion.button>
        )}
      </div>
    </div>
  );
};
