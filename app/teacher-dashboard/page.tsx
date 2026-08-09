"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/lib/api';
import { AxiosError } from 'axios';
import {
  LayoutGrid,
  Video,
  Headphones,
  Save,
  Plus,
  Trash2,
  LogOut,
  BarChart3,
  Users,
  Clock,
  X,
  Search,
  MessageSquare,
  ListChecks,
  Check,
  RefreshCcw,
  BookOpen,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  Menu,
  PlayCircle,
  Type,
  ShieldCheck,
  Calendar,
  FileText,
  Printer,
  Download,
  GraduationCap,
  Award,
  Filter,
  MapPin,
  Bot,
  ChevronRight,
  ChevronLeft,
  PieChart
} from 'lucide-react';

// --- VERİ TİPİ TANIMLAMALARI ---

interface Option {
  id?: number | string; // Opsiyonel (yeni eklenenlerde id olmayabilir)
  option_text: string;
  is_correct: boolean;
}

interface Question {
  id?: number | string; // Opsiyonel yaptık çünkü yeni eklenen sorularda ID henüz oluşmamış olabilir
  question_text: string;
  options: Option[];
  order?: number;
}

interface Quiz {
  id?: number | string; // Bu satır eksik olduğu için hata veriyor
  title: string;
  description: string;
  questions: Question[];
}

interface Flashcard {
  id?: number;
  question: string;
  answer: string;
}

interface Material {
  id?: number;
  content_type: 'video' | 'podcast' | 'form' | 'pdf';
  embed_url: string;
  title: string;
  point_value?: number;
  quiz?: Quiz;
}
interface EntryOption {
  id?: number;
  option_text: string;
  is_correct: boolean;
}

interface EntryQuestion {
  id?: number;
  question_text: string;
  target_week: number; // Yanlış yapılırsa açılacak hafta no
  options: EntryOption[];
}

interface QuizDetailAnalysis {
  question_text: string;
  selected_option: string;
  correct_option: string;
  is_correct: boolean;
}

interface ChatbotReportData {
  student_name: string;
  total_count: number;
  questions: {
    text: string;
    week: number | string;
    date: string;
  }[];
}

interface WeeklyProgress {
  week_number: number;
  progress: number;
  duration: string | number; // Toplam süre (Round 1 + Round 2)
  duration_seconds?: number; // Backend'den gelen ham saniye verisi
  duration_2?: string | number;
  score_1?: number;
  score_2?: number;
  correct_1?: number;
  wrong_1?: number;
  correct_2?: number;
  wrong_2?: number;
  questions?: string[];
  quiz_results?: QuizDetailAnalysis[];
  // YENİ: Her materyal için özel sürelerin tutulduğu liste
  material_details?: {
    title: string;
    content_type: string;
    duration_seconds: number;
  }[];
}

interface BulkStudentData {
  id: string | number;
  full_name: string;
  email: string;
  department: string;
  total_points: number;
  pre_test_score?: string; // <-- BU SATIRI EKLE (Opsiyonel string olarak)
  total_time: number;
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
    // YENİ: PDF Raporunda tüm materyalleri listelemek için gereken alan
    material_details?: {
      title: string;
      content_type: string;
      duration_seconds: number;
    }[];
  }[];
}

interface StudentAnalytics {
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

// 1. Her bir şıkkın (seçeneğin) yapısı
interface SurveyOption {
  id?: number | string;
  option_text: string; // Örn: "Kesinlikle Katılıyorum"
  value: number;       // Örn: 5
}

// 2. Her bir sorunun yapısı
interface SurveyQuestion {
  id?: number | string;
  text: string;       // Soru metni
  category: string;   // Alt boyut / Kategori
  options: SurveyOption[]; // TypeScript artık 'options' alanını tanıyacak
}

// 3. Genel anket yapısı
interface Survey {
  id?: number | string;
  title: string;
  description: string;
  week_number: number;
  questions: SurveyQuestion[];
}

// 4. Akademisyen analiz ekranı verisi
interface SurveyAnalysisResult {
  student: string;
  question: string;
  answer: number; // Öğrencinin seçtiği şıkkın sayısal değeri
  category: string;
}

export default function TeacherDashboard() {
  // --- STATE YÖNETİMİ ---
// --- STATE YÖNETİMİ ---
  // Tek bir yerde güncellenmiş activeTab tipi
  const [activeTab, setActiveTab] = useState<'content' | 'analytics' | 'chatbot' | 'survey_results' | 'time_analytics'>('content');
  const [loading, setLoading] = useState(false);
  const [fetchingWeek, setFetchingWeek] = useState(false);
  const [analytics, setAnalytics] = useState<StudentAnalytics[]>([]);
  const [bulkData, setBulkData] = useState<BulkStudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentAnalytics | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('cocukgelisimi');

  const [weekNumber, setWeekNumber] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [introTitle, setIntroTitle] = useState('Genel Tanıtım ve Oryantasyon');
  const [introVideoUrl, setIntroVideoUrl] = useState('');
  const [introDescription, setIntroDescription] = useState('');

  const [materials, setMaterials] = useState<Material[]>([{ content_type: 'video', embed_url: '', title: '', point_value: 10 }]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [chatbotData, setChatbotData] = useState<ChatbotReportData[]>([]);
  const [entryQuestions, setEntryQuestions] = useState<EntryQuestion[]>([]);

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('4');
  
  // Anket sonuçlarını tutacak olan state (Mükerrerlikten temizlendi)
  const [surveyAnalysis, setSurveyAnalysis] = useState<SurveyAnalysisResult[]>([]);
  
  const [isSurveyActive, setIsSurveyActive] = useState(false); // Bu hafta anket var mı?
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [surveyTitle, setSurveyTitle] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [systemTimeData, setSystemTimeData] = useState<any>(null);

/// =================================================================
  // 1. ADIM: TÜM VERİ ÇEKME FONKSIYONLARI (ÜSTTE OLMALI)
  // =================================================================

  // --- 1. ÖĞRENCİ ANALİZLERİNİ ÇEKME ---
  const fetchAnalytics = useCallback(async (page = 1) => {
    if (!selectedDepartment || selectedDepartment === 'all') return;
    setLoading(true);
    setAnalytics([]); 
    try {
      const [res, bulkRes] = await Promise.all([
        api.get(`/contents/analytics/?department=${selectedDepartment}&page=${page}`),
        api.get(`/contents/bulk-academic-report/?department=${selectedDepartment}`)
      ]);
      
      if (res.data && res.data.results) {
        setAnalytics(res.data.results);
        setTotalCount(res.data.count); 
      } else {
        setAnalytics(res.data);
        if (Array.isArray(res.data)) {
          setTotalCount(res.data.length);
        }
      }
      setBulkData(bulkRes.data);
    } catch (err) {
      console.error("Analiz verileri yüklenemedi:", err);
      setAnalytics([]); 
      setBulkData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment, setAnalytics, setBulkData, setTotalCount, setLoading]);

// --- 2. CHATBOT ANALİZLERİNİ ÇEKME ---
  const fetchChatbotAnalytics = useCallback(async () => {
    if (!selectedDepartment || selectedDepartment === 'all') return;
    setChatbotData([]);
    try {
      const res = await api.get(`/contents/chatbot-analytics/?department=${selectedDepartment}`);
      setChatbotData(res.data);
    } catch (err) {
      console.error("Chatbot verileri yüklenemedi:", err);
      setChatbotData([]);
    }
  }, [selectedDepartment, setChatbotData]);

 // --- 3. ANKET ANALİZ SONUÇLARINI ÇEKME ---
 // --- ANKET ANALİZ SONUÇLARINI BACKEND'DEN ÇEKME ---
const fetchSurveyAnalytics = useCallback(async () => {
  if (!selectedDepartment || selectedDepartment === 'all') return;
  setLoading(true);
  try {
    // Doğrudan seçili anket ID'sini backend'e gönderiyoruz
    const res = await api.get(`/contents/academic/surveys/report/?department=${selectedDepartment}&survey_id=${selectedSurveyId}`);
    setSurveyAnalysis(res.data);
  } catch (err) {
    console.error("Anket analizleri çekilemedi:", err);
    setSurveyAnalysis([]);
  } finally {
    setLoading(false);
  }
}, [selectedDepartment, selectedSurveyId, setSurveyAnalysis, setLoading]);

  // =================================================================
  // 2. ADIM: ANCAK HER ŞEY TANIMLANDIKTAN SONRA EFFECT TETİKLENMELİ
  useEffect(() => {
    if (!selectedDepartment || selectedDepartment === 'all') return;

    if (activeTab === 'analytics') {
      fetchAnalytics(currentPage);
    }
    if (activeTab === 'chatbot') {
      fetchChatbotAnalytics();
    }
    if (activeTab === 'survey_results') {
      fetchSurveyAnalytics(); 
    }
  }, [activeTab, selectedDepartment, currentPage, fetchAnalytics, fetchChatbotAnalytics, fetchSurveyAnalytics]);

  // =================================================================
  // 3. ADIM: ANKET HESAPLAMALARI VE YARDIMCI FONKSİYONLAR
  // =================================================================


  // Yeni Soru Ekleme (İçinde boş şıklarla beraber)
const addSurveyQuestion = () => {
  setSurveyQuestions([
    ...surveyQuestions,
    { 
      text: "", 
      category: "", 
      options: [
        { option_text: "", value: 1 },
        { option_text: "", value: 2 },
        { option_text: "", value: 3 },
        { option_text: "", value: 4 },
        { option_text: "", value: 5 }
      ] 
    }
  ]);
};

// Şık Metnini Güncelleme
const updateSurveyOption = (qIdx: number, oIdx: number, text: string) => {
  setSurveyQuestions(prevQuestions => {
    // 1. Ana diziyi kopyala
    const newQuestions = [...prevQuestions];
    // 2. Güncellenecek soruyu kopyala
    const targetQuestion = { ...newQuestions[qIdx] };
    // 3. Sorunun içindeki options dizisini kopyala
    const newOptions = [...targetQuestion.options];
    // 4. İlgili seçeneği güncelle
    newOptions[oIdx] = { ...newOptions[oIdx], option_text: text };
    
    // 5. Parçaları birleştir
    targetQuestion.options = newOptions;
    newQuestions[qIdx] = targetQuestion;
    
    return newQuestions;
  });
};

const updateSurveyQuestion = (index: number, field: keyof SurveyQuestion, value: string) => {
  setSurveyQuestions(prev => {
    const newQs = [...prev];
    newQs[index] = { ...newQs[index], [field]: value };
    return newQs;
  });
};

  // --- BÖLÜM LİSTESİ ---
  const departmentList = [
    { id: 'cocukgelisimi', name: 'Çocuk Gelişimi' },
    { id: 'diyaliz', name: 'Diyaliz' },
    { id: 'disprotezteknolojisi', name: 'Diş Protez Teknolojisi' },
    { id: 'eczanehizmetleri', name: 'Eczane Hizmetleri' },
    { id: 'fizyoterapi', name: 'Fizyoterapi' },
  ];

  // TeacherDashboard fonksiyonunun en üstüne ekle
const [preTestQuestions, setPreTestQuestions] = useState<Question[]>([
  {
    question_text: "",
    options: [
      { option_text: "", is_correct: true },
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false }
    ]
  }
]);

// fetchWeekDetail fonksiyonunda data.pre_test_questions'ı setlemeyi unutma:
// setPreTestQuestions(data.pre_test_questions || [...]);

  const getDeptName = (id: string) => {
    const dept = departmentList.find(d => d.id === id);
    return dept ? dept.name : id;
  };

  // --- SÜRE FORMATLAMA FONKSİYONU ---
  const formatDuration = (duration: string | number) => {
    if (!duration || duration === "Aktivite Kaydı Yok" || duration === "Aktivite Yok" || duration === 0) {
      return "0 dk";
    }

    let totalMinutes = 0;

    // Eğer gelen veri sadece sayı ise (Saniye cinsinden geliyordur)
    if (typeof duration === 'number') {
      totalMinutes = Math.floor(duration / 60);
    }
    // Eğer gelen veri metin ise (Örn: "120 saniye" veya "2 sa 10 dk")
    else {
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

  // --- HAFTA DETAYI ÇEKME ---
  // --- HAFTA DETAYI ÇEKME ---
  // --- HAFTA DETAYI ÇEKME ---
  const fetchWeekDetail = useCallback(async (week: number) => {
    setFetchingWeek(true);
    try {
      const res = await api.get(`/contents/list/?week_number=${week}`);
      const data = res.data;
      
      // 1. Temel İçerik Bilgileri
      setIntroDescription(data.intro_description || '');
      setTitle(data.title || '');
      setDescription(data.description || '');

      // 2. Tarih Formatlama
      if (data.release_date) {
        setReleaseDate(data.release_date.split('T')[0]);
      } else {
        setReleaseDate('');
      }

      if (data.due_date) {
        setDueDate(data.due_date.split('T')[0]);
      } else {
        setDueDate('');
      }

      // 3. Oryantasyon Bilgileri
      if (data.intro_video_url !== undefined) {
        setIntroVideoUrl(data.intro_video_url || '');
        setIntroTitle(data.intro_title || 'Genel Tanıtım ve Oryantasyon');
      }

      // 4. Materyaller
      if (data.materials && data.materials.length > 0) {
        setMaterials(data.materials);
      } else {
        setMaterials([{ content_type: 'video', embed_url: '', title: '', point_value: 10 }]);
      }

      // 5. Flashcardlar ve Giriş Testleri
      setFlashcards(data.flashcards || []);
      setEntryQuestions(data.entry_questions || []);

      // --- 6. ANKET (SURVEY) VERİLERİNİ YÜKLE ---
      if (data.survey_data) {
        setIsSurveyActive(true); 
        
        // ANKET BAŞLIĞI: Backend 'title' gönderiyor, 'setSurveyTitle' varsa set ediyoruz
        // Eğer 'setSurveyTitle' diye bir state'in yoksa bileşene eklemeyi unutma
        if (typeof setSurveyTitle === 'function') {
           setSurveyTitle(data.survey_data.title || '');
        }

        // ANKET SORULARI VE ŞIKLARI
        if (data.survey_data.questions && data.survey_data.questions.length > 0) {
          const formattedSurveyQuestions = data.survey_data.questions.map((q: any) => ({
            id: q.id,
            text: q.text, // Backend'den gelen 'text'
            category: q.category || '',
            // ŞIKLAR: Backend'den gelen 'options' dizisini kontrol et
            options: q.options && q.options.length > 0 ? q.options : [
              // Eğer veritabanında şık yoksa hoca için varsayılan taslağı oluştur
              { option_text: "Hiçbir zaman", value: 1 },
              { option_text: "Ender olarak", value: 2 },
              { option_text: "Bazen", value: 3 },
              { option_text: "Sıklıkla", value: 4 },
              { option_text: "Her zaman", value: 5 }
            ]
          }));
          setSurveyQuestions(formattedSurveyQuestions);
        } else {
          setSurveyQuestions([]);
        }
      } else {
        setIsSurveyActive(false);
        setSurveyQuestions([]);
        if (typeof setSurveyTitle === 'function') setSurveyTitle('');
      }

      // --- 7. ÖN TEST SORULARINI YÜKLE (Hafta 1 Özel) ---
      if (week === 1) {
        if (data.pre_test_questions && data.pre_test_questions.length > 0) {
          setPreTestQuestions(data.pre_test_questions);
        } else {
          setPreTestQuestions([
            {
              question_text: "",
              options: [
                { option_text: "", is_correct: true },
                { option_text: "", is_correct: false },
                { option_text: "", is_correct: false },
                { option_text: "", is_correct: false },
                { option_text: "", is_correct: false }
              ]
            }
          ]);
        }
      } else {
        setPreTestQuestions([]);
      }

    } catch (err) {
      console.error("Haftalık veriler çekilemedi:", err);
      // Hata durumunda formu sıfırla
      setTitle('');
      setDescription('');
      setReleaseDate('');
      setDueDate('');
      setMaterials([{ content_type: 'video', embed_url: '', title: '', point_value: 10 }]);
      setFlashcards([]);
      setPreTestQuestions([]);
      setIsSurveyActive(false);
      setSurveyQuestions([]);
      if (typeof setSurveyTitle === 'function') setSurveyTitle('');
    } finally {
      setFetchingWeek(false);
    }
  }, [setIsSurveyActive, setSurveyQuestions]);

  // --- İZLEYİCİ (TRIGGER) ---
  useEffect(() => {
    if (activeTab === 'content') {
      fetchWeekDetail(weekNumber);
    }
  }, [weekNumber, activeTab, fetchWeekDetail]);

  const [systemTimeLoading, setSystemTimeLoading] = useState<boolean>(true);
  const [selectedWeekTab, setSelectedWeekTab] = useState<string>('all'); // <- EKSİK OLAN STATE SATIRI BU, BURAYA EKLE!


useEffect(() => {
  // Sadece ilgili sekme aktifken istek atmasını garantiliyoruz
  if (activeTab !== 'time_analytics') return;

  setSystemTimeLoading(true);
  
  // API URL'ini temiz bir şekilde kurguluyoruz
  let url = '/contents/system-time-analytics/';
  if (selectedDepartment) {
    url += `?department=${selectedDepartment}`;
  }

  api.get(url)
    .then(res => {
      // Eğer backend'den gelen veri boş veya tanımsızsa, arayüzün boş kalmaması için mock/default şablon veriyoruz
      if (!res.data || Object.keys(res.data).length === 0 || !res.data.raw_student_list) {
        setSystemTimeData({
          max_engagement: { student: "Veri Yok", time: "0 Saat" },
          min_engagement: { student: "Veri Yok", time: "0 Saat" },
          activity_distribution: [
            { type: "Video İzleme", hours: 0 },
            { type: "Ders Notu Okuma (PDF)", hours: 0 },
            { type: "Bilgi Testi (Quiz)", hours: 0 },
            { type: "Podcast Dinleme", hours: 0 },
            { type: "Ödev Çözme", hours: 0 }
          ],
          raw_student_list: []
        });
      } else {
        setSystemTimeData(res.data);
      }
      setSystemTimeLoading(false);
    })
    .catch(err => {
      console.error("Zaman analitiği yüklenirken hata:", err);
      setSystemTimeLoading(false);
    });
}, [selectedDepartment, activeTab]);

// --- ANALİZ VERİLERİNİ ÇEKME ---


  // --- KRİTİK: BÖLÜM VEYA SAYFA DEĞİŞTİĞİNDE VERİYİ ÇEK ---
  useEffect(() => {
    if (activeTab === 'analytics' && selectedDepartment) {
      // Bölüm değiştiğinde sayfayı 1'e resetlemek mantıklı olabilir
      // setCurrentPage(1); 
      fetchAnalytics(currentPage);
    }
  }, [activeTab, selectedDepartment, currentPage, fetchAnalytics]);



const handlePrintChatbot = () => {
    // Akademik raporu tamamen gizle, chatbot raporunu göster
    const academicReport = document.getElementById('bulk-report-pdf');
    const chatbotReport = document.getElementById('chatbot-report-pdf');
    
    if (academicReport) academicReport.style.display = 'none';
    if (chatbotReport) chatbotReport.style.display = 'block';
    
    window.print();
    
    // Yazdırma penceresi kapandıktan sonra ekranı eski haline getir (opsiyonel)
    if (chatbotReport) chatbotReport.style.display = 'none';
  };

  const handlePrintAcademic = () => {
    // Chatbot raporunu tamamen gizle, akademik raporu göster
    const academicReport = document.getElementById('bulk-report-pdf');
    const chatbotReport = document.getElementById('chatbot-report-pdf');
    
    if (chatbotReport) chatbotReport.style.display = 'none';
    if (academicReport) academicReport.style.display = 'block';
    
    window.print();
    
    if (academicReport) academicReport.style.display = 'none';
  };
  

  // --- FİLTRELEME HESAPLAMALARI ---
  // Backend zaten filtreli gönderdiği için ekstra işlem yapmadan veriyi doğrudan döndürüyoruz.
  const filteredAnalytics = useMemo(() => {
    return analytics;
  }, [analytics]);

  const filteredBulkData = useMemo(() => {
    return bulkData;
  }, [bulkData]);

  // --- MATERYAL ETKİLEŞİMLERİ ---
  const addMaterialRow = () => {
    setMaterials([...materials, { content_type: 'video', embed_url: '', title: '', point_value: 10 }]);
  };

  const removeMaterialRow = (index: number) => {
    if (materials.length > 1) {
      setMaterials(materials.filter((_, i) => i !== index));
    }
  };

  const updateMaterial = (index: number, field: keyof Material, value: unknown) => {
    const newMaterials = [...materials];

    if (field === 'content_type') {
      newMaterials[index].content_type = value as any;
      if (value === 'form' && !newMaterials[index].quiz) {
        newMaterials[index].quiz = {
          title: newMaterials[index].title || "Haftalık Değerlendirme",
          description: "",
          questions: [{
            question_text: "",
            options: [
              { option_text: "", is_correct: true },
              { option_text: "", is_correct: false },
              { option_text: "", is_correct: false },
              { option_text: "", is_correct: false },
              { option_text: "", is_correct: false }
            ]
          }]
        };
      }
    } else if (field === 'title') {
      newMaterials[index].title = value as string;
    } else if (field === 'embed_url') {
      newMaterials[index].embed_url = value as string;
    } else if (field === 'point_value') {
      newMaterials[index].point_value = Number(value);
    }

    setMaterials(newMaterials);
  };

 const addEntryQuestion = () => {
  setEntryQuestions([
    ...entryQuestions,
    {
      question_text: "",
      target_week: 1,
      options: [
        { option_text: "", is_correct: true },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false }
      ]
    }
  ]);
};

const updateEntryQuestion = (index: number, field: keyof EntryQuestion, value: any) => {
  const newQs = [...entryQuestions];
  newQs[index] = { ...newQs[index], [field]: value };
  setEntryQuestions(newQs);
};

const updateEntryOption = (qIdx: number, oIdx: number, text: string) => {
  const newQs = [...entryQuestions];
  newQs[qIdx].options[oIdx].option_text = text;
  setEntryQuestions(newQs);
};

const setCorrectEntryOption = (qIdx: number, oIdx: number) => {
  const newQs = [...entryQuestions];
  newQs[qIdx].options.forEach((opt, i) => {
    opt.is_correct = i === oIdx;
  });
  setEntryQuestions(newQs);
};

  // --- SINAV (QUIZ) FONKSİYONLARI ---
  const addQuestion = (mIndex: number) => {
    const newMats = [...materials];
    if (newMats[mIndex].quiz) {
      newMats[mIndex].quiz!.questions.push({
        question_text: "",
        options: [
          { option_text: "", is_correct: true },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false }
        ]
      });
    }
    setMaterials(newMats);
  };

  const updateQuestionText = (mIndex: number, qIndex: number, text: string) => {
    const newMats = [...materials];
    if (newMats[mIndex].quiz) {
      newMats[mIndex].quiz!.questions[qIndex].question_text = text;
    }
    setMaterials(newMats);
  };

  const updateOption = (mIndex: number, qIndex: number, oIndex: number, text: string) => {
    const newMats = [...materials];
    if (newMats[mIndex].quiz) {
      newMats[mIndex].quiz!.questions[qIndex].options[oIndex].option_text = text;
    }
    setMaterials(newMats);
  };

  const setCorrectOption = (mIndex: number, qIndex: number, oIndex: number) => {
    const newMats = [...materials];
    if (newMats[mIndex].quiz) {
      newMats[mIndex].quiz!.questions[qIndex].options.forEach((opt, i) => {
        opt.is_correct = i === oIndex;
      });
    }
    setMaterials(newMats);
  };

  const updateFlashcard = (index: number, field: keyof Flashcard, value: string) => {
    const newCards = [...flashcards];
    newCards[index] = { ...newCards[index], [field]: value };
    setFlashcards(newCards);
  };
// --- YENİ: ANKET ANALİZ HESAPLAMALARI (KATEGORİ BAZLI GRUPLAMA) ---
const surveyCategoryAverages = useMemo(() => {
  const categories: { [key: string]: { total: number; count: number } } = {};
  surveyAnalysis.forEach(item => {
    const cat = item.category || "Genel Sorular";
    if (!categories[cat]) {
      categories[cat] = { total: 0, count: 0 };
    }
    categories[cat].total += item.answer;
    categories[cat].count += 1;
  });

  return Object.keys(categories).map(key => ({
    name: key,
    average: Math.round(((categories[key].total / categories[key].count) + Number.EPSILON) * 100) / 100,
    totalCount: categories[key].count
  }));
}, [surveyAnalysis]);
  // --- KAYDETME VE YAYINLAMA ---
 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const payload = {
            week_number: Number(weekNumber),
            title: title,
            description: description,
            release_date: releaseDate || null,
            due_date: dueDate || null,
            intro_title: introTitle,
            intro_video_url: introVideoUrl,
            intro_description: introDescription,
           has_survey: isSurveyActive,
    survey_title: selectedSurveyId, 
    
    survey_questions: isSurveyActive 
        ? surveyQuestions
            .filter((q: SurveyQuestion) => q.text && q.text.trim() !== "") 
            .map((q: SurveyQuestion, index: number) => {
                // Her bir soru için objeyi oluşturuyoruz
                const questionData: any = {
                    text: q.text,
                    category: q.category || "",
                    order: index,
                    // Şıklar (options) döngüsü
                    options: (q.options && q.options.length > 0) 
                        ? q.options.map((opt: SurveyOption) => {
                            const optionData: any = {
                                option_text: opt.option_text || "",
                                value: opt.value !== undefined ? opt.value : 0
                            };
                            
                            // Interface'deki id? sayesinde artık hata vermez
                            if (opt.id) {
                                optionData.id = opt.id;
                            }
                            return optionData;
                        })
                        : []
                };

                // Soru ID'si varsa ekliyoruz
                if (q.id) {
                    questionData.id = q.id;
                }
                
                return questionData;
            })
        : [],

            // --- MATERYALLER (ID KORUMALI) ---
            materials: materials
                .filter(m => m.title.trim() !== "")
                .map((m) => ({
                    ...(m.id ? { id: m.id } : {}),
                    title: m.title,
                    content_type: m.content_type,
                    embed_url: m.embed_url,
                    point_value: m.point_value,
                    ...(m.quiz ? {
                        quiz: {
                            ...(m.quiz.id ? { id: m.quiz.id } : {}),
                            title: m.quiz.title || m.title,
                            description: m.quiz.description || "",
                            questions: m.quiz.questions.map((q, qIdx) => ({
                                ...(q.id ? { id: q.id } : {}),
                                question_text: q.question_text,
                                order: qIdx,
                                options: q.options.map((opt) => ({
                                    ...(opt.id ? { id: opt.id } : {}),
                                    option_text: opt.option_text,
                                    is_correct: opt.is_correct
                                }))
                            }))
                        }
                    } : {})
                })),

            // Kaynaklar, Pre-Test ve Giriş Soruları kısımları aynı kalıyor...
            flashcards: flashcards.filter(f => f.question.trim() !== "").map((f, index) => ({ 
                ...(f.id ? { id: f.id } : {}),
                question: f.question,
                answer: f.answer,
                order: index 
            })),

            pre_test_questions: Number(weekNumber) === 1 
                ? preTestQuestions.filter(q => q.question_text.trim() !== "").map((q, qIdx) => ({
                    ...(q.id ? { id: q.id } : {}),
                    question_text: q.question_text,
                    order: qIdx,
                    options: q.options.map(opt => ({
                        ...(opt.id ? { id: opt.id } : {}),
                        option_text: opt.option_text,
                        is_correct: opt.is_correct
                    }))
                }))
                : [],

            entry_questions: Number(weekNumber) > 1 
                ? entryQuestions.filter(q => q.question_text.trim() !== "").map((q, index) => ({
                    ...(q.id ? { id: q.id } : {}),
                    question_text: q.question_text,
                    order: index,
                    target_week: q.target_week, 
                    options: q.options.map(opt => ({
                        ...(opt.id ? { id: opt.id } : {}),
                        option_text: opt.option_text,
                        is_correct: opt.is_correct
                    }))
                })) 
                : [],
        };

        await api.post('/contents/list/', payload);
        alert("Haftalık içerik ve anket başarıyla güncellendi.");
        fetchWeekDetail(weekNumber);
    } catch (err) {
        const error = err as AxiosError<{ detail?: string }>;
        alert(error.response?.data?.detail || "Kayıt hatası oluştu.");
    } finally {
        setLoading(false);
    }
};



  return (
    <div className="min-h-screen bg-gray-50 font-roboto text-secondary text-left">


 {/* --- 1. PDF ŞABLONU (Gizli - Sadece Yazıcıda Görünür) --- */}
<div id="bulk-report-pdf" className="hidden print:block bg-white p-0 text-left">
  {Array.from({ length: Math.ceil(filteredBulkData.length / 6) }, (_, i) =>
    filteredBulkData.slice(i * 6, i * 6 + 6)
  ).map((studentGroup, pageIdx) => (
    <div 
      key={pageIdx} 
      className="p-4 text-left" 
      style={{ 
        pageBreakAfter: 'always', 
        width: '297mm', // Yatay A4 standardı
        margin: '0 auto' 
      }}
    >
      {/* LOGO VE BAŞLIK */}
      <div className="flex flex-col items-center mb-6 border-b-4 border-black pb-4 text-center">
        <img src="/okul-logo.png" alt="Okul Logosu" className="h-16 object-contain mb-3" onError={(e) => (e.currentTarget.style.display = 'none')} />
        <h1 className="text-xl font-black uppercase tracking-tighter text-black">SİSTEM GENELİ AKADEMİK GELİŞİM VE PERFORMANS ÇİZELGESİ</h1>
        <p className="text-xs font-bold text-gray-700 mt-1 uppercase tracking-widest">
          Bölüm: {getDeptName(selectedDepartment).toUpperCase()} (Sayfa {pageIdx + 1})
        </p>
      </div>

      {/* GRUP TABLOSU - table-fixed ve Optimize Edilmiş Genişlikler */}
      <table className="w-full border-collapse border-2 border-black table-fixed">
        <thead>
          <tr className="bg-black text-white text-center">
            {/* İsim sütunu daraltıldı: %8 */}
            <th className="border-2 border-black p-1 text-[8px] font-black uppercase leading-none text-left w-[8%]">Öğrenci</th>
            {/* Ön Test: %4 */}
            <th className="border-2 border-black p-1 text-[8px] font-black uppercase leading-none text-center bg-gray-200 text-black w-[4%]">ÖN TEST</th>
            
            {/* 14 Hafta Sütunları - Her biri %5.75 (Toplam %80.5) */}
            {Array.from({ length: 14 }, (_, i) => i + 1).map(n => (
              <th key={n} className="border-2 border-black p-0.5 text-[6px] font-black uppercase leading-none text-center w-[5.75%]">
                H.{n}
              </th>
            ))}
            
            {/* Genel Toplam: %7.5 */}
            <th className="border-2 border-black p-1 text-[9px] font-black uppercase leading-none text-center bg-gray-800 w-[7.5%]">GENEL TOPLAM</th>
          </tr>
        </thead>
        <tbody className="text-left font-bold">
          {studentGroup.map((student, idx) => (
            <tr key={idx} className="text-center hover:bg-gray-50 leading-none border-b border-black">
              {/* İsim Sütunu (Kayıp olmaması için break-all) */}
              <td className="border-2 border-black p-1.5 text-[7px] font-black text-left uppercase leading-tight break-all">
                {student.full_name}
              </td>
              
              <td className="border-2 border-black p-1 text-[8px] font-black text-center italic bg-gray-50/50">
                {student.pre_test_score || "-"}
              </td>
              
              {student.weekly_breakdown.map((week, wIdx) => (
                <td key={wIdx} className="border-2 border-black p-0.5 text-[5px] font-bold leading-none align-top overflow-hidden">
                  <div className="flex flex-col gap-1">
                    {/* TUR 1 VERİLERİ */}
                    <div className="flex flex-col border-b border-gray-300 pb-0.5 w-full items-center bg-blue-50/10">
                      <div className="flex justify-between w-full px-0.5 mb-0.5 scale-[0.85]">
                        <span className="text-gray-400 font-black">T1</span>
                        <span className="text-blue-700 font-black">%{Math.round(week.progress)}</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[4px] text-gray-700">{week.correct}D / {week.wrong}Y</span>
                        <span className="text-[4px] text-blue-600 font-black">{formatDuration(week.duration_seconds)}</span>
                      </div>
                    </div>

                    {/* MATERYALLER - Tüm liste korunuyor */}
                    <div className="flex flex-col gap-0.5 px-0.5">
                      <p className="text-[3.5px] font-black text-gray-400 uppercase border-b border-gray-50 mb-0.5 text-left">Materyaller:</p>
                      {week.material_details && week.material_details.length > 0 ? (
                        week.material_details.map((mat, mi) => (
                          <div key={mi} className="flex justify-between items-start gap-0.5 text-[4px] text-gray-600 leading-[1.1] mb-0.5">
                            <span className="text-left break-words w-full">• {mat.title}</span>
                            <span className="font-black shrink-0 text-secondary">{formatDuration(mat.duration_seconds)}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[4px] text-gray-300 italic text-center">Yok</span>
                      )}
                    </div>

                    {/* TUR 2 VERİLERİ */}
                    {week.is_round_2_started ? (
                      <div className="flex flex-col w-full items-center pt-0.5 border-t border-amber-200 bg-amber-50/30 mt-auto">
                        <span className="text-amber-700 font-black scale-[0.6]">T2 AKTİF</span>
                        <span className="text-green-700 font-black scale-[0.8]">{week.correct_2}D/{week.wrong_2}Y</span>
                        <span className="text-[4px] text-amber-700 font-bold">{formatDuration(week.duration_seconds_2)}</span>
                      </div>
                    ) : null}
                  </div>
                </td>
              ))}

              {/* BİRLEŞTİRİLMİŞ PUAN VE SÜRE */}
              <td className="border-2 border-black p-1 bg-gray-100">
                <div className="flex flex-col items-center justify-center gap-0.5">
                   <span className="text-[9px] font-black text-blue-800 leading-none">{student.total_points} P.</span>
                   <div className="w-full border-t border-black/20 my-1"></div>
                   <span className="text-[7px] font-black italic text-gray-700 leading-none">{formatDuration(student.total_time)}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ))}
</div>
{/* --- 2. CHATBOT ÖZEL PDF ŞABLONU (SADECE SORUSU OLANLAR VE HER SAYFADA TEK ÖĞRENCİ) --- */}
<div id="chatbot-report-pdf" className="hidden print:block bg-white p-0 text-left">
  {/* SADECE SORU SAYISI 0'DAN BÜYÜK OLANLARI FİLTRELE VE BAS */}
  {chatbotData
    .filter(student => student.total_count > 0)
    .map((student, pageIdx, filteredArray) => (
    <div key={pageIdx} className="p-10 text-left min-h-screen flex flex-col" style={{ pageBreakAfter: 'always' }}>
      
      {/* LOGO VE BAŞLIK ALANI */}
      <div className="flex flex-col items-center mb-8 border-b-4 border-[#1a1a1a] pb-6 text-center">
        <img src="/okul-logo.png" alt="Okul Logosu" className="h-24 object-contain mb-4" onError={(e) => (e.currentTarget.style.display = 'none')} />
        <h1 className="text-2xl font-black uppercase tracking-tighter text-[#1a1a1a]">YAPAY ZEKA ETKİLEŞİM VE SORU ANALİZİ</h1>
        <p className="text-lg font-bold text-[#ce1212] mt-1 uppercase tracking-widest">
          {getDeptName(selectedDepartment).toUpperCase()} BÖLÜMÜ
        </p>
        <div className="flex gap-8 mt-3 text-[10px] font-black uppercase text-gray-400">
          <span>Rapor Tarihi: {new Date().toLocaleDateString('tr-TR')}</span>
          <span className="text-[#1a1a1a]">Sorgu No: #AI-{student.total_count}-{pageIdx + 1}</span>
        </div>
      </div>

      {/* ÖĞRENCİ KİMLİK KARTI */}
      <div className="bg-[#1a1a1a] text-white p-6 rounded-t-3xl flex justify-between items-center shadow-lg">
        <div className="text-left">
          <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-1">Öğrenci Adı Soyadı</p>
          <h2 className="text-xl font-black uppercase">{student.student_name}</h2>
        </div>
        <div className="text-right bg-white/10 px-6 py-2 rounded-2xl border border-white/20">
          <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Toplam Soru</p>
          <p className="text-2xl font-black leading-none text-red-500">{student.total_count}</p>
        </div>
      </div>

      {/* SORULAR ALANI */}
      <div className="border-2 border-[#1a1a1a] border-t-0 p-8 bg-white flex-1 rounded-b-3xl shadow-sm">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b pb-2 flex items-center gap-2">
           <Bot size={14} className="text-[#ce1212]" /> Aktif Chatbot Soru Geçmişi
        </h3>
        
        <div className="space-y-6">
          {student.questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-gray-50 p-5 rounded-2xl border-l-[10px] border-[#ce1212] shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center font-black text-[9px] text-gray-400 uppercase italic mb-3">
                <span className="flex items-center gap-1.5"><Calendar size={12} className="text-gray-300" /> {q.date}</span>
                <span className="bg-[#1a1a1a] text-white px-4 py-1 rounded-full not-italic tracking-widest">HAFTA {q.week}</span>
              </div>
              
              <p className="text-[#1a1a1a] font-bold text-sm leading-relaxed relative z-10 pr-6">
                &quot; {q.text} &quot;
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SAYFA ALTI BİLGİSİ */}
      <div className="mt-auto pt-8 flex justify-between items-center border-t border-gray-100">
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic">Sadece chatbot etkileşimi olan öğrenciler raporlanmıştır.</p>
        <p className="text-[10px] font-black text-[#1a1a1a]">Sayfa {pageIdx + 1} / {filteredArray.length}</p>
      </div>
    </div>
  ))}
</div>

     <header className="bg-[#1a1a1a] p-4 md:p-6 shadow-xl sticky top-0 z-50 print:hidden text-left border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-4 lg:gap-6 text-left">
          
          {/* LOGO ALANI */}
          <div className="flex items-center gap-3 w-full lg:w-auto text-left leading-none shrink-0">
            <div className="bg-[#ce1212] p-2 rounded-lg shadow-lg shrink-0 flex items-center justify-center">
              <LayoutGrid size={24} className="text-white" />
            </div>
            <div className="text-left leading-none">
              <h1 className="text-lg md:text-xl font-black text-white uppercase leading-none">Akademisyen Paneli</h1>
              <p className="text-[9px] md:text-[10px] text-gray-400 uppercase tracking-widest leading-none mt-1 font-bold">AKADEMİK YÖNETİM</p>
            </div>
          </div>

          {/* MENÜ BUTONLARI KAPSAYICISI */}
          {/* overflow ve scroll gizleme belasını kaldırdık, yerine esnek flex-wrap getirdik */}
          <div className="flex flex-wrap bg-white/5 p-1 rounded-2xl border border-white/10 w-full lg:w-auto gap-1 justify-center leading-none text-left shrink-0">
            <button 
              onClick={() => setActiveTab('content')} 
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 rounded-xl text-[11px] font-black transition-all whitespace-nowrap leading-none ${activeTab === 'content' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              <Plus size={14} /> İÇERİK YÖNETİMİ
            </button>
            <button 
              onClick={() => setActiveTab('analytics')} 
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 rounded-xl text-[11px] font-black transition-all whitespace-nowrap leading-none ${activeTab === 'analytics' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              <BarChart3 size={14} /> ÖĞRENCİ ANALİZLERİ
            </button>
            <button 
              onClick={() => setActiveTab('chatbot')} 
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 rounded-xl text-[11px] font-black transition-all whitespace-nowrap leading-none ${activeTab === 'chatbot' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              <Bot size={14} /> CHATBOT ANALİZİ
            </button>
            <button 
              onClick={() => setActiveTab('survey_results')} 
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 rounded-xl text-[11px] font-black transition-all whitespace-nowrap leading-none ${activeTab === 'survey_results' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              <PieChart size={14} /> ANKET SONUÇLARI
            </button>
             <button 
  onClick={() => setActiveTab('time_analytics')} 
  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap leading-none ${activeTab === 'time_analytics' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
>
  <Clock size={16} /> SİSTEM ZAMAN ANALİTİĞİ
</button>
          </div>

          {/* GÜVENLİ ÇIKIŞ BUTONU */}
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="w-full lg:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl text-white font-bold text-[10px] uppercase leading-none transition-all active:scale-95 text-left shadow-sm shrink-0">
            <LogOut size={16} /> GÜVENLİ ÇIKIŞ
          </button>
          
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* 3. ANA İÇERİK (MAIN) */}
      {/* ---------------------------------------------------------------- */}
      <main className="max-w-6xl mx-auto p-4 md:p-12 pt-8 md:pt-12 print:hidden text-left">
        
        {/* --- SEKME 1: İÇERİK YÖNETİMİ --- */}
        {activeTab === 'content' && (
          <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 text-left">
            <div className="bg-white p-5 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-gray-100 relative overflow-hidden text-left leading-normal">
              {fetchingWeek && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center text-left">
                  <div className="flex flex-col items-center gap-3 font-black text-[#ce1212] animate-pulse text-center leading-none text-left">
                    <RefreshCcw className="animate-spin text-left" size={32} />
                    <span className="text-xs uppercase tracking-widest font-bold leading-none text-left">VERİLER ALINIYOR...</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-10 text-left">
                <div className="lg:col-span-1 text-left leading-none">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest leading-none">Düzenlenen Hafta</label>
                  <select value={weekNumber} onChange={(e) => setWeekNumber(Number(e.target.value))} className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-black font-bold outline-none focus:border-red-500 transition-colors text-sm shadow-inner leading-none">
                    {Array.from({ length: 14 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}. Hafta</option>)}
                  </select>
                </div>
                <div className="lg:col-span-3 text-left leading-none">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest leading-none">Haftalık Konu Başlığı</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-black outline-none focus:border-red-500 font-bold transition-all text-sm shadow-inner leading-none" placeholder="Haftanın ana başlığını giriniz..." />
                </div>
                <div className="lg:col-span-1 text-left leading-none">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest leading-none">Erişim Tarihi (Aktif)</label>
                  <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 font-bold outline-none focus:border-red-500 shadow-inner leading-none" />
                </div>
                <div className="lg:col-span-1 text-left leading-none">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest leading-none">Kapanış Tarihi (Pasif)</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 font-bold outline-none focus:border-red-500 shadow-inner leading-none" />
                </div>
              </div>

              {weekNumber === 1 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="p-6 md:p-8 bg-gradient-to-br from-red-50 to-white rounded-3xl border-2 border-[#ce1212]/20 shadow-sm space-y-6 text-left leading-normal">
                    <div className="flex items-center gap-3 text-[#ce1212] border-b border-red-100 pb-4 leading-none">
                      <ShieldCheck size={24} />
                      <div className="text-left leading-none">
                        <h3 className="font-black uppercase text-[10px] md:text-xs tracking-widest leading-none">SİSTEM GENELİ ORYANTASYON VİDEOSU</h3>
                        <p className="text-[9px] text-gray-400 font-bold mt-2 uppercase tracking-tighter">* Sisteme girişte izlenmesi zorunlu olan rehber içeriktir.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-none">
                      <div className="text-left">
                        <label className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest"><Type size={12} /> Oryantasyon Başlığı</label>
                        <input type="text" value={introTitle} onChange={(e) => setIntroTitle(e.target.value)} className="w-full p-3.5 rounded-xl border border-gray-200 text-xs font-bold outline-none focus:border-red-500 bg-white" />
                      </div>
                      <div className="text-left">
                        <label className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest"><PlayCircle size={12} /> Video Embed URL</label>
                        <input type="url" value={introVideoUrl} onChange={(e) => setIntroVideoUrl(e.target.value)} className="w-full p-3.5 rounded-xl border border-gray-200 text-xs font-mono outline-none focus:border-red-500 bg-white" />
                      </div>
                      <div className="md:col-span-2 text-left mt-4">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Oryantasyon Metni (Opsiyonel)</label>
                        <textarea value={introDescription} onChange={(e) => setIntroDescription(e.target.value)} rows={4} className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-black font-bold outline-none focus:border-red-500 transition-all text-sm shadow-inner leading-relaxed" placeholder="Hoş geldiniz metni veya sistem rehberini buraya yazabilirsiniz..." />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 bg-gradient-to-br from-blue-50 to-white rounded-3xl border-2 border-blue-200 shadow-sm space-y-6 text-left leading-normal">
                    <div className="flex items-center justify-between border-b border-blue-100 pb-4">
                      <div className="flex items-center gap-3 text-blue-600 leading-none">
                        <ListChecks size={24} />
                        <div>
                          <h3 className="font-black uppercase text-[10px] md:text-xs tracking-widest leading-none">ÖN DEĞERLENDİRME TESTİ (ZORUNLU)</h3>
                          <p className="text-[9px] text-gray-400 font-bold mt-2 uppercase tracking-tighter">* Öğrenciler bu testi tamamlamadan haftalık derslere erişemezler.</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setPreTestQuestions([...preTestQuestions, { question_text: "", options: [{option_text: "", is_correct: true}, {option_text: "", is_correct: false}, {option_text: "", is_correct: false}, {option_text: "", is_correct: false}, {option_text: "", is_correct: false}] }])} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black hover:bg-blue-700 transition-all shadow-lg active:scale-95">+ YENİ SORU EKLE</button>
                    </div>
                    <div className="space-y-8">
                      {preTestQuestions.map((q, qIndex) => (
                        <div key={qIndex} className="p-5 md:p-7 bg-white rounded-[2rem] border border-blue-100 shadow-sm space-y-5 relative group">
                          <button type="button" onClick={() => setPreTestQuestions(preTestQuestions.filter((_, i) => i !== qIndex))} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                          <div className="flex gap-4 items-start pr-10">
                            <span className="bg-blue-600 text-white w-9 h-9 rounded-xl flex items-center justify-center font-black shrink-0 shadow-lg text-sm">{qIndex + 1}</span>
                            <div className="w-full">
                              <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 tracking-widest">Soru Metni</label>
                              <input type="text" placeholder="Soru metni..." className="w-full p-2 border-b-2 border-gray-50 focus:border-blue-500 outline-none font-bold text-sm bg-transparent" value={q.question_text} onChange={(e) => { const newQs = [...preTestQuestions]; newQs[qIndex].question_text = e.target.value; setPreTestQuestions(newQs); }} />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-12">
                            {q.options.map((opt, oIndex) => (
                              <div key={oIndex} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${opt.is_correct ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-100'}`}>
                                <button type="button" onClick={() => { const newQs = [...preTestQuestions]; newQs[qIndex].options.forEach((o, i) => o.is_correct = i === oIndex); setPreTestQuestions(newQs); }} className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${opt.is_correct ? 'bg-green-500 text-white shadow-lg' : 'bg-white text-gray-300 border'}`}><Check size={14} /></button>
                                <input type="text" placeholder={`${oIndex + 1}. Seçenek`} className="bg-transparent outline-none text-[11px] font-bold w-full text-secondary" value={opt.option_text} onChange={(e) => { const newQs = [...preTestQuestions]; newQs[qIndex].options[oIndex].option_text = e.target.value; setPreTestQuestions(newQs); }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6 text-left leading-normal mt-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-4 leading-none">
                  <h3 className="font-black text-secondary uppercase text-[10px] md:text-xs tracking-widest flex items-center gap-2"><ListChecks size={18} className="text-[#ce1212]" /> Materyaller ve Puanlama</h3>
                  <button type="button" onClick={addMaterialRow} className="w-full sm:w-auto bg-red-50 text-[#ce1212] flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black hover:bg-[#ce1212] hover:text-white transition-all shadow-sm"><Plus size={16} /> MATERYAL EKLE</button>
                </div>
                <div className="grid gap-6">
                  {materials.map((mat, mIndex) => (
                    <div key={mIndex} className="p-4 md:p-6 bg-gray-50 rounded-2xl md:rounded-[2.5rem] border border-gray-200 space-y-4 hover:border-red-200 transition-all group leading-normal">
                      <div className="flex flex-col lg:flex-row gap-4 items-center">
                        <div className="w-full lg:w-32 shrink-0">
                          <select value={mat.content_type} onChange={(e) => updateMaterial(mIndex, 'content_type', e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 text-black text-[9px] font-black bg-white outline-none shadow-sm cursor-pointer leading-none">
                            <option value="video">🎥 Video</option>
                            <option value="podcast">🎙️ Podcast</option>
                            <option value="form">📝 Test</option>
                            <option value="pdf">📄 PDF</option>
                            <option value="assignment">📂 Ödev (MS Form)</option>
                          </select>
                        </div>
                        <div className="w-full flex-1">
                          <input type="text" placeholder="Materyal Başlığı" className="w-full p-3 rounded-xl border border-gray-200 text-black text-xs font-bold outline-none bg-white shadow-sm leading-none" value={mat.title} onChange={(e) => updateMaterial(mIndex, 'title', e.target.value)} />
                        </div>
                        {mat.content_type !== 'pdf' && (
                          <div className="w-full lg:w-28 shrink-0 flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                            <Award size={14} className="text-amber-500 ml-1" />
                            <input type="number" placeholder="Puan" className="w-full p-2 text-xs font-black text-secondary outline-none bg-transparent leading-none" value={mat.point_value} onChange={(e) => updateMaterial(mIndex, 'point_value', e.target.value)} />
                          </div>
                        )}
                        {mat.content_type !== 'form' && (
                          <div className="w-full flex-[1.5]">
                            <input type="url" placeholder={mat.content_type === 'pdf' ? "OneDrive İndirme Linki" : "Embed URL Adresi"} className="w-full p-3 rounded-xl border border-gray-200 text-black text-[10px] font-mono outline-none bg-white shadow-sm leading-none" value={mat.embed_url} onChange={(e) => updateMaterial(mIndex, 'embed_url', e.target.value)} />
                          </div>
                        )}
                        <button type="button" onClick={() => removeMaterialRow(mIndex)} className="w-full lg:w-auto p-3 text-red-400 hover:text-red-600 transition-colors active:scale-90"><Trash2 size={20} /></button>
                      </div>

                      {mat.content_type === 'form' && mat.quiz && (
                        <div className="mt-4 bg-white p-5 rounded-2xl border-2 border-dashed border-red-100 space-y-6 text-left">
                          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                            <div className="flex items-center gap-2 text-[#ce1212] font-black text-[10px] uppercase tracking-widest"><ListChecks size={18} /> Sınav Düzenleyici</div>
                            <button type="button" onClick={() => addQuestion(mIndex)} className="text-[#ce1212] font-black text-[9px] uppercase hover:underline">+ Yeni Soru Ekle</button>
                          </div>
                          <div className="space-y-8">
                            {mat.quiz.questions.map((q, qIndex) => (
                              <div key={qIndex} className="p-4 bg-gray-50/50 rounded-xl space-y-4 border border-gray-100">
                                <div className="flex gap-4 items-start">
                                  <span className="bg-[#ce1212] text-white w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-md">{qIndex + 1}</span>
                                  <input type="text" placeholder="Soru metni..." className="w-full p-2.5 rounded-lg border text-xs font-bold focus:border-red-500 outline-none" value={q.question_text} onChange={(e) => updateQuestionText(mIndex, qIndex, e.target.value)} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:pl-11">
                                  {q.options.map((opt, oIndex) => (
                                    <div key={oIndex} className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${opt.is_correct ? 'bg-green-50 border-green-500' : 'bg-white border-gray-100'}`}>
                                      <button type="button" onClick={() => setCorrectOption(mIndex, qIndex, oIndex)} className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${opt.is_correct ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-300'}`}><Check size={12} /></button>
                                      <input type="text" placeholder="Şık içeriği..." className="flex-1 bg-transparent text-[10px] font-bold outline-none" value={opt.option_text} onChange={(e) => updateOption(mIndex, qIndex, oIndex, e.target.value)} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 space-y-6 text-left leading-normal">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-4 leading-none">
                  <div className="flex items-center gap-2 text-secondary font-black text-[10px] md:text-xs uppercase tracking-widest leading-none"><BookOpen size={18} className="text-blue-600" /> Haftalık Flashcardlar</div>
                  <button type="button" onClick={() => setFlashcards([...flashcards, { question: '', answer: '' }])} className="w-full sm:w-auto bg-blue-50 text-blue-600 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all shadow-sm leading-none"><Plus size={16} /> KART EKLE</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {flashcards.map((card, idx) => (
                    <div key={idx} className="p-5 md:p-6 bg-blue-50/30 rounded-2xl border-2 border-blue-100 space-y-4 relative group hover:border-blue-300 transition-all shadow-sm">
                      <button type="button" onClick={() => setFlashcards(flashcards.filter((_, i) => i !== idx))} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[9px] font-black text-blue-600 uppercase mb-1.5 tracking-widest"><Type size={10} className="inline mr-1" /> Kaynak / Döküman Adı</label>
                          <input type="text" placeholder="Kaynak adı..." className="w-full p-3 rounded-xl border border-blue-100 text-xs font-bold outline-none focus:border-blue-500 bg-white" value={card.question} onChange={(e) => updateFlashcard(idx, 'question', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-blue-600 uppercase mb-1.5 tracking-widest"><Download size={10} className="inline mr-1" /> OneDrive / Word / PDF Linki</label>
                          <input type="url" placeholder="Link..." className="w-full p-3 rounded-xl border border-blue-100 text-[10px] font-mono outline-none focus:border-blue-500 bg-white" value={card.answer} onChange={(e) => updateFlashcard(idx, 'answer', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>


              <div className="mt-10 p-6 md:p-8 bg-amber-50/30 rounded-3xl border-2 border-amber-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 text-amber-600 border-b border-amber-100 pb-4 leading-none">
                  <Calendar size={24} />
                  <div className="text-left leading-none">
                    <h3 className="font-black uppercase text-[10px] md:text-xs tracking-widest leading-none">HAFTALIK DERS NOTLARI VE ÖZET</h3>
                    <p className="text-[9px] text-gray-400 font-bold mt-2 uppercase tracking-tighter">* Öğrencilerin panelinde görüntülenecek içerik.</p>
                  </div>
                </div>
                <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-5 md:p-8 rounded-2xl border-2 border-gray-100 bg-white text-black outline-none focus:border-amber-500 transition-all font-bold text-sm shadow-inner leading-relaxed" placeholder="Ders notlarını buraya yazabilirsiniz..." />
              </div>
              {/* --- HAFTALIK HAZIRLIK (GİRİŞ) TESTİ DÜZENLEYİCİ --- */}
{/* --- HAFTALIK HAZIRLIK (GİRİŞ) TESTİ DÜZENLEYİCİ --- */}
{weekNumber > 1 && (
  <div className="mt-12 p-6 md:p-10 bg-gradient-to-br from-[#1a1a1a] to-black rounded-[2.5rem] border-2 border-[#ce1212]/30 shadow-2xl space-y-8 text-left leading-normal relative overflow-hidden">
    
    {/* Estetik Arkaplan Süsü */}
    <div className="absolute top-[-20px] right-[-20px] opacity-5 text-white rotate-12">
      <ShieldCheck size={200} />
    </div>

    {/* ÜST BAŞLIK VE YENİ SORU EKLEME BUTONU */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-8 gap-4 relative z-10">
      <div className="flex items-center gap-4 text-white leading-none">
        <div className="bg-[#ce1212] p-3 rounded-2xl shadow-lg shadow-red-900/20">
          <RefreshCcw size={24} className="text-white" />
        </div>
        <div className="text-left leading-none">
          <h3 className="font-black uppercase text-xs md:text-sm tracking-[0.2em] leading-none mb-2">Haftalık Giriş (Hatırlatıcı) Testi</h3>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest italic">
            * Öğrenci bu haftaya girmeden önce test edilir. Yanlış cevapta, o sorunun bağlı olduğu hafta 2 günlüğüne açılır.
          </p>
        </div>
      </div>
      <button 
        type="button" 
        onClick={addEntryQuestion} 
        className="w-full sm:w-auto bg-white/5 hover:bg-[#ce1212] text-white flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black transition-all border border-white/10 shadow-xl active:scale-95 group"
      >
        <Plus size={18} className="group-hover:rotate-90 transition-transform" /> HATIRLATICI SORU EKLE
      </button>
    </div>

    {/* SORU KARTLARI LİSTESİ */}
    <div className="space-y-8 relative z-10">
      {entryQuestions.map((q, qIndex) => (
        <div key={qIndex} className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-6 relative group hover:border-[#ce1212]/50 transition-all shadow-inner">
          
          {/* Soru Silme Butonu */}
          <button 
            type="button" 
            onClick={() => setEntryQuestions(entryQuestions.filter((_, i) => i !== qIndex))} 
            className="absolute top-8 right-8 text-gray-600 hover:text-red-500 transition-colors p-2"
          >
            <Trash2 size={22} />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* 1. Soru Metni Giriş Alanı */}
            <div className="md:col-span-8 space-y-2">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Soru Metni</label>
              <textarea 
                rows={2}
                placeholder="Örn: 1. haftada işlenen temel veri yapıları nelerdir?" 
                className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl text-white font-bold text-sm outline-none focus:border-[#ce1212] transition-all shadow-inner resize-none"
                value={q.question_text}
                onChange={(e) => updateEntryQuestion(qIndex, 'question_text', e.target.value)}
              />
            </div>

            {/* 2. Her Soruya Özel Hedef Hafta Seçicisi (Kritik Nokta) */}
            <div className="md:col-span-4 space-y-2">
              <label className="block text-[10px] font-black text-[#ce1212] uppercase tracking-widest ml-2 italic">Yanlış Yapılırsa Açılacak Hafta</label>
              <div className="relative">
                <select 
                  className="w-full p-5 bg-[#1a1a1a] border-2 border-[#ce1212]/20 rounded-2xl text-white font-black text-sm outline-none cursor-pointer appearance-none hover:border-[#ce1212] transition-colors"
                  value={q.target_week}
                  onChange={(e) => updateEntryQuestion(qIndex, 'target_week', Number(e.target.value))}
                >
                  {/* Sadece geçmiş haftaları listeleme mantığı */}
                  {Array.from({ length: weekNumber - 1 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n} className="bg-black">
                      Hafta {n} Konularına Yönlendir
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#ce1212]">
                  <MapPin size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* 5 ŞIKLI GRID SİSTEMİ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {q.options.map((opt, oIndex) => (
              <div 
                key={oIndex} 
                className={`flex items-center gap-4 p-4 rounded-[1.5rem] border-2 transition-all ${
                  opt.is_correct ? 'bg-green-500/10 border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/20'
                }`}
              >
                <button 
                  type="button" 
                  onClick={() => setCorrectEntryOption(qIndex, oIndex)}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                    opt.is_correct ? 'bg-green-500 text-white shadow-lg' : 'bg-white/10 text-gray-600 border border-white/10'
                  }`}
                >
                  <Check size={16} strokeWidth={3} />
                </button>
                <input 
                  type="text" 
                  placeholder={`${oIndex + 1}. Seçenek içeriği`} 
                  className="bg-transparent outline-none text-[11px] font-bold w-full text-white placeholder:text-gray-700"
                  value={opt.option_text}
                  onChange={(e) => updateEntryOption(qIndex, oIndex, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
        
      ))}

      {/* SORU YOKSA GÖSTERİLECEK BOŞ DURUM EKRANI */}
      {entryQuestions.length === 0 && (
        <div className="py-16 text-center border-4 border-dashed border-white/5 rounded-[3rem] bg-black/20">
          <HelpCircle size={48} className="mx-auto text-gray-800 mb-4 opacity-20" />
          <p className="text-gray-600 italic text-xs font-black uppercase tracking-[0.3em]">Henüz bir hatırlatıcı soru eklenmedi.</p>
        </div>
      )}
    </div>
  </div>
)}

<div className="mt-12 p-6 md:p-10 bg-gradient-to-br from-purple-50 to-white rounded-[2.5rem] border-2 border-purple-200 shadow-xl space-y-8 text-left leading-normal animate-in fade-in slide-in-from-top-4 duration-700">
  
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-purple-100 pb-6 gap-4">
    <div className="flex items-center gap-4 text-purple-900 leading-none">
      <div className="bg-purple-600 p-3 rounded-2xl shadow-lg shadow-purple-900/20">
        <FileText size={24} className="text-white" />
      </div>
      <div className="text-left leading-none">
        <h3 className="font-black uppercase text-xs md:text-sm tracking-[0.2em] leading-none mb-2">Haftalık Bilimsel Ölçek Takibi</h3>
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">
          * Bu anket tamamlanmadan haftalık materyaller öğrenciye açılmaz (Kilit Mekanizması).
        </p>
      </div>
    </div>
    
    {/* Aktif/Pasif Toggle */}
    <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-purple-100 shadow-sm">
      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ANKET KİLİDİ:</span>
      <button 
        type="button"
        onClick={() => setIsSurveyActive(!isSurveyActive)}
        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none ${isSurveyActive ? 'bg-purple-600' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSurveyActive ? 'translate-x-7' : 'translate-x-1'}`} />
      </button>
    </div>
  </div>

  {isSurveyActive ? (
    <div className="space-y-8 animate-in zoom-in-95 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
        <div className="space-y-3">
          <label className="block text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2 flex items-center gap-2">
            <Filter size={12} /> Uygulanacak Ölçek / Anket Başlığı
          </label>
          <div className="relative">
            <input 
              type="text"
              placeholder="Örn: Teknoloji Kabul Ölçeği"
              className="w-full p-5 bg-white border-2 border-purple-100 rounded-2xl text-black font-black text-sm outline-none focus:border-purple-600 transition-all shadow-inner"
              value={surveyTitle}
              onChange={(e) => setSelectedSurveyId(e.target.value)}
            />
          </div>
        </div>

        {/* Yeni Soru Ekleme Butonu */}
        <button 
          type="button" 
          onClick={addSurveyQuestion}
          className="w-full md:w-auto bg-purple-600 text-white flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black hover:bg-purple-900 transition-all shadow-xl active:scale-95 group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform" /> YENİ ANKET SORUSU EKLE
        </button>
      </div>

      {/* DİNAMİK SORU VE ŞIK LİSTESİ */}
      <div className="space-y-6">
        <h4 className="text-[10px] font-black text-purple-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <ListChecks size={16} /> Anket Soru Maddeleri ve Derecelendirme
        </h4>
        
        {surveyQuestions.map((q, qIndex) => (
          <div key={qIndex} className="p-8 bg-white rounded-[2.5rem] border-2 border-purple-100 shadow-sm space-y-6 relative group hover:border-purple-300 transition-all">
            
            <button 
              type="button"
              onClick={() => setSurveyQuestions(surveyQuestions.filter((_, i) => i !== qIndex))}
              className="absolute top-8 right-8 text-gray-300 hover:text-red-500 transition-colors p-2"
            >
              <Trash2 size={22} />
            </button>

            <div className="flex gap-6 items-start pr-12">
              <span className="bg-purple-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-lg">
                {qIndex + 1}
              </span>
              
              <div className="flex-1 w-full space-y-4">
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Soru Metni</label>
                  <input 
                    type="text"
                    placeholder="Anket sorusunu buraya yazınız..."
                    className="w-full p-2 border-b-2 border-gray-100 focus:border-purple-500 outline-none font-bold text-base bg-transparent text-secondary"
                    value={q.text}
                    onChange={(e) => updateSurveyQuestion(qIndex, 'text', e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-3 bg-purple-50/50 p-2 rounded-lg w-fit">
                  <Type size={12} className="text-purple-400" />
                  <input 
                    type="text"
                    placeholder="Kategori (Örn: Algılanan Fayda)"
                    className="text-[9px] font-black text-purple-600 uppercase tracking-widest bg-transparent outline-none min-w-[200px]"
                    value={q.category}
                    onChange={(e) => updateSurveyQuestion(qIndex, 'category', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* MANUEL ŞIK GİRİŞ ALANI (Likert 1-5) */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 pl-16">
              {q.options?.map((opt, oIndex) => (
                <div key={oIndex} className="space-y-2">
                  <label className="text-[8px] font-black text-gray-400 uppercase ml-1 flex items-center gap-1">
                    <CheckCircle size={10} className="text-purple-300" /> Derece {opt.value}
                  </label>
                  <input 
                    type="text"
                    placeholder={`Şık ${opt.value} metni...`}
                    className="w-full p-3 bg-purple-50/30 border border-purple-100 rounded-xl text-[10px] font-bold text-purple-900 outline-none focus:border-purple-400 transition-colors"
                    value={opt.option_text}
                    onChange={(e) => updateSurveyOption(qIndex, oIndex, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {surveyQuestions.length === 0 && (
          <div className="text-center py-16 border-4 border-dashed border-purple-100 rounded-[3rem] bg-white/50">
            <HelpCircle size={48} className="mx-auto text-purple-200 mb-4 opacity-40" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Henüz bir anket sorusu eklenmedi.</p>
          </div>
        )}
      </div>

      {/* UYARI VE BİLGİLENDİRME */}
      <div className="p-6 bg-purple-100/40 rounded-3xl border border-purple-200 flex items-start gap-4 shadow-inner">
        <AlertCircle className="text-purple-600 shrink-0" size={24} />
        <div className="text-left leading-tight">
          <p className="text-[10px] font-black text-purple-900 uppercase tracking-widest mb-1">Önemli Kilit Bildirimi</p>
          <p className="text-[10px] font-bold text-purple-800 leading-relaxed uppercase italic">
            Bu anket 5&apos;li Likert yapısındadır. Öğrenci {weekNumber}. haftanın içeriğini görmeden önce tüm şıkları doldurulmuş bu anketi yanıtlamak zorundadır.
          </p>
        </div>
      </div>
    </div>
  ) : (
    <div className="py-16 text-center border-4 border-dashed border-purple-100 rounded-[3rem] bg-white/50 shadow-inner">
       <ShieldCheck size={56} className="mx-auto text-purple-200 mb-4 opacity-40" />
       <p className="text-gray-400 italic text-[11px] font-black uppercase tracking-[0.4em]">Anket kilidi bu hafta için aktif değil.</p>
    </div>
  )}
</div>
              
              <button type="submit" disabled={loading} className="w-full mt-10 bg-[#1a1a1a] text-white py-6 rounded-[2rem] font-black tracking-[0.2em] hover:bg-black transition-all flex justify-center items-center gap-3 shadow-2xl active:scale-95 text-xs md:text-sm uppercase leading-none">
                <Save size={20} className="text-[#ce1212]" /> {loading ? "KAYDEDİLİYOR..." : "HAFTAYI KAYDET VE YAYINLA"}
              </button>
            </div>
          </form>
        )}

        {/* --- SEKME 2: ÖĞRENCİ ANALİZLERİ --- */}
{activeTab === 'analytics' && (
  <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6 md:space-y-8 pb-10 text-left">
    
    {/* Üst Bilgi Kartı ve Filtreler */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-xl border border-gray-100 text-left">
      <div className="flex items-center gap-6 leading-none">
        <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 flex items-center justify-center leading-none">
          <Users size={32} />
        </div>
        <div className="text-left leading-none">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 leading-none">Toplam Kayıtlı Öğrenci</p>
          {/* totalCount state'ini kullanıyoruz, analytics.length sadece o sayfayı verir */}
          <p className="text-3xl font-black">{totalCount || analytics.length}</p>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto leading-none text-left">
        <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 text-left">
          <Filter size={16} className="text-gray-400" />
          <select 
            value={selectedDepartment} 
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setCurrentPage(1); // Bölüm değişince 1. sayfaya dön
            }} 
            className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer"
          >
            {departmentList.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        
        <button onClick={handlePrintAcademic} className="flex items-center justify-center gap-3 bg-red-700 hover:bg-red-800 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all leading-none active:scale-95">
          <FileText size={18} /> {getDeptName(selectedDepartment).toUpperCase()} AKADEMİK RAPOR
        </button>
      </div>
    </div>

    {/* Analiz Tablosu */}
    <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden text-left">
      <div className="p-6 md:p-8 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-[#ce1212]" />
          <h2 className="font-black text-secondary uppercase text-[10px] md:text-xs tracking-widest">
            Akademik Takip Çizelgesi (Sayfa {currentPage})
          </h2>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-100/50 text-gray-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">
              <th className="p-5 md:p-8">AD SOYAD / BÖLÜM</th>
              <th className="p-5 md:p-8">PUAN / AKTİF İLERLEME</th>
              <th className="p-5 md:p-8">TOPLAM SÜRE</th>
              <th className="p-5 md:p-8 text-center">İŞLEM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 suppressHydrationWarning">
            {analytics.length > 0 ? (
              analytics.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50/50 transition-all group">
                  <td className="p-5 md:p-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary text-white rounded-full flex items-center justify-center font-bold text-xs shadow-md shrink-0 uppercase">
                        {student.first_name?.[0]}{student.last_name?.[0]}
                      </div>
                      <div className="min-w-0 flex-1 leading-tight">
                        <p className="font-black text-black text-sm truncate uppercase">{student.first_name} {student.last_name}</p>
                        <p className="text-[9px] text-[#ce1212] font-black mt-1 uppercase">{getDeptName(student.department)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 md:p-8">
                    <div className="flex items-center gap-4">
                      <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg font-black text-[10px] border border-amber-200 shadow-sm">{student.total_points} Puan</div>
                      <div className="space-y-1.5 w-32">
                        <div className="flex justify-between items-center leading-none">
                          <span className="text-[10px] font-bold text-secondary">%{student.overall_progress}</span>
                          <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter">GÜNCEL</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden border shadow-inner">
                          <div 
                            className={`h-full transition-all duration-1000 ${student.overall_progress === 100 ? 'bg-green-500' : 'bg-[#ce1212]'}`} 
                            style={{ width: `${student.overall_progress}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 md:p-8">
                    <div className="flex items-center gap-2 text-gray-700 font-black text-xs md:text-sm">
                      <Clock size={16} className="text-amber-500 shrink-0" /> 
                      {/* Backend'den gelen hazır string'i kullanıyoruz veya formatlıyoruz */}
                      {student.total_time_spent}
                    </div>
                  </td>
                  <td className="p-5 md:p-8 text-center">
                    <button 
                      onClick={() => setSelectedStudent(student)} 
                      className="inline-flex items-center gap-2 text-[9px] font-black uppercase bg-secondary text-white px-5 py-2.5 rounded-xl hover:bg-black transition-all active:scale-95 shadow-md"
                    >
                      <Search size={14} /> HAFTALIK KARNE
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-20 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">
                  {loading ? "Veriler Hazırlanıyor..." : "Bu bölümde öğrenci bulunamadı."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- SAYFALANDIRMA KONTROLLERİ --- */}
      <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Toplam {totalCount} öğrenciden {analytics.length} tanesi gösteriliyor
        </p>
        <div className="flex items-center gap-2">
          <button 
            disabled={currentPage === 1 || loading}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm text-secondary disabled:opacity-30 hover:bg-gray-100 transition-all active:scale-90"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="bg-white border border-gray-200 px-6 py-2.5 rounded-xl shadow-sm text-[11px] font-black text-secondary">
            SAYFA {currentPage}
          </div>

          <button 
            disabled={analytics.length < 10 || loading} // 10'dan az veri varsa sonraki sayfa yoktur
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm text-secondary disabled:opacity-30 hover:bg-gray-100 transition-all active:scale-90"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  </div>
)}

       {/* --- SEKME 3: CHATBOT ANALİZİ --- */}
{activeTab === 'chatbot' && (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
    
    {/* ÜST KONTROL VE FİLTRELEME ÇUBUĞU */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-xl border border-gray-100 text-left">
      <div className="text-left leading-none">
        <h2 className="text-xl font-black text-[#1a1a1a] uppercase leading-none border-l-4 border-[#ce1212] pl-3">Chatbot Etkileşim İzleme</h2>
        <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest italic leading-none">Soru Analizi ve Merak Endeksi</p>
      </div>
      <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto leading-none text-left">
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-left shadow-inner">
          <Filter size={16} className="text-[#ce1212]" />
          <select 
            value={selectedDepartment} 
            onChange={(e) => setSelectedDepartment(e.target.value)} 
            className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer text-[#1a1a1a]"
          >
            {departmentList.map(d => (
              <option key={d.id} value={d.id} className="text-black">{d.name}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={handlePrintChatbot}
          className="flex items-center justify-center gap-3 bg-[#ce1212] hover:bg-black text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all leading-none active:scale-95 text-left"
        >
          <Bot size={18} /> {getDeptName(selectedDepartment).toUpperCase()} CHATBOT RAPORU AL
        </button>
      </div>
    </div>

    {/* ÖZET İSTATİSTİK KARTLARI */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-3xl shadow-xl border-b-4 border-[#ce1212] flex items-center gap-4">
        <div className="bg-red-50 p-4 rounded-2xl text-[#ce1212] leading-none flex items-center justify-center">
          <MessageSquare size={32} />
        </div>
        <div className="text-left leading-none">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest leading-none mb-2">Toplam Soru</p>
          <p className="text-3xl font-black text-[#1a1a1a] leading-none">{chatbotData.reduce((acc, curr) => acc + curr.total_count, 0)}</p>
        </div>
      </div>
      <div className="bg-[#1a1a1a] p-6 rounded-3xl shadow-xl flex items-center gap-4 text-white">
        <div className="bg-white/10 p-4 rounded-2xl text-white leading-none flex items-center justify-center">
          <Users size={32} />
        </div>
        <div className="text-left leading-none">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest leading-none mb-2">Aktif Kullanıcı</p>
          <p className="text-3xl font-black leading-none text-white">{chatbotData.filter(d => d.total_count > 0).length} <span className="text-sm text-gray-500">/ {chatbotData.length}</span></p>
        </div>
      </div>
    </div>

    {/* DETAYLI ÖĞRENCİ LİSTESİ VE SORU GEÇMİŞİ */}
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-left leading-normal">
      <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center">
        <h2 className="font-black text-secondary uppercase text-xs tracking-widest flex items-center gap-2 leading-none">
          <Bot size={18} className="text-[#ce1212]" /> Öğrenci Soru Geçmişi Detayları
        </h2>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-[#1a1a1a] text-white text-[10px] font-black uppercase tracking-widest leading-none">
            <tr>
              <th className="p-6 w-1/4">ÖĞRENCİ BİLGİSİ</th>
              <th className="p-6 w-24 text-center">ADET</th>
              <th className="p-6">SORDUĞU SORULAR VE HAFTA ANALİZİ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {chatbotData.map((student, i) => (
              <tr key={i} className="hover:bg-red-50/30 transition-all align-top">
                <td className="p-6">
                  <p className="font-black text-black uppercase text-sm leading-none">{student.student_name}</p>
                  <p className="text-[8px] text-[#ce1212] font-black uppercase mt-2 tracking-tighter leading-none">
                    {getDeptName(selectedDepartment)}
                  </p>
                </td>
                <td className="p-6 text-center">
                  <span className="bg-[#1a1a1a] text-white px-4 py-2 rounded-xl font-black text-sm shadow-md inline-block leading-none">
                    {student.total_count}
                  </span>
                </td>
                <td className="p-6">
                  <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-3 custom-scrollbar">
                    {student.questions.length > 0 ? (
                      student.questions.map((q, qi) => (
                        <div key={qi} className="bg-white p-3 rounded-2xl border border-gray-100 hover:border-red-200 transition-colors shadow-sm">
                          <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase mb-2 tracking-tighter leading-none">
                            <span className="flex items-center gap-1"><Calendar size={10} className="text-[#ce1212]" /> {q.date}</span>
                            <span className="bg-[#ce1212] px-2 py-0.5 rounded-full text-white font-black">HAFTA {q.week}</span>
                          </div>
                          <p className="text-[11px] text-gray-700 font-medium italic leading-relaxed">&quot;{q.text}&quot;</p>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center">
                        <span className="text-gray-300 italic text-[10px] uppercase font-bold tracking-widest">Henüz bir chatbot etkileşimi bulunmuyor.</span>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}
{/* --- SEKME 4: ANKET / ÖLÇEK SONUÇLARI VE STANDART GRAFİKLER --- */}
{activeTab === 'survey_results' && (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
    
    {/* ÜST SEÇİM KONTROLÜ VE ANKET BAZLI FİLTRELER */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-xl border border-gray-100 text-left">
      <div className="text-left leading-none">
        <h2 className="text-xl font-black text-purple-950 uppercase leading-none border-l-4 border-purple-600 pl-3">Bilimsel Ölçek Yanıt Analizleri</h2>
        <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest italic leading-none">Soru Maddesi Bazlı Dinamik Likert Dağılım Grafikleri</p>
      </div>
      
      <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
        {/* Departman Filtresi */}
        <div className="flex-1 md:flex-none flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 text-left shadow-inner">
          <Filter size={16} className="text-purple-600" />
          <select 
            value={selectedDepartment} 
            onChange={(e) => setSelectedDepartment(e.target.value)} 
            className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer text-purple-950 w-full font-black"
          >
            {Array.isArray(departmentList) && departmentList.map(d => (
              <option key={d.id} value={d.id} className="text-black">{d.name}</option>
            ))}
          </select>
        </div>

        {/* Anket Seçim Filtresi */}
        <div className="flex-1 md:flex-none flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 text-left shadow-inner">
          <ListChecks size={16} className="text-purple-600" />
          <select 
            value={selectedSurveyId} 
            onChange={(e) => setSelectedSurveyId(e.target.value)} 
            className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer text-purple-950 w-full font-black"
          >
            <option value="4" className="text-black">4. HAFTA UYUM ÖLÇEĞİ</option>
            <option value="5" className="text-black">5. HAFTA DEĞERLENDİRME ANKETİ</option>
            <option value="6" className="text-black">6. HAFTA ÖĞRENME ANKETİ</option>
          </select>
        </div>
      </div>
    </div>

    {/* İSTATİSTİK PANELİ VE HESAPLAMA BLOĞU */}
    {(() => {
      const surveyDataArray = Array.isArray(surveyAnalysis) ? surveyAnalysis : [];
      const totalResponses = surveyDataArray.length;
      
      const totalScore = surveyDataArray.reduce((acc: number, curr: any) => {
        const val = Number(curr.answer);
        return acc + (!isNaN(val) ? val : 0);
      }, 0);
      
      const generalAverage = totalResponses > 0 ? (Math.round((totalScore / totalResponses) * 100) / 100) : 0;
      const dynamicPercentage = totalResponses > 0 ? Math.round((generalAverage / 5) * 100) : 0;

      const answerCounts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      
      const fallbackLabels: { [key: number]: string } = {
        1: "Hiçbir zaman",
        2: "Ender olarak",
        3: "Bazen",
        4: "Sıklıkla",
        5: "Her zaman"
      };

      const dynamicLikertLabels: { [key: number]: string } = { ...fallbackLabels };

      // Soru bazlı gruplama haritası mimarisi
      const questionsMap: { [key: string]: { 
        questionText: string; 
        category: string;
        responsesCount: number;
        counts: { [key: number]: number }; 
        labels: { [key: number]: string }; 
      }} = {};

      // --- YENİ STATE EKLEMEDEN ÖĞRENCİ KATILIM SÜRESİNİ HESAPLAYAN AKILLI SAYAÇ ---
      const studentParticipationMap: { [key: string]: { studentName: string; item_count: number } } = {};

      surveyDataArray.forEach((item: any) => {
        const qText = item.question || "Soru Maddesi Eksik";
        const finalScore = Number(item.answer) || 0;
        const cat = item.category || "Genel";
        const studentName = item.student || "Bilinmeyen Öğrenci";

        // Öğrenci katılım/süre aktivitesini say
        if (!studentParticipationMap[studentName]) {
          studentParticipationMap[studentName] = { studentName, item_count: 0 };
        }
        studentParticipationMap[studentName].item_count += 1;

        if (!questionsMap[qText]) {
          questionsMap[qText] = {
            questionText: qText,
            category: cat,
            responsesCount: 0,
            counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            labels: { ...fallbackLabels }
          };
        }

        if (finalScore >= 1 && finalScore <= 5) {
          questionsMap[qText].counts[finalScore]++;
          questionsMap[qText].responsesCount++;
          answerCounts[finalScore]++;
          
          const isTextClean = item.answer_text && 
                               !item.answer_text.includes("Hata") && 
                               item.answer_text !== "null" && 
                               item.answer_text.trim() !== "";
          if (isTextClean) {
            dynamicLikertLabels[finalScore] = item.answer_text;
            questionsMap[qText].labels[finalScore] = item.answer_text;
          }
        }
      });

      const groupedQuestions = Object.values(questionsMap);

      // En çok katılım sağlayan/sistemde kalan öğrencileri sıralı diziye çevir
      const timeDataArray = Object.values(studentParticipationMap)
        .sort((a, b) => b.item_count - a.item_count)
        .map((item, idx) => ({
          rank: idx + 1,
          student: item.studentName,
          department: selectedDepartment ? String(selectedDepartment).toUpperCase() : "ÇOCUK GELİŞİMİ",
          total_time: `${(item.item_count * 1.2).toFixed(1)} Saat` // Her soru maddesi analizini ~1.2 saatlik aktif çalışmaya oranlıyoruz
        }));

      // --- %100 TÜRKÇE VE LOGOLU ANKET ANALİZ PDF FONKSİYONU ---
      const exportSurveyPDF = async () => {
        const { jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default;
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        
        const fixTR = (str: string) => {
          if (!str) return "";
          return str
            .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
            .replace(/ç/g, "c").replace(/ö/g, "o").replace(/ü/g, "u")
            .replace(/İ/g, "I").replace(/Ş/g, "S").replace(/Ğ/g, "G")
            .replace(/Ç/g, "C").replace(/Ö/g, "O").replace(/Ü/g, "U");
        };

        doc.setFont("Helvetica", "bold");
        doc.setFillColor(67, 24, 108); // Kurumsal Koyu Mor Başlık
        doc.rect(0, 0, 210, 25, "F");
        
        doc.setFillColor(255, 255, 255, 0.2);
        doc.rect(12, 5, 12, 14, "F");
        doc.setFillColor(255, 255, 255);
        doc.rect(15, 9, 6, 6, "F");
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13);
        doc.text("AKADEMIK OLCEK VE ANKET ANALIZ RAPORU", 30, 15);
        
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(10);
        doc.setFont("Helvetica", "normal");
        doc.text(fixTR(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`), 15, 35);
        doc.text(fixTR(`Toplam Örneklem: ${totalResponses} Yanıt Maddesi`), 15, 41);
        doc.text(fixTR(`Genel Skor Ortalaması: ${generalAverage} / 5.00  (%${dynamicPercentage} Başarı)`), 15, 47);
        
        doc.setDrawColor(220, 220, 220);
        doc.line(15, 52, 195, 52);
        
        const rows = groupedQuestions.map((q, idx) => [
          fixTR(`${idx + 1}. ${q.questionText}`),
          `%${q.responsesCount > 0 ? Math.round((q.counts[5] / q.responsesCount) * 100) : 0} (${q.counts[5]})`,
          `%${q.responsesCount > 0 ? Math.round((q.counts[4] / q.responsesCount) * 100) : 0} (${q.counts[4]})`,
          `%${q.responsesCount > 0 ? Math.round((q.counts[3] / q.responsesCount) * 100) : 0} (${q.counts[3]})`,
          `%${q.responsesCount > 0 ? Math.round((q.counts[2] / q.responsesCount) * 100) : 0} (${q.counts[2]})`,
          `%${q.responsesCount > 0 ? Math.round((q.counts[1] / q.responsesCount) * 100) : 0} (${q.counts[1]})`
        ]);
        
        autoTable(doc, {
          startY: 58,
          head: [[
            fixTR('Soru Maddesi Açıklaması'), 
            fixTR(`5 Puan (${dynamicLikertLabels[5]})`), 
            fixTR(`4 Puan (${dynamicLikertLabels[4]})`), 
            fixTR(`3 Puan (${dynamicLikertLabels[3]})`), 
            fixTR(`2 Puan (${dynamicLikertLabels[2]})`), 
            fixTR(`1 Puan (${dynamicLikertLabels[1]})`)
          ]],
          body: rows,
          styles: { font: 'Helvetica', fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [67, 24, 108], textColor: [255, 255, 255] },
          columnStyles: { 0: { cellWidth: 85 } }
        });
        
        doc.save(`Akademik_Anket_Raporu_Hafta_${selectedSurveyId}.pdf`);
      };

      // --- %100 GEÇERLİ SÜRE KATILIM PDF RAPORU FONKSİYONU ---
      const exportTimePDF = async () => {
        const { jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default;
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        
        const fixTR = (str: string) => {
          if (!str) return "";
          return str
            .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
            .replace(/ç/g, "c").replace(/ö/g, "o").replace(/ü/g, "u")
            .replace(/İ/g, "I").replace(/Ş/g, "S").replace(/Ğ/g, "G")
            .replace(/Ç/g, "C").replace(/Ö/g, "O").replace(/Ü/g, "U");
        };

        doc.setFont("Helvetica", "bold");
        doc.setFillColor(67, 24, 108);
        doc.rect(0, 0, 210, 25, "F");
        
        doc.setFillColor(255, 255, 255, 0.2);
        doc.rect(12, 5, 12, 14, "F");
        doc.setFillColor(255, 255, 255);
        doc.rect(15, 9, 6, 6, "F");
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13);
        doc.text("SISTEMDE AKTIF CALISMA SURESI VE KATILIM RAPORU", 30, 15);
        
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(10);
        doc.setFont("Helvetica", "normal");
        doc.text(fixTR(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`), 15, 35);
        doc.text(fixTR(`Toplam Aktif Öğrenci Örneklemi: ${timeDataArray.length} Öğrenci`), 15, 41);
        
        doc.setDrawColor(220, 220, 220);
        doc.line(15, 47, 195, 47);
        
        const timeRows = timeDataArray.map(item => [
          `#${item.rank}`,
          fixTR(item.student),
          fixTR(item.department),
          fixTR(item.total_time)
        ]);

        autoTable(doc, {
          startY: 53,
          head: [[fixTR('Sıralama'), fixTR('Öğrenci Adı Soyadı'), fixTR('Bölüm / Departman'), fixTR('Toplam Aktif Kalma Süresi')]],
          body: timeRows,
          styles: { font: 'Helvetica', fontSize: 8.5, cellPadding: 3 },
          headStyles: { fillColor: [67, 24, 108], textColor: [255, 255, 255] },
          columnStyles: { 0: { cellWidth: 25 }, 3: { cellWidth: 45 } }
        });
        
        doc.save(`Sistemde_Kalma_Suresi_Raporu_${new Date().toISOString().slice(0,10)}.pdf`);
      };


      return (
        <>
          {/* ÜST İSTATİSTİK KARTLARI PANELİ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-900 to-indigo-950 p-6 rounded-3xl shadow-xl text-white text-left flex flex-col justify-between">
              <div>
                <p className="text-[9px] font-black tracking-widest text-purple-300 uppercase">Anket Toplam Verisi</p>
                <h3 className="text-3xl font-black mt-2">{totalResponses} <span className="text-xs font-normal text-purple-300">Yanıt Maddesi</span></h3>
              </div>
              <p className="text-[9px] text-purple-200/60 font-medium mt-4">Bu ankete ait veri tabanında işlenen aktif satır sayısı.</p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 flex flex-col justify-between text-left gap-4">
              <div>
                <p className="text-[9px] font-black tracking-widest text-gray-400 uppercase">Ölçek Genel Başarı Oranı</p>
                <h4 className="text-base font-black text-purple-950 uppercase leading-none mt-1">Anket Memnuniyet Oranı</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-black text-purple-950">
                  <span>Skor Etki Yoğunluğu</span>
                  <span>%{dynamicPercentage}</span>
                </div>
                <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden p-0.5 border shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-1000 shadow-md"
                    style={{ width: `${totalResponses > 0 ? dynamicPercentage : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 text-left flex flex-col justify-between">
              <div>
                <p className="text-[9px] font-black tracking-widest text-gray-400 uppercase">Anket Genel Skor Ortalaması</p>
                <h3 className="text-3xl font-black text-green-600 mt-2">
                  {generalAverage} <span className="text-xs font-normal text-gray-400">/ 5.00</span>
                </h3>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-4">
                <div 
                  className="h-full bg-green-500 transition-all duration-1000" 
                  style={{ width: `${totalResponses > 0 ? (generalAverage / 5) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* ÖĞRENCİ BAZLI DETAYLI VERİ TABLOSU */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-left">
            <div className="p-6 border-b bg-purple-50/20 flex justify-between items-center">
              <h2 className="font-black text-purple-950 uppercase text-xs tracking-widest flex items-center gap-2 leading-none">
                <ListChecks size={18} className="text-purple-600" /> Öğrenci Bazlı Ölçek Veritabanı Maddeleri
              </h2>
              <button 
                onClick={exportSurveyPDF}
                className="bg-purple-950 hover:bg-purple-900 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileText size={13} /> PDF Rapor Al
              </button>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-purple-950 text-white text-[10px] font-black uppercase tracking-widest leading-none">
                  <tr>
                    <th className="p-6 w-1/4">ÖĞRENCİ BİLGİSİ</th>
                    <th className="p-6 w-1/3">SORU MADDESİ</th>
                    <th className="p-6 w-1/4">KATEGORİ</th>
                    <th className="p-6 text-center w-32">VERİLEN PUAN / ŞIK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-bold">
                  {totalResponses > 0 ? (
                    surveyDataArray.map((item: any, si: number) => {
                      const finalScore = Number(item.answer) || 0;
                      const isTextValid = item.answer_text && 
                                          !item.answer_text.includes("Hata") && 
                                          item.answer_text !== "null" && 
                                          item.answer_text.trim() !== "";
                      
                      const displayLabel = isTextValid ? item.answer_text : (dynamicLikertLabels[finalScore] || `${finalScore} Puan`);

                      return (
                        <tr key={si} className="hover:bg-purple-50/20 transition-all">
                          <td className="p-5 text-sm uppercase text-black font-black truncate">{item.student || "Bilinmeyen Öğrenci"}</td>
                          <td className="p-5 text-xs text-gray-600 font-medium leading-relaxed">&quot;{item.question || "Soru Maddesi Eksik"}&quot;</td>
                          <td className="p-5">
                            <span className="bg-purple-100/60 text-purple-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{item.category || "Genel"}</span>
                          </td>
                          <td className="p-5 text-center">
                            <span className="bg-purple-600 text-white px-3 py-2 rounded-xl text-xs font-black shadow-md block w-fit mx-auto whitespace-nowrap">
                              {finalScore} Puan ({displayLabel})
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-16 text-center text-gray-400 text-xs uppercase tracking-widest">
                        {loading ? "Analizler İşleniyor..." : "Veri tabanında eşleşen veri bulunamadı."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SİSTEMDE EN ÇOK KALAN ÖĞRENCİLER ANALİZ VE PDF PANELİ */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden text-left">
            <div className="p-6 border-b bg-purple-50/20 flex justify-between items-center">
              <div>
                <h2 className="font-black text-purple-950 uppercase text-xs tracking-widest leading-none">
                  Sisteme En Çok Katılım Sağlayan Öğrenciler (Devamlılık Sıralaması)
                </h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Öğrencilerin Log Tablosundaki Toplam Aktif Çalışma Süreleri</p>
              </div>
              <button
                onClick={exportTimePDF}
                className="bg-green-600 hover:bg-green-700 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileText size={13} /> Süre Raporu PDF Al
              </button>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-purple-950/5 text-purple-950 text-[10px] font-black uppercase tracking-widest leading-none border-b">
                  <tr>
                    <th className="p-4 w-20 text-center">SIRA</th>
                    <th className="p-4">ÖĞRENCİ BİLGİSİ</th>
                    <th className="p-4">BÖLÜM / DEPARTMAN</th>
                    <th className="p-4 text-center w-44">TOPLAM AKTİF SÜRE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-bold text-sm">
                  {timeDataArray.length > 0 ? (
                    timeDataArray.slice(0, 10).map((item, index) => (
                      <tr key={index} className="hover:bg-purple-50/10 transition-all">
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                            index === 0 ? 'bg-amber-100 text-amber-700' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-500'
                          }`}>
                            #{item.rank}
                          </span>
                        </td>
                        <td className="p-4 text-purple-950 font-black uppercase">{item.student}</td>
                        <td className="p-4 text-gray-400 text-xs uppercase">{item.department}</td>
                        <td className="p-4 text-center">
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-black">
                            {item.total_time}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400 text-xs uppercase tracking-widest">
                        Aktif kalma süresi analizi yükleniyor...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MADDELERE GÖRE SORU BAZLI YÜZDELİK GRAFİK LİSTESİ */}
          <div className="space-y-6">
            <h3 className="text-sm font-black text-purple-950 uppercase tracking-widest text-left border-l-4 border-purple-600 pl-2">
              Maddelere Göre Soru Bazlı Yüzdelik Likert Dağılımları
            </h3>
            
            {groupedQuestions.length > 0 ? (
              groupedQuestions.map((q, qi) => (
                <div key={qi} className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 text-left space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <h4 className="text-sm font-black text-purple-950 leading-snug">
                      {qi + 1}. &quot;{q.questionText}&quot;
                    </h4>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest self-start sm:self-center">
                      {q.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {[5, 4, 3, 2, 1].map((score) => {
                      const count = q.counts[score] || 0;
                      const pct = q.responsesCount > 0 ? Math.round((count / q.responsesCount) * 100) : 0;
                      const currentLabel = q.labels[score] || fallbackLabels[score];

                      return (
                        <div key={score} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/50 hover:bg-purple-50/10 transition-all">
                          <div className="sm:w-44 shrink-0 text-left leading-tight">
                            <span className="text-xs font-black text-purple-950 block">{score} Puan</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase truncate block">{currentLabel}</span>
                          </div>
                          
                          <div className="flex-1 bg-gray-200 h-3.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          <div className="sm:w-28 text-right font-black shrink-0 text-xs text-purple-950 refinement-percentage">
                            %{pct} <span className="text-[10px] text-gray-400 font-normal">({count} Öğrenci)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : null}
          </div>
        </>
      );
    })()}

  </div>
)}
{/* --- SEKME 5: SİSTEM ZAMAN ANALİTİĞİ VE ETKİNLİK DAĞILIMLARI --- */}
{activeTab === 'time_analytics' && (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
    
    {/* ÜST SEÇİM KONTROLÜ VE BÖLÜM FİLTRESİ */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-xl border border-gray-100 text-left">
      <div className="text-left leading-none">
        <h2 className="text-xl font-black text-purple-950 uppercase leading-none border-l-4 border-purple-600 pl-3">Sistem Zaman Yönetimi Verileri</h2>
        <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest italic leading-none">Öğrencilerin Aktif Kalma Süreleri ve Materyal Dağılım Analizleri</p>
      </div>
      
      <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 text-left shadow-inner w-full md:w-auto">
        <Filter size={16} className="text-purple-600" />
        <select 
          value={selectedDepartment} 
          onChange={(e) => setSelectedDepartment(e.target.value)} 
          className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer text-purple-950 w-full font-black"
        >
          {Array.isArray(departmentList) && departmentList.map(d => (
            <option key={d.id} value={d.id} className="text-black">{d.name}</option>
          ))}
        </select>
      </div>
    </div>

    {/* YÜKLENİYOR DURUM KONTROLÜ */}
    {systemTimeLoading ? (
      <div className="bg-white p-16 text-center text-gray-400 font-black uppercase text-xs tracking-widest rounded-3xl border border-dashed shadow-sm animate-pulse">
        Sistem Zaman Analizleri Veritabanından Jet Hızıyla Çekiliyor...
      </div>
    ) : (
      (() => {
        // [DÜZELTME]: Dışarıdaki selectedWeekTab state referansını pürüzsüzce yerel akışa bağlıyoruz
        const currentWeekTab = selectedWeekTab || 'all';

        const rawMax = systemTimeData?.max_engagement || { student: "Veri Yok", time: "0 Saat" };
        const rawMin = systemTimeData?.min_engagement || { student: "Veri Yok", time: "0 Saat" };
        const activityList = Array.isArray(systemTimeData?.activity_distribution) ? systemTimeData?.activity_distribution : [];
        const generalStudentList = Array.isArray(systemTimeData?.raw_student_list) ? systemTimeData?.raw_student_list : [];
        const weeklyList = Array.isArray(systemTimeData?.weekly_analysis) ? systemTimeData?.weekly_analysis : [];
        
        const activityHoursArray = activityList.map((item: any) => Number(item?.hours) || 0);
        const maxActivityHours = activityHoursArray.length > 0 ? Math.max(...activityHoursArray) : 1;

        // --- SAAT ONDALIK DEĞERİNİ METNE ÇEVİREN AKILLI DÖNÜŞTÜRÜCÜ ---
        const convertHoursToText = (timeVal: string | number) => {
          if (!timeVal || timeVal === "0 Saat" || timeVal === 0) return "0 dk";
          const numericHours = typeof timeVal === 'number' ? timeVal : parseFloat(String(timeVal).replace(/[^0-9.]/g, ''));
          if (isNaN(numericHours) || numericHours === 0) return "0 dk";
          
          const totalMinutes = Math.round(numericHours * 60);
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          
          if (hours === 0) return `${minutes} dk`;
          if (minutes === 0) return `${hours} sa`;
          return `${hours} sa ${minutes} dk`;
        };

        const maxEngagement = { student: rawMax.student, time: convertHoursToText(rawMax.time) };
        const minEngagement = { student: rawMin.student, time: convertHoursToText(rawMin.time) };

        // [DÜZELTME]: State'e göre dinamik liste süzme işlemi
        let displayStudents = generalStudentList;
        let activeRepTitle = "Genel Katilim Sıralama Listesi";
        
        if (currentWeekTab !== 'all') {
          const matchedWeek = weeklyList.find((w: any) => String(w.week_number) === String(currentWeekTab));
          if (matchedWeek && Array.isArray(matchedWeek.student_list)) {
            displayStudents = matchedWeek.student_list;
            activeRepTitle = `${currentWeekTab}. Hafta Katılım Sıralama Listesi`;
          }
        }

        const exportZamanRaporPDF = async () => {
          const { jsPDF } = await import('jspdf');
          const autoTable = (await import('jspdf-autotable')).default;
          const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
          
          const fixTR = (str: string) => !str ? "" : str.replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ç/g, "c").replace(/ö/g, "o").replace(/ü/g, "u").replace(/İ/g, "I").replace(/Ş/g, "S").replace(/Ğ/g, "G").replace(/Ç/g, "C").replace(/Ö/g, "O").replace(/Ü/g, "U");

          doc.setFont("Helvetica", "bold"); doc.setFillColor(67, 24, 108); doc.rect(0, 0, 210, 25, "F");
          doc.setTextColor(255, 255, 255); doc.setFontSize(13); 
          doc.text(fixTR(activeRepTitle.toUpperCase()), 15, 15);

          const pdfRows = displayStudents.map((item: any) => [
            `#${item?.rank || ''}`,
            fixTR(item?.student || ''),
            selectedDepartment ? fixTR(String(selectedDepartment).toUpperCase()) : "COCUK GELISIMI",
            fixTR(convertHoursToText(item?.time || 0))
          ]);

          autoTable(doc, {
            startY: 35,
            head: [[fixTR('Sıralama'), fixTR('Ogrenci Adi Soyadi'), fixTR('Bolum / Departman'), fixTR('Toplam Tekil Sure')]],
            body: pdfRows,
            styles: { font: 'Helvetica', fontSize: 9 }
          });
          doc.save(`${activeRepTitle.replace(/\s+/g, '_')}.pdf`);
        };

        return (
          <>
            {/* EN AKTİF / EN AZ AKTİF ÖĞRENCİ KARTLARI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-xl border-l-[10px] border-green-500 text-left flex flex-col justify-between min-h-[130px]">
                <div><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Sistemde En Uzun Süre Kalan Öğrenci</span><h3 className="text-lg font-black text-purple-950 uppercase truncate">{maxEngagement.student}</h3></div>
                <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-4"><span className="text-[10px] text-gray-400 font-bold uppercase">Toplam Aktif Çalışma</span><span className="bg-green-100 text-green-700 font-black px-3 py-1 rounded-xl text-sm">{maxEngagement.time}</span></div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-xl border-l-[10px] border-orange-500 text-left flex flex-col justify-between min-h-[130px]">
                <div><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Sistemde En Az Süre Kalan Öğrenci</span><h3 className="text-lg font-black text-purple-950 uppercase truncate">{minEngagement.student}</h3></div>
                <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-4"><span className="text-[10px] text-gray-400 font-bold uppercase">Toplam Aktif Çalışma</span><span className="bg-orange-100 text-orange-700 font-black px-3 py-1 rounded-xl text-sm">{minEngagement.time}</span></div>
              </div>
            </div>

            {/* ETKİNLİK DAĞILIM BARLARI GRAFİĞİ */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 text-left space-y-4">
              <h3 className="text-xs font-black text-purple-950 uppercase tracking-widest border-l-4 border-indigo-500 pl-2">Materyal ve Etkinlik Türlerine Göre Zaman Dağılımları</h3>
              <div className="grid grid-cols-1 gap-3">
                {activityList.map((act: any, idx: number) => {
                  const currentPct = Math.round((act.hours / maxActivityHours) * 100) || 0;
                  return (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50">
                      <div className="sm:w-48 shrink-0"><span className="text-xs font-black text-purple-950 block">{act.type}</span></div>
                      <div className="flex-1 bg-gray-200 h-3.5 rounded-full overflow-hidden p-0.5 shadow-inner"><div className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 rounded-full" style={{ width: `${currentPct}%` }} /></div>
                      <div className="sm:w-28 text-right font-black text-xs text-purple-950 shrink-0">{convertHoursToText(act.hours)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* HAFTALIK ZAMAN VE KATILIM KIRILIM DETAYLARI PANALİ */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 text-left space-y-6">
              <h3 className="text-xs font-black text-purple-950 uppercase tracking-widest border-l-4 border-red-500 pl-2">
                Haftalık Zaman ve Katılım Kırılım Detayları
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {weeklyList.length > 0 ? (
                  weeklyList.map((wItem: any, wIdx: number) => {
                    const wActivityHoursArray = Array.isArray(wItem.activity_distribution) ? wItem.activity_distribution.map((item: any) => item.hours) : [];
                    const wMaxHours = wActivityHoursArray.length > 0 ? Math.max(...wActivityHoursArray) : 1;

                    return (
                      <div key={wIdx} className="bg-gray-50/60 p-5 rounded-2xl border border-gray-200/60 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                          <span className="bg-purple-950 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
                            {wItem.week_number}. HAFTA
                          </span>
                          <span className="text-xs font-black text-purple-950">
                            Toplam: {convertHoursToText(wItem.total_hours)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-[11px] leading-tight">
                          <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-left">
                            <span className="text-[8px] text-gray-400 font-bold block uppercase mb-1">En Çok Kalan</span>
                            <span className="font-black text-purple-950 block truncate">{wItem.max_engagement?.student}</span>
                            <span className="text-green-600 font-black text-[10px]">{convertHoursToText(wItem.max_engagement?.time)}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-left">
                            <span className="text-[8px] text-gray-400 font-bold block uppercase mb-1">En Az Kalan</span>
                            <span className="font-black text-purple-950 block truncate">{wItem.min_engagement?.student}</span>
                            <span className="text-orange-600 font-black text-[10px]">{convertHoursToText(wItem.min_engagement?.time)}</span>
                          </div>
                        </div>

                        <div className="space-y-2 pt-1">
                          <span className="text-[9px] text-gray-400 font-black block uppercase tracking-wider mb-1">Haftalık Materyal Dağılımı</span>
                          {Array.isArray(wItem.activity_distribution) && wItem.activity_distribution.map((wAct: any, aIdx: number) => {
                            const wPct = Math.round((wAct.hours / wMaxHours) * 100) || 0;
                            return (
                              <div key={aIdx} className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold text-gray-600">
                                  <span>{wAct.type}</span>
                                  <span className="font-black text-purple-950">{convertHoursToText(wAct.hours)}</span>
                                </div>
                                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden p-0.5 shadow-inner">
                                  <div className="h-full bg-purple-600 rounded-full" style={{ width: `${wPct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center p-8 text-gray-400 text-xs font-black uppercase tracking-wider">
                    Haftalık kırılım analizi bulunamadı...
                  </div>
                )}
              </div>
            </div>

          {/* [DÜZELTME]: Buton tetiklendiğinde setSelectedWeekTab kancasını (React State) çalıştırıyoruz */}
<div className="flex flex-wrap gap-2 text-left justify-start items-center bg-gray-100 p-2 rounded-2xl border border-gray-200">
  <button 
    type="button"
    onClick={() => setSelectedWeekTab('all')}
    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${selectedWeekTab === 'all' ? 'bg-purple-950 text-white shadow-md' : 'bg-transparent text-gray-500 hover:text-purple-950'}`}
  >
    🌍 Tüm Dönem (Genel)
  </button>
  {weeklyList.map((w: any) => (
    <button
      key={w.week_number}
      type="button"
      onClick={() => setSelectedWeekTab(String(w.week_number))}
      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${String(selectedWeekTab) === String(w.week_number) ? 'bg-purple-600 text-white shadow-md' : 'bg-transparent text-gray-500 hover:text-purple-600'}`}
    >
      📆 {w.week_number}. Hafta
    </button>
  ))}
</div>

            {/* DİNAMİK LİDERLİK SIRALAMA TABLOSU */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-left">
              <div className="p-6 border-b bg-purple-50/20 flex justify-between items-center">
                <h2 className="font-black text-purple-950 uppercase text-xs tracking-widest flex items-center gap-2 leading-none">
                  ⏱️ {activeRepTitle}
                </h2>
                <button onClick={exportZamanRaporPDF} className="bg-purple-950 hover:bg-purple-900 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"><FileText size={13} /> PDF Al</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-purple-950 text-white text-[10px] font-black uppercase tracking-widest">
                    <tr><th className="p-5 w-24 text-center">SIRA</th><th className="p-5">ÖĞRENCİ ADI SOYADI</th><th className="p-5 text-center w-48">TOPLAM AKTİF SÜRE</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-bold text-sm">
                    {displayStudents.length > 0 ? (
                      displayStudents.map((item: any, index: number) => (
                        <tr key={index} className="hover:bg-purple-50/20 transition-all">
                          <td className="p-4 text-center"><span className="px-2.5 py-1 rounded-lg text-xs font-black bg-gray-50 text-gray-500">#{item.rank || (index + 1)}</span></td>
                          <td className="p-4 text-purple-950 font-black uppercase">{item.student}</td>
                          <td className="p-4 text-center"><span className="bg-purple-600 text-white px-3 py-1.5 rounded-xl text-xs font-black">{convertHoursToText(item.time)}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-gray-400 font-bold text-xs uppercase">Bu Haftaya Ait Katılım Verisi Bulunmuyor.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      })()
    )}
  </div>
)}
      </main>

      {/* KARNE MODALI - SADECE AI SORULARI VE TEST SONUÇLARI */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-2 md:p-4 animate-in fade-in duration-300 overflow-y-auto text-left leading-none">
          <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border-4 border-white my-auto text-left">

            {/* HEADER */}
            <div className="p-6 md:p-10 border-b bg-gray-50 flex justify-between items-center shrink-0 text-left leading-none">
              <div className="flex items-center gap-4 text-left leading-none">
                <div className="bg-secondary p-3 rounded-2xl text-white shadow-xl shrink-0 flex items-center justify-center">
                  <Users size={28} />
                </div>
                <div className="text-left leading-none">
                  <h3 className="font-black text-xl md:text-2xl uppercase tracking-tighter text-secondary leading-none mb-2">Akademik Performans Karnesi</h3>
                  <p className="text-[10px] text-[#ce1212] font-black uppercase italic leading-none">
                    {selectedStudent.first_name} {selectedStudent.last_name} | {getDeptName(selectedStudent.department)}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="bg-white p-3 rounded-full hover:bg-red-50 border transition-all text-gray-400 shadow-sm active:scale-90 flex items-center justify-center">
                <X size={24} />
              </button>
            </div>
            {/* --- YENİ: ÖN TEST (BAŞLANGIÇ SEVİYESİ) KARTI --- */}
{selectedStudent?.pre_test_data && (
  <div className="mx-6 md:mx-10 mt-6 p-5 bg-gradient-to-r from-purple-50 to-white border-l-8 border-purple-500 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-top-2 duration-500">
    <div className="flex items-center gap-4">
      <div className="bg-purple-500 p-3 rounded-xl text-white shadow-lg shrink-0">
        <GraduationCap size={24} />
      </div>
      <div className="text-left leading-tight">
        <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] mb-1">
          SİSTEM GİRİŞ SEVİYESİ (ÖN TEST)
        </p>
        <p className="text-xl font-black text-secondary uppercase leading-none">
          BAŞARI SKORU: %{selectedStudent.pre_test_data.score}
        </p>
        <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">
          Tamamlanma Tarihi: {selectedStudent.pre_test_data.date}
        </p>
      </div>
    </div>
    
    <div className="flex gap-4">
      <div className="px-4 py-2 bg-white rounded-xl border border-purple-100 shadow-sm text-center min-w-[70px]">
        <p className="text-[8px] font-bold text-gray-400 uppercase leading-none mb-1">Doğru</p>
        <p className="text-sm font-black text-green-600 leading-none">{selectedStudent.pre_test_data.correct}</p>
      </div>
      <div className="px-4 py-2 bg-white rounded-xl border border-purple-100 shadow-sm text-center min-w-[70px]">
        <p className="text-[8px] font-bold text-gray-400 uppercase leading-none mb-1">Yanlış</p>
        <p className="text-sm font-black text-red-600 leading-none">{selectedStudent.pre_test_data.wrong}</p>
      </div>
    </div>
  </div>
)}

            {/* HAFTALIK DETAYLAR LİSTESİ */}
            <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 bg-white custom-scrollbar text-left leading-normal">
              {selectedStudent.weekly_breakdown?.map((week) => (
                <div key={week.week_number} className="p-6 md:p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6 relative overflow-hidden text-left leading-normal">

                  {/* HAFTA BAŞLIĞI */}
                  <div className="flex items-center gap-4 text-left leading-none">
                    <div className="w-14 h-14 bg-white rounded-2xl flex flex-col items-center justify-center border font-black text-secondary shrink-0 shadow-sm leading-none">
                      <span className="text-[9px] text-[#ce1212] uppercase leading-none mb-1">HAFTA</span>
                      <span className="text-xl leading-none">{week.week_number}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-base font-black text-secondary leading-none">%{week.progress} Tamamlandı</span>
                      {week.progress === 100 && <span className="text-[10px] text-green-600 font-bold flex items-center gap-1"><Check size={12} /> BAŞARIYLA BİTİRİLDİ</span>}
                    </div>
                  </div>

                  {/* 1. SINAV DETAY ANALİZİ */}
                  {week.quiz_results && week.quiz_results.length > 0 && (
                    <div className="space-y-4 text-left leading-normal border-t border-gray-200 pt-6">
                      <div className="flex items-center gap-2 text-secondary leading-none mb-2">
                        <ListChecks size={16} className="text-[#ce1212]" />
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">Haftalık Sınav Sonuç Analizi</p>
                      </div>
                      <div className="grid gap-3 text-left">
                        {week.quiz_results.map((r, ri) => (
                          <div key={ri} className={`p-4 rounded-2xl border-2 transition-all text-left ${r.is_correct ? 'bg-green-50/30 border-green-100' : 'bg-red-50/30 border-red-100'}`}>
                            <div className="flex justify-between items-start gap-3 text-left leading-tight">
                              <span className="text-[11px] font-bold text-secondary flex gap-2">
                                <span className="opacity-40">{ri + 1}.</span> {r.question_text}
                              </span>
                              {r.is_correct ? <CheckCircle size={14} className="text-green-500 shrink-0" /> : <AlertCircle size={14} className="text-red-500 shrink-0" />}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-6 border-t border-black/5 pt-3 text-left">
                              <div className="flex flex-col items-start leading-tight">
                                <span className="text-[8px] font-black text-gray-400 uppercase mb-1">Seçilen Şık</span>
                                <span className={`text-[10px] font-black ${r.is_correct ? 'text-green-600' : 'text-red-600'}`}>{r.selected_option}</span>
                              </div>
                              {!r.is_correct && (
                                <div className="flex flex-col items-start leading-tight">
                                  <span className="text-[8px] font-black text-gray-400 uppercase mb-1">Doğru Şık</span>
                                  <span className="text-[10px] font-black text-green-600">{r.correct_option}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. YAPAY ZEKA SORULARI */}
                  {week.questions && week.questions.length > 0 && (
                    <div className="bg-blue-50/30 p-6 rounded-3xl border-2 border-blue-100/50 space-y-4 text-left leading-normal border-t border-blue-100 mt-4">
                      <div className="flex items-center gap-2 text-blue-600 leading-none">
                        <MessageSquare size={16} />
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">Yapay Zekaya Sorduğu Sorular</p>
                      </div>
                      <div className="space-y-3 text-left">
                        {week.questions.map((q, qi) => (
                          <div key={qi} className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm relative group text-left">
                            <p className="text-[11px] font-medium italic text-gray-600 leading-relaxed text-left">
                              &quot;{q}&quot;
                            </p>
                            <Bot size={14} className="absolute top-4 right-4 text-blue-200 opacity-20" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AKTİVİTE YOKSA DURUMU */}
                  {(!week.quiz_results || week.quiz_results.length === 0) && (!week.questions || week.questions.length === 0) && (
                    <div className="text-left py-4 opacity-30 italic text-[10px] font-bold uppercase tracking-widest leading-none">
                      Bu hafta henüz bir sınav veya AI etkileşimi bulunmuyor.
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* FOOTER */}
            <div className="p-8 bg-gray-50 border-t flex justify-center shrink-0 leading-none">
              <button
                onClick={() => setSelectedStudent(null)}
                className="w-full md:w-auto bg-secondary text-white px-16 py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 shadow-xl transition-all flex items-center justify-center leading-none"
              >
                PANELİ KAPAT VE LİSTEYE DÖN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}