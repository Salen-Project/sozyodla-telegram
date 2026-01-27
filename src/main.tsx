import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initTelegram } from './lib/telegram';
import './index.css';

// Initialize Telegram Mini App
initTelegram();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
