
import { GoogleGenAI, Type } from "@google/genai";
import { GenerateContentRequest, QuizData } from "../types";

// --- API Key Manager System ---

interface KeyState {
  key: string;
  lastUsed: number;
  usageCount: number;
  cooldownUntil: number; // Timestamp when key becomes active again
}

class APIKeyManager {
  private keys: KeyState[] = [];
  private readonly COOLDOWN_DURATION = 60 * 1000; // 60 seconds cooldown on error

  constructor() {
    const keysString = process.env.API_KEY || "";
    // Parse keys from comma-separated string
    const rawKeys = keysString.split(',').map(k => k.trim()).filter(k => k.length > 0);
    
    if (rawKeys.length === 0) {
      console.warn("No API Keys found in environment variables!");
    }

    this.keys = rawKeys.map(key => ({
      key,
      lastUsed: 0,
      usageCount: 0,
      cooldownUntil: 0
    }));
  }

  /**
   * Selects the best available key based on:
   * 1. Not in cooldown
   * 2. Least Recently Used (Load Balancing)
   */
  private getBestKey(): string | null {
    const now = Date.now();
    
    // Filter active keys
    const activeKeys = this.keys.filter(k => now >= k.cooldownUntil);

    if (activeKeys.length === 0) {
      // If all keys are cooling down, pick the one expiring soonest to fail-fast or wait
      // For this implementation, we try to use the one that cooled down earliest, 
      // effectively forcing a retry if we are desperate.
      return this.keys.sort((a, b) => a.cooldownUntil - b.cooldownUntil)[0]?.key || null;
    }

    // Sort by Last Used (Ascending) -> Use the key that has been idle the longest
    activeKeys.sort((a, b) => a.lastUsed - b.lastUsed);

    const selected = activeKeys[0];
    selected.lastUsed = now; // Update immediately to prevent concurrency race conditions
    selected.usageCount++;
    
    return selected.key;
  }

  /**
   * Report an error for a specific key to trigger cooldown
   */
  private reportFailure(keyString: string) {
    const keyObj = this.keys.find(k => k.key === keyString);
    if (keyObj) {
      keyObj.cooldownUntil = Date.now() + this.COOLDOWN_DURATION;
      console.warn(`API Key ending in ...${keyString.slice(-4)} marked for cooldown.`);
    }
  }

  /**
   * Wrapper to execute an API call with automatic failover
   */
  public async execute<T>(operation: (apiKey: string) => Promise<T>): Promise<T> {
    // Try up to the number of keys we have + 1 retry
    let attempts = 0;
    const maxAttempts = this.keys.length > 0 ? this.keys.length : 1;
    let lastError: any = null;

    while (attempts < maxAttempts) {
      const currentKey = this.getBestKey();
      
      if (!currentKey) {
        throw new Error("No API keys configured.");
      }

      try {
        // Attempt the operation
        return await operation(currentKey);
      } catch (error: any) {
        lastError = error;
        attempts++;
        
        // Log error and penalize key
        console.error(`Attempt ${attempts} failed with key ...${currentKey.slice(-4)}:`, error.message);
        
        // Check if it's a rate limit or server error (429, 500, 503)
        // Note: GoogleGenAI often throws errors with status codes in the message or structure
        const isRateLimit = error.message?.includes("429") || error.message?.includes("Quota") || error.status === 429;
        const isServerError = error.message?.includes("500") || error.message?.includes("503") || error.status >= 500;

        if (isRateLimit || isServerError) {
          this.reportFailure(currentKey);
        }
        
        // If we have exhausted all keys, throw the last error
        if (attempts >= maxAttempts) break;
      }
    }

    throw lastError || new Error("Failed to execute API request after multiple attempts.");
  }
}

// Singleton instance
const keyManager = new APIKeyManager();

// --- End Manager ---

const questionSchema = {
  type: Type.OBJECT,
  properties: {
    topic: { type: Type.STRING },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          type: { type: Type.STRING, enum: ["MultipleChoice", "TrueFalse", "ShortAnswer", "FillInBlanks"] },
          difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
          questionText: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswer: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["id", "type", "difficulty", "questionText", "correctAnswer", "explanation"]
      }
    }
  },
  required: ["questions", "topic"]
};

const gradingSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      questionId: { type: Type.INTEGER },
      isCorrect: { type: Type.BOOLEAN },
      feedback: { type: Type.STRING, description: "Brief explanation of why it's correct or what was missing." }
    },
    required: ["questionId", "isCorrect", "feedback"]
  }
};

export const generateQuizFromContent = async (request: GenerateContentRequest): Promise<QuizData> => {
  return keyManager.execute(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const { config, text, mediaItems } = request;

    const typesString = config.questionTypes.join(", ");

    const systemInstruction = `
      بصفتك معلماً عربياً خبيراً، قم بإنشاء اختبار تعليمي يتكون من ${config.questionCount} سؤالاً بناءً على المواد المقدمة.
      القواعد الصارمة:
      1. أنواع الأسئلة المسموح بها فقط: [${typesString}].
      2. العمر المستهدف: ${config.targetAge}. الصعوبة: ${config.difficulty}.
      3. لنوع "FillInBlanks" (إكمال الفراغ)، اجعل السؤال يحتوي على فراغ واضح ليقوم الطالب بكتابته.
      4. اللغة: عربية فصحى بسيطة ومناسبة للمرحلة العمرية.
      ارجع الرد بتنسيق JSON فقط.
    `;

    const parts: any[] = [];
    if (mediaItems && mediaItems.length > 0) {
      mediaItems.forEach(item => {
        parts.push({ inlineData: { data: item.base64Data, mimeType: item.mimeType } });
      });
    }
    if (text) parts.push({ text });

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', 
      contents: { role: 'user', parts: parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.4,
      }
    });

    return JSON.parse(response.text || "{}") as QuizData;
  });
};

export const gradeShortAnswers = async (questions: any[], userAnswers: Record<number, string>): Promise<any[]> => {
  const answersToGrade = questions
    .filter(q => q.type === "ShortAnswer" || q.type === "FillInBlanks")
    .map(q => ({
      id: q.id,
      question: q.questionText,
      correctAnswer: q.correctAnswer,
      userAnswer: userAnswers[q.id] || ""
    }));

  if (answersToGrade.length === 0) return [];

  return keyManager.execute(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      بصفتك معلماً عربياً خبيراً، قم بتقييم إجابات الطلاب التالية.
      قواعد التقييم الصارمة:
      1. كن متسامحاً جداً (Very Flexible) مع الأخطاء الإملائية.
      2. تجاهل أخطاء النحو أو مواضع الهمزات (مثل أ، إ، آ، ا).
      3. إذا كان المعنى واضحاً وصحيحاً في جوهره، اعتبر الإجابة "صحيحة" (isCorrect: true).
      4. تقبل اختلاف الصياغة طالما الفكرة صحيحة.
      
      البيانات:
      ${JSON.stringify(answersToGrade)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: gradingSchema,
        temperature: 0.1,
      }
    });

    return JSON.parse(response.text || "[]");
  });
};
