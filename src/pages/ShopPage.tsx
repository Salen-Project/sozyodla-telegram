import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Star, Zap, Palette, Lock, Crown } from 'lucide-react';
import { hideBackButton, hideMainButton, haptic } from '../lib/telegram';

interface ShopItem {
  id: string;
  icon: React.ReactNode;
  name: string;
  desc: string;
  price: string;
  tag?: string;
  available: boolean;
}

export const ShopPage: React.FC = () => {
  useEffect(() => {
    hideBackButton();
    hideMainButton();
  }, []);

  const shopItems: ShopItem[] = [
    {
      id: 'premium',
      icon: <Crown size={24} color="#f59e0b" />,
      name: 'Premium Access',
      desc: 'Unlock all books, unlimited quizzes, and advanced stats',
      price: 'Coming Soon',
      tag: '🔜',
      available: false,
    },
    {
      id: 'no-ads',
      icon: <Zap size={24} color="#8b5cf6" />,
      name: 'Ad-Free Experience',
      desc: 'Remove all distractions for focused learning',
      price: 'Coming Soon',
      available: false,
    },
    {
      id: 'themes',
      icon: <Palette size={24} color="#3b82f6" />,
      name: 'Custom Themes',
      desc: 'Personalize your learning environment with new colors',
      price: 'Coming Soon',
      available: false,
    },
    {
      id: 'streak-freeze',
      icon: <Star size={24} color="#22c55e" />,
      name: 'Streak Freeze',
      desc: 'Protect your streak when you miss a day',
      price: 'Coming Soon',
      available: false,
    },
  ];

  const handlePurchase = (item: ShopItem) => {
    if (!item.available) {
      haptic.notification('warning');
      return;
    }
    haptic.impact('medium');
  };

  return (
    <div className="h-full overflow-y-auto pb-2">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--tg-text)' }}>
          Shop 🛍️
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--tg-subtitle)' }}>
          Power up your learning
        </p>
      </div>

      {/* Coming soon banner */}
      <div className="px-4 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 text-center"
          style={{
            background: 'linear-gradient(135deg, #3b82f620, #8b5cf620)',
            border: '1px solid var(--tg-secondary-bg)',
          }}
        >
          <ShoppingBag size={32} style={{ color: 'var(--tg-button)', margin: '0 auto 8px' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--tg-text)' }}>
            Shop is coming soon! 🚀
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--tg-hint)' }}>
            We're working on premium features to enhance your learning experience
          </p>
        </motion.div>
      </div>

      {/* Items */}
      <div className="px-4 space-y-2">
        <h2 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--tg-section-header)' }}>
          Upcoming Items
        </h2>
        {shopItems.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => handlePurchase(item)}
            className="w-full flex items-center gap-3 p-4 rounded-xl active:opacity-80 transition-opacity"
            style={{
              backgroundColor: 'var(--tg-section-bg)',
              border: '1px solid var(--tg-secondary-bg)',
              opacity: item.available ? 1 : 0.7,
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--tg-secondary-bg)' }}
            >
              {item.available ? item.icon : <Lock size={20} style={{ color: 'var(--tg-hint)' }} />}
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold" style={{ color: 'var(--tg-text)' }}>
                  {item.name}
                </p>
                {item.tag && <span className="text-xs">{item.tag}</span>}
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--tg-hint)' }}>
                {item.desc}
              </p>
            </div>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0"
              style={{
                backgroundColor: item.available ? 'var(--tg-button)' : 'var(--tg-secondary-bg)',
                color: item.available ? 'var(--tg-button-text)' : 'var(--tg-hint)',
              }}
            >
              {item.price}
            </span>
          </motion.button>
        ))}
      </div>

      <p className="text-center text-xs px-4 py-4" style={{ color: 'var(--tg-hint)', opacity: 0.6 }}>
        All current features are free! Premium items will be optional.
      </p>
    </div>
  );
};
