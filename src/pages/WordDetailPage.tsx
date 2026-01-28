import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Volume2, Heart, ArrowRight } from 'lucide-react';
import { editions } from '../data/vocabulary';
import { useProgress } from '../contexts/ProgressContext';
import { showBackButton, hideMainButton } from '../lib/telegram';
import { getWordImageUrl } from '../lib/images';

const LANG_KEY = 'sozyola_tg_lang';
const FAV_KEY = 'sozyola_favorites';

export const WordDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId, unitId, wordIndex } = useParams<{ bookId: string; unitId: string; wordIndex: string }>();
  const [imgError, setImgError] = useState(false);
  const [lang] = useState(() => localStorage.getItem(LANG_KEY) || 'uz');
  const [isFavorite, setIsFavorite] = useState(false);

  const edition = editions.find(e => e.id === Number(bookId));
  const unit = edition?.units.find(u => u.id === Number(unitId));
  const word = unit?.words[Number(wordIndex)];

  useEffect(() => {
    showBackButton(() => navigate(-1));
    hideMainButton();
  }, [navigate]);

  // Check if word is favorited
  useEffect(() => {
    if (!word) return;
    try {
      const favs = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
      setIsFavorite(favs.some((f: any) => f.word === word.word));
    } catch {
      setIsFavorite(false);
    }
  }, [word]);

  const toggleFavorite = () => {
    if (!word || !edition || !unit) return;
    try {
      const favs = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
      const exists = favs.findIndex((f: any) => f.word === word.word);
      if (exists >= 0) {
        favs.splice(exists, 1);
        setIsFavorite(false);
      } else {
        favs.push({
          word: word.word,
          meaning: word.meaning,
          meaningRu: word.meaningRu,
          definition: word.definition,
          example: word.example,
          partOfSpeech: word.partOfSpeech,
          image: word.image,
          bookId: edition.id,
          unitId: unit.id,
          wordIndex: Number(wordIndex),
        });
        setIsFavorite(true);
      }
      localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    } catch (e) {
      console.error('Failed to toggle favorite:', e);
    }
  };

  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.85;
    speechSynthesis.speak(u);
  };

  if (!edition || !unit || !word) {
    return (
      <div className="h-full flex items-center justify-center">
        <p style={{ color: 'var(--tg-hint)' }}>Word not found</p>
      </div>
    );
  }

  const imageUrl = getWordImageUrl(word.image);
  const translation = lang === 'ru' && word.meaningRu ? word.meaningRu : word.meaning;

  return (
    <div className="h-full overflow-y-auto pb-6 safe-area-bottom">
      <div className="px-4 pt-4">
        {/* Word Card */}
        <div
          className="rounded-2xl overflow-hidden mb-4"
          style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
        >
          {/* Image */}
          {imageUrl && !imgError ? (
            <div className="w-full h-48 overflow-hidden" style={{ backgroundColor: 'var(--tg-secondary-bg)' }}>
              <img
                src={imageUrl}
                alt={word.word}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div
              className="w-full h-32 flex items-center justify-center"
              style={{ backgroundColor: 'var(--tg-secondary-bg)' }}
            >
              <span className="text-5xl opacity-50">📖</span>
            </div>
          )}

          {/* Content */}
          <div className="p-4">
            {/* Word + actions */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--tg-link)' }}>
                  {word.word}
                </h1>
                <button
                  onClick={() => speak(word.word)}
                  className="p-2 rounded-full active:opacity-60"
                  style={{ backgroundColor: 'var(--tg-secondary-bg)' }}
                >
                  <Volume2 size={18} style={{ color: 'var(--tg-button)' }} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {word.partOfSpeech && (
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: 'var(--tg-secondary-bg)', color: 'var(--tg-hint)' }}
                  >
                    {word.partOfSpeech}
                  </span>
                )}
                <button
                  onClick={toggleFavorite}
                  className="p-2 rounded-full active:opacity-60"
                  style={{ backgroundColor: isFavorite ? '#ef444420' : 'var(--tg-secondary-bg)' }}
                >
                  <Heart
                    size={18}
                    fill={isFavorite ? '#ef4444' : 'none'}
                    style={{ color: isFavorite ? '#ef4444' : 'var(--tg-hint)' }}
                  />
                </button>
              </div>
            </div>

            {/* Translation */}
            <p className="text-lg font-semibold mb-3" style={{ color: 'var(--tg-text)' }}>
              {translation}
            </p>

            {/* Definition */}
            <div className="mb-3">
              <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--tg-hint)' }}>
                Definition
              </p>
              <p className="text-sm" style={{ color: 'var(--tg-subtitle)' }}>
                {word.definition}
              </p>
            </div>

            {/* Example */}
            <div>
              <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--tg-hint)' }}>
                Example
              </p>
              <p className="text-sm italic" style={{ color: 'var(--tg-text)' }}>
                "{word.example}"
              </p>
            </div>
          </div>
        </div>

        {/* Source info */}
        <div
          className="rounded-xl p-3 mb-4"
          style={{ backgroundColor: 'var(--tg-secondary-bg)' }}
        >
          <p className="text-xs" style={{ color: 'var(--tg-hint)' }}>
            📚 Book {bookId} · Unit {unitId} · Word {Number(wordIndex) + 1} of {unit.words.length}
          </p>
        </div>

        {/* Go to Unit button */}
        <button
          onClick={() => navigate(`/unit/${bookId}/${unitId}`)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium active:opacity-80"
          style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
        >
          View Full Unit
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
