import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  calculateRecommendation,
  generateRecommendation,
  decisionModel,
  UserAnswersSchema,
} from '@copilot-guidance/decision-engine';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get decision model
app.get('/api/model', (_req, res) => {
  res.json(decisionModel);
});

// Calculate score and recommendation
app.post('/api/score', (req, res) => {
  try {
    const userAnswers = UserAnswersSchema.parse(req.body.answers);
    const scoringResult = calculateRecommendation(decisionModel, userAnswers);
    const recommendation = generateRecommendation(scoringResult);
    res.json({ recommendation, scoringResult });
  } catch (error) {
    console.error('Error calculating score:', error);
    res.status(400).json({
      error: 'Invalid request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get AI explanation (stub - deterministic for now)
app.post('/api/explain', async (req, res) => {
  try {
    // For production without AI, return the deterministic recommendation
    const userAnswers = UserAnswersSchema.parse(req.body.answers);
    const scoringResult = calculateRecommendation(decisionModel, userAnswers);
    const recommendation = generateRecommendation(scoringResult);
    res.json({ recommendation });
  } catch (error) {
    console.error('Error generating explanation:', error);
    res.status(500).json({
      error: 'Failed to generate explanation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get sources
app.get('/api/sources', (_req, res) => {
  try {
    // Return verified sources from the model metadata
    const sources = decisionModel.metadata?.sources || [];
    res.json({ sources });
  } catch (error) {
    console.error('Sources error:', error);
    res.status(500).json({ error: 'Failed to get sources' });
  }
});

// Serve static files from React build
const staticPath = join(__dirname, 'apps/web/dist');
app.use(express.static(staticPath));

// Handle React routing - send all other requests to index.html
app.get('*', (req, res) => {
  res.sendFile(join(staticPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Decision model v${decisionModel.version}`);
  console.log(`   http://localhost:${PORT}`);
});

export default app;
