import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface QuizOptionProps {
  text: string;
  index: number;
  isSelected: boolean;
  isCorrect: boolean | null;
  disabled: boolean;
  onSelect: () => void;
}

export const QuizOption: React.FC<QuizOptionProps> = ({
  text,
  index,
  isSelected,
  isCorrect,
  disabled,
  onSelect,
}) => {
  const letters = ['A', 'B', 'C', 'D'];

  const getBorderColor = () => {
    if (isCorrect === true) return '#22c55e';
    if (isCorrect === false && isSelected) return '#ef4444';
    if (isSelected) return 'var(--tg-button)';
    return 'var(--tg-secondary-bg)';
  };

  const getBgColor = () => {
    if (isCorrect === true) return '#22c55e15';
    if (isCorrect === false && isSelected) return '#ef444415';
    return 'var(--tg-section-bg)';
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      onClick={onSelect}
      disabled={disabled}
      className="w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors"
      style={{
        borderColor: getBorderColor(),
        backgroundColor: getBgColor(),
        opacity: disabled && !isSelected && isCorrect !== true ? 0.5 : 1,
      }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{
          backgroundColor: isSelected ? 'var(--tg-button)' : 'var(--tg-secondary-bg)',
          color: isSelected ? 'var(--tg-button-text)' : 'var(--tg-text)',
        }}
      >
        {isCorrect === true ? (
          <Check size={16} />
        ) : isCorrect === false && isSelected ? (
          <X size={16} />
        ) : (
          letters[index]
        )}
      </div>
      <span className="text-sm font-medium flex-1" style={{ color: 'var(--tg-text)' }}>
        {text}
      </span>
    </motion.button>
  );
};
