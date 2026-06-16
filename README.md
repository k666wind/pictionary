# 🎨 Pictionary PWA 畫畫猜猜

A free, offline-capable Pictionary party game PWA for kids and families.  
Players read a word on screen, draw it on paper, and teammates guess!

**Live Demo:** `https://<your-username>.github.io/pictionary-pwa/`

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🎮 Local Multiplayer | Pass & Play — up to 6 teams on one device |
| 🌏 Bilingual | Chinese + English words shown together |
| 📚 175+ Words | 7 built-in categories, 25 words each |
| ⭐ Custom Banks | Add your own words in-app; export/import as JSON |
| ⏱ Timer | 60 / 90 / 120 sec countdown with danger pulse |
| 🔊 Sound Effects | Web Audio API — no external files needed |
| 📳 Vibration | Haptic feedback at key moments |
| 🎉 Confetti | Canvas confetti on correct guesses & game over |
| 🏆 Leaderboard | Persistent score history via localStorage |
| 📲 PWA | Installable, fully offline via Service Worker |

---

## 🚀 Deploy to GitHub Pages

### 1. Create GitHub repo

```bash
git init
git remote add origin https://github.com/<username>/pictionary-pwa.git
```

### 2. Enable GitHub Pages

Go to **Settings → Pages → Source → GitHub Actions**

### 3. Push to main

```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically:
1. Type-check with `tsc --noEmit`
2. Build with Vite
3. Deploy `dist/` to GitHub Pages

Your app will be live at:  
`https://<username>.github.io/pictionary-pwa/`

---

## 🛠 Local Development

```bash
npm install
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Type-check + production build
npm run preview    # Preview production build locally
```

**Requirements:** Node.js 18+

---

## 📁 Project Structure

```
src/
├── components/
│   ├── screens/          # Full-page screens (Home, Setup, Timer, etc.)
│   └── ui/               # Reusable components (Confetti, ProgressBar, etc.)
├── store/
│   └── gameStore.ts      # Zustand store — all game logic
├── data/
│   └── wordBanks.ts      # Built-in word banks (175 words)
├── types/
│   └── index.ts          # TypeScript interfaces
└── utils/
    ├── audio.ts           # Web Audio API sound engine
    ├── game.ts            # Shuffle, filter, helpers
    ├── storage.ts         # localStorage + JSON export/import
    └── usePwaInstall.ts   # PWA install prompt hook
```

---

## 📚 Word Bank JSON Format

Custom word banks use this format for import/export:

```json
{
  "version": 1,
  "exportedAt": "2026-06-15T00:00:00.000Z",
  "banks": [
    {
      "id": "my-bank",
      "name": { "zh": "我嘅題目", "en": "My Words" },
      "isCustom": true,
      "words": [
        {
          "id": "w001",
          "zh": "貓咪",
          "en": "Cat",
          "difficulty": "easy",
          "category": "custom"
        }
      ]
    }
  ]
}
```

---

## 🗺 Roadmap

- [x] Phase 1A — Core game flow (Setup → Play → Results)
- [x] Phase 1B — Sound, vibration, Service Worker, Settings
- [x] Phase 1C — JSON export/import, exit confirm, 175 words, progress bar
- [x] Phase 1D — Home animations, PWA install banner, UI polish
- [ ] Phase 2 — Online multiplayer (PartyKit)

---

## 🧰 Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Zustand | 4 | State management |
| Vite | 5 | Build tool |
| vite-plugin-pwa | 1.3 | Service Worker + manifest |
| GitHub Pages | — | Hosting |
| GitHub Actions | — | CI/CD |

---

## 📄 License

MIT — free to use, modify, and share.
