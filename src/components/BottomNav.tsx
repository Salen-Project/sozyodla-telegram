import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, User } from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/shop', icon: ShoppingBag, label: 'Shop' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Only show on top-level pages
  const topPages = ['/', '/search', '/shop', '/profile', '/favorites', '/settings'];
  if (!topPages.includes(location.pathname)) return null;

  return (
    <div
      className="flex items-center justify-around py-2 safe-area-bottom"
      style={{
        backgroundColor: 'var(--tg-bg)',
        borderTop: '1px solid var(--tg-secondary-bg)',
      }}
    >
      {tabs.map(tab => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 active:scale-90 transition-transform"
          >
            <tab.icon
              size={22}
              style={{ color: isActive ? 'var(--tg-button)' : 'var(--tg-hint)' }}
            />
            <span
              className="text-xs"
              style={{
                color: isActive ? 'var(--tg-button)' : 'var(--tg-hint)',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
