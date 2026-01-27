import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  count: number;
  compact?: boolean;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ count, compact }) => {
  if (count <= 0) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Flame size={14} className="text-orange-500" />
        <span className="text-xs font-bold text-orange-500">{count}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-2 px-4 py-2 rounded-2xl"
      style={{ backgroundColor: 'var(--tg-secondary-bg)' }}
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
      >
        <Flame size={22} className="text-orange-500" />
      </motion.div>
      <div>
        <span className="text-lg font-bold" style={{ color: 'var(--tg-text)' }}>
          {count}
        </span>
        <span className="text-xs ml-1" style={{ color: 'var(--tg-hint)' }}>
          day streak
        </span>
      </div>
    </motion.div>
  );
};
