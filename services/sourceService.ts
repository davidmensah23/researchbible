
import { Paper, CitationStyle } from "../types";

const MOCK_PAPERS: Paper[] = [
  {
    id: "1",
    title: "The Impact of Artificial Intelligence on Higher Education: A Systematic Review",
    authors: ["Zhang, L.", "Miller, K."],
    year: 2023,
    journal: "Journal of Educational Technology",
    abstract: "This paper explores the various applications of AI in university settings, focusing on personalized learning pathways and administrative automation.",
    doi: "10.1016/jet.2023.04.001"
  },
  {
    id: "2",
    title: "Sustainable Urban Design and Public Health: Qualitative Perspectives",
    authors: ["Smith, J.", "Doe, A."],
    year: 2022,
    journal: "Urban Planning & Health",
    abstract: "A deep dive into how green spaces influence the psychological well-being of residents in high-density urban environments.",
    doi: "10.1111/uph.2022.09.015"
  },
  {
    id: "3",
    title: "Quantum Computing Algorithms for Large-Scale Data Optimization",
    authors: ["Venkatesh, R.", "Tanaka, H."],
    year: 2024,
    journal: "Computational Science Quarterly",
    abstract: "An analysis of Shor's algorithm and its variations in solving complex logistical problems in real-time environments.",
    doi: "10.1088/csq.2024.01.002"
  },
  {
    id: "4",
    title: "Neuroplasticity and Language Acquisition in Adult Learners",
    authors: ["Garcia, M.", "Leclerc, F."],
    year: 2021,
    journal: "Cognitive Neuroscience Today",
    abstract: "Examining the physiological changes in the brain when learning a second language after the critical period of development.",
    doi: "10.1037/cnt.2021.11.004"
  },
  {
    id: "5",
    title: "Ethical Implications of Genetic Engineering in Modern Agriculture",
    authors: ["O'Sullivan, D.", "Kumar, S."],
    year: 2023,
    journal: "Applied Bioethics",
    abstract: "A critical review of the socioeconomic and ecological impacts of CRISPR technology in crop modification.",
    doi: "10.1007/ab.2023.05.012"
  }
];

export const searchPapers = async (query: string): Promise<Paper[]> => {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 800));
  return MOCK_PAPERS.filter(p => 
    p.title.toLowerCase().includes(query.toLowerCase()) || 
    p.abstract.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);
};

export const formatCitation = (paper: Paper, style: CitationStyle): string => {
  const authorsStr = paper.authors.join(", ");
  switch (style) {
    case CitationStyle.APA:
      return `${authorsStr} (${paper.year}). ${paper.title}. ${paper.journal}. DOI: ${paper.doi}`;
    case CitationStyle.MLA:
      return `${authorsStr}. "${paper.title}." ${paper.journal}, vol. 1, no. 1, ${paper.year}.`;
    case CitationStyle.IEEE:
      return `[1] ${authorsStr}, "${paper.title}," ${paper.journal}, pp. 1-10, ${paper.year}.`;
    case CitationStyle.CHICAGO:
      return `${authorsStr}. "${paper.title}." ${paper.journal} (${paper.year}).`;
    default:
      return `${authorsStr}. ${paper.title}. ${paper.year}.`;
  }
};

export const formatInTextCitation = (paper: Paper, style: CitationStyle, index: number = 1): string => {
  // Extract last name from the first author
  const firstAuthor = paper.authors[0] || "Unknown";
  const lastName = firstAuthor.includes(',') 
    ? firstAuthor.split(',')[0].trim() 
    : firstAuthor.split(' ').pop() || "Author";

  switch (style) {
    case CitationStyle.APA:
      return `(${lastName}, ${paper.year})`;
    case CitationStyle.MLA:
      return `(${lastName})`;
    case CitationStyle.IEEE:
      return `[${index}]`;
    case CitationStyle.CHICAGO:
      return `(${lastName} ${paper.year})`;
    default:
      return `(${lastName}, ${paper.year})`;
  }
};
