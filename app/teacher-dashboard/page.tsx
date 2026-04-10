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
  Bot
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

export default function TeacherDashboard() {
  // --- STATE YÖNETİMİ ---
  const [activeTab, setActiveTab] = useState<'content' | 'analytics' | 'chatbot'>('content');  const [loading, setLoading] = useState(false);
  const [fetchingWeek, setFetchingWeek] = useState(false);
  const [analytics, setAnalytics] = useState<StudentAnalytics[]>([]);
  const [bulkData, setBulkData] = useState<BulkStudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentAnalytics | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('cocukgelisimi');

  const [weekNumber, setWeekNumber] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [releaseDate, setReleaseDate] = useState('');

  const [introTitle, setIntroTitle] = useState('Genel Tanıtım ve Oryantasyon');
  const [introVideoUrl, setIntroVideoUrl] = useState('');
  const [introDescription, setIntroDescription] = useState('');

  const [materials, setMaterials] = useState<Material[]>([{ content_type: 'video', embed_url: '', title: '', point_value: 10 }]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [chatbotData, setChatbotData] = useState<ChatbotReportData[]>([]);
  const [entryQuestions, setEntryQuestions] = useState<EntryQuestion[]>([]);

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
  const fetchWeekDetail = useCallback(async (week: number) => {
    setFetchingWeek(true);
    try {
      const res = await api.get(`/contents/list/?week_number=${week}`);
      const data = res.data;
      
      // Temel İçerik Bilgileri
      setIntroDescription(data.intro_description || '');
      setTitle(data.title || '');
      setDescription(data.description || '');

      // Tarih Formatlama
      if (data.release_date) {
        setReleaseDate(data.release_date.split('T')[0]);
      } else {
        setReleaseDate('');
      }

      // Oryantasyon Bilgileri
      if (data.intro_video_url !== undefined) {
        setIntroVideoUrl(data.intro_video_url || '');
        setIntroTitle(data.intro_title || 'Genel Tanıtım ve Oryantasyon');
      }

      // Materyaller
      if (data.materials && data.materials.length > 0) {
        setMaterials(data.materials);
      } else {
        setMaterials([{ content_type: 'video', embed_url: '', title: '', point_value: 10 }]);
      }

      // Flashcardlar
      setFlashcards(data.flashcards || []);
      setEntryQuestions(data.entry_questions || []);

      // --- KRİTİK GÜNCELLEME: ÖN TEST SORULARINI YÜKLE ---
      if (week === 1) {
        if (data.pre_test_questions && data.pre_test_questions.length > 0) {
          // Eğer veritabanında soru varsa onları state'e bas
          setPreTestQuestions(data.pre_test_questions);
        } else {
          // Eğer veritabanı boşsa (yeni kurulum), hoca için 1 tane boş taslak soru bırak
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
        // 1. haftada değilsek, state'i temizle (bellek yönetimi için)
        setPreTestQuestions([]);
      }

    } catch (err) {
      console.error("Haftalık veriler çekilemedi:", err);
      // Hata durumunda formu sıfırla
      setTitle('');
      setDescription('');
      setReleaseDate('');
      setMaterials([{ content_type: 'video', embed_url: '', title: '', point_value: 10 }]);
      setFlashcards([]);
      setPreTestQuestions([]);
    } finally {
      setFetchingWeek(false);
    }
  }, []);

  // --- İZLEYİCİ (TRIGGER) ---
  useEffect(() => {
    if (activeTab === 'content') {
      fetchWeekDetail(weekNumber);
    }
  }, [weekNumber, activeTab, fetchWeekDetail]);

// --- ANALİZ VERİLERİNİ ÇEKME ---
  // selectedDepartment değiştikçe bu fonksiyon kendini günceller
  // --- ANALİZ VERİLERİNİ ÇEKME ---
  const fetchAnalytics = useCallback(async () => {
    // Güvenlik: Departman seçili değilse veya 'all' ise (tedbir amaçlı) istek atma
    if (!selectedDepartment || selectedDepartment === 'all') return;

    setLoading(true);
    // KRİTİK: Yeni veri gelene kadar eski verileri temizle ki liste anlık sıfırlansın
    setAnalytics([]); 
    setBulkData([]);

    try {
      // Sadece seçili departman parametresiyle istek atıyoruz
      const [res, bulkRes] = await Promise.all([
        api.get(`/contents/analytics/?department=${selectedDepartment}`),
        api.get(`/contents/bulk-academic-report/?department=${selectedDepartment}`)
      ]);
      
      setAnalytics(res.data);
      setBulkData(bulkRes.data);
    } catch (err) {
      console.error("Analiz verileri yüklenemedi:", err);
      // Hata durumunda listelerin boş kaldığından emin ol
      setAnalytics([]); 
      setBulkData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment]); // selectedDepartment değiştikçe fonksiyon kendini günceller

  // Sekme (Tab) değiştiğinde veriyi tetikle
 // --- KRİTİK: BÖLÜM DEĞİŞTİĞİNDE VERİYİ ANLIK ÇEK ---
  useEffect(() => {
    // Eğer analiz sekmesindeysek VE bir bölüm seçiliyse veriyi çek
    if (activeTab === 'analytics' && selectedDepartment) {
      console.log(`${selectedDepartment} için veriler güncelleniyor...`);
      fetchAnalytics();
    }
  }, [activeTab, selectedDepartment, fetchAnalytics]); // <-- selectedDepartment buraya eklendi!

  const fetchChatbotAnalytics = useCallback(async () => {
  if (!selectedDepartment || selectedDepartment === 'all') return;
  setChatbotData([]);
  
  try {
    const res = await api.get(`/contents/chatbot-analytics/?department=${selectedDepartment}`);
    setChatbotData(res.data);
  } catch (err) {
    console.error("Chatbot verileri yüklenemedi:", err);
  }
}, [selectedDepartment]);

useEffect(() => {
  if (activeTab === 'analytics') {
    fetchAnalytics();
  }
  if (activeTab === 'chatbot') {
    fetchChatbotAnalytics(); // Chatbot sekmesine girince veriyi çek
  }
}, [activeTab, fetchAnalytics, fetchChatbotAnalytics]);

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
            intro_title: introTitle,
            intro_video_url: introVideoUrl,
            intro_description: introDescription,

            // --- MATERYALLER (ID KORUMALI) ---
            materials: materials
                .filter(m => m.title.trim() !== "")
                .map((m) => ({
                    ...(m.id ? { id: m.id } : {}), // KRİTİK: ID varsa gönder, yoksa yeni oluşturur
                    title: m.title,
                    content_type: m.content_type,
                    embed_url: m.embed_url,
                    point_value: m.point_value,
                    // Eğer materyal bir sınavsa (form) onun içindeki quiz ve soru ID'lerini de korumalıyız
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

            // Kaynaklar (ID Korumalı)
            flashcards: flashcards
                .filter(f => f.question.trim() !== "")
                .map((f, index) => ({ 
                    ...(f.id ? { id: f.id } : {}), // ID Koruması
                    question: f.question,
                    answer: f.answer,
                    order: index 
                })),

            // 1. HAFTA: Pre-Test (ID Korumalı)
            pre_test_questions: Number(weekNumber) === 1 
                ? preTestQuestions
                    .filter(q => q.question_text.trim() !== "")
                    .map((q, qIdx) => ({
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

            // Giriş Soruları (Zaten doğru yapmıştın ama üzerinden geçelim)
            entry_questions: Number(weekNumber) > 1 
                ? entryQuestions
                    .filter(q => q.question_text.trim() !== "")
                    .map((q, index) => ({
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
        alert("Haftalık içerik başarıyla güncellendi.");
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


     {/* 1. PDF ŞABLONU (Gizli - Sadece Yazıcıda Görünür) */}
<div id="bulk-report-pdf" className="hidden print:block bg-white p-0 text-left">
  {/* Veriyi 6'şarlı gruplara bölerek haritalıyoruz */}
  {Array.from({ length: Math.ceil(filteredBulkData.length / 6) }, (_, i) =>
    filteredBulkData.slice(i * 6, i * 6 + 6)
  ).map((studentGroup, pageIdx) => (
    <div key={pageIdx} className="p-10 text-left" style={{ pageBreakAfter: 'always' }}>
      {/* LOGO VE BAŞLIK (Her sayfanın başında tekrar eder) */}
      <div className="flex flex-col items-center mb-10 border-b-4 border-black pb-8 text-center">
        <img src="/okul-logo.png" alt="Okul Logosu" className="h-28 object-contain mb-6" onError={(e) => (e.currentTarget.style.display = 'none')} />
        <h1 className="text-3xl font-black uppercase tracking-tighter text-black">SİSTEM GENELİ AKADEMİK GELİŞİM VE PERFORMANS ÇİZELGESİ</h1>
        <p className="text-lg font-bold text-gray-700 mt-2 uppercase tracking-widest">
          Bölüm: {getDeptName(selectedDepartment).toUpperCase()} (Sayfa {pageIdx + 1})
        </p>
        <div className="flex gap-10 mt-4 text-[10px] font-black uppercase text-gray-500">
          <span>Ders: Dijital Okuryazarlık</span>
          <span>Rapor Tarihi: {new Date().toLocaleDateString('tr-TR')}</span>
          <span>Gruptaki Öğrenci: {studentGroup.length}</span>
        </div>
      </div>

      {/* GRUP TABLOSU */}
      <table className="w-full border-collapse border-2 border-black">
        <thead>
          <tr className="bg-black text-white text-center">
            <th className="border-2 border-black p-3 text-[10px] font-black uppercase leading-none text-left w-48">Öğrenci Adı Soyadı</th>
            <th className="border-2 border-black p-3 text-[10px] font-black uppercase leading-none text-center bg-gray-200">ÖN TEST</th>
            {Array.from({ length: 14 }, (_, i) => i + 1).map(n => (
              <th key={n} className="border-2 border-black p-1 text-[7px] font-black uppercase leading-none text-center w-32">
                H.{n} ANALİZİ
              </th>
            ))}
            <th className="border-2 border-black p-3 text-[10px] font-black uppercase leading-none text-center bg-gray-800">Top. Puan</th>
            <th className="border-2 border-black p-3 text-[10px] font-black uppercase text-center bg-gray-800">Top. Süre</th>
          </tr>
        </thead>
        <tbody className="text-left font-bold">
          {studentGroup.map((student, idx) => (
            <tr key={idx} className="text-center hover:bg-gray-50 leading-none">
              <td className="border-2 border-black p-3 text-[10px] font-black text-left uppercase leading-tight">{student.full_name}</td>
              <td className="border-2 border-black p-3 text-[9px] font-black text-center italic bg-gray-50/50">
                {student.pre_test_score || "Girilmedi"}
              </td>
              
              {student.weekly_breakdown.map((week, wIdx) => (
                <td key={wIdx} className="border-2 border-black p-1 text-[6px] font-bold leading-none align-top">
                  <div className="flex flex-col gap-1.5">
                    {/* TUR 1 VERİLERİ */}
                    <div className="flex flex-col border-b border-gray-300 pb-1 w-full items-center bg-blue-50/30">
                      <div className="flex justify-between w-full px-1 mb-0.5">
                        <span className="text-gray-500 font-black scale-[0.8]">T1</span>
                        <span className="text-blue-700 font-black">%{Math.round(week.progress)}</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[5px] text-gray-700">{week.correct}D / {week.wrong}Y</span>
                        <span className="text-[5px] text-blue-600 font-black">{formatDuration(week.duration_seconds)}</span>
                      </div>
                    </div>

                    {/* MATERYAL DETAYLARI */}
                    <div className="flex flex-col gap-1 px-0.5">
                      <p className="text-[4px] font-black text-gray-400 uppercase border-b border-gray-100 mb-1 text-left">Materyal Süreleri:</p>
                      {week.material_details && week.material_details.length > 0 ? (
                        week.material_details.map((mat, mi) => (
                          <div key={mi} className="flex justify-between items-start gap-1 text-[4.5px] text-gray-600 leading-[1.2] mb-0.5">
                            <span className="text-left break-words w-20">• {mat.title}</span>
                            <span className="font-black shrink-0 text-secondary">{formatDuration(mat.duration_seconds)}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[4px] text-gray-300 italic text-center">Aktivite Yok</span>
                      )}
                    </div>

                    {/* TUR 2 VERİLERİ */}
                    {week.is_round_2_started ? (
                      <div className="flex flex-col w-full items-center pt-1 border-t-2 border-amber-200 bg-amber-50/30 mt-auto">
                        <span className="text-amber-600 font-black scale-[0.7]">T2 AKTİF</span>
                        <span className="text-green-700 font-black">{week.correct_2}D / {week.wrong_2}Y</span>
                        <span className="text-[5px] text-amber-700 font-bold">{formatDuration(week.duration_seconds_2)}</span>
                      </div>
                    ) : null}
                  </div>
                </td>
              ))}

              <td className="border-2 border-black p-3 text-sm font-black text-blue-800 bg-gray-50">{student.total_points} P.</td>
              <td className="border-2 border-black p-3 text-[9px] font-black leading-none bg-gray-50 italic">{formatDuration(student.total_time)}</td>
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

      {/* ---------------------------------------------------------------- */}
      {/* 2. NORMAL ARAYÜZ (HEADER) */}
      {/* ---------------------------------------------------------------- */}
      <header className="bg-[#1a1a1a] p-4 md:p-6 shadow-xl sticky top-0 z-50 print:hidden text-left border-b border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 text-left">
          <div className="flex items-center gap-3 w-full md:w-auto text-left leading-none text-left">
            <div className="bg-[#ce1212] p-2 rounded-lg shadow-lg shrink-0 text-left flex items-center justify-center">
              <LayoutGrid size={24} className="text-white text-left" />
            </div>
            <div className="text-left leading-none text-left text-left">
              <h1 className="text-lg md:text-xl font-black text-white uppercase leading-none text-left">Akademisyen Paneli</h1>
              <p className="text-[9px] md:text-[10px] text-gray-400 uppercase tracking-widest leading-none text-left mt-1 font-bold">AKADEMİK YÖNETİM</p>
            </div>
          </div>

          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-full md:w-auto overflow-x-auto no-scrollbar leading-none text-left">
            <button onClick={() => setActiveTab('content')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap leading-none ${activeTab === 'content' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
              <Plus size={16} /> İÇERİK YÖNETİMİ
            </button>
            <button onClick={() => setActiveTab('analytics')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap leading-none ${activeTab === 'analytics' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
              <BarChart3 size={16} /> ÖĞRENCİ ANALİZLERİ
            </button>
            <button 
  onClick={() => setActiveTab('chatbot')} 
  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap leading-none ${activeTab === 'chatbot' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
>
  <Bot size={16} /> CHATBOT ANALİZİ
</button>
          </div>

          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="w-full md:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-white font-bold text-[10px] uppercase leading-none transition-all active:scale-95 text-left shadow-sm">
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

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-left">
                <div className="md:col-span-1 text-left leading-none">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest leading-none">Düzenlenen Hafta</label>
                  <select value={weekNumber} onChange={(e) => setWeekNumber(Number(e.target.value))} className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-black font-bold outline-none focus:border-red-500 transition-colors text-sm shadow-inner leading-none">
                    {Array.from({ length: 14 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}. Hafta</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 text-left leading-none">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest leading-none">Haftalık Konu Başlığı</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-black outline-none focus:border-red-500 font-bold transition-all text-sm shadow-inner leading-none" placeholder="Haftanın ana başlığını giriniz..." />
                </div>
                <div className="md:col-span-1 text-left leading-none">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest leading-none">Erişim Tarihi (Kilit)</label>
                  <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 font-bold outline-none focus:border-red-500 shadow-inner leading-none" />
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
              
              <button type="submit" disabled={loading} className="w-full mt-10 bg-[#1a1a1a] text-white py-6 rounded-[2rem] font-black tracking-[0.2em] hover:bg-black transition-all flex justify-center items-center gap-3 shadow-2xl active:scale-95 text-xs md:text-sm uppercase leading-none">
                <Save size={20} className="text-[#ce1212]" /> {loading ? "KAYDEDİLİYOR..." : "HAFTAYI KAYDET VE YAYINLA"}
              </button>
            </div>
          </form>
        )}

        {/* --- SEKME 2: ÖĞRENCİ ANALİZLERİ --- */}
        {activeTab === 'analytics' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6 md:space-y-8 pb-10 text-left">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-xl border border-gray-100 text-left">
              <div className="flex items-center gap-6 leading-none">
                <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 flex items-center justify-center leading-none"><Users size={32} /></div>
                <div className="text-left leading-none">
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 leading-none">Kayıtlı Öğrenci</p>
                  <p className="text-3xl font-black">{filteredAnalytics.length}</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto leading-none text-left">
                <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 text-left">
                  <Filter size={16} className="text-gray-400" />
                  <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer">
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

            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden text-left">
              <div className="p-6 md:p-8 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-[#ce1212]" />
                  <h2 className="font-black text-secondary uppercase text-[10px] md:text-xs tracking-widest">Akademik Takip Çizelgesi</h2>
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
                  <tbody className="divide-y divide-gray-100">
                    {filteredAnalytics.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50/50 transition-all group">
                        <td className="p-5 md:p-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-secondary text-white rounded-full flex items-center justify-center font-bold text-xs shadow-md shrink-0 uppercase">{student.first_name[0]}{student.last_name[0]}</div>
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
                                <div className={`h-full transition-all duration-1000 ${student.overall_progress === 100 ? 'bg-green-500' : 'bg-[#ce1212]'}`} style={{ width: `${student.overall_progress}%` }} />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 md:p-8">
                          <div className="flex items-center gap-2 text-gray-700 font-black text-xs md:text-sm">
                            <Clock size={16} className="text-amber-500 shrink-0" /> {formatDuration(student.total_time_spent)}
                          </div>
                        </td>
                        <td className="p-5 md:p-8 text-center">
                          <button onClick={() => setSelectedStudent(student)} className="inline-flex items-center gap-2 text-[9px] font-black uppercase bg-secondary text-white px-5 py-2.5 rounded-xl hover:bg-black transition-all active:scale-95 shadow-md">
                            <Search size={14} /> HAFTALIK KARNE
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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