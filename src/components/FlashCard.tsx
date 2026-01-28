import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Word } from '../types';
import { haptic } from '../lib/telegram';
import { Volume2, Heart, RotateCcw, ImageOff } from 'lucide-react';

interface FlashCardProps {
  word: Word;
  index: number;
  total: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
];

// Generate a consistent hash number from a word for deterministic styling
const hashWord = (word: string): number => {
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash = ((hash << 5) - hash) + word.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

// Word-related emoji mapping for common word categories
const getWordEmoji = (word: string, pos?: string): string => {
  const w = word.toLowerCase();
  // Simple category detection
  if (['afraid', 'fear', 'scared', 'nervous', 'worry'].some(e => w.includes(e))) return '😨';
  if (['angry', 'mad', 'fury', 'rage'].some(e => w.includes(e))) return '😠';
  if (['happy', 'joy', 'glad', 'pleased', 'cheerful', 'excited'].some(e => w.includes(e))) return '😊';
  if (['sad', 'sorrow', 'grief', 'unhappy'].some(e => w.includes(e))) return '😢';
  if (['run', 'walk', 'jump', 'move', 'fly', 'swim'].some(e => w.includes(e))) return '🏃';
  if (['eat', 'food', 'cook', 'meal', 'drink'].some(e => w.includes(e))) return '🍽️';
  if (['book', 'read', 'write', 'study', 'learn'].some(e => w.includes(e))) return '📚';
  if (['work', 'job', 'office', 'business'].some(e => w.includes(e))) return '💼';
  if (['home', 'house', 'room', 'door', 'wall'].some(e => w.includes(e))) return '🏠';
  if (['tree', 'flower', 'plant', 'garden'].some(e => w.includes(e))) return '🌳';
  if (['water', 'river', 'ocean', 'rain', 'sea'].some(e => w.includes(e))) return '🌊';
  if (['fire', 'hot', 'burn', 'heat'].some(e => w.includes(e))) return '🔥';
  if (['light', 'sun', 'bright', 'shine'].some(e => w.includes(e))) return '☀️';
  if (['dark', 'night', 'shadow', 'black'].some(e => w.includes(e))) return '🌙';
  if (['love', 'heart', 'kind', 'care'].some(e => w.includes(e))) return '❤️';
  if (['money', 'pay', 'cost', 'price', 'rich'].some(e => w.includes(e))) return '💰';
  if (['time', 'clock', 'hour', 'wait'].some(e => w.includes(e))) return '⏰';
  if (pos === 'v') return '⚡';
  if (pos === 'adj') return '✨';
  if (pos === 'n') return '📦';
  return '💡';
};

const WordImage: React.FC<{ word: string; pos?: string }> = ({ word, pos }) => {
  const h = hashWord(word);
  const gradIdx = h % GRADIENTS.length;
  const emoji = getWordEmoji(word, pos);

  return (
    <div
      className="w-20 h-20 rounded-2xl mb-3 flex items-center justify-center shadow-sm"
      style={{ background: GRADIENTS[gradIdx] }}
    >
      <span className="text-3xl">{emoji}</span>
    </div>
  );
};

export const FlashCard: React.FC<FlashCardProps> = ({
  word,
  index,
  total,
  isFavorite,
  onToggleFavorite,
  onSwipeLeft,
  onSwipeRight,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);

  const handleFlip = () => {
    haptic.impact('light');
    setIsFlipped(!isFlipped);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      haptic.notification('success');
      onSwipeRight();
      setIsFlipped(false);
    } else if (info.offset.x < -threshold) {
      haptic.impact('medium');
      onSwipeLeft();
      setIsFlipped(false);
    }
    setDragDirection(null);
  };

  const handleDrag = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 30) setDragDirection('right');
    else if (info.offset.x < -30) setDragDirection('left');
    else setDragDirection(null);
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
    haptic.selection();
  };

  return (
    <div className="relative w-full max-w-sm mx-auto" style={{ perspective: '1000px' }}>
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-medium" style={{ color: 'var(--tg-hint)' }}>
          {index + 1} / {total}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === index ? '20px' : '6px',
                backgroundColor: i <= index ? 'var(--tg-button)' : 'var(--tg-secondary-bg)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Swipe hints */}
      <AnimatePresence>
        {dragDirection && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 z-10 -translate-y-1/2 text-2xl font-bold rounded-xl px-4 py-2"
            style={{
              ...(dragDirection === 'right'
                ? { left: '8px', backgroundColor: '#22c55e20', color: '#22c55e' }
                : { right: '8px', backgroundColor: '#ef444420', color: '#ef4444' }),
            }}
          >
            {dragDirection === 'right' ? '✓ Know' : '✗ Review'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 0.97 }}
        onClick={handleFlip}
        className="cursor-pointer touch-pan-y"
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 30 }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative w-full aspect-[3/4] rounded-2xl"
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg"
            style={{
              backfaceVisibility: 'hidden',
              backgroundColor: 'var(--tg-section-bg)',
              border: '1px solid var(--tg-secondary-bg)',
            }}
          >
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              {/* Word image */}
              <WordImage word={word.word} pos={word.partOfSpeech} />
              <span
                className="text-xs uppercase tracking-wider mb-2 font-medium"
                style={{ color: 'var(--tg-hint)' }}
              >
                {word.partOfSpeech || 'word'}
              </span>
              <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--tg-text)' }}>
                {word.word}
              </h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speak(word.word);
                }}
                className="p-3 rounded-full mb-4 active:scale-90 transition-transform"
                style={{ backgroundColor: 'var(--tg-secondary-bg)' }}
              >
                <Volume2 size={20} style={{ color: 'var(--tg-button)' }} />
              </button>
              <p className="text-sm text-center opacity-60 mt-2" style={{ color: 'var(--tg-hint)' }}>
                Tap to flip • Swipe to navigate
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                  haptic.impact('light');
                }}
                className="p-2 rounded-full active:scale-90 transition-transform"
                style={{ backgroundColor: 'var(--tg-secondary-bg)' }}
              >
                <Heart
                  size={18}
                  fill={isFavorite ? '#ef4444' : 'none'}
                  color={isFavorite ? '#ef4444' : 'var(--tg-hint)'}
                />
              </button>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl p-6 flex flex-col shadow-lg overflow-y-auto"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              backgroundColor: 'var(--tg-section-bg)',
              border: '1px solid var(--tg-secondary-bg)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold" style={{ color: 'var(--tg-text)' }}>
                {word.word}
              </h3>
              <RotateCcw size={16} style={{ color: 'var(--tg-hint)' }} />
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <span
                  className="text-xs uppercase tracking-wider font-medium block mb-1"
                  style={{ color: 'var(--tg-section-header)' }}
                >
                  Translation (UZ)
                </span>
                <p className="text-lg font-semibold" style={{ color: 'var(--tg-text)' }}>
                  {word.meaning}
                </p>
              </div>

              {word.meaningRu && (
                <div>
                  <span
                    className="text-xs uppercase tracking-wider font-medium block mb-1"
                    style={{ color: 'var(--tg-section-header)' }}
                  >
                    Translation (RU)
                  </span>
                  <p className="text-base" style={{ color: 'var(--tg-text)' }}>
                    {word.meaningRu}
                  </p>
                </div>
              )}

              <div>
                <span
                  className="text-xs uppercase tracking-wider font-medium block mb-1"
                  style={{ color: 'var(--tg-section-header)' }}
                >
                  Definition
                </span>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--tg-text)' }}>
                  {word.definition}
                </p>
              </div>

              <div>
                <span
                  className="text-xs uppercase tracking-wider font-medium block mb-1"
                  style={{ color: 'var(--tg-section-header)' }}
                >
                  Example
                </span>
                <p className="text-sm italic leading-relaxed" style={{ color: 'var(--tg-subtitle)' }}>
                  "{word.example}"
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
