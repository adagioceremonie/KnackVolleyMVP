import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// Persistent storage for page views per match
const DATA_DIR = path.join(process.cwd(), 'data');
const PAGEVIEWS_FILE = path.join(DATA_DIR, 'pageviews.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.error('Failed to create data dir', e);
  }
}

function loadPageViews(): Record<string, number> {
  try {
    ensureDataDir();
    if (fs.existsSync(PAGEVIEWS_FILE)) {
      const content = fs.readFileSync(PAGEVIEWS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading pageviews file', err);
  }
  return {};
}

function savePageViews(data: Record<string, number>) {
  try {
    ensureDataDir();
    fs.writeFileSync(PAGEVIEWS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving pageviews file', err);
  }
}

let pageViewsMap = loadPageViews();

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    team: 'Knack Volley Roeselare',
    season: '2026-2027',
  });
});

app.get('/api/pageviews/:matchId', (req, res) => {
  const { matchId } = req.params;
  const count = pageViewsMap[matchId] || 0;
  res.json({ matchId, count });
});

app.post('/api/pageviews/:matchId/increment', (req, res) => {
  const { matchId } = req.params;
  pageViewsMap[matchId] = (pageViewsMap[matchId] || 0) + 1;
  savePageViews(pageViewsMap);
  res.json({ matchId, count: pageViewsMap[matchId] });
});

app.post('/api/pageviews/:matchId/reset', (req, res) => {
  const { matchId } = req.params;
  pageViewsMap[matchId] = 0;
  savePageViews(pageViewsMap);
  res.json({ matchId, count: 0 });
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
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Knack Volley MVP Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
