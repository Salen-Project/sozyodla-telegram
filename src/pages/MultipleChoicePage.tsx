import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { editions } from '../data/vocabulary';
import { useProgress } from '../contexts/ProgressContext';
import { showBackButton, hideMainButton, haptic } from '../lib/telegram';
import { ProgressBar } from '../components/ProgressBar';
import { getWordImageUrl } from '../lib/images';
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

  const getMeaning = (w: Word) => lang === 'ru' && w.meaningRu ? w.meaningRu : w.meaning;

  const questions = useMemo<MCQuestion[]>(() => {
    return shuffleArray(words).map(word => {
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
  }, [words]);

  const [currentQ, setCurrentQ] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [imgError, setImgError] = useState(false);

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
      if (edition && unit) {
        const percentage = Math.round((score / questions.length) * 100);
        saveResult(edition.id, unit.id, {
          score, total: questions.length, percentage, date: new Date().toISOString(),
        });
        addWordsLearned(score);
      }
      setCompleted(true);
      haptic.notification('success');
    }
  }, [currentQ, questions.length, score, edition, unit, saveResult, addWordsLearned]);

  if (!edition || !unit || words.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p style={{ color: 'var(--tg-hint)' }}>No words found</p>
      </div>
    );
  }

  if (completed) {
    const percentage = Math.round((score / questions.length) * 100);
    const isGreat = percentage >= 80;
    return (
      <div className="h-full flex flex-col items-center justify-center px-6">
        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring' }}>
          <Trophy size={64} className={isGreat ? 'text-yellow-500' : 'text-gray-400'} />
        </motion.div>
        <h2 className="text-2xl font-bold mt-4 mb-2" style={{ color: 'var(--tg-text)' }}>
          {isGreat ? 'Excellent! 🎉' : 'Keep Practicing! 💪'}
        </h2>
        <div className="text-4xl font-bold mb-2" style={{ color: isGreat ? '#22c55e' : '#f59e0b' }}>
          {percentage}%
        </div>
        <p className="text-sm mb-6" style={{ color: 'var(--tg-subtitle)' }}>
          {score} out of {questions.length} correct
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => { setCurrentQ(0); setSelectedIndex(null); setIsCorrect(null); setScore(0); setCompleted(false); }}
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

  const question = questions[currentQ];

  return (
    <div className="h-full flex flex-col px-4 pt-4 pb-6 safe-area-bottom">
      <div className="mb-3">
        <ProgressBar current={currentQ + 1} total={questions.length} label="Progress" />
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
            Choose the correct meaning
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
                className="w-full text-left p-3.5 rounded-xl text-sm transition-all"
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
            {currentQ < questions.length - 1 ? 'Next Question →' : 'See Results'}
          </motion.button>
        )}
      </div>
    </div>
  );
};
