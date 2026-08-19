// --- VERİ TİPİ TANIMLAMALARI ---

export interface Option {
  id?: number | string;
  option_text: string;
  is_correct: boolean;
}

export interface Question {
  id?: number | string;
  question_text: string;
  options: Option[];
  order?: number;
}

export interface Quiz {
  id?: number | string;
  title: string;
  description: string;
  questions: Question[];
}

export interface Flashcard {
  id?: number;
  question: string;
  answer: string;
}

export interface Material {
  id?: number;
  content_type: 'video' | 'podcast' | 'form' | 'pdf' | 'assignment';
  embed_url: string;
  title: string;
  point_value?: number;
  min_duration_seconds?: number;
  quiz?: Quiz;
}

export interface EntryOption {
  id?: number;
  option_text: string;
  is_correct: boolean;
}

export interface EntryQuestion {
  id?: number;
  question_text: string;
  target_week: number;
  options: EntryOption[];
}

export interface QuizDetailAnalysis {
  question_text: string;
  selected_option: string;
  correct_option: string;
  is_correct: boolean;
}

export interface ChatbotReportData {
  student_name: string;
  total_count: number;
  questions: {
    text: string;
    week: number | string;
    date: string;
  }[];
}

export interface WeeklyProgress {
  week_number: number;
  progress: number;
  duration: string | number;
  duration_seconds?: number;
  duration_2?: string | number;
  score_1?: number;
  score_2?: number;
  correct_1?: number;
  wrong_1?: number;
  correct_2?: number;
  wrong_2?: number;
  questions?: string[];
  quiz_results?: QuizDetailAnalysis[];
  material_details?: {
    id?: number;
    title: string;
    content_type: string;
    duration_seconds: number;
    duration_seconds_t1?: number;
    duration_seconds_t2?: number;
  }[];
}

export interface BulkStudentData {
  id: string | number;
  full_name: string;
  email: string;
  department: string;
  total_points: number;
  pre_test_score?: string;
  total_time: number;
  total_time_t1?: number;
  total_time_t2?: number;
  weekly_breakdown: {
    week: number;
    progress: number;
    duration: string | number;
    duration_seconds: number;
    duration_seconds_2: number;
    correct: number;
    wrong: number;
    correct_2: number;
    wrong_2: number;
    score_1?: number;
    score_2?: number;
    has_quiz: boolean;
    is_round_2_started: boolean;
    quiz_results?: QuizDetailAnalysis[];
    questions?: string[];
    material_details?: {
      id?: number;
      title: string;
      content_type: string;
      duration_seconds: number;
      duration_seconds_t1?: number;
      duration_seconds_t2?: number;
    }[];
  }[];
}

export interface StudentAnalytics {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  total_points: number;
  total_time_spent: string;
  overall_progress: number;
  weekly_breakdown: WeeklyProgress[];
  pre_test_data?: {
    score: number;
    correct: number;
    wrong: number;
    date: string;
  };
}

export interface SurveyOption {
  id?: number | string;
  option_text: string;
  value: number;
}

export interface SurveyQuestion {
  id?: number | string;
  text: string;
  category: string;
  options: SurveyOption[];
}

export interface Survey {
  id?: number | string;
  title: string;
  description: string;
  week_number: number;
  questions: SurveyQuestion[];
}

export interface SurveyAnalysisResult {
  student: string;
  question: string;
  answer: number;
  category: string;
  answer_text?: string;
}

// --- BÖLÜM LİSTESİ VE YARDIMCI FONKSİYONLAR ---

export const departmentList = [
  { id: 'cocukgelisimi', name: 'Çocuk Gelişimi' },
  { id: 'diyaliz', name: 'Diyaliz' },
  { id: 'disprotezteknolojisi', name: 'Diş Protez Teknolojisi' },
  { id: 'eczanehizmetleri', name: 'Eczane Hizmetleri' },
  { id: 'fizyoterapi', name: 'Fizyoterapi' },
];

export const getDeptName = (id: string) => {
  const dept = departmentList.find(d => d.id === id);
  return dept ? dept.name : id;
};

export const formatDuration = (duration: string | number) => {
  if (!duration || duration === "Aktivite Kaydı Yok" || duration === "Aktivite Yok" || duration === 0) {
    return "0 dk";
  }

  let totalMinutes = 0;

  if (typeof duration === 'number') {
    totalMinutes = Math.floor(duration / 60);
  } else {
    const numbers = duration.match(/\d+/g)?.map(Number) || [];
    if (duration.toLowerCase().includes('sa')) {
      const hours = numbers[0] || 0;
      const mins = numbers[1] || 0;
      totalMinutes = (hours * 60) + mins;
    } else {
      totalMinutes = numbers[0] || 0;
    }
  }

  if (totalMinutes === 0) return "0 dk";
  if (totalMinutes < 60) return `${totalMinutes} dk`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} sa ${minutes} dk`;
};
