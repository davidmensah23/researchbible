
import { GoogleGenAI, Type } from "@google/genai";
import { Methodology, ResearchSectionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const suggestTopics = async (theme: string): Promise<string[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Suggest 5 specific, high-level academic research titles based on this theme: "${theme}". 
    The titles must be professional, academic, and ready for publication. 
    Format the output as a simple JSON array of strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse topics", e);
    return [];
  }
};

export const generateBackground = async (topic: string, methodology: Methodology): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a professional "Background of the Study" section for a research project titled "${topic}". 
    The methodology used is ${methodology}. 
    Structure the response with academic depth, discussing general context, the problem, and current trends in the field. 
    Keep it around 400 words. Do not use markdown headers, just paragraphs.`,
  });

  return response.text || "";
};

export const ingestManuscript = async (rawContent: string): Promise<Record<ResearchSectionType, string>> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `I have a research manuscript with the following content: "${rawContent.substring(0, 10000)}". 
    Please extract and categorize the content into the following sections: Abstract, Background, Literature Review, Methodology, and References. 
    Format the output as a JSON object where keys are the section names exactly.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          'Abstract': { type: Type.STRING },
          'Background': { type: Type.STRING },
          'Literature Review': { type: Type.STRING },
          'Methodology': { type: Type.STRING },
          'References': { type: Type.STRING },
        },
        required: ['Abstract', 'Background', 'Literature Review', 'Methodology', 'References']
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to ingest manuscript", e);
    return {
      'Abstract': '',
      'Background': '',
      'Literature Review': '',
      'Methodology': '',
      'References': ''
    };
  }
};

export interface GroundedSource {
  title: string;
  authors: string;
  year: string;
  summary: string;
  uri: string;
}

export const searchAcademicSources = async (query: string): Promise<GroundedSource[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Search for real, recent academic papers, journals, and scholarly articles related to the topic: "${query}". 
    For each paper, provide: Title, Main Authors, Publication Year, and a 2-sentence Summary.
    Format your response as a JSON array of objects. 
    Example structure: [{"title": "...", "authors": "...", "year": "...", "summary": "..."}]`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            authors: { type: Type.STRING },
            year: { type: Type.STRING },
            summary: { type: Type.STRING }
          },
          required: ['title', 'authors', 'year', 'summary']
        }
      }
    },
  });

  // Extract grounding URLs from metadata
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sourcesText = response.text || '[]';
  
  try {
    const parsedSources = JSON.parse(sourcesText);
    // Map grounding URIs to sources if possible, or just provide the first relevant one
    return parsedSources.map((source: any, index: number) => ({
      ...source,
      uri: groundingChunks[index]?.web?.uri || groundingChunks[0]?.web?.uri || 'https://scholar.google.com'
    }));
  } catch (e) {
    console.error("Failed to parse grounded sources", e);
    return [];
  }
};
