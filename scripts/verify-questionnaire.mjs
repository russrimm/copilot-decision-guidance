#!/usr/bin/env node
/**
 * Verification script for decision model questionnaire
 * Tests that all questions have complete 5-platform weights and validates structure
 */

import { decisionModel } from '../packages/decision-engine/dist/index.js';

console.log('🔍 Decision Model Verification\n');
console.log(`Version: ${decisionModel.version}`);
console.log(`Last Updated: ${decisionModel.metadata.lastUpdated}`);
console.log(`Description: ${decisionModel.metadata.description}\n`);

let totalQuestions = 0;
let totalAnswers = 0;
let missingWeights = 0;
const platforms = ['m365Copilot', 'copilotStudio', 'foundry', 'agentBuilder', 'hybrid'];

console.log('📊 Questionnaire Structure:\n');

decisionModel.questionGroups.forEach((group) => {
  console.log(`\n📁 ${group.title} (${group.id})`);
  console.log(`   ${group.description}`);

  group.questions.forEach((question) => {
    totalQuestions++;
    console.log(`\n   ❓ ${question.title}`);
    console.log(`      ID: ${question.id}`);
    console.log(`      Answers: ${question.answers.length}`);

    question.answers.forEach((answer) => {
      totalAnswers++;
      const weights = answer.weights || {};
      const missingPlatforms = platforms.filter((p) => !(p in weights));

      if (missingPlatforms.length > 0) {
        missingWeights++;
        console.log(`      ⚠️  ${answer.id}: Missing ${missingPlatforms.join(', ')}`);
      }
    });
  });
});

console.log('\n\n📈 Summary:\n');
console.log(`✅ Question Groups: ${decisionModel.questionGroups.length}`);
console.log(`✅ Total Questions: ${totalQuestions}`);
console.log(`✅ Total Answers: ${totalAnswers}`);
console.log(`✅ Required Platforms: ${platforms.length} (${platforms.join(', ')})`);

if (missingWeights === 0) {
  console.log('\n✅ ✅ ✅ ALL ANSWERS HAVE COMPLETE 5-PLATFORM WEIGHTS! ✅ ✅ ✅\n');
} else {
  console.log(`\n⚠️  ${missingWeights} answers are missing platform weights\n`);
  process.exit(1);
}

// Validate evaluation criteria coverage
console.log('📋 Evaluation Criteria Coverage:\n');

const criteria = {
  'Technical Complexity': [
    'outcome_development',
    'outcome_tasks',
    'data_sources',
    'integration_complexity',
    'ttv_ai_requirements',
  ],
  'Skills & Resources': ['ttv_skills'],
  'Budget Assessment': ['cost_budget'],
  'Time to Production': ['ttv_urgency'],
  'Governance & Compliance': [
    'governance_needs',
    'governance_dataresidency',
    'governance_lifecycle',
  ],
  'Action Safety': ['data_actions', 'data_proactive'],
  'Memory & Analytics': ['cost_memory'],
  'Scale & Performance': ['audience_scale', 'cost_performance'],
};

let totalCovered = 0;
let totalMissing = 0;

Object.entries(criteria).forEach(([criterion, questionIds]) => {
  let found = 0;
  let missing = [];

  questionIds.forEach((qId) => {
    const exists = decisionModel.questionGroups.some((g) => g.questions.some((q) => q.id === qId));
    if (exists) {
      found++;
      totalCovered++;
    } else {
      missing.push(qId);
      totalMissing++;
    }
  });

  if (missing.length === 0) {
    console.log(`✅ ${criterion}: ${found}/${questionIds.length} questions covered`);
  } else {
    console.log(
      `⚠️  ${criterion}: ${found}/${questionIds.length} questions covered (Missing: ${missing.join(', ')})`
    );
  }
});

console.log(
  `\n✅ Framework Alignment: ${totalCovered}/${totalCovered + totalMissing} questions (${Math.round((totalCovered / (totalCovered + totalMissing)) * 100)}%)\n`
);

if (totalMissing === 0) {
  console.log('🎉 All evaluation criteria from Microsoft AI Decision Framework are covered!\n');
} else {
  console.log(`⚠️  ${totalMissing} evaluation criteria questions are missing\n`);
}

console.log('✅ Verification complete!\n');
