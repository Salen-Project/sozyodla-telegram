import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Brain, Pen, ArrowRight, Volume2, Shuffle, ListChecks, Sparkles, FileText } from 'lucide-react';
import { editions } from '../data/vocabulary';
import { useProgress } from '../contexts/ProgressContext';
import { showBackButton, hideMainButton, haptic } from '../lib/telegram';
import { getWordImageUrl } from '../lib/images';
import { Word } from '../types';

const LANG_KEY = 'sozyola_tg_lang';

const WordCard: React.FC<{ word: Word; lang: string }> = ({ word, lang }) => {
  const [imgError, setImgError] = useState(false);
  const imageUrl = getWordImageUrl(word.image);
  const translation = lang === 'ru' && word.meaningRu ? word.meaningRu : word.meaning;

  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.85;
    speechSynthesis.speak(u);
    haptic.selection();
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
    >
      {/* Image */}
      {imageUrl && !imgError ? (
        <div className="w-full h-32 overflow-hidden" style={{ backgroundColor: 'var(--tg-secondary-bg)' }}>
          <img
            src={imageUrl}
            alt={word.word}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div
          className="w-full h-20 flex items-center justify-center"
          style={{ backgroundColor: 'var(--tg-secondary-bg)' }}
        >
          <span className="text-3xl opacity-50">📖</span>
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-base font-bold" style={{ color: 'var(--tg-link)' }}>
            {word.word}
          </span>
          <button
            onClick={() => speak(word.word)}
            className="active:opacity-60 p-0.5"
          >
            <Volume2 size={14} style={{ color: 'var(--tg-hint)' }} />
          </button>
          {word.partOfSpeech && (
            <span
              className="ml-auto text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-hint)' }}
            >
              {word.partOfSpeech}
            </span>
          )}
        </div>

        <p className="text-sm font-medium mb-1.5" style={{ color: 'var(--tg-text)' }}>
          {translation}
        </p>

        <p className="text-xs mb-1" style={{ color: 'var(--tg-subtitle)' }}>
          <span style={{ color: 'var(--tg-hint)' }}>Def: </span>
          {word.definition}
        </p>

        <p className="text-xs italic" style={{ color: 'var(--tg-hint)' }}>
          "{word.example}"
        </p>
      </div>
    </div>
  );
};

export const UnitPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId, unitId } = useParams<{ bookId: string; unitId: string }>();
  const { progress } = useProgress();
  const [showAllWords, setShowAllWords] = useState(false);
  const [lang] = useState(() => localStorage.getItem(LANG_KEY) || 'uz');

  const edition = editions.find(e => e.id === Number(bookId));
  const unit = edition?.units.find(u => u.id === Number(unitId));

  useEffect(() => {
    showBackButton(() => navigate(`/book/${bookId}`));
    hideMainButton();
  }, [navigate, bookId]);

  if (!edition || !unit) {
    return (
      <div className="h-full flex items-center justify-center">
        <p style={{ color: 'var(--tg-hint)' }}>Unit not found</p>
      </div>
    );
  }

  const result = progress.results[`${edition.id}-${unit.id}`];

  const modes = [
    {
      id: 'flashcards',
      label: 'Flashcards',
      desc: 'Swipe through word cards',
      icon: BookOpen,
      color: '#3b82f6',
      path: `/flashcards/${bookId}/${unitId}`,
    },
    {
      id: 'quiz',
      label: 'Quiz',
      desc: 'Multiple choice questions',
      icon: Brain,
      color: '#8b5cf6',
      path: `/quiz/${bookId}/${unitId}`,
    },
    {
      id: 'recall',
      label: 'Word Recall',
      desc: 'Type the correct word',
      icon: Pen,
      color: '#f59e0b',
      path: `/recall/${bookId}/${unitId}`,
    },
    {
      id: 'matching',
      label: 'Matching',
      desc: 'Match words with meanings',
      icon: Shuffle,
      color: '#22c55e',
      path: `/matching/${bookId}/${unitId}`,
    },
    {
      id: 'multiple-choice',
      label: 'Multiple Choice',
      desc: 'Choose the right meaning',
      icon: ListChecks,
      color: '#ec4899',
      path: `/multiple-choice/${bookId}/${unitId}`,
    },
    {
      id: 'scramble',
      label: 'Word Scramble',
      desc: 'Unscramble the letters',
      icon: Sparkles,
      color: '#06b6d4',
      path: `/scramble/${bookId}/${unitId}`,
      isNew: true,
    },
    {
      id: 'fill-blank',
      label: 'Fill in Blank',
      desc: 'Complete the sentence',
      icon: FileText,
      color: '#8b5cf6',
      path: `/fill-blank/${bookId}/${unitId}`,
      isNew: true,
    },
  ];

  return (
    <div className="h-full overflow-y-auto pb-6 safe-area-bottom">
      <div className="px-4 pt-4">
        {/* Unit header */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
        >
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--tg-text)' }}>
            {unit.title}
          </h1>
          <p className="text-sm mb-3" style={{ color: 'var(--tg-subtitle)' }}>
            {edition.title} • {unit.words.length} words
          </p>
          {result && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: result.percentage >= 80 ? '#22c55e20' : '#f59e0b20',
                color: result.percentage >= 80 ? '#22c55e' : '#f59e0b',
              }}
            >
              Best: {result.percentage}% ({result.score}/{result.total})
            </div>
          )}
        </div>

        {/* Exercise modes */}
        <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--tg-section-header)' }}>
          Start Practicing
        </h2>
        <div className="space-y-2 mb-5">
          {modes.map((mode, i) => (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                haptic.impact('light');
                navigate(mode.path);
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl"
              style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${mode.color}20` }}
              >
                <mode.icon size={20} style={{ color: mode.color }} />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: 'var(--tg-text)' }}>
                    {mode.label}
                  </p>
                  {mode.isNew && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'var(--tg-hint)' }}>{mode.desc}</p>
              </div>
              <ArrowRight size={18} style={{ color: mode.color }} />
            </motion.button>
          ))}
        </div>

        {/* All Words Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--tg-section-header)' }}>
              All Words
            </h2>
            <button
              onClick={() => setShowAllWords(!showAllWords)}
              className="text-xs font-medium px-3 py-1 rounded-full active:opacity-70"
              style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-button)' }}
            >
              {showAllWords ? 'Collapse' : 'Show All'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(showAllWords ? unit.words : unit.words.slice(0, 4)).map((word, i) => (
              <motion.div
                key={word.word}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <WordCard word={word} lang={lang} />
              </motion.div>
            ))}
          </div>

          {!showAllWords && unit.words.length > 4 && (
            <button
              onClick={() => setShowAllWords(true)}
              className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium active:opacity-70"
              style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-button)' }}
            >
              Show all {unit.words.length} words
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
