
import { GoogleGenAI, Type } from "@google/genai";
import { Methodology, ResearchSectionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    Structure the response with academic depth. 
    Format with simple <p> tags only.`,
  });

  return response.text || "";
};

export const generateQuestionnaireJSON = async (topic: string, methodology: Methodology): Promise<any[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create a professional research instrument for: "${topic}". 
    Methodology: ${methodology}. 
    Return exactly 8 items as a JSON array of objects with fields: 
    id (unique string), type (one of: multiple-choice, text, rating), label (the question), and options (array of strings, only for multiple-choice).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING },
            label: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['id', 'type', 'label']
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse questionnaire", e);
    return [];
  }
};

export const generateAnalysis = async (topic: string, methodology: Methodology): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Draft a "Data Analysis Plan" for: "${topic}". 
    Methodology: ${methodology}. 
    Format with HTML tags like <h3> and <p>.`,
  });
  return response.text || "";
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
    contents: `Search for real academic papers related to: "${query}". 
    Format your response as a JSON array of objects.`,
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

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  try {
    const parsedSources = JSON.parse(response.text || '[]');
    return parsedSources.map((source: any, index: number) => ({
      ...source,
      uri: groundingChunks[index]?.web?.uri || 'https://scholar.google.com'
    }));
  } catch (e) {
    return [];
  }
};

export const analyzeContextForSuggestions = async (content: string): Promise<string> => {
  if (!content.trim() || content.length < 50) return "";
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Suggest a specific academic search query for: "${content.substring(0, 500)}". 
    Return ONLY the search query string.`,
  });
  return response.text?.trim() || "";
};

export const ingestManuscript = async (htmlContent: string): Promise<Record<string, string>> => {
  // Use gemini-3-pro-preview for complex manuscript parsing tasks
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `I will provide you with the HTML content of a research paper. 
    Please identify and extract the HTML blocks corresponding to these sections: Abstract, Background, Methodology, References. 
    You MUST preserve all internal HTML tags (b, i, u, p, h1, h2, ul, li, etc.) within those blocks so formatting is not lost. 
    If a section is missing, return an empty string for it.
    
    Content: 
    ${htmlContent.substring(0, 10000)}`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          Abstract: { type: Type.STRING },
          Background: { type: Type.STRING },
          Methodology: { type: Type.STRING },
          References: { type: Type.STRING }
        }
      }
    }
  });
  
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse manuscript extraction", e);
    return {
      Abstract: htmlContent.substring(0, 2000),
      Background: '',
      Methodology: '',
      References: ''
    };
  }
};
