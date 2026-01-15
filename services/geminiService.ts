import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GenerateContentRequest, QuizData } from "../types";

// Define the response schema strictly to ensure easy parsing
const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    topic: { 
      type: Type.STRING, 
      description: "A short title or topic derived from the content in Arabic" 
    },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          type: { 
            type: Type.STRING, 
            enum: ["MultipleChoice", "TrueFalse", "ShortAnswer"],
            description: "The type of the question"
          },
          difficulty: { 
            type: Type.STRING, 
            enum: ["Easy", "Medium", "Hard"],
            description: "Difficulty level"
          },
          questionText: { 
            type: Type.STRING,
            description: "The question text in Modern Standard Arabic"
          },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of 4 options for MultipleChoice. Null or empty for others."
          },
          correctAnswer: { 
            type: Type.STRING,
            description: "The correct answer in Arabic."
          },
          explanation: { 
            type: Type.STRING,
            description: "A brief explanation of why the answer is correct in Arabic."
          }
        },
        required: ["id", "type", "difficulty", "questionText", "correctAnswer", "explanation"]
      }
    }
  },
  required: ["questions", "topic"]
};

export const generateQuizFromContent = async (request: GenerateContentRequest): Promise<QuizData> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey });
  const { config, text, base64Data, mimeType } = request;

  // Construct specific instructions based on configuration
  const typeInstruction = config.questionTypes.length > 0 
    ? `Only generate questions of these types: ${config.questionTypes.join(', ')}.` 
    : 'Generate a mix of question types.';

  const difficultyInstruction = config.difficulty === 'Mixed'
    ? 'Generate a mix of Easy, Medium, and Hard questions.'
    : `Generate questions with ${config.difficulty} difficulty.`;

  // Prompt engineering
  const systemInstruction = `
    You are an expert Arabic educational assistant. Your goal is to analyze the provided material and generate a custom review quiz.
    
    Configuration Requirements:
    1. Target Audience Age: ${config.targetAge} years old (Adjust language complexity accordingly).
    2. Question Count: Generate exactly ${config.questionCount} questions.
    3. Types: ${typeInstruction}
    4. Difficulty: ${difficultyInstruction}
    
    General Rules:
    1. Language: strictly Modern Standard Arabic (Fusha).
    2. Content: Ensure questions cover key points from the provided material.
    3. Formatting: Return ONLY the raw JSON object matching the schema.
    4. Context: If the image/PDF contains text, extract it and use it. If it is a diagram, interpret it.
    
    Structure the response to be parsed directly by the application.
  `;

  const parts: any[] = [];

  if (base64Data && mimeType) {
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    });
    
    // Adjust prompt based on file type
    if (mimeType === 'application/pdf') {
       parts.push({
        text: "Analyze this PDF document and generate educational review questions based on the configuration.",
      });
    } else {
      parts.push({
        text: "Analyze this image and generate educational review questions based on the configuration.",
      });
    }
  }

  if (text) {
    parts.push({
      text: `Analyze the following text and generate educational review questions based on the configuration:\n\n${text}`,
    });
  }

  if (parts.length === 0) {
    throw new Error("No content provided for generation.");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.4,
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("No response from AI");

    return JSON.parse(responseText) as QuizData;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};