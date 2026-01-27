import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ProgressProvider } from './contexts/ProgressContext';
import { HomePage } from './pages/HomePage';
import { BookPage } from './pages/BookPage';
import { UnitPage } from './pages/UnitPage';
import { SelectUnitPage } from './pages/SelectUnitPage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { QuizPage } from './pages/QuizPage';
import { RecallPage } from './pages/RecallPage';

const App: React.FC = () => {
  return (
    <ProgressProvider>
      <HashRouter>
        <div className="h-full w-full" style={{ backgroundColor: 'var(--tg-bg)' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/book/:bookId" element={<BookPage />} />
            <Route path="/unit/:bookId/:unitId" element={<UnitPage />} />
            <Route path="/select/:mode" element={<SelectUnitPage />} />
            <Route path="/flashcards/:bookId/:unitId" element={<FlashcardsPage />} />
            <Route path="/quiz/:bookId/:unitId" element={<QuizPage />} />
            <Route path="/recall/:bookId/:unitId" element={<RecallPage />} />
          </Routes>
        </div>
      </HashRouter>
    </ProgressProvider>
  );
};

export default App;
