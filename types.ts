export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  category: string;
  timestamp: number;
}

export interface GenerationState {
  isGenerating: boolean;
  progress: number; // 0 to 100
  error: string | null;
}

export type StylePreset = {
  id: string;
  label: string;
  description: string;
  promptSuffix: string;
  icon: string;
};

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  creditsUsed: number;
  maxCredits: number;
  lastResetDate: string; // ISO date string YYYY-MM-DD
}
