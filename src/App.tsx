import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProgressProvider } from './contexts/ProgressContext';
import { HomePage } from './pages/HomePage';
import { BookPage } from './pages/BookPage';
import { UnitPage } from './pages/UnitPage';
import { SelectUnitPage } from './pages/SelectUnitPage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { QuizPage } from './pages/QuizPage';
import { RecallPage } from './pages/RecallPage';
import { SearchPage } from './pages/SearchPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ShopPage } from './pages/ShopPage';
import { BottomNav } from './components/BottomNav';

const App: React.FC = () => {
  return (
    <ProgressProvider>
      <MemoryRouter>
        <div className="h-full w-full flex flex-col" style={{ backgroundColor: 'var(--tg-bg)' }}>
          <div className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/book/:bookId" element={<BookPage />} />
              <Route path="/unit/:bookId/:unitId" element={<UnitPage />} />
              <Route path="/select/:mode" element={<SelectUnitPage />} />
              <Route path="/flashcards/:bookId/:unitId" element={<FlashcardsPage />} />
              <Route path="/quiz/:bookId/:unitId" element={<QuizPage />} />
              <Route path="/recall/:bookId/:unitId" element={<RecallPage />} />
            </Routes>
          </div>
          <BottomNav />
        </div>
      </MemoryRouter>
    </ProgressProvider>
  );
};

export default App;
