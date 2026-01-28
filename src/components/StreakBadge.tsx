import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  count: number;
  compact?: boolean;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ count, compact }) => {
  if (count <= 0) return null;

  // Milestone detection for special effects
  const isMilestone = count === 7 || count === 14 || count === 30 || count >= 100;
  const isEpic = count >= 30;
  const flameColor = isEpic ? '#f59e0b' : count >= 7 ? '#fb923c' : '#f97316';

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Flame size={14} style={{ color: flameColor }} />
        <span className="text-xs font-bold" style={{ color: flameColor }}>{count}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-2 px-4 py-2 rounded-2xl"
      style={{ 
        backgroundColor: isMilestone ? `${flameColor}15` : 'var(--tg-secondary-bg)',
        border: isMilestone ? `1px solid ${flameColor}40` : 'none',
        boxShadow: isEpic ? `0 0 12px ${flameColor}30` : 'none',
      }}
    >
      <motion.div
        animate={{ 
          rotate: [0, -10, 10, -5, 5, 0],
          scale: isMilestone ? [1, 1.1, 1] : 1,
        }}
        transition={{ 
          duration: 0.5, 
          repeat: Infinity, 
          repeatDelay: isMilestone ? 2 : 3 
        }}
      >
        <Flame size={22} style={{ color: flameColor }} />
      </motion.div>
      <div>
        <span className="text-lg font-bold" style={{ color: isEpic ? flameColor : 'var(--tg-text)' }}>
          {count}
        </span>
        <span className="text-xs ml-1" style={{ color: 'var(--tg-hint)' }}>
          {isEpic ? '🔥 streak!' : 'day streak'}
        </span>
      </div>
    </motion.div>
  );
};
