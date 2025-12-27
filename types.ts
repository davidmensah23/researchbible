
export enum CitationStyle {
  APA = 'APA',
  MLA = 'MLA',
  IEEE = 'IEEE',
  CHICAGO = 'Chicago'
}

export enum Methodology {
  QUALITATIVE = 'Qualitative',
  QUANTITATIVE = 'Quantitative'
}

export type ResearchSectionType = 'Abstract' | 'BTHS' | 'QE' | 'Method' | 'References' | 'Questionnaire' | 'Analysis' | 'Draft';

export type ProjectStatus = 'Draft' | 'Published' | 'Archived';

export interface Project {
  id: string;
  title: string;
  theme: string;
  citationStyle: CitationStyle;
  methodology: Methodology;
  sections: Record<ResearchSectionType, string>;
  references: Paper[];
  status: ProjectStatus;
  updatedAt: string;
  sourceFile?: {
    name: string;
    type: string;
    data: string;
  };
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal: string;
  abstract: string;
  doi?: string;
}

export enum AppStep {
  LANDING,
  CONFIG,
  TOPIC_ARCHITECT,
  PROJECT_LIBRARY,
  DASHBOARD
}
