import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UserProgress, QuizResult, ContentUnlock, DatabaseProgress } from '../types/index';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'sozyola_tg_progress';
const UNLOCKS_STORAGE_KEY = 'sozyola_tg_unlocks';
const SYNC_INTERVAL_MS = 60 * 1000; // 1 minute

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

const getCachedUnlocks = (): ContentUnlock[] => {
  try {
    const stored = localStorage.getItem(UNLOCKS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
};

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
  isUnitUnlocked: (editionId: number, unitId: number) => boolean;
  contentUnlocks: ContentUnlock[];
}

const ProgressCtx = createContext<ProgressContextType | null>(null);

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();
  const [progress, setProgress] = useState<UserProgress>(getLocalProgress);
  const [contentUnlocks, setContentUnlocks] = useState<ContentUnlock[]>(() => getCachedUnlocks());
  const progressRef = useRef(progress);
  const syncInProgressRef = useRef(false);
  const initialSyncDoneRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // Save to localStorage whenever progress changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  // ====== SUPABASE SYNC ======

  // Fetch content unlocks from Supabase
  const fetchContentUnlocks = useCallback(async () => {
    if (!authUser) return;
    try {
      const { data, error } = await supabase
        .from('content_unlocks')
        .select('*')
        .eq('user_id', authUser.id);

      if (!error && data) {
        setContentUnlocks(data as ContentUnlock[]);
        localStorage.setItem(UNLOCKS_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.error('[Sync] Error fetching content unlocks:', err);
    }
  }, [authUser]);

  // Fetch progress from Supabase
  const fetchFromCloud = useCallback(async (): Promise<DatabaseProgress | null> => {
    if (!authUser) return null;
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows
        throw error;
      }
      return data as DatabaseProgress;
    } catch (err) {
      console.error('[Sync] Error fetching from cloud:', err);
      return null;
    }
  }, [authUser]);

  // Push progress to Supabase
  const pushToCloud = useCallback(async (progressData: UserProgress, timestamp: string): Promise<boolean> => {
    if (!authUser) return false;
    try {
      const dbProgress = {
        user_id: authUser.id,
        unlocked_units: progressData.unlockedUnits,
        results: progressData.results,
        streak: progressData.streak,
        daily_goal: progressData.dailyGoal,
        last_studied: progressData.lastStudied || null,
        user_profile: progressData.user || null,
        favorites: progressData.favorites || [],
        words_learned: progressData.wordsLearned || 0,
        language: localStorage.getItem('sozyola_tg_lang') || 'uz',
        updated_at: timestamp,
      };

      const { error } = await supabase
        .from('user_progress')
        .upsert(dbProgress, { onConflict: 'user_id' });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[Sync] Error pushing to cloud:', err);
      return false;
    }
  }, [authUser]);

  // Convert remote DB format to local UserProgress
  const remoteToLocal = useCallback((remote: DatabaseProgress): UserProgress => {
    return {
      unlockedUnits: remote.unlocked_units || INITIAL_PROGRESS.unlockedUnits,
      results: remote.results || {},
      streak: remote.streak || INITIAL_PROGRESS.streak,
      user: remote.user_profile || null,
      dailyGoal: remote.daily_goal || INITIAL_PROGRESS.dailyGoal,
      lastStudied: remote.last_studied || undefined,
      updatedAt: remote.updated_at,
      favorites: remote.favorites || [],
      wordsLearned: remote.words_learned || 0,
    };
  }, []);

  // Main sync function
  const syncProgress = useCallback(async () => {
    if (!authUser || syncInProgressRef.current) return;
    syncInProgressRef.current = true;

    try {
      const currentProgress = progressRef.current;
      const remoteData = await fetchFromCloud();

      if (!remoteData) {
        // No cloud data - push local to cloud
        const ts = new Date().toISOString();
        await pushToCloud({ ...currentProgress, updatedAt: ts }, ts);
      } else {
        const localTime = new Date(currentProgress.updatedAt || 0).getTime();
        const remoteTime = new Date(remoteData.updated_at).getTime();

        if (remoteTime > localTime) {
          // Remote is newer - pull
          console.log('[Sync] Remote is newer, pulling');
          const pulled = remoteToLocal(remoteData);
          setProgress(pulled);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(pulled));
        } else if (localTime > remoteTime) {
          // Local is newer - push
          console.log('[Sync] Local is newer, pushing');
          const ts = new Date().toISOString();
          await pushToCloud({ ...currentProgress, updatedAt: ts }, ts);
        }
      }
    } catch (err) {
      console.error('[Sync] Error:', err);
    } finally {
      syncInProgressRef.current = false;
    }
  }, [authUser, fetchFromCloud, pushToCloud, remoteToLocal]);

  // Initial sync when user logs in
  useEffect(() => {
    if (authUser && !initialSyncDoneRef.current) {
      initialSyncDoneRef.current = true;
      syncProgress();
      fetchContentUnlocks();
    }
    if (!authUser) {
      initialSyncDoneRef.current = false;
    }
  }, [authUser, syncProgress, fetchContentUnlocks]);

  // Periodic sync every minute
  useEffect(() => {
    if (!authUser) return;
    const id = setInterval(() => {
      syncProgress();
      fetchContentUnlocks();
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(id);
  }, [authUser, syncProgress, fetchContentUnlocks]);

  // Reset on user switch
  useEffect(() => {
    if (!authUser) {
      // User logged out - keep local data but stop syncing
      return;
    }
  }, [authUser]);

  // ====== PROGRESS METHODS ======

  // Helper to update progress with timestamp and trigger background sync
  const updateProgress = useCallback((updater: (prev: UserProgress) => UserProgress) => {
    setProgress(prev => {
      const updated = updater(prev);
      updated.updatedAt = new Date().toISOString();
      return updated;
    });
    // Debounced sync
    if (authUser) {
      setTimeout(() => syncProgress(), 2000);
    }
  }, [authUser, syncProgress]);

  const updateStreak = useCallback(() => {
    const today = getToday();
    if (progress.streak.lastStudyDate === today) return;

    let newCount = 1;
    if (progress.streak.lastStudyDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (progress.streak.lastStudyDate === yesterday.toISOString().split('T')[0]) {
        newCount = progress.streak.count + 1;
      }
    }

    updateProgress(prev => ({
      ...prev,
      streak: { count: newCount, lastStudyDate: today },
    }));
  }, [progress.streak, updateProgress]);

  const saveResult = useCallback((editionId: number, unitId: number, result: QuizResult) => {
    const key = `${editionId}-${unitId}`;
    updateProgress(prev => ({
      ...prev,
      results: { ...prev.results, [key]: result },
    }));
  }, [updateProgress]);

  const getResult = useCallback((editionId: number, unitId: number) => {
    return progress.results[`${editionId}-${unitId}`];
  }, [progress.results]);

  const addWordsLearned = useCallback((count: number) => {
    const today = getToday();
    updateProgress(prev => ({
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
  }, [updateProgress]);

  const toggleFavorite = useCallback((editionId: number, unitId: number, word: string) => {
    const key = `${editionId}-${unitId}-${word.toLowerCase()}`;
    updateProgress(prev => {
      const favorites = prev.favorites || [];
      const isFav = favorites.includes(key);
      return {
        ...prev,
        favorites: isFav ? favorites.filter(f => f !== key) : [...favorites, key],
      };
    });
  }, [updateProgress]);

  const isFavorite = useCallback((editionId: number, unitId: number, word: string): boolean => {
    const key = `${editionId}-${unitId}-${word.toLowerCase()}`;
    return (progress.favorites || []).includes(key);
  }, [progress.favorites]);

  const setLastStudied = useCallback((editionId: number, unitId: number) => {
    updateProgress(prev => ({
      ...prev,
      lastStudied: { editionId, unitId, timestamp: new Date().toISOString() },
    }));
  }, [updateProgress]);

  const setDailyGoalTarget = useCallback((target: number) => {
    updateProgress(prev => ({
      ...prev,
      dailyGoal: { ...prev.dailyGoal, target },
    }));
  }, [updateProgress]);

  const resetProgress = useCallback(() => {
    setProgress(INITIAL_PROGRESS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const isUnitUnlocked = useCallback((editionId: number, unitId: number): boolean => {
    // First 3 units of every book are always free
    if (unitId <= 3) return true;
    return contentUnlocks.some(
      unlock => unlock.edition_id === editionId && unlock.unit_id === unitId
    );
  }, [contentUnlocks]);

  return (
    <ProgressCtx.Provider value={{
      progress,
      updateStreak,
      saveResult,
      getResult,
      addWordsLearned,
      toggleFavorite,
      isFavorite,
      setLastStudied,
      setDailyGoalTarget,
      resetProgress,
      isUnitUnlocked,
      contentUnlocks,
    }}>
      {children}
    </ProgressCtx.Provider>
  );
};

export const useProgress = (): ProgressContextType => {
  const ctx = useContext(ProgressCtx);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
};
