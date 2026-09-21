import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent leaderboard data file path
const DATA_DIR = path.join(process.cwd(), 'data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  stage: number;
  bossesDefeated: number;
  date: string;
}

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', name: 'CYBER_ACE', score: 98500, stage: 5, bossesDefeated: 4, date: '2026-03-15' },
  { id: '2', name: 'NEO_PADDLE', score: 84200, stage: 4, bossesDefeated: 3, date: '2026-03-16' },
  { id: '3', name: 'VOID_BREAKER', score: 71900, stage: 4, bossesDefeated: 3, date: '2026-03-18' },
  { id: '4', name: 'NOVA_PILOT', score: 58400, stage: 3, bossesDefeated: 2, date: '2026-03-19' },
  { id: '5', name: 'PIXEL_GOD', score: 49800, stage: 3, bossesDefeated: 2, date: '2026-03-20' },
  { id: '6', name: 'RETRO_RUNNER', score: 38200, stage: 2, bossesDefeated: 1, date: '2026-03-20' },
  { id: '7', name: 'STAR_STRIKER', score: 27500, stage: 2, bossesDefeated: 1, date: '2026-03-21' },
  { id: '8', name: 'BRICK_BARON', score: 19400, stage: 1, bossesDefeated: 0, date: '2026-03-21' }
];

function loadLeaderboard(): LeaderboardEntry[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const raw = fs.readFileSync(LEADERBOARD_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(DEFAULT_LEADERBOARD, null, 2), 'utf-8');
    return DEFAULT_LEADERBOARD;
  } catch (err) {
    console.error('Error loading leaderboard:', err);
    return DEFAULT_LEADERBOARD;
  }
}

function saveLeaderboard(entries: LeaderboardEntry[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving leaderboard:', err);
  }
}

let leaderboardCache = loadLeaderboard();

// Leaderboard API Endpoints
app.get('/api/leaderboard', (req, res) => {
  const sorted = [...leaderboardCache].sort((a, b) => b.score - a.score).slice(0, 50);
  res.json({
    success: true,
    entries: sorted
  });
});

app.post('/api/leaderboard', (req, res) => {
  const { name, score, stage, bossesDefeated } = req.body;

  if (!name || typeof score !== 'number' || score < 0) {
    return res.status(400).json({ success: false, error: 'Invalid entry parameters' });
  }

  const cleanName = String(name).trim().slice(0, 16) || 'ANONYMOUS';
  const newEntry: LeaderboardEntry = {
    id: 'score_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    name: cleanName.toUpperCase(),
    score: Math.floor(score),
    stage: Number(stage) || 1,
    bossesDefeated: Number(bossesDefeated) || 0,
    date: new Date().toISOString().split('T')[0]
  };

  leaderboardCache.push(newEntry);
  leaderboardCache.sort((a, b) => b.score - a.score);
  // Keep top 100
  leaderboardCache = leaderboardCache.slice(0, 100);
  saveLeaderboard(leaderboardCache);

  const rank = leaderboardCache.findIndex(e => e.id === newEntry.id) + 1;

  res.json({
    success: true,
    entry: newEntry,
    rank,
    topEntries: leaderboardCache.slice(0, 20)
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Brick Breaker server running on http://localhost:${PORT}`);
  });
}

startServer();
