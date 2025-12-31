import { describe, it, expect } from 'vitest';
import { calculateRecommendation, validateAnswers, getAllQuestions } from '../src/scoring';
import { generateRecommendation } from '../src/recommendations';
import decisionModel from '../src/data/decision-model.v1.json';
import { DecisionModelSchema, type UserAnswers, type DecisionModel } from '../src/types';

describe('Decision Engine', () => {
  describe('Model Validation', () => {
    it('should have a valid decision model schema', () => {
      expect(() => DecisionModelSchema.parse(decisionModel)).not.toThrow();
    });

    it('should have all required question groups', () => {
      const model = decisionModel as DecisionModel;
      const groupIds = model.questionGroups.map((g) => g.id);

      expect(groupIds).toContain('outcome');
      expect(groupIds).toContain('audience');
      expect(groupIds).toContain('data');
      expect(groupIds).toContain('integration');
      expect(groupIds).toContain('governance');
      expect(groupIds).toContain('timeToValue');
      expect(groupIds).toContain('cost');
    });
  });

  describe('Scoring Logic', () => {
    const model = decisionModel as DecisionModel;

    it('should recommend M365 Copilot for productivity-focused scenario', () => {
      const answers: UserAnswers = {
        outcome_primary: 'outcome_productivity',
        outcome_tasks: 'tasks_assist',
        audience_who: 'audience_all_employees',
        audience_scale: 'scale_large',
        data_sources: 'data_m365',
        data_realtime: 'realtime_no',
        integration_complexity: 'integration_none',
        integration_channels: 'channels_m365',
        governance_needs: 'governance_basic',
        governance_lifecycle: 'lifecycle_no',
        ttv_urgency: 'urgency_immediate',
        ttv_skills: 'skills_none',
        cost_model: 'cost_per_user',
      };

      const result = calculateRecommendation(model, answers);

      expect(result.recommendation).toBe('M365_COPILOT');
      expect(result.scores.m365Copilot).toBeGreaterThan(result.scores.copilotStudio);
      expect(result.confidenceLevel).toBe('high');
    });

    it('should recommend Copilot Studio for custom agent scenario', () => {
      const answers: UserAnswers = {
        outcome_primary: 'outcome_custom_agent',
        outcome_tasks: 'tasks_action',
        audience_who: 'audience_customers',
        audience_scale: 'scale_medium',
        data_sources: 'data_lob',
        data_realtime: 'realtime_yes',
        integration_complexity: 'integration_custom',
        integration_channels: 'channels_web',
        governance_needs: 'governance_advanced',
        governance_lifecycle: 'lifecycle_yes',
        ttv_urgency: 'urgency_months',
        ttv_skills: 'skills_developer',
        cost_model: 'cost_usage',
      };

      const result = calculateRecommendation(model, answers);

      expect(result.recommendation).toBe('COPILOT_STUDIO');
      expect(result.scores.copilotStudio).toBeGreaterThan(result.scores.m365Copilot);
      expect(result.confidenceLevel).toBe('high');
    });

    it('should recommend Hybrid for mixed scenario', () => {
      const answers: UserAnswers = {
        outcome_primary: 'outcome_both',
        outcome_tasks: 'tasks_both',
        audience_who: 'audience_mixed',
        audience_scale: 'scale_large',
        data_sources: 'data_both',
        data_realtime: 'realtime_maybe',
        integration_complexity: 'integration_prebuilt',
        integration_channels: 'channels_multiple',
        governance_needs: 'governance_moderate',
        governance_lifecycle: 'lifecycle_no',
        ttv_urgency: 'urgency_weeks',
        ttv_skills: 'skills_lowcode',
        cost_model: 'cost_both',
      };

      const result = calculateRecommendation(model, answers);

      expect(result.recommendation).toBe('HYBRID');
      expect(result.scores.hybrid).toBeGreaterThanOrEqual(
        Math.max(result.scores.m365Copilot, result.scores.copilotStudio) - 10
      );
    });

    it('should recommend Hybrid when scores are close', () => {
      const answers: UserAnswers = {
        outcome_primary: 'outcome_productivity',
        outcome_tasks: 'tasks_assist',
        audience_who: 'audience_department',
        audience_scale: 'scale_medium',
        data_sources: 'data_lob',
        data_realtime: 'realtime_yes',
        integration_complexity: 'integration_prebuilt',
        integration_channels: 'channels_teams',
        governance_needs: 'governance_moderate',
        governance_lifecycle: 'lifecycle_no',
        ttv_urgency: 'urgency_weeks',
        ttv_skills: 'skills_lowcode',
        cost_model: 'cost_per_user',
      };

      const result = calculateRecommendation(model, answers);

      // With mixed signals, should recommend Hybrid
      expect(['HYBRID', 'COPILOT_STUDIO']).toContain(result.recommendation);
    });

    it('should handle "unsure" answers conservatively', () => {
      const answers: UserAnswers = {
        outcome_primary: 'outcome_unsure',
        outcome_tasks: 'tasks_unsure',
        audience_who: 'audience_unsure',
        audience_scale: 'scale_unsure',
        data_sources: 'data_unsure',
        data_realtime: 'realtime_unsure',
        integration_complexity: 'integration_unsure',
        integration_channels: 'channels_unsure',
        governance_needs: 'governance_unsure',
        governance_lifecycle: 'lifecycle_unsure',
        ttv_urgency: 'urgency_unsure',
        ttv_skills: 'skills_unsure',
        cost_model: 'cost_unsure',
      };

      const result = calculateRecommendation(model, answers);

      // All "unsure" should likely lead to Hybrid or low confidence
      expect(result.recommendation).toBeDefined();
      expect(['low', 'medium']).toContain(result.confidenceLevel);
    });

    it('should include breakdown for transparency', () => {
      const answers: UserAnswers = {
        outcome_primary: 'outcome_productivity',
        outcome_tasks: 'tasks_assist',
      };

      const result = calculateRecommendation(model, answers);

      expect(result.breakdown).toHaveLength(2);
      expect(result.breakdown[0]).toHaveProperty('questionId');
      expect(result.breakdown[0]).toHaveProperty('questionTitle');
      expect(result.breakdown[0]).toHaveProperty('answerId');
      expect(result.breakdown[0]).toHaveProperty('answerLabel');
      expect(result.breakdown[0]).toHaveProperty('weights');
    });

    it('should handle partial answers gracefully', () => {
      const answers: UserAnswers = {
        outcome_primary: 'outcome_productivity',
        // Only answer one question
      };

      const result = calculateRecommendation(model, answers);

      expect(result.recommendation).toBeDefined();
      expect(result.breakdown).toHaveLength(1);
    });

    it('should handle empty answers', () => {
      const answers: UserAnswers = {};

      const result = calculateRecommendation(model, answers);

      expect(result.recommendation).toBeDefined();
      expect(result.scores.m365Copilot).toBe(0);
      expect(result.scores.copilotStudio).toBe(0);
      expect(result.scores.hybrid).toBe(0);
    });
  });

  describe('Answer Validation', () => {
    const model = decisionModel as DecisionModel;

    it('should validate complete answers', () => {
      const allQuestions = getAllQuestions(model);
      const answers: UserAnswers = {};

      allQuestions.forEach((q) => {
        answers[q.id] = q.answers[0].id;
      });

      const validation = validateAnswers(model, answers);

      expect(validation.valid).toBe(true);
      expect(validation.missingQuestions).toHaveLength(0);
    });

    it('should detect missing answers', () => {
      const answers: UserAnswers = {
        outcome_primary: 'outcome_productivity',
      };

      const validation = validateAnswers(model, answers);

      expect(validation.valid).toBe(false);
      expect(validation.missingQuestions.length).toBeGreaterThan(0);
    });
  });

  describe('Recommendation Generation', () => {
    const model = decisionModel as DecisionModel;

    it('should generate M365 Copilot recommendation content', () => {
      const answers: UserAnswers = {
        outcome_primary: 'outcome_productivity',
        outcome_tasks: 'tasks_assist',
        audience_who: 'audience_all_employees',
        audience_scale: 'scale_large',
        data_sources: 'data_m365',
        data_realtime: 'realtime_no',
        integration_complexity: 'integration_none',
        integration_channels: 'channels_m365',
        governance_needs: 'governance_basic',
        governance_lifecycle: 'lifecycle_no',
        ttv_urgency: 'urgency_immediate',
        ttv_skills: 'skills_none',
        cost_model: 'cost_per_user',
      };

      const scoringResult = calculateRecommendation(model, answers);
      const recommendation = generateRecommendation(scoringResult);

      expect(recommendation.type).toBe('M365_COPILOT');
      expect(recommendation.title).toContain('Microsoft 365 Copilot');
      expect(recommendation.summary).toBeTruthy();
      expect(recommendation.reasons.length).toBeGreaterThan(0);
      expect(recommendation.nextSteps.length).toBeGreaterThan(0);
      expect(recommendation.risks.length).toBeGreaterThan(0);
      expect(recommendation.sources.length).toBeGreaterThan(0);
      expect(recommendation.scoringResult).toBe(scoringResult);
    });

    it('should generate Copilot Studio recommendation content', () => {
      const answers: UserAnswers = {
        outcome_primary: 'outcome_custom_agent',
        outcome_tasks: 'tasks_action',
        audience_who: 'audience_customers',
        audience_scale: 'scale_medium',
        data_sources: 'data_lob',
        data_realtime: 'realtime_yes',
        integration_complexity: 'integration_custom',
        integration_channels: 'channels_web',
        governance_needs: 'governance_advanced',
        governance_lifecycle: 'lifecycle_yes',
        ttv_urgency: 'urgency_months',
        ttv_skills: 'skills_developer',
        cost_model: 'cost_usage',
      };

      const scoringResult = calculateRecommendation(model, answers);
      const recommendation = generateRecommendation(scoringResult);

      expect(recommendation.type).toBe('COPILOT_STUDIO');
      expect(recommendation.title).toContain('Copilot Studio');
      expect(recommendation.nextSteps.length).toBeGreaterThan(0);
      expect(recommendation.risks.length).toBeGreaterThan(0);
    });

    it('should generate Hybrid recommendation content', () => {
      const answers: UserAnswers = {
        outcome_primary: 'outcome_both',
        outcome_tasks: 'tasks_both',
        audience_who: 'audience_mixed',
        audience_scale: 'scale_large',
        data_sources: 'data_both',
        data_realtime: 'realtime_maybe',
        integration_complexity: 'integration_prebuilt',
        integration_channels: 'channels_multiple',
        governance_needs: 'governance_moderate',
        governance_lifecycle: 'lifecycle_no',
        ttv_urgency: 'urgency_weeks',
        ttv_skills: 'skills_lowcode',
        cost_model: 'cost_both',
      };

      const scoringResult = calculateRecommendation(model, answers);
      const recommendation = generateRecommendation(scoringResult);

      expect(recommendation.type).toBe('HYBRID');
      expect(recommendation.title).toContain('Hybrid');
      expect(recommendation.summary).toContain('Microsoft 365 Copilot');
      expect(recommendation.summary).toContain('Copilot Studio');
    });

    it('should include valid Microsoft Learn source URLs', () => {
      const answers: UserAnswers = {
        outcome_primary: 'outcome_productivity',
        outcome_tasks: 'tasks_assist',
        audience_who: 'audience_all_employees',
        audience_scale: 'scale_large',
        data_sources: 'data_m365',
        data_realtime: 'realtime_no',
        integration_complexity: 'integration_none',
        integration_channels: 'channels_m365',
        governance_needs: 'governance_basic',
        governance_lifecycle: 'lifecycle_no',
        ttv_urgency: 'urgency_immediate',
        ttv_skills: 'skills_none',
        cost_model: 'cost_per_user',
      };

      const scoringResult = calculateRecommendation(model, answers);
      const recommendation = generateRecommendation(scoringResult);

      recommendation.sources.forEach((source) => {
        expect(source.title).toBeTruthy();
        expect(source.url).toMatch(/^https:\/\/learn\.microsoft\.com/);
      });
    });
  });

  describe('Edge Cases', () => {
    const model = decisionModel as DecisionModel;

    it('should handle invalid answer IDs gracefully', () => {
      const answers: UserAnswers = {
        outcome_primary: 'invalid_answer_id',
        outcome_tasks: 'tasks_assist',
      };

      const result = calculateRecommendation(model, answers);

      expect(result.recommendation).toBeDefined();
      expect(result.breakdown.length).toBe(1); // Only valid answer counted
    });

    it('should maintain deterministic results for same inputs', () => {
      const answers: UserAnswers = {
        outcome_primary: 'outcome_productivity',
        outcome_tasks: 'tasks_assist',
        audience_who: 'audience_all_employees',
      };

      const result1 = calculateRecommendation(model, answers);
      const result2 = calculateRecommendation(model, answers);

      expect(result1.recommendation).toBe(result2.recommendation);
      expect(result1.scores).toEqual(result2.scores);
      expect(result1.confidenceLevel).toBe(result2.confidenceLevel);
    });

    it('should handle questions with no selected answer', () => {
      const answers: UserAnswers = {
        outcome_primary: '', // Empty string
      };

      const result = calculateRecommendation(model, answers);

      expect(result.breakdown).toHaveLength(0);
    });
  });
});
