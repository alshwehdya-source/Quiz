export enum Difficulty {
  Easy = "Easy",
  Medium = "Medium",
  Hard = "Hard",
  Mixed = "Mixed"
}

export enum QuestionType {
  MultipleChoice = "MultipleChoice",
  TrueFalse = "TrueFalse",
  ShortAnswer = "ShortAnswer"
}

export interface Question {
  id: number;
  type: QuestionType;
  difficulty: Difficulty;
  questionText: string;
  options?: string[]; // Only for MC
  correctAnswer: string; // For TF, it would be "True" or "False" localized
  explanation: string;
}

export interface QuizData {
  topic?: string;
  questions: Question[];
}

export interface QuizConfiguration {
  questionCount: number;
  questionTypes: QuestionType[];
  difficulty: Difficulty;
  targetAge: string;
}

export interface GenerateContentRequest {
  text?: string;
  base64Data?: string;
  mimeType?: string;
  config: QuizConfiguration;
}