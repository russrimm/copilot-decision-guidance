export interface UseCase {
  id: string;
  title: string;
  description: string;
  vertical: 'oil' | 'gas' | 'energy';
  departments: string[];
  dataSources: string[];
  agentArchitecture: {
    name: string;
    overview: string;
    components: string[];
    dataFlow: string;
  };
  implementation: {
    phase1: string[];
    phase2: string[];
    phase3: string[];
    estimatedTimelineWeeks: number;
    skillsRequired: string[];
  };
  roi: {
    timeSavingsPercentage: number;
    costReductionPercentage: number;
    productivityGainPercentage: number;
    paybackPeriodMonths: number;
    estimatedAnnualValue: string;
  };
}
