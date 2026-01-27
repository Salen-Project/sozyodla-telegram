export interface Word {
    word: string;
    meaning: string; // Uzbek translation
    meaningRu?: string; // Russian translation
    definition: string;
    example: string;
    partOfSpeech?: string;
    image?: string; // URL to an image representing the word
}

export interface Unit {
    id: number;
    title: string;
    words: Word[];
}

export interface Edition {
    id: number;
    title: string;
    description: string;
    color: string;
    coverImage?: string;
    units: Unit[];
}

export interface QuizResult {
    score: number;
    total: number;
    percentage: number;
    date: string;
}

export type UserRole = 'student' | 'teacher' | 'self_learner' | 'professional' | 'other';

// Daily usage time entry (minutes spent per day)
export interface DailyUsageTime {
    date: string; // YYYY-MM-DD
    minutes: number; // Total minutes spent on the app
}

export interface UserProgress {
    unlockedUnits: Record<number, number[]>; // editionId -> array of unlocked unit IDs
    results: Record<string, QuizResult>; // key: "editionId-unitId"
    streak: {
        count: number;
        lastStudyDate: string | null; // ISO date string YYYY-MM-DD
    };
    user: {
        name: string;
        role: UserRole;
    } | null;
    lastStudied?: {
        editionId: number;
        unitId: number;
        timestamp: string;
    };
    dailyGoal: {
        target: number; // words per day
        wordsToday: number;
        date: string; // YYYY-MM-DD
    };
    favorites: string[]; // Array of "editionId-unitId-word" keys
    wordsLearned: number; // Total words learned count
    updatedAt?: string; // ISO timestamp for sync
    // Time tracking: stores last 30 days of usage time
    dailyUsageTime?: DailyUsageTime[];
}

// Sync-related types
export interface SyncedProgress extends UserProgress {
    userId: string;
    syncStatus: 'synced' | 'pending' | 'error';
}

export interface SyncQueueItem {
    id: string;
    timestamp: string;
    changes: Partial<UserProgress>;
}

export interface SyncState {
    isOnline: boolean;
    isSyncing: boolean;
    lastSyncedAt: string | null;
    pendingChanges: number;
    error: string | null;
}

export interface ContentUnlock {
    id: string;
    user_id: string;
    edition_id: number;
    unit_id: number;
    unlocked_at: string;
    unlocked_by: string;
    notes?: string;
}

export interface DatabaseProgress {
    id: string;
    user_id: string;
    unlocked_units: Record<number, number[]>;
    results: Record<string, QuizResult>;
    streak: {
        count: number;
        lastStudyDate: string | null;
    };
    daily_goal: {
        target: number;
        wordsToday: number;
        date: string;
    };
    last_studied: {
        editionId: number;
        unitId: number;
        timestamp: string;
    } | null;
    user_profile: {
        name: string;
        role: UserRole;
    } | null;
    favorites?: string[];
    words_learned?: number;
    daily_usage_time?: DailyUsageTime[];
    language: 'en' | 'uz' | 'ru' | null;
    last_device_id: string | null;
    updated_at: string;
    created_at: string;
}
