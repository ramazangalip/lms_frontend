"use client";
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { 
  PlayCircle, 
  Headphones, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  LogOut, 
  Video, 
  CheckCircle2, 
  Send,
  X,
  Bot,
  Award,
  ArrowRight, 
  ListChecks,
  BookOpen,
  RefreshCcw,
  Sparkles,
  Lock,
  Menu,
  ShieldCheck,
  Zap,
  Eye,
  AlertCircle,
  Calendar
} from 'lucide-react';

// --- ARAYÜZ TANIMLAMALARI ---
interface Option {
  id: number;
  option_text: string;
}

interface Question {
  id: number;
  question_text: string;
  options: Option[];
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  questions: Question[];
}

interface FlashcardData {
  id: number;
  question: string;
  answer: string;
}

interface Material {
  id: number;
  content_type: 'video' | 'podcast' | 'form';
  embed_url: string;
  title: string;
  quiz?: Quiz;
}

interface WeeklyContent {
  id: number;
  week_number: number;
  title: string;
  description: string;
  intro_title?: string;
  intro_video_url?: string;
  release_date?: string; 
  is_locked: boolean;    
  lock_reason?: string;  
  is_intro_watched: boolean;
  materials: Material[];
  flashcards: FlashcardData[];
  progress?: number; 
  is_completed?: boolean;
}

interface ProgressData {
  weekly_content: number;
  completion_percentage: number;
  is_completed: boolean;
}

// --- 3D FLASHCARD BILEŞENI ---
const Flashcard = ({ question, answer }: { question: string, answer: string }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="group w-full max-w-xl mx-auto h-64 [perspective:1000px] cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
        <div className="absolute inset-0 w-full h-full bg-white border-2 border-gray-100 rounded-3xl shadow-sm flex flex-col items-center justify-center p-8 [backface-visibility:hidden]">
          <div className="bg-red-50 text-primary p-3 rounded-2xl mb-4"><BookOpen size={24} /></div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">SORU</span>
          <p className="text-center font-bold text-secondary text-base leading-tight">{question}</p>
          <div className="absolute bottom-4 flex items-center gap-2 text-[9px] text-primary font-bold uppercase animate-pulse">
            <RefreshCcw size={10} /> Cevabı Gör
          </div>
        </div>
        <div className="absolute inset-0 w-full h-full bg-primary text-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="text-[10px] font-black text-red-200 uppercase tracking-widest mb-4">CEVAP</span>
          <p className="text-center font-medium text-base leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
};

export default function StudentDashboard() {
  const [contents, setContents] = useState<WeeklyContent[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeeklyContent | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);
  const [isIntroView, setIsIntroView] = useState(true);
  const [loading, setLoading] = useState(true);
  const [completedMaterials, setCompletedMaterials] = useState<number[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- QUIZ STATE'LERİ ---
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{score: number, correct: number, wrong: number} | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [currentAttemptId, setCurrentAttemptId] = useState<number | null>(null);

  // --- AI ANALYSIS STATE'LERİ ---
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [aiAnalysisFeedback, setAiAnalysisFeedback] = useState<string | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  // AI CHAT STATE'LERİ
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{role: 'user' | 'bot', content: string}[]>([
    { role: 'bot', content: 'Merhaba! Ben BÜ-LMS Yapay Zeka asistanıyım. Sana nasıl yardımcı olabilirim?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- SAYAÇ SÜRELERİ ---
  const introWatchThreshold = 240;    // 4 dk
  const materialWatchThreshold = 420; // 7 dk

  const [watchTime, setWatchTime] = useState(0);
  const [introWatchTime, setIntroWatchTime] = useState(0);

  const trackingInterval = useRef<NodeJS.Timeout | null>(null);
  const watchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const introTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // --- MATERYAL SIRALAMA MANTIĞI (YENİ) ---
  const getSortedMaterials = (mats: Material[]) => {
    const orderMap = { video: 1, podcast: 2, form: 3 };
    return [...mats].sort((a, b) => (orderMap[a.content_type] || 4) - (orderMap[b.content_type] || 4));
  };

  // --- TEST KİLİT KONTROLÜ ---
  const isQuizLocked = () => {
    if (!selectedWeek || !activeMaterial || activeMaterial.content_type !== 'form') return false;
    const mediaToFinish = selectedWeek.materials.filter(m => m.content_type === 'video' || m.content_type === 'podcast');
    return mediaToFinish.some(m => !completedMaterials.includes(m.id));
  };

  // --- GENEL TANITIM VERİSİNİ ÇEKME ---
  const getIntroData = () => {
    const weekOne = contents.find(c => c.week_number === 1);
    return {
      url: weekOne?.intro_video_url || selectedWeek?.intro_video_url || "",
      title: weekOne?.intro_title || selectedWeek?.intro_title || "Genel Oryantasyon",
      isWatched: weekOne?.is_intro_watched || selectedWeek?.is_intro_watched || false
    };
  };

  const fetchPreviousAttempt = async (quizId: number) => {
    if (!quizId) return;
    try {
      const res = await api.get(`/contents/quiz-last-attempt/${quizId}/`);
      if (res.data && res.data.id) {
        setQuizResult({
          score: res.data.score,
          correct: res.data.correct_answers || res.data.correct,
          wrong: res.data.wrong_answers || res.data.wrong
        });
        setCurrentAttemptId(res.data.id);
      } else {
        setQuizResult(null);
        setCurrentAttemptId(null);
      }
    } catch (err) {
      setQuizResult(null);
      setCurrentAttemptId(null);
    }
  };

  useEffect(() => {
    if (activeMaterial?.content_type === 'form' && activeMaterial.quiz?.id) {
      if (completedMaterials.includes(activeMaterial.id)) {
        fetchPreviousAttempt(activeMaterial.quiz.id);
      } else {
        setQuizResult(null);
        setCurrentAttemptId(null);
      }
    } else {
      setQuizResult(null);
      setCurrentAttemptId(null);
    }
  }, [activeMaterial?.id, completedMaterials]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput("");
    setIsTyping(true);
    try {
      const res = await api.post('/contents/ai-chat/', { 
        message: userMsg,
        weekly_content_id: selectedWeek?.id 
      });
      setMessages(prev => [...prev, { role: 'bot', content: res.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: 'Üzgünüm, şu an bağlantı kuramıyorum.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const fetchContents = async (isUpdate = false) => {
    try {
      const [contentRes, progressRes, completedMatsRes] = await Promise.all([
        api.get('/contents/list/'),
        api.get('/contents/studentprogress/'),
        api.get('/contents/completed-materials-ids/')
      ]);
      setCompletedMaterials(completedMatsRes.data);
      const rawContents: WeeklyContent[] = contentRes.data;
      const progressData: ProgressData[] = progressRes.data;
      const mergedData = rawContents.map((week: WeeklyContent) => {
        const foundProgress = progressData.find((p: ProgressData) => p.weekly_content === week.id);
        return {
          ...week,
          progress: foundProgress ? foundProgress.completion_percentage : 0,
          is_completed: foundProgress ? foundProgress.is_completed : false
        };
      });
      setContents(mergedData);
      
      if (isInitialMount.current && mergedData.length > 0 && !selectedWeek) {
        const firstWeek = mergedData.sort((a: WeeklyContent, b: WeeklyContent) => a.week_number - b.week_number)[0];
        setSelectedWeek(firstWeek);
        setIsIntroView(true);
        isInitialMount.current = false;
      } 
      else if (isUpdate && selectedWeek) {
        const updated = mergedData.find((c: WeeklyContent) => c.id === selectedWeek.id);
        if (updated) {
          setSelectedWeek(updated);
          if (activeMaterial) {
            const updatedMaterial = updated.materials.find(m => m.id === activeMaterial.id);
            if (updatedMaterial) setActiveMaterial(updatedMaterial);
          }
        }
      }
    } catch (err) {
      console.error("Veri çekme hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  const handleCompleteMaterial = async (materialId: number) => {
    try {
      await api.post('/contents/complete-material/', { material_id: materialId });
      if (watchTimerRef.current) {
        clearInterval(watchTimerRef.current);
        watchTimerRef.current = null;
      }
      setWatchTime(0);
      await fetchContents(true);
    } catch (err) {
      console.error("Tamamlama hatası");
    }
  };

  const handleCompleteIntro = async () => {
    try {
      await api.post('/contents/weeks/complete-intro/');
      if (introTimerRef.current) {
        clearInterval(introTimerRef.current);
        introTimerRef.current = null;
      }
      setIntroWatchTime(0);
      await fetchContents(true);
    } catch (err) {
      console.error("Tanıtım tamamlama hatası");
    }
  };

  const handleQuizSubmit = async () => {
    if (!activeMaterial?.quiz) return;
    const totalQuestions = activeMaterial.quiz.questions.length;
    if (Object.keys(selectedAnswers).length < totalQuestions) {
      alert("Lütfen tüm soruları cevaplayın.");
      return;
    }
    setQuizSubmitting(true);
    try {
      const answers = Object.entries(selectedAnswers).map(([qId, oId]) => ({
        question_id: parseInt(qId),
        option_id: oId
      }));
      const res = await api.post(`/contents/quiz/${activeMaterial.quiz.id}/submit/`, { answers });
      setQuizResult({
        score: res.data.score,
        correct: res.data.correct,
        wrong: res.data.wrong
      });
      setCurrentAttemptId(res.data.attempt_id);
      setCompletedMaterials(prev => [...prev, activeMaterial.id]);
      await fetchContents(true);
    } catch (err) {
      console.error("Quiz submit hatası:", err);
      alert("Bu testi daha önce çözmüş olabilirsiniz.");
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleFetchAIAnalysis = async () => {
    if (!currentAttemptId) {
        alert("Analiz edilecek sınav verisi bulunamadı. Lütfen sayfayı yenileyin.");
        return;
    }
    setIsAnalysisLoading(true);
    setIsAnalysisModalOpen(true);
    setAiAnalysisFeedback(null);
    try {
      const res = await api.get(`/contents/quiz-analysis/${currentAttemptId}/`);
      setAiAnalysisFeedback(res.data.ai_feedback);
    } catch (err) {
      setAiAnalysisFeedback("Analiz şu an oluşturulamadı. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  useEffect(() => {
    if (introTimerRef.current) {
      clearInterval(introTimerRef.current);
      introTimerRef.current = null;
    }
    const introStatus = getIntroData();
    if (isIntroView && introStatus.url && !introStatus.isWatched) {
      setIntroWatchTime(0);
      introTimerRef.current = setInterval(() => {
        setIntroWatchTime((prev) => {
          const next = prev + 1;
          if (next >= introWatchThreshold) {
            handleCompleteIntro();
            return 0;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (introTimerRef.current) {
        clearInterval(introTimerRef.current);
        introTimerRef.current = null;
      }
    };
  }, [selectedWeek?.id, contents, isIntroView]);

  useEffect(() => {
    if (watchTimerRef.current) {
      clearInterval(watchTimerRef.current);
      watchTimerRef.current = null;
    }
    const introStatus = getIntroData();
    if (!isIntroView && activeMaterial && 
        (activeMaterial.content_type === 'video' || activeMaterial.content_type === 'podcast') && 
        !completedMaterials.includes(activeMaterial.id) &&
        introStatus.isWatched) {
      setWatchTime(0);
      watchTimerRef.current = setInterval(() => {
        setWatchTime((prev) => {
          const nextTime = prev + 1;
          if (nextTime >= materialWatchThreshold) {
            handleCompleteMaterial(activeMaterial.id);
            return 0;
          }
          return nextTime;
        });
      }, 1000);
    } else {
      setWatchTime(0);
    }
    return () => {
      if (watchTimerRef.current) {
        clearInterval(watchTimerRef.current);
        watchTimerRef.current = null;
      }
    };
  }, [activeMaterial?.id, completedMaterials, contents, isIntroView]);

  useEffect(() => {
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
      trackingInterval.current = null;
    }
    if (selectedWeek) {
      const sendPing = async () => {
        try {
          await api.post('/contents/track-activity/', {
            weekly_content_id: selectedWeek.id,
            seconds: 30 
          });
        } catch (err) { 
          console.error("Ping hatası"); 
        }
      };
      trackingInterval.current = setInterval(sendPing, 30000);
    }
    return () => { 
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
        trackingInterval.current = null;
      }
    };
  }, [selectedWeek?.id]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const handleWeekSelection = (weekData: WeeklyContent) => {
    if (weekData.is_locked) return;
    setSelectedWeek(weekData);
    setQuizResult(null);
    setSelectedAnswers({});
    setCurrentAttemptId(null);
    setCurrentCardIndex(0); 
    setIntroWatchTime(0);
    setIsIntroView(false); 
    if (weekData.materials.length > 0) {
      // Varsayılan materyali de sıralı seç
      setActiveMaterial(getSortedMaterials(weekData.materials)[0]);
    } else {
      setActiveMaterial(null);
    }
    setIsSidebarOpen(false); 
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-white flex-col gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-primary text-[10px] font-black tracking-widest animate-pulse uppercase">YÜKLENİYOR...</p>
    </div>
  );

  const introStatus = getIntroData();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-roboto relative text-secondary">
      
      {/* MOBİL ÜST BAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-secondary flex items-center justify-between px-6 z-[60] shadow-md">
        <h2 className="text-white font-black uppercase text-xs tracking-widest text-primary">BÜ-LMS</h2>
        <button onClick={() => setIsSidebarOpen(true)} className="text-white p-1.5 bg-gray-800 rounded-lg">
          <Menu size={20} />
        </button>
      </div>

      {/* SOL MENÜ (SIDEBAR) */}
      <aside className={`fixed inset-y-0 left-0 z-[100] w-72 bg-secondary shadow-2xl flex flex-col border-r border-gray-800 transition-transform duration-300 transform lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-gray-700 bg-black/20 text-center flex items-center justify-between shrink-0">
          <div className="w-full text-center ml-2 ">
            <h2 className="logo-text text-lg text-white tracking-widest text-primary font-bold uppercase leading-none">BÜ-LMS</h2>
            <p className="text-[9px] text-gray-500 uppercase mt-1.5 tracking-tighter text-center">ÖĞRENCİ PANELİ</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500 absolute right-4 top-5"><X size={20} /></button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar leading-tight">
          <button onClick={() => { setIsIntroView(true); setActiveMaterial(null); }} className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all border ${isIntroView ? 'bg-primary border-primary text-white shadow-lg' : 'bg-gray-800/40 border-gray-700 text-gray-400 hover:bg-gray-800'}`}>
            <div className="bg-white/10 p-1.5 rounded-lg shrink-0"><Video size={16}/></div>
            <div className="text-left"><p className="text-[8px] font-black uppercase tracking-widest leading-none mb-1 text-gray-400">Tanıtım</p><p className="text-xs font-bold uppercase">TANITIM VİDEOSU</p></div>
          </button>
          <div className="h-px bg-gray-700/50 mx-2 my-1" />
          {[1,2,3,4,5,6,7,8,9,10,11,12,13,14].map((num) => {
            const weekData = contents.find((c) => c.week_number === num);
            const isActive = selectedWeek?.week_number === num && !isIntroView;
            const isFinished = weekData?.is_completed;
            const introLocked = !introStatus.isWatched;
            const isWeekLocked = weekData?.is_locked || introLocked;
            const lockReason = weekData?.lock_reason || (introLocked ? "Önce tanıtım videosunu izlemelisiniz." : "");

            return (
              <div key={`sidebar-week-wrapper-${num}`} className="relative group text-left">
                <button 
                  disabled={!weekData || isWeekLocked} 
                  onClick={() => weekData && handleWeekSelection(weekData)} 
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all border ${isActive ? 'bg-primary border-primary text-white shadow-lg' : isWeekLocked ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed opacity-40' : weekData ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-transparent border-dashed border-gray-700 text-gray-700 opacity-20'}`}
                >
                  <div className="flex items-center gap-3">
                    {isWeekLocked ? (
                      <Lock size={14} className="text-gray-600" />
                    ) : isFinished ? (
                      <CheckCircle2 size={16} className="text-green-400" />
                    ) : (
                      <span className="text-[10px] font-bold">{num < 10 ? `0${num}` : num}</span>
                    )}
                    <div className="text-left leading-tight">
                      <p className="text-xs font-semibold">Hafta {num}</p>
                      {weekData && !isWeekLocked && <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-0.5">%{weekData.progress} TAMAMLANDI</p>}
                      {isWeekLocked && weekData && <p className="text-[7px] text-red-500 font-bold uppercase mt-0.5">KİLİTLİ</p>}
                    </div>
                  </div>
                  {weekData && !isWeekLocked && <ChevronRight size={12} className="opacity-40" />}
                </button>

                {isWeekLocked && weekData && (
                  <div className="hidden group-hover:block absolute left-full ml-2 top-0 w-48 bg-black text-white text-[9px] p-2 rounded-lg z-[110] shadow-xl border border-gray-700 animate-in fade-in slide-in-from-left-1 text-left">
                    <p className="font-bold flex items-center gap-1 text-red-400 uppercase mb-1">
                      <AlertCircle size={10} /> Erişim Engellendi
                    </p>
                    {lockReason}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <button onClick={handleLogout} className="p-5 border-t border-gray-700 flex items-center justify-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold text-[10px] tracking-widest uppercase shrink-0"><LogOut size={14} /> GÜVENLİ ÇIKIŞ</button>
      </aside>

      {/* ANA İÇERİK ALANI */}
      <main className="flex-1 overflow-y-auto bg-white custom-scrollbar pt-14 lg:pt-0">
        {selectedWeek ? (
          <div className="animate-in fade-in duration-500 text-left">
            {isIntroView ? (
              <div className="max-w-3xl mx-auto p-6 md:p-14 space-y-10 text-center">
                <div className="text-center space-y-3">
                  <div className="bg-primary/10 text-primary w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border border-primary/20 animate-pulse"><Zap size={28} /></div>
                  <h2 className="text-2xl md:text-4xl font-black text-secondary uppercase tracking-tighter leading-none">{introStatus.title}</h2>
                  <div className="bg-gray-50 px-4 py-2 rounded-xl border flex items-center gap-3 mx-auto w-fit shadow-sm">
                    <ShieldCheck size={16} className={introStatus.isWatched ? "text-green-500" : "text-primary"} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary">{introStatus.isWatched ? "TANITIM TAMAMLANDI, HAFTALAR ERİŞİME AÇILDI." : "HAFTALARIN AÇILMASI İÇİN VİDEOYU İZLEMELİSİNİZ."}</span>
                  </div>
                </div>
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-50 ring-1 ring-gray-200 bg-secondary text-center">
                  {introStatus.url ? <iframe src={introStatus.url} className="w-full h-full" allowFullScreen></iframe> : <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4"><Lock size={40} className="opacity-20" /><p className="font-black italic uppercase tracking-widest text-[10px]">Tanıtım videosu mevcut değil.</p></div>}
                </div>
              </div>
            ) : (
              <div className="max-w-screen-xl mx-auto p-6 md:p-10 text-left">
                <div className="mb-10 border-b pb-8 border-gray-100 flex flex-col md:flex-row md:items-end justify-between gap-6 leading-none text-left">
                  <div className="flex-1 space-y-4 leading-tight text-left">
                    <div className="flex items-center gap-3 text-left"><span className="bg-secondary text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest leading-none">HAFTA {selectedWeek.week_number}</span></div>
                    <h1 className="text-2xl md:text-4xl font-black text-secondary tracking-tighter uppercase leading-tight text-left">{selectedWeek.title}</h1>
                    <div className="flex items-center gap-3 text-left">
                      <div className="flex-1 max-w-xs bg-gray-100 h-1.5 rounded-full overflow-hidden border text-left"><div className={`h-full transition-all duration-1000 ${selectedWeek.is_completed ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${selectedWeek.progress || 0}%` }} /></div>
                      <span className="text-[10px] font-black text-gray-400">%{selectedWeek.progress || 0} TAMAM</span>
                    </div>
                  </div>
                  
                  {/* MATERYAL SEÇİCİ (SIRALI: Video -> Podcast -> Test) */}
                  <div className="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner border border-gray-200 overflow-x-auto no-scrollbar max-w-full shrink-0 leading-none">
                    {getSortedMaterials(selectedWeek.materials).map((mat) => {
                      let MatIcon = Zap;
                      if (mat.content_type === 'video') MatIcon = Video;
                      else if (mat.content_type === 'podcast') MatIcon = Headphones;
                      else if (mat.content_type === 'form') MatIcon = ListChecks;
                      const isThisQuizLocked = mat.content_type === 'form' && selectedWeek.materials.filter(m => m.content_type !== 'form').some(m => !completedMaterials.includes(m.id));
                      return (
                        <button key={mat.id} onClick={() => setActiveMaterial(mat)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap leading-none ${activeMaterial?.id === mat.id ? 'bg-white text-primary shadow-md scale-105' : 'text-gray-500'}`}>
                          {completedMaterials.includes(mat.id) ? <CheckCircle2 size={14} className="text-green-500" /> : isThisQuizLocked ? <Lock size={12} className="text-gray-400" /> : <MatIcon size={14} />}
                          <span className="ml-1 leading-none uppercase">{mat.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeMaterial ? (
                  <div className="space-y-12 animate-in slide-in-from-bottom-2 text-left">
                    <section className="material-display-area text-left">
                    {activeMaterial.content_type !== 'form' ? (
                      <div className="relative aspect-video shadow-2xl rounded-3xl overflow-hidden bg-black border-4 border-gray-50 ring-1 ring-gray-200 max-w-4xl mx-auto"><iframe src={activeMaterial.embed_url} className="absolute inset-0 w-full h-full" allowFullScreen></iframe></div>
                    ) : (
                      <div className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden max-w-4xl mx-auto text-left">
                        <div className="bg-secondary p-5 md:p-6 flex items-center justify-between text-white border-b-2 border-primary shrink-0 leading-none">
                          <div className="flex items-center gap-4 leading-none text-left">
                            <div className="bg-primary p-2.5 rounded-xl shadow-lg leading-none text-center"><ListChecks size={20}/></div>
                            <div className="text-left leading-none"><h2 className="text-white font-black text-base md:text-lg uppercase tracking-tighter mb-1 leading-none">{activeMaterial.quiz?.title || activeMaterial.title}</h2><p className="text-gray-400 text-[8px] font-bold uppercase tracking-widest leading-none">Değerlendirme Sınavı</p></div>
                          </div>
                        </div>
                        <div className="p-5 md:p-8 space-y-8 bg-gray-50/20 leading-normal text-left">
                          {isQuizLocked() ? (
                            <div className="text-center py-12 px-6 flex flex-col items-center gap-6 animate-in zoom-in-95 leading-none">
                              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center border-2 border-red-100 shadow-lg leading-none text-center"><Lock size={32} /></div>
                              <div className="space-y-2 text-center leading-none"><h3 className="text-lg font-black text-secondary uppercase tracking-tight leading-none">Test Kilitli</h3><p className="text-xs text-gray-500 font-medium max-w-sm mx-auto leading-relaxed text-center">Bu testi açabilmek için haftaya ait tüm videoları ve podcastleri bitirmelisiniz.</p></div>
                              <div className="flex flex-wrap justify-center gap-2 leading-none">
                                {getSortedMaterials(selectedWeek.materials).filter(m => m.content_type !== 'form').map(m => (
                                  <div key={m.id} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-2 border leading-none ${completedMaterials.includes(m.id) ? 'bg-green-50 border-green-100 text-green-600' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                                    {completedMaterials.includes(m.id) ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>} {m.title}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (completedMaterials.includes(activeMaterial.id) || quizResult) ? (
                            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-500 leading-none text-center">
                              <div className="w-14 h-14 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto border-2 border-green-100 shadow-xl animate-bounce leading-none"><Award size={28} /></div>
                              {quizResult && (
                                <div className="space-y-4 text-center leading-none">
                                  <h3 className="text-xl md:text-2xl font-black text-secondary uppercase tracking-tighter text-primary leading-none">Tebrikler!</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-lg mx-auto leading-none">
                                    <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-100 text-center shadow-sm leading-none"><p className="text-[8px] font-black text-gray-400 uppercase mb-2 leading-none">Skor</p><p className="text-xl font-black text-secondary leading-none">%{quizResult.score}</p></div>
                                    <div className="bg-green-50 p-4 rounded-xl border-2 border-green-100 text-center shadow-sm leading-none"><p className="text-[8px] font-black text-green-600 uppercase mb-2 leading-none">Doğru</p><p className="text-xl font-black text-green-600 leading-none">{quizResult.correct}</p></div>
                                    <div className="bg-red-50 p-4 rounded-xl border-2 border-red-100 text-center shadow-sm leading-none"><p className="text-[8px] font-black text-red-600 uppercase mb-2 leading-none">Yanlış</p><p className="text-xl font-black text-red-600 leading-none">{quizResult.wrong}</p></div>
                                  </div>
                                </div>
                              )}
                              <button onClick={handleFetchAIAnalysis} className="mx-auto flex items-center gap-2 bg-secondary text-white px-10 py-5 rounded-2xl font-black text-[10px] shadow-xl uppercase hover:scale-105 active:scale-95 transition-all leading-none mt-4"><Sparkles size={16} className="text-primary animate-pulse" /> AI ANALİZİ GÖR</button>
                            </div>
                          ) : (
                            <>
                              {activeMaterial.quiz?.questions.map((q, qIdx) => (
                                <div key={q.id} className="space-y-4 text-left leading-normal border-b border-gray-100 pb-6 last:border-0">
                                  <h3 className="text-sm md:text-base font-black text-secondary flex gap-3 text-left leading-tight"><span className="text-primary leading-none">0{qIdx + 1}.</span> {q.question_text}</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:pl-8 leading-none">{q.options.map((opt) => (<button key={opt.id} onClick={() => setSelectedAnswers(prev => ({...prev, [q.id]: opt.id}))} className={`p-3.5 rounded-xl text-left text-[11px] font-bold border-2 transition-all flex items-center justify-between group leading-tight ${selectedAnswers[q.id] === opt.id ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-gray-100 text-gray-500 hover:border-red-100'}`}>{opt.option_text}{selectedAnswers[q.id] === opt.id && <ArrowRight size={12}/>}</button>))}</div>
                                </div>
                              ))}
                              <button onClick={handleQuizSubmit} disabled={quizSubmitting} className="w-full bg-secondary text-white py-4 rounded-xl font-black tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:bg-gray-200 uppercase mt-6 text-[10px] leading-none"><Send size={18} className="text-primary"/> SINAVI BİTİR VE ANALİZ ET</button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    </section>

                    <section className="flashcard-notes-grid space-y-12 text-left">
                      {selectedWeek.flashcards && selectedWeek.flashcards.length > 0 && (
                        <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 space-y-8 leading-none text-left">
                            <div className="flex items-center justify-between leading-none text-left">
                              <div className="flex items-center gap-4 shrink-0 text-left leading-none"><div className="bg-primary p-3 rounded-2xl text-white shadow-lg leading-none text-center"><BookOpen size={24}/></div><h3 className="font-black text-secondary uppercase text-lg tracking-tighter leading-none text-left">TEKRAR KARTLARI</h3></div>
                              <div className="flex items-center gap-3 bg-white p-1.5 rounded-full border shadow-sm shrink-0 leading-none">
                                  <button onClick={() => setCurrentCardIndex(prev => Math.max(0, prev - 1))} className="p-2 hover:bg-gray-50 rounded-full transition-colors disabled:opacity-20 leading-none" disabled={currentCardIndex === 0}><ChevronLeft size={20}/></button>
                                  <span className="text-[10px] font-black w-10 text-center leading-none">{currentCardIndex + 1}/{selectedWeek.flashcards.length}</span>
                                  <button onClick={() => setCurrentCardIndex(prev => Math.min(selectedWeek.flashcards.length - 1, prev + 1))} className="p-2 hover:bg-gray-50 rounded-full transition-colors disabled:opacity-20 leading-none" disabled={currentCardIndex === selectedWeek.flashcards.length - 1}><ChevronRight size={20}/></button>
                              </div>
                            </div>
                            <Flashcard key={`fc-${selectedWeek.flashcards[currentCardIndex].id}`} question={selectedWeek.flashcards[currentCardIndex].question} answer={selectedWeek.flashcards[currentCardIndex].answer} />
                        </div>
                      )}
                      <div className="bg-white rounded-[3rem] border-2 border-gray-50 shadow-xl overflow-hidden flex flex-col min-h-[400px] leading-normal text-left">
                         <div className="bg-gray-50/80 px-8 py-6 border-b border-gray-100 flex items-center gap-4 shrink-0 leading-none"><FileText size={24} className="text-primary leading-none" /><h3 className="font-black text-secondary uppercase tracking-widest text-[10px] leading-none text-left">Akademik Notlar</h3></div>
                         <div className="p-8 md:p-10 text-gray-600 leading-relaxed text-base italic font-light overflow-y-auto flex-1 custom-scrollbar text-left">{selectedWeek.description || "Haftaya ait ders notu bulunmamaktadır."}</div>
                      </div>
                    </section>
                  </div>
                ) : <div className="bg-gray-50 rounded-[3rem] p-24 text-center border-4 border-dashed border-gray-100 text-gray-300 font-black uppercase tracking-widest italic flex flex-col items-center gap-5 leading-none text-center"><Eye size={64} className="opacity-10" /> LÜTFEN BİR MATERYAL SEÇİNİZ</div>}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-200 p-8 text-center gap-6 leading-none"><PlayCircle size={120} strokeWidth={0.5} className="animate-pulse opacity-10" /><p className="text-xl font-black uppercase tracking-[0.5em] opacity-20 text-secondary text-center leading-none">Öğretim Haftası Seçin</p></div>
        )}
      </main>

      {/* AI CHAT PANELİ */}
      <div className="fixed bottom-4 right-4 z-[999] flex flex-col items-end gap-2 shrink-0 leading-none text-left">
        {isChatOpen && (
          <div className="w-[240px] md:w-[280px] h-[360px] bg-white rounded-[1.25rem] shadow-[0_15px_40px_rgba(0,0,0,0.2)] border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 ring-1 ring-black/5 shrink-0 leading-none">
            <div className="bg-secondary p-3 flex items-center justify-between text-white shrink-0 shadow-lg leading-none">
              <div className="flex items-center gap-2 leading-none"><div className="bg-primary p-1.5 rounded-lg shadow-md text-center leading-none"><Bot size={14} /></div><h4 className="text-[9px] font-black tracking-widest uppercase leading-none text-left">BÜ-AI ASİSTAN</h4></div>
              <button onClick={() => setIsChatOpen(false)} className="hover:text-primary transition-all shrink-0 p-1 leading-none text-center"><X size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-gray-50/50 custom-scrollbar shrink-0 leading-relaxed text-left">
              {messages.map((msg, idx) => (<div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in leading-none`}><div className={`max-w-[90%] p-2 rounded-lg text-[9px] font-medium shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-secondary rounded-tl-none border border-gray-100'}`}>{msg.content}</div></div>))}
              {isTyping && <div className="flex justify-start leading-none"><div className="bg-white p-2 rounded-lg rounded-tl-none shadow-sm flex gap-1 animate-pulse border border-gray-100 leading-none text-center"><span className="w-1 h-1 bg-gray-300 rounded-full"></span><span className="w-1 h-1 bg-gray-300 rounded-full"></span><span className="w-1 h-1 bg-gray-300 rounded-full"></span></div></div>}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendChatMessage} className="p-2.5 bg-white border-t border-gray-100 flex gap-2 shrink-0 leading-none"><input type="text" placeholder="Sor..." className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-lg px-3 py-1.5 text-[9px] outline-none focus:border-primary transition-all font-bold text-secondary shadow-inner leading-none" value={chatInput} onChange={(e) => setChatInput(e.target.value)} /><button type="submit" className="bg-primary text-white p-2 rounded-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0 leading-none text-center"><Send size={12} /></button></form>
          </div>
        )}
        <button onClick={() => setIsChatOpen(!isChatOpen)} className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95 z-[1000] border-2 border-white shrink-0 ${isChatOpen ? 'bg-secondary text-white' : 'bg-primary text-white'}`}>{isChatOpen ? <X size={18} /> : <Bot size={20} />}</button>
      </div>

      {/* AI ANALYSIS MODAL */}
      {isAnalysisModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-secondary/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto leading-none text-left">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden border-4 border-white my-auto flex flex-col max-h-[90vh] leading-none text-left">
            <div className="bg-secondary p-8 flex items-center justify-between text-white border-b-4 border-primary shrink-0 leading-none text-left">
              <div className="flex items-center gap-5 leading-none text-left">
                <div className="bg-primary p-3 rounded-2xl shadow-lg leading-none text-center shadow-red-500/20"><Bot size={28} /></div>
                <div className="leading-none text-left"><h3 className="font-black uppercase tracking-tighter text-xl leading-none text-left">BÜ-AI Performans Raporu</h3><p className="text-primary text-[10px] font-bold uppercase tracking-widest mt-1 leading-none text-left">Yapay Zeka Eğitim Mentörü</p></div>
              </div>
              <button onClick={() => setIsAnalysisModalOpen(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary transition-all p-1 leading-none text-center"><X size={24} /></button>
            </div>
            <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50 min-h-[300px] leading-relaxed text-left">
              {isAnalysisLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-8 leading-none text-center"><div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin leading-none text-center"></div><p className="text-secondary font-black text-xl uppercase tracking-widest animate-pulse leading-none text-center">Veriler Analiz Ediliyor...</p></div>
              ) : (
                <div className="bg-white border-2 border-primary/10 p-8 rounded-[2.5rem] shadow-sm leading-relaxed text-left animate-in slide-in-from-bottom-4 text-left">
                  <div className="flex items-center gap-3 mb-6 text-primary leading-none text-left"><Sparkles size={20} /><span className="font-black text-xs uppercase tracking-widest leading-none text-left">Akıllı Geri Bildirim</span></div>
                  <p className="text-secondary font-medium leading-loose text-base whitespace-pre-line italic leading-relaxed text-left">&quot;{aiAnalysisFeedback}&quot;</p>
                </div>
              )}
            </div>
            <div className="p-8 bg-white border-t flex justify-center shrink-0 leading-none text-center"><button onClick={() => setIsAnalysisModalOpen(false)} className="w-full md:w-auto bg-secondary text-white px-16 py-5 rounded-[2rem] font-black text-xs tracking-widest shadow-xl uppercase active:scale-95 transition-all leading-none text-center">Kapat Ve Devam Et</button></div>
          </div>
        </div>
      )}
    </div>
  );
}