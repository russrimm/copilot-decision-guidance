export type LaunchpadModuleId = 'mindset' | 'discover' | 'build' | 'share';

export interface LaunchpadProgress {
  completedModules: Record<LaunchpadModuleId, boolean>;
  quizPassed: Record<LaunchpadModuleId, boolean>;
  feedbackSubmissions: number;
}

const STORAGE_KEY = 'agentic-portal:launchpad-progress:v1';

const defaultProgress: LaunchpadProgress = {
  completedModules: { mindset: false, discover: false, build: false, share: false },
  quizPassed: { mindset: false, discover: false, build: false, share: false },
  feedbackSubmissions: 0,
};

export function loadLaunchpadProgress(): LaunchpadProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress;
    const parsed = JSON.parse(raw) as Partial<LaunchpadProgress>;
    return {
      completedModules: { ...defaultProgress.completedModules, ...parsed.completedModules },
      quizPassed: { ...defaultProgress.quizPassed, ...parsed.quizPassed },
      feedbackSubmissions: parsed.feedbackSubmissions ?? defaultProgress.feedbackSubmissions,
    };
  } catch {
    return defaultProgress;
  }
}

export function saveLaunchpadProgress(progress: LaunchpadProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function markModuleCompleted(moduleId: LaunchpadModuleId) {
  const progress = loadLaunchpadProgress();
  progress.completedModules[moduleId] = true;
  saveLaunchpadProgress(progress);
  return progress;
}

export function markQuizPassed(moduleId: LaunchpadModuleId) {
  const progress = loadLaunchpadProgress();
  progress.quizPassed[moduleId] = true;
  saveLaunchpadProgress(progress);
  return progress;
}

export function incrementFeedbackCount() {
  const progress = loadLaunchpadProgress();
  progress.feedbackSubmissions += 1;
  saveLaunchpadProgress(progress);
  return progress;
}

export function getLaunchpadCompletionPercent(progress: LaunchpadProgress): number {
  const total = Object.keys(progress.completedModules).length;
  const done = Object.values(progress.completedModules).filter(Boolean).length;
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export function getEarnedBadges(progress: LaunchpadProgress): string[] {
  const badges: string[] = [];

  if (progress.quizPassed.mindset) badges.push('AI Mindset Explorer');
  if (progress.quizPassed.discover) badges.push('Agent Spotter');
  if (progress.quizPassed.build) badges.push('Agent Builder');
  if (progress.quizPassed.share) badges.push('Best Practice Sharer');

  const allCompleted = Object.values(progress.completedModules).every(Boolean);
  if (allCompleted) badges.push('Launchpad Graduate');

  if (progress.feedbackSubmissions >= 1) badges.push('Community Contributor');

  return badges;
}
