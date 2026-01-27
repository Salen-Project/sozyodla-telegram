# SOZYOLA Telegram Mini App 📚

A Telegram Mini App for learning vocabulary through flashcards, quizzes, and word recall exercises. Built for the Telegram Bot platform using the Web App API.

## Features

- 🃏 **Flashcards** — Swipe-based card viewer with flip animation, pronunciation, and favorites
- 🧠 **Multiple Choice Quiz** — Test vocabulary knowledge with 4-option questions
- ✍️ **Word Recall** — Type-the-answer exercise with reveal option
- 📊 **Progress Tracking** — Per-unit scores, words learned counter
- 🔥 **Daily Streak** — Consecutive day tracking
- 📱 **Telegram-Native UI** — Uses theme colors, BackButton, HapticFeedback

## Stack

- React 18 + TypeScript
- Vite 7
- Tailwind CSS 4
- Framer Motion (animations, swipe gestures)
- @twa-dev/sdk (Telegram Web App integration)
- @supabase/supabase-js (optional backend)

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── FlashCard.tsx  # Swipeable flashcard with flip
│   ├── QuizOption.tsx # Quiz answer option
│   ├── ProgressBar.tsx
│   └── StreakBadge.tsx
├── pages/             # Route pages
│   ├── HomePage.tsx   # Dashboard with stats, modes, books
│   ├── BookPage.tsx   # Unit list for a book
│   ├── UnitPage.tsx   # Exercise mode selector
│   ├── SelectUnitPage.tsx
│   ├── FlashcardsPage.tsx
│   ├── QuizPage.tsx
│   └── RecallPage.tsx
├── contexts/          # React context providers
├── hooks/             # Custom hooks (progress management)
├── lib/               # Telegram SDK wrapper, Supabase client
├── data/              # Vocabulary data (7 books, 120+ units)
└── types/             # TypeScript interfaces
```

## Setup

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Deployment as Telegram Mini App

1. **Build** the app: `npm run build`
2. **Deploy** the `dist/` folder to a static hosting service (Vercel, Netlify, GitHub Pages, etc.) with HTTPS
3. **Create a Telegram Bot** via [@BotFather](https://t.me/BotFather)
4. **Set the Web App URL**:
   ```
   /setmenubutton
   → Select your bot
   → Enter the URL: https://your-domain.com
   → Enter button text: Open SOZYOLA
   ```
   Or use the Bot API:
   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setChatMenuButton" \
     -H "Content-Type: application/json" \
     -d '{"menu_button": {"type": "web_app", "text": "📚 SOZYOLA", "web_app": {"url": "https://your-domain.com"}}}'
   ```

## Telegram Features Used

| Feature | Usage |
|---------|-------|
| Theme colors | `var(--tg-theme-*)` CSS variables for native look |
| BackButton | Navigation back through pages |
| HapticFeedback | Correct/incorrect answers, card swipes |
| `WebApp.ready()` | App initialization signal |
| `WebApp.expand()` | Full-height expansion |

## Data

Includes vocabulary from 7 books:
- 4000 Essential English Words (Books 1-6)
- The College Panda's 400 SAT Words

Each word includes: English word, Uzbek translation, Russian translation, definition, example sentence, part of speech.

## License

Private — SOZYOLA
