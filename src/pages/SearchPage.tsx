import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, X, Volume2, BookOpen, ChevronRight } from 'lucide-react';
import { editions } from '../data/vocabulary';
import { Word } from '../types';
import { hideBackButton, hideMainButton } from '../lib/telegram';

interface SearchResult {
  word: Word;
  wordIndex: number;
  editionId: number;
  editionTitle: string;
  unitId: number;
  unitTitle: string;
}

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    hideBackButton();
    hideMainButton();
    // Auto focus search input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const found: SearchResult[] = [];
    for (const edition of editions) {
      for (const unit of edition.units) {
        for (let i = 0; i < unit.words.length; i++) {
          const word = unit.words[i];
          if (
            word.word.toLowerCase().includes(q) ||
            word.meaning.toLowerCase().includes(q) ||
            (word.meaningRu && word.meaningRu.toLowerCase().includes(q)) ||
            word.definition.toLowerCase().includes(q)
          ) {
            found.push({
              word,
              wordIndex: i,
              editionId: edition.id,
              editionTitle: edition.title,
              unitId: unit.id,
              unitTitle: unit.title,
            });
          }
        }
      }
    }
    return found.slice(0, 50); // Limit to 50 results
  }, [query]);

  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    speechSynthesis.speak(u);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search bar */}
      <div className="px-4 pt-4 pb-3">
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ backgroundColor: 'var(--tg-secondary-bg)' }}
        >
          <Search size={18} style={{ color: 'var(--tg-hint)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search words, meanings, definitions..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--tg-text)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="active:opacity-60">
              <X size={18} style={{ color: 'var(--tg-hint)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {query.length < 2 ? (
          <div className="flex flex-col items-center justify-center mt-12">
            <BookOpen size={48} style={{ color: 'var(--tg-hint)', opacity: 0.5 }} />
            <p className="text-sm mt-3" style={{ color: 'var(--tg-hint)' }}>
              Type at least 2 characters to search
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--tg-hint)', opacity: 0.7 }}>
              Search in English, Uzbek, or Russian
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-12">
            <p className="text-sm" style={{ color: 'var(--tg-hint)' }}>
              No results for "{query}"
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-xs mb-2" style={{ color: 'var(--tg-hint)' }}>
              {results.length} result{results.length !== 1 ? 's' : ''}{results.length >= 50 ? '+' : ''}
            </p>
            {results.map((r, i) => (
              <motion.button
                key={`${r.editionId}-${r.unitId}-${r.word.word}-${i}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                onClick={() => navigate(`/word/${r.editionId}/${r.unitId}/${r.wordIndex}`)}
                className="w-full text-left p-3 rounded-xl active:opacity-80 transition-opacity"
                style={{ backgroundColor: 'var(--tg-section-bg)', border: '1px solid var(--tg-secondary-bg)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: 'var(--tg-text)' }}>
                        {r.word.word}
                      </span>
                      {r.word.partOfSpeech && (
                        <span className="text-xs px-1 py-0.5 rounded" style={{ color: 'var(--tg-hint)', backgroundColor: 'var(--tg-secondary-bg)' }}>
                          {r.word.partOfSpeech}
                        </span>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); speak(r.word.word); }}
                        className="active:opacity-60"
                      >
                        <Volume2 size={14} style={{ color: 'var(--tg-hint)' }} />
                      </button>
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--tg-subtitle)' }}>
                      {r.word.meaning}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--tg-hint)' }}>
                      Book {r.editionId} · Unit {r.unitId}
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--tg-hint)' }} />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
