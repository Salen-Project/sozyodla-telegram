import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initTelegram } from './lib/telegram';
import './index.css';

// Initialize Telegram Mini App (safe)
try {
  initTelegram();
} catch (e) {
  console.warn('Telegram init failed:', e);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
