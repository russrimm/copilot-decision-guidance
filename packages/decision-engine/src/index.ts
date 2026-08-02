export * from './types.js';
export * from './scoring.js';
export * from './recommendations.js';

// Load decision model
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach((nested) => deepFreeze(nested));
  }
  return value;
}

const modelPath = join(__dirname, 'data', 'decision-model.v1.json');
export const decisionModel = deepFreeze(JSON.parse(readFileSync(modelPath, 'utf-8')));
