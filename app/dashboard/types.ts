export interface Option {
  id: number;
  option_text: string;
}

export interface Question {
  id: number;
  question_text: string;
  options: Option[];
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  questions: Question[];
}

export interface FlashcardData {
  id: number;
  question: string;
  answer: string;
}

export interface SurveyOption {
  id: number;
  option_text: string;
  value: number;
}

export interface SurveyQuestion {
  id: number;
  text: string;
  category: string;
  options: SurveyOption[];
}

export interface Material {
  id: number;
  content_type: 'video' | 'podcast' | 'form' | 'pdf' | 'assignment';
  embed_url: string;
  title: string;
  point_value?: number;
  min_duration_seconds?: number;
  quiz?: Quiz;
}

export interface WeeklyContent {
  id: number;
  week_number: number;
  title: string;
  description: string;
  intro_title?: string;
  intro_description?: string;
  intro_video_url?: string;
  release_date?: string;
  due_date?: string;
  is_locked: boolean;
  total_score?: number;
  lock_reason?: string;
  is_intro_watched: boolean;
  materials: Material[];
  flashcards: FlashcardData[];
  progress?: number;
  is_completed?: boolean;
  current_attempt_round: number;
  pre_test_questions?: Question[];
  pre_test_data?: {
    is_completed: boolean;
    score: number;
  };
  is_entry_test_required?: boolean;
  entry_questions?: Question[];
  is_survey_required?: boolean;
  survey_data?: {
    id: number;
    title: string;
    questions: SurveyQuestion[];
  };
}

export interface ProgressData {
  weekly_content: number | string;
  completion_percentage: number;
  is_completed: boolean;
}

export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}
