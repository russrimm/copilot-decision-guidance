/**
 * Production Server (ES Modules - No TypeScript Transpilation Needed)
 * This is a compiled JavaScript version that doesn't require tsx
 * Integrates frontend serving and API routes in a single process
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ES Module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Dynamic import of decision engine (handles TypeScript via package exports)
let decisionModel, calculateRecommendation, explainRecommendation, getVerifiedSources;

async function loadDecisionEngine() {
  try {
    const engine = await import('@copilot-guidance/decision-engine');
    decisionModel = engine.decisionModel;
    calculateRecommendation = engine.calculateRecommendation;
    explainRecommendation = engine.explainRecommendation;

    console.log('✅ Decision engine loaded successfully');
    console.log(`📊 Decision model v${decisionModel.metadata.version}`);
  } catch (error) {
    console.error('❌ Failed to load decision engine:', error);
    process.exit(1);
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    model: decisionModel?.metadata || null,
  });
});

// Get decision model
app.get('/api/model', (req, res) => {
  try {
    res.json(decisionModel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load decision model' });
  }
});

// Calculate recommendation
app.post('/api/score', async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers) {
      return res.status(400).json({ error: 'Missing answers in request body' });
    }

    const result = calculateRecommendation(decisionModel, answers);
    res.json(result);
  } catch (error) {
    console.error('Error calculating recommendation:', error);
    res.status(500).json({ error: 'Failed to calculate recommendation' });
  }
});

// Get AI explanation (if enabled)
app.post('/api/explain', async (req, res) => {
  try {
    const { recommendation, answers } = req.body;

    if (!recommendation) {
      return res.status(400).json({ error: 'Missing recommendation in request body' });
    }

    const result = await explainRecommendation(recommendation, answers);
    res.json(result);
  } catch (error) {
    console.error('Error generating explanation:', error);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
});

// Get verified sources
app.get('/api/sources', (req, res) => {
  try {
    // Sources are embedded in the model metadata
    const sources = decisionModel.metadata?.sources || [];
    res.json({ sources });
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

// Serve static frontend files
const frontendPath = join(__dirname, 'apps', 'web', 'dist');
app.use(express.static(frontendPath));

// React Router fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(frontendPath, 'index.html'));
});

// Start server after loading decision engine
loadDecisionEngine()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`   http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
