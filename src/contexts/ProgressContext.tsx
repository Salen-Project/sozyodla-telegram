import React, { createContext, useContext } from 'react';
import { useLocalProgress } from '../hooks/useLocalProgress';
import { UserProgress, QuizResult } from '../types';

interface ProgressContextType {
  progress: UserProgress;
  updateStreak: () => void;
  saveResult: (editionId: number, unitId: number, result: QuizResult) => void;
  getResult: (editionId: number, unitId: number) => QuizResult | undefined;
  addWordsLearned: (count: number) => void;
  toggleFavorite: (editionId: number, unitId: number, word: string) => void;
  isFavorite: (editionId: number, unitId: number, word: string) => boolean;
  setLastStudied: (editionId: number, unitId: number) => void;
  setDailyGoalTarget: (target: number) => void;
  resetProgress: () => void;
}

const ProgressCtx = createContext<ProgressContextType | null>(null);

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const progressHook = useLocalProgress();
  return <ProgressCtx.Provider value={progressHook}>{children}</ProgressCtx.Provider>;
};

export const useProgress = (): ProgressContextType => {
  const ctx = useContext(ProgressCtx);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
};
