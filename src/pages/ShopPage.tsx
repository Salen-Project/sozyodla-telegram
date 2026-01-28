import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Package, Check, Star } from 'lucide-react';
import { hideBackButton, hideMainButton, haptic } from '../lib/telegram';
import { editions } from '../data/vocabulary';

interface BookItem {
  id: number;
  title: string;
  wordCount: number;
  price: number;
  purchased: boolean;
}

const PURCHASED_KEY = 'sozyola_purchased_books';
const ALL_BOOKS_PRICE = 199000;
const SINGLE_BOOK_PRICE = 49000;

export const ShopPage: React.FC = () => {
  const [purchasedBooks, setPurchasedBooks] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(PURCHASED_KEY);
      return stored ? JSON.parse(stored) : [1]; // Book 1 is free
    } catch {
      return [1];
    }
  });

  useEffect(() => {
    hideBackButton();
    hideMainButton();
  }, []);

  const books: BookItem[] = editions.map(ed => ({
    id: ed.id,
    title: ed.title,
    wordCount: ed.units.reduce((acc, u) => acc + u.words.length, 0),
    price: ed.id === 1 ? 0 : SINGLE_BOOK_PRICE, // Book 1 is free
    purchased: purchasedBooks.includes(ed.id),
  }));

  const allBooksPurchased = books.every(b => b.purchased);
  const unpurchasedCount = books.filter(b => !b.purchased && b.price > 0).length;

  const formatPrice = (price: number) => {
    if (price === 0) return "Bepul";
    return `${price.toLocaleString()} so'm`;
  };

  const handlePurchaseBook = (book: BookItem) => {
    if (book.purchased || book.price === 0) return;
    
    haptic.impact('medium');
    
    // In real app, this would open Telegram payment
    // For now, show alert
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.showConfirm) {
      tg.showConfirm(
        `"${book.title}" kitobini ${formatPrice(book.price)} ga sotib olmoqchimisiz?`,
        (confirmed: boolean) => {
          if (confirmed) {
            // Simulate purchase
            const newPurchased = [...purchasedBooks, book.id];
            setPurchasedBooks(newPurchased);
            localStorage.setItem(PURCHASED_KEY, JSON.stringify(newPurchased));
            haptic.notification('success');
            tg.showAlert('Xarid muvaffaqiyatli! ✅');
          }
        }
      );
    } else {
      alert(`Sotib olish: ${book.title} - ${formatPrice(book.price)}`);
    }
  };

  const handlePurchaseAll = () => {
    if (allBooksPurchased) return;
    
    haptic.impact('medium');
    
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.showConfirm) {
      tg.showConfirm(
        `Barcha kitoblarni ${formatPrice(ALL_BOOKS_PRICE)} ga sotib olmoqchimisiz? (${unpurchasedCount} ta kitob)`,
        (confirmed: boolean) => {
          if (confirmed) {
            const allIds = books.map(b => b.id);
            setPurchasedBooks(allIds);
            localStorage.setItem(PURCHASED_KEY, JSON.stringify(allIds));
            haptic.notification('success');
            tg.showAlert('Barcha kitoblar sotib olindi! 🎉');
          }
        }
      );
    } else {
      alert(`Barcha kitoblar: ${formatPrice(ALL_BOOKS_PRICE)}`);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-2">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--tg-text)' }}>
          Do'kon 🛍️
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--tg-subtitle)' }}>
          Kitoblarni sotib oling
        </p>
      </div>

      {/* All Books Bundle */}
      {!allBooksPurchased && unpurchasedCount > 1 && (
        <div className="px-4 mb-4">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handlePurchaseAll}
            className="w-full rounded-xl p-4 active:scale-[0.98] transition-transform"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Package size={24} color="white" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-white">
                    Barcha Kitoblar
                  </p>
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                    🔥 Tejamkor
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-0.5">
                  {unpurchasedCount} ta kitob • {books.reduce((a, b) => a + b.wordCount, 0).toLocaleString()}+ so'z
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">
                  {formatPrice(ALL_BOOKS_PRICE)}
                </p>
                <p className="text-xs text-white/60 line-through">
                  {formatPrice(SINGLE_BOOK_PRICE * unpurchasedCount)}
                </p>
              </div>
            </div>
          </motion.button>
        </div>
      )}

      {/* Individual Books */}
      <div className="px-4 space-y-2">
        <h2 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--tg-section-header)' }}>
          Kitoblar
        </h2>
        {books.map((book, i) => (
          <motion.button
            key={book.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => handlePurchaseBook(book)}
            disabled={book.purchased}
            className="w-full flex items-center gap-3 p-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-100"
            style={{
              backgroundColor: book.purchased ? 'rgba(34, 197, 94, 0.1)' : 'var(--tg-section-bg)',
              border: book.purchased ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--tg-secondary-bg)',
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ 
                backgroundColor: book.purchased ? 'rgba(34, 197, 94, 0.2)' : 'var(--tg-secondary-bg)',
              }}
            >
              {book.purchased ? (
                <Check size={24} color="#22c55e" />
              ) : (
                <BookOpen size={24} style={{ color: 'var(--tg-button)' }} />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold" style={{ color: 'var(--tg-text)' }}>
                {book.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--tg-hint)' }}>
                {book.wordCount.toLocaleString()} ta so'z
              </p>
            </div>
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
              style={{
                backgroundColor: book.purchased 
                  ? 'rgba(34, 197, 94, 0.2)' 
                  : book.price === 0 
                    ? 'rgba(34, 197, 94, 0.15)' 
                    : 'var(--tg-button)',
                color: book.purchased || book.price === 0 ? '#22c55e' : 'var(--tg-button-text)',
              }}
            >
              {book.purchased ? '✓ Sotib olingan' : formatPrice(book.price)}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Stats */}
      <div className="px-4 py-4 mt-2">
        <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--tg-hint)' }}>
          <Star size={14} />
          <span>Birinchi kitob bepul!</span>
        </div>
      </div>
    </div>
  );
};
