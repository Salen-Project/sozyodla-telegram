import { useState, useEffect, useCallback } from 'react';
import { UserProgress, QuizResult } from '../types';

const STORAGE_KEY = 'sozyola_tg_progress';

const getToday = () => new Date().toISOString().split('T')[0];

const INITIAL_PROGRESS: UserProgress = {
  unlockedUnits: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] },
  results: {},
  streak: { count: 0, lastStudyDate: null },
  user: null,
  dailyGoal: { target: 20, wordsToday: 0, date: getToday() },
  favorites: [],
  wordsLearned: 0,
};

const getLocalProgress = (): UserProgress => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const today = getToday();
      if (parsed.dailyGoal?.date !== today) {
        parsed.dailyGoal = { ...parsed.dailyGoal, wordsToday: 0, date: today };
      }
      return { ...INITIAL_PROGRESS, ...parsed };
    }
  } catch {}
  return INITIAL_PROGRESS;
};

export function useLocalProgress() {
  const [progress, setProgress] = useState<UserProgress>(getLocalProgress);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const updateStreak = useCallback(() => {
    const today = getToday();
    if (progress.streak.lastStudyDate === today) return;

    let newCount = 1;
    if (progress.streak.lastStudyDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (progress.streak.lastStudyDate === yesterdayStr) {
        newCount = progress.streak.count + 1;
      }
    }

    setProgress(prev => ({
      ...prev,
      streak: { count: newCount, lastStudyDate: today },
    }));
  }, [progress.streak]);

  const saveResult = useCallback((editionId: number, unitId: number, result: QuizResult) => {
    const key = `${editionId}-${unitId}`;
    setProgress(prev => ({
      ...prev,
      results: { ...prev.results, [key]: result },
    }));
  }, []);

  const getResult = useCallback((editionId: number, unitId: number) => {
    return progress.results[`${editionId}-${unitId}`];
  }, [progress.results]);

  const addWordsLearned = useCallback((count: number) => {
    const today = getToday();
    setProgress(prev => ({
      ...prev,
      wordsLearned: (prev.wordsLearned || 0) + count,
      dailyGoal: {
        ...prev.dailyGoal,
        wordsToday: prev.dailyGoal.date === today
          ? prev.dailyGoal.wordsToday + count
          : count,
        date: today,
      },
    }));
  }, []);

  const toggleFavorite = useCallback((editionId: number, unitId: number, word: string) => {
    const key = `${editionId}-${unitId}-${word.toLowerCase()}`;
    setProgress(prev => {
      const favorites = prev.favorites || [];
      const isFav = favorites.includes(key);
      return {
        ...prev,
        favorites: isFav ? favorites.filter(f => f !== key) : [...favorites, key],
      };
    });
  }, []);

  const isFavorite = useCallback((editionId: number, unitId: number, word: string): boolean => {
    const key = `${editionId}-${unitId}-${word.toLowerCase()}`;
    return (progress.favorites || []).includes(key);
  }, [progress.favorites]);

  const setLastStudied = useCallback((editionId: number, unitId: number) => {
    setProgress(prev => ({
      ...prev,
      lastStudied: { editionId, unitId, timestamp: new Date().toISOString() },
    }));
  }, []);

  return {
    progress,
    updateStreak,
    saveResult,
    getResult,
    addWordsLearned,
    toggleFavorite,
    isFavorite,
    setLastStudied,
  };
}
