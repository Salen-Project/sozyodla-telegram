// Use global Telegram WebApp from the CDN script in index.html
const WebApp = (window as any).Telegram?.WebApp;

// Initialize Telegram Web App
export const tg = WebApp;

export const initTelegram = () => {
  try {
    tg.ready();
    tg.expand();
    // Enable closing confirmation for unsaved data
    tg.enableClosingConfirmation();
    // Set header color to match theme
    tg.setHeaderColor('secondary_bg_color');
    tg.setBackgroundColor('bg_color');
  } catch (e) {
    console.warn('Telegram WebApp not available:', e);
  }
};

export const haptic = {
  impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
    try {
      tg.HapticFeedback.impactOccurred(style);
    } catch {}
  },
  notification: (type: 'error' | 'success' | 'warning') => {
    try {
      tg.HapticFeedback.notificationOccurred(type);
    } catch {}
  },
  selection: () => {
    try {
      tg.HapticFeedback.selectionChanged();
    } catch {}
  },
};

export const showMainButton = (text: string, onClick: () => void) => {
  try {
    tg.MainButton.setText(text);
    tg.MainButton.onClick(onClick);
    tg.MainButton.show();
  } catch {}
};

export const hideMainButton = () => {
  try {
    tg.MainButton.hide();
    tg.MainButton.offClick(() => {});
  } catch {}
};

export const showBackButton = (onClick: () => void) => {
  try {
    tg.BackButton.onClick(onClick);
    tg.BackButton.show();
  } catch {}
};

export const hideBackButton = () => {
  try {
    tg.BackButton.hide();
    tg.BackButton.offClick(() => {});
  } catch {}
};

export const getTelegramUser = () => {
  try {
    return tg.initDataUnsafe?.user || null;
  } catch {
    return null;
  }
};

export const getInitData = () => {
  try {
    return tg.initData || '';
  } catch {
    return '';
  }
};

export const closeMiniApp = () => {
  try {
    tg.close();
  } catch {}
};
