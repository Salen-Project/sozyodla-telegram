import React, { Suspense } from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProgressProvider } from './contexts/ProgressContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { BottomNav } from './components/BottomNav';

// Lazy load non-essential pages for faster initial load
const BookPage = React.lazy(() => import('./pages/BookPage').then(m => ({ default: m.BookPage })));
const UnitPage = React.lazy(() => import('./pages/UnitPage').then(m => ({ default: m.UnitPage })));
const SelectUnitPage = React.lazy(() => import('./pages/SelectUnitPage').then(m => ({ default: m.SelectUnitPage })));
const FlashcardsPage = React.lazy(() => import('./pages/FlashcardsPage').then(m => ({ default: m.FlashcardsPage })));
const QuizPage = React.lazy(() => import('./pages/QuizPage').then(m => ({ default: m.QuizPage })));
const RecallPage = React.lazy(() => import('./pages/RecallPage').then(m => ({ default: m.RecallPage })));
const MatchingPage = React.lazy(() => import('./pages/MatchingPage').then(m => ({ default: m.MatchingPage })));
const MultipleChoicePage = React.lazy(() => import('./pages/MultipleChoicePage').then(m => ({ default: m.MultipleChoicePage })));
const SearchPage = React.lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const FavoritesPage = React.lazy(() => import('./pages/FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const ShopPage = React.lazy(() => import('./pages/ShopPage').then(m => ({ default: m.ShopPage })));
const WordDetailPage = React.lazy(() => import('./pages/WordDetailPage').then(m => ({ default: m.WordDetailPage })));
const WordScramblePage = React.lazy(() => import('./pages/WordScramblePage').then(m => ({ default: m.WordScramblePage })));
const FillBlankPage = React.lazy(() => import('./pages/FillBlankPage').then(m => ({ default: m.FillBlankPage })));

// Loading spinner for lazy loaded pages
const PageLoader: React.FC = () => (
  <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: 'var(--tg-bg)' }}>
    <div
      className="animate-spin h-8 w-8 border-3 rounded-full"
      style={{
        borderColor: 'var(--tg-hint)',
        borderTopColor: 'var(--tg-button)',
        borderWidth: '3px',
      }}
    />
  </div>
);

const AuthGate: React.FC = () => {
  const { user, isLoading, isSkipped } = useAuth();

  if (isLoading) {
    return (
      <div
        className="h-full w-full flex flex-col items-center justify-center"
        style={{ backgroundColor: 'var(--tg-bg)' }}
      >
        <div className="text-4xl mb-3">📚</div>
        <div
          className="animate-spin h-6 w-6 border-2 rounded-full"
          style={{
            borderColor: 'var(--tg-hint)',
            borderTopColor: 'var(--tg-button)',
          }}
        />
      </div>
    );
  }

  if (!user && !isSkipped) {
    return <LoginPage />;
  }

  return (
    <ProgressProvider>
      <MemoryRouter>
        <div className="h-full w-full flex flex-col" style={{ backgroundColor: 'var(--tg-bg)' }}>
          <div className="flex-1 overflow-hidden">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/book/:bookId" element={<BookPage />} />
                <Route path="/unit/:bookId/:unitId" element={<UnitPage />} />
                <Route path="/word/:bookId/:unitId/:wordIndex" element={<WordDetailPage />} />
                <Route path="/select/:mode" element={<SelectUnitPage />} />
                <Route path="/flashcards/:bookId/:unitId" element={<FlashcardsPage />} />
                <Route path="/quiz/:bookId/:unitId" element={<QuizPage />} />
                <Route path="/recall/:bookId/:unitId" element={<RecallPage />} />
                <Route path="/matching/:bookId/:unitId" element={<MatchingPage />} />
                <Route path="/multiple-choice/:bookId/:unitId" element={<MultipleChoicePage />} />
                <Route path="/scramble/:bookId/:unitId" element={<WordScramblePage />} />
                <Route path="/fill-blank/:bookId/:unitId" element={<FillBlankPage />} />
              </Routes>
            </Suspense>
          </div>
          <BottomNav />
        </div>
      </MemoryRouter>
    </ProgressProvider>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
