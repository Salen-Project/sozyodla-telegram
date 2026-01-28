import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Volume2, ChevronRight, BookOpen } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { editions } from '../data/vocabulary';
import { Word } from '../types';
import { hideBackButton, hideMainButton } from '../lib/telegram';

interface FavoriteWord {
  word: Word;
  editionId: number;
  unitId: number;
  key: string;
}

export const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { progress, toggleFavorite } = useProgress();

  useEffect(() => {
    hideBackButton();
    hideMainButton();
  }, []);

  const favoriteWords = useMemo<FavoriteWord[]>(() => {
    const favs: FavoriteWord[] = [];
    for (const favKey of progress.favorites || []) {
      const parts = favKey.split('-');
      if (parts.length < 3) continue;
      const editionId = Number(parts[0]);
      const unitId = Number(parts[1]);
      const wordStr = parts.slice(2).join('-');

      const edition = editions.find(e => e.id === editionId);
      const unit = edition?.units.find(u => u.id === unitId);
      const word = unit?.words.find(w => w.word.toLowerCase() === wordStr);
      if (word) {
        favs.push({ word, editionId, unitId, key: favKey });
      }
    }
    return favs;
  }, [progress.favorites]);

  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    speechSynthesis.speak(u);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--tg-text)' }}>
          Favorites ❤️
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--tg-subtitle)' }}>
          {favoriteWords.length} saved word{favoriteWords.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {favoriteWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-12">
            <Heart size={48} style={{ color: 'var(--tg-hint)', opacity: 0.5 }} />
            <p className="text-sm mt-3" style={{ color: 'var(--tg-hint)' }}>
              No favorites yet
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--tg-hint)', opacity: 0.7 }}>
              Tap the heart icon on flashcards to save words
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {favoriteWords.map((fav, i) => (
              <motion.div
                key={fav.key}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
              >
                <button
                  onClick={() => toggleFavorite(fav.editionId, fav.unitId, fav.word.word)}
                  className="shrink-0 active:scale-90 transition-transform"
                >
                  <Heart size={20} fill="#ef4444" color="#ef4444" />
                </button>
                <button
                  onClick={() => navigate(`/unit/${fav.editionId}/${fav.unitId}`)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" style={{ color: 'var(--tg-text)' }}>
                      {fav.word.word}
                    </span>
                    {fav.word.partOfSpeech && (
                      <span className="text-xs px-1 py-0.5 rounded" style={{ color: 'var(--tg-hint)', backgroundColor: 'var(--tg-secondary-bg)' }}>
                        {fav.word.partOfSpeech}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--tg-subtitle)' }}>
                    {fav.word.meaning}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--tg-hint)' }}>
                    Book {fav.editionId} · Unit {fav.unitId}
                  </p>
                </button>
                <button
                  onClick={() => speak(fav.word.word)}
                  className="shrink-0 active:opacity-60 p-2"
                >
                  <Volume2 size={16} style={{ color: 'var(--tg-hint)' }} />
                </button>
                <button
                  onClick={() => navigate(`/unit/${fav.editionId}/${fav.unitId}`)}
                  className="shrink-0"
                >
                  <ChevronRight size={16} style={{ color: 'var(--tg-hint)' }} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
