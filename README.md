# SB Props

A Super Bowl props quiz app where users submit predictions, compete on a live leaderboard, and admins manage questions and game state.

## Features

- **Authentication** – Email/password and Google sign-in via Firebase
- **Quiz** – Step-by-step prop questions with tiebreaker (Price is Right rules)
- **Leaderboard** – Live scoring, rankings, and answer breakdown
- **Admin** – Add/edit questions, set correct answers, control game start/end, set final score
- **Multi-year support** – Switch between different game years from the navbar

## Tech Stack

- React 18 + React Router 6
- Firebase (Auth + Firestore)
- HeroUI components
- Framer Motion
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

```bash
npm install
```

### Running the app

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production

```bash
npm run build
```

### Run tests

```bash
npm test
```

## Project Structure

```
src/
├── components/       # Reusable UI (Navbar, CustomRadio, auth)
├── containers/       # Page-level components
│   ├── Admin/        # Admin panel (questions, game controls)
│   ├── Authentication/
│   ├── Dashboard/    # User entries, leaderboard
│   └── Quiz/         # Props quiz flow
├── services/
│   └── firebase.js   # Firebase config and auth helpers
└── assets/
```

## Firebase Setup

The app uses Firebase Auth and Firestore. You'll need your own Firebase project and to replace the config in `src/services/firebase.js` with your credentials.

Firestore structure:

- `users` – User profiles (name, email, takenQuiz, isAdmin)
- `games/{year}` – Game doc (gameStatus, gameOver, finalScore)
  - `propQuestions` – Questions (prompt, choices, correctChoice, order)
  - `propEntries` – User submissions (responses, score, tiebreaker)
