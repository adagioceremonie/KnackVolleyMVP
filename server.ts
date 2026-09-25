import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Google Cloud Run automatically passes PORT=8080.
// In local/dev environments without PORT, default to 3000.
const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || (isProduction ? '8080' : '3000'), 10);

app.use(express.json());

// Public static assets
const publicPath = path.join(process.cwd(), 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// Persistent storage for page views per match
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
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

// Health check endpoints for Google Cloud Run (probes & load balancer health checks)
app.get(['/healthz', '/livez', '/readyz', '/api/health'], (_req, res) => {
  res.status(200).json({
    status: 'ok',
    team: 'Knack Volley Roeselare MVP Voting',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// API routes
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
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.setHeader('Cache-Control', 'no-cache');
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application build not found. Run npm run build.');
      }
    });
  }

  // Bind to 0.0.0.0 - required by Google Cloud Run
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Knack Volley MVP Server running on http://0.0.0.0:${PORT} [${isProduction ? 'production' : 'development'}]`);
  });

  // Graceful shutdown handling for Cloud Run container lifecycle (SIGTERM/SIGINT)
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Shutting down HTTP server gracefully...`);
    server.close(() => {
      console.log('HTTP server terminated cleanly.');
      process.exit(0);
    });

    // Force terminate after 10s if connections fail to close
    setTimeout(() => {
      console.error('Shutdown timeout expired, forcing process exit.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
