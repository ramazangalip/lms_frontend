"use client";
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { 
  PlayCircle, Headphones, FileText, ChevronRight, ChevronLeft,
  LogOut, Video, CheckCircle2, Send, X, Bot, Award, ArrowRight, 
  ListChecks, BookOpen, RefreshCcw, Sparkles, Lock, Menu,
  ShieldCheck, Zap, Eye, AlertCircle, Calendar, Download,
  ShieldAlert
} from 'lucide-react';

// --- VERİ TİPİ TANIMLAMALARI ---
interface Option { id: number; option_text: string; }
interface Question { id: number; question_text: string; options: Option[]; }
interface Quiz { id: number; title: string; description: string; questions: Question[]; }
interface FlashcardData { id: number; question: string; answer: string; }
interface Material { 
  id: number; 
  content_type: 'video' | 'podcast' | 'form' | 'pdf' | 'assignment';
  embed_url: string; 
  title: string; 
  point_value?: number; 
  quiz?: Quiz; 
}
interface WeeklyContent {
  id: number; 
  week_number: number; 
  title: string; 
  description: string;
  intro_title?: string; 
  intro_description?: string; 
  intro_video_url?: string; 
  release_date?: string; 
  is_locked: boolean; 
  lock_reason?: string; 
  is_intro_watched: boolean;
  materials: Material[]; 
  flashcards: FlashcardData[]; 
  progress?: number; 
  is_completed?: boolean;
  // YENİ EKLENEN ALAN:
  current_attempt_round: number; 
  pre_test_questions?: Question[]; // Bunu ekle
  pre_test_data?: {                // Bunu ekle
    is_completed: boolean;
    score: number;
  };
  is_entry_test_required?: boolean;
  entry_questions?: Question[];
}
interface ProgressData { weekly_content: number | string; completion_percentage: number; is_completed: boolean; }



export default function StudentDashboard() {
  const [contents, setContents] = useState<WeeklyContent[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeeklyContent | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);
  const [isIntroView, setIsIntroView] = useState(true);
  const [loading, setLoading] = useState(true);
  const [completedMaterials, setCompletedMaterials] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pointsEarned, setPointsEarned] = useState<{show: boolean, amount: number}>({show: false, amount: 0});
  const [userTotalPoints, setUserTotalPoints] = useState(0);
  const trackingInterval = useRef<NodeJS.Timeout | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{score: number, correct: number, wrong: number} | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [aiAnalysisFeedback, setAiAnalysisFeedback] = useState<string | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{role: 'user' | 'bot', content: string}[]>([{ role: 'bot', content: 'Merhaba! Ben BÜ-LMS Yapay Zeka asistanıyım. Sana nasıl yardımcı olabilirim?' }]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
const [entryAnswers, setEntryAnswers] = useState<Record<number, number>>({});
const [entrySubmitting, setEntrySubmitting] = useState(false);

  const materialWatchThreshold = 300; 
  const introWatchThreshold = 240;    
  const [watchTime, setWatchTime] = useState(0);
  const [introWatchTime, setIntroWatchTime] = useState(0);
  const activeMaterialRef = useRef<Material | null>(null);
  const watchTimeInternalRef = useRef(0);
  const introWatchTimeInternalRef = useRef(0);
  const watchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const introTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  // State tanımlamalarının olduğu bölüme ekle
  const [preTestQuestions, setPreTestQuestions] = useState<Question[]>([]);
  const [preTestAnswers, setPreTestAnswers] = useState<Record<number, number>>({});
  const [preTestResult, setPreTestResult] = useState<{
  score: number, 
  correct?: number, 
  wrong?: number, 
  is_completed: boolean
} | null>(null);
  const [preTestSubmitting, setPreTestSubmitting] = useState(false);
  const [entryResult, setEntryResult] = useState<{ 
  unlockedWeeks: number[], 
  isSuccess: boolean,
  correctCount: number,
  wrongCount: number 
}>({ 
  unlockedWeeks: [], 
  isSuccess: false, 
  correctCount: 0, 
  wrongCount: 0 
});

  useEffect(() => { activeMaterialRef.current = activeMaterial; }, [activeMaterial]);

const getSortedMaterials = (mats: Material[]) => {
  // Sıralama: pdf (1), video (2), podcast (3), form (4)
  const orderMap = { pdf: 1, video: 2, podcast: 3, form: 4 ,assignment: 5};
  return [...mats].sort((a, b) => (orderMap[a.content_type] || 6) - (orderMap[b.content_type] || 6));
};

  const isQuizLocked = () => {
  // Eğer hafta seçili değilse kilitlemeye gerek yok
  if (!selectedWeek) return false;

  // Hafta içindeki sınav (form) dışındaki tüm materyalleri (video, pdf, assignment vb.) bul
  const requiredMaterials = selectedWeek.materials.filter(m => m.content_type !== 'form');
  
  // Eğer bu zorunlu materyallerden herhangi biri tamamlanmamışsa kilitlidir (true döner)
  return requiredMaterials.some(m => !completedMaterials.includes(String(m.id)));
};

const getIntroData = () => {
  const weekOne = contents.find(c => c.week_number === 1);
  return {
    url: weekOne?.intro_video_url || "",
    title: weekOne?.intro_title || "Genel Oryantasyon",
    isWatched: weekOne?.is_intro_watched || false,
    // Yeni alanı ekledik:
    description: weekOne?.intro_description || "" 
  };
};

const fetchContents = async (isUpdate = false) => {
  try {
    const [contentRes, progressRes, completedMatsRes, analyticsRes, preTestRes] = await Promise.all([
      api.get('/contents/list/'), 
      api.get('/contents/studentprogress/'),
      api.get('/contents/completed-materials-ids/'), 
      api.get('/contents/analytics/'),
      api.get('/contents/pre-test/status/')
    ]);

    // --- ÖN TEST VERİLERİNİ SETLİYORUZ (KRİTİK GÜNCELLEME) ---
    if (preTestRes.data) {
      setPreTestQuestions(preTestRes.data.questions || []);
      
      if (preTestRes.data.result) {
        // Objeyi parçalayarak (destructuring) state'e tam olarak ne gittiğini netleştiriyoruz
        const { is_completed, score, correct, wrong } = preTestRes.data.result;
        setPreTestResult({
          is_completed: is_completed,
          score: score,
          correct: correct, // Backend'den gelen 'correct' alanı
          wrong: wrong      // Backend'den gelen 'wrong' alanı
        });
      }
    }
    
    // 2. Kullanıcı puanlarını güncelle
    setUserTotalPoints(analyticsRes.data.total_points || 0);
    
    // 3. Tamamlanan materyal ID'lerini string listesi yap
    const stringifiedCompleted = (completedMatsRes.data || []).map((id: any) => String(id));
    setCompletedMaterials(stringifiedCompleted);
    
    // 4. Haftalık içerikleri ve ilerleme yüzdelerini birleştir
    const rawContents = contentRes.data;
    const mergedData = rawContents.map((week: WeeklyContent) => {
      const foundProgress = progressRes.data.find((p: ProgressData) => String(p.weekly_content) === String(week.id));
      return { 
        ...week, 
        progress: foundProgress ? Math.round(foundProgress.completion_percentage) : 0, 
        is_completed: foundProgress ? foundProgress.is_completed : false 
      };
    });
    setContents(mergedData);

    // 5. Mevcut seçili hafta varsa, verilerini tazele
    if (selectedWeek) {
      const freshWeekData = mergedData.find((w: WeeklyContent) => w.id === selectedWeek.id);
      if (freshWeekData) {
        setSelectedWeek(freshWeekData);
      }
    }

    // 6. Haftalık Sınav (Quiz) Durum Kontrolü
    const currentWeek = selectedWeek || mergedData.sort((a: any, b: any) => a.week_number - b.week_number)[0];
    if (currentWeek) {
      const quizMat = currentWeek.materials.find((m: any) => m.content_type === 'form');
      if (quizMat && stringifiedCompleted.includes(String(quizMat.id))) {
         try {
           const res = await api.get(`/contents/quiz/${quizMat.quiz.id}/last-attempt/`);
           if (res.data) {
             setQuizResult({
               score: res.data.score,
               correct: res.data.correct,
               wrong: res.data.wrong
             });
             setCurrentAttemptId(String(res.data.id));
           }
         } catch (qErr) {
           console.log("Haftalık sınav verisi çekilemedi.");
         }
      }
    }

    // 7. İlk açılış kontrolü
    if (isInitialMount.current && mergedData.length > 0 && !selectedWeek) {
      setSelectedWeek(mergedData.sort((a: any, b: any) => a.week_number - b.week_number)[0]);
      setIsIntroView(true); 
      isInitialMount.current = false;
    }

  } catch (err) { 
    console.error("Öğrenci verileri yüklenirken hata oluştu:", err); 
  } finally { 
    setLoading(false); 
  }
};
  useEffect(() => { fetchContents(); }, []);

  const handleCompleteMaterial = async (materialId: number | string) => {
    if (!materialId) return;
    try {
      const res = await api.post('contents/complete-material/', { material_id: String(materialId) });
      if (res.data.status === "success") {
          if (res.data.new_points_earned > 0) {
              setPointsEarned({ show: true, amount: res.data.new_points_earned });
              setUserTotalPoints(res.data.total_points);
              setTimeout(() => setPointsEarned({ show: false, amount: 0 }), 5000);
          }
      }
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
      watchTimeInternalRef.current = 0; setWatchTime(0);
      await fetchContents(true);
    } catch (err) { console.error("Tamamlama hatası."); }
  };

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
      // Hangi materyal açıksa onun ID'sini gönderiyoruz
      material_id: activeMaterial?.id || null, 
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
  // ARTIK materyal değişince de (activeMaterial?.id) ping mekanizması tazelemeye girecek
}, [selectedWeek?.id, activeMaterial?.id]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  // Bu fonksiyonu "Test Gönderimi" bölümüne ekle
const handlePreTestSubmit = async () => {
  if (Object.keys(preTestAnswers).length < preTestQuestions.length) {
    alert("Lütfen tüm ön değerlendirme sorularını cevaplayın.");
    return;
  }
  setPreTestSubmitting(true);
  try {
    const answers = Object.entries(preTestAnswers).map(([qId, oId]) => ({
      question_id: Number(qId),
      option_id: Number(oId)
    }));
    
    // Backend: path('pre-test/submit/', ...)
    const res = await api.post('/contents/pre-test/submit/', { answers });
    
    // Backend'den gelen TAM sonucu state'e yaz (Skor, Doğru, Yanlış)
    setPreTestResult({ 
      score: res.data.score, 
      correct: res.data.correct, 
      wrong: res.data.wrong, 
      is_completed: true 
    });
    
    // Sidebar kilitlerinin kalkması için genel listeyi tekrar çek
    await fetchContents(true);
    alert("Ön değerlendirme başarıyla tamamlandı!");
  } catch (err) {
    alert("Ön test gönderilirken bir hata oluştu.");
  } finally {
    setPreTestSubmitting(false);
  }
};

const handleEntryTestSubmit = async () => {
  if (!selectedWeek || !selectedWeek.entry_questions) return;
  
  if (Object.keys(entryAnswers).length < selectedWeek.entry_questions.length) {
    alert("Lütfen tüm hazırlık sorularını cevaplayın.");
    return;
  }

  setEntrySubmitting(true);
  try {
    const answers = Object.entries(entryAnswers).map(([qId, oId]) => ({
      question_id: Number(qId),
      option_id: Number(oId)
    }));

    const res = await api.post(`/contents/week/${selectedWeek.week_number}/submit-entry-test/`, { answers });
    
    // Eğer yanlış cevaplar varsa, backend kilitleri açtı. Kullanıcıya bilgi ver.
    if (res.data.wrong_target_weeks && res.data.wrong_target_weeks.length > 0) {
      alert(`Bazı soruları yanlış cevapladınız. Hatırlamanız için şu haftaların kilidi 2 günlüğüne açıldı: ${res.data.wrong_target_weeks.join(', ')}. hafta`);
    }

    // Başarılıysa verileri tazele (Artık materyaller gelecek çünkü is_entry_test_required: false olacak)
    await fetchContents(true);
    setEntryAnswers({}); // State'i temizle
  } catch (err) {
    alert("Test gönderilirken bir hata oluştu.");
  } finally {
    setEntrySubmitting(false);
  }
};

  // --- TEST GÖNDERİMİ ---
  const handleQuizSubmit = async () => {
    if (!activeMaterial?.quiz) return;
    const totalQs = activeMaterial.quiz.questions.length;
    if (Object.keys(selectedAnswers).length < totalQs) { 
      alert("Lütfen tüm soruları cevaplayın."); 
      return; 
    }
    setQuizSubmitting(true);
    try {
      const answers = Object.entries(selectedAnswers).map(([qId, oId]) => ({ 
        question_id: String(qId), 
        option_id: String(oId) 
      }));
      
      const res = await api.post(`/contents/quiz/${String(activeMaterial.quiz.id)}/submit/`, { answers });
      
      setQuizResult({ 
        score: res.data.score, 
        correct: res.data.correct, 
        wrong: res.data.wrong 
      });
      setCurrentAttemptId(String(res.data.attempt_id));

      // TUR KONTROLÜ VE UYARI
      if (res.data.next_round_activated) {
        alert("Yanlış cevaplarınız olduğu için Yapay Zeka analizinden sonra 2. Tur başlayacaktır. Materyalleri tekrar gözden geçirebilirsiniz.");
      }

      const earned = res.data.points_earned || 0;
      if (earned > 0) {
        setPointsEarned({ show: true, amount: earned });
        setUserTotalPoints(prev => prev + earned);
        setTimeout(() => setPointsEarned({ show: false, amount: 0 }), 5000);
      }
      
      await fetchContents(true); // Tüm verileri ve yeni round bilgisini çek
    } catch (err) { 
      alert("Test gönderim hatası."); 
    } finally { 
      setQuizSubmitting(false); 
    }
  };
  const handleFetchAIAnalysis = async () => {
  if (!currentAttemptId) return;
  setIsAnalysisLoading(true);
  setIsAnalysisModalOpen(true);
  setAiAnalysisFeedback("");

  try {
    // Backend'deki yeni QuizAIAnalysisView'e istek atıyoruz
    // Bu view artık Vertex AI yerine veritabanındaki 'explanation' alanlarını birleştirip dönecek
    const res = await api.get(`/contents/quiz-analysis/${currentAttemptId}/`);
    
    if (res.data && res.data.ai_feedback) {
      setAiAnalysisFeedback(res.data.ai_feedback);
    } else {
      setAiAnalysisFeedback("Analiz verisi bulunamadı.");
    }
  } catch (err) {
    console.error("Analiz Hatası:", err);
    setAiAnalysisFeedback("Analiz yüklenirken bir hata oluştu.");
  } finally {
    setIsAnalysisLoading(false);
  }
};

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput(""); setIsTyping(true);
    try {
      const res = await api.post('/contents/ai-chat/', { message: userMsg, weekly_content_id: selectedWeek?.id });
      setMessages(prev => [...prev, { role: 'bot', content: res.data.response }]);
    } catch (err) { setMessages(prev => [...prev, { role: 'bot', content: 'Hata oluştu.' }]); } finally { setIsTyping(false); }
  };

  const introStatus = getIntroData();

 useEffect(() => {
    // Mevcut bir sayaç varsa her ihtimale karşı temizle
    if (introTimerRef.current) clearInterval(introTimerRef.current);
    
    // Eğer öğrenci Tanıtım ekranındaysa ve henüz kilitler açılmamışsa (isWatched false ise)
    if (isIntroView && !introStatus.isWatched) {
      console.log("Tanıtım izleme sayacı başlatıldı. Hedef süre:", introWatchThreshold, "saniye.");
      
      // İç referansı ve görsel sayacı her girişte sıfırla
      introWatchTimeInternalRef.current = 0;
      setIntroWatchTime(0);

      introTimerRef.current = setInterval(() => {
        introWatchTimeInternalRef.current += 1; 
        setIntroWatchTime(introWatchTimeInternalRef.current);
        
        // Hata ayıklama için her saniye konsola yazdırabilirsin
        // console.log("Tanıtım Saniyesi:", introWatchTimeInternalRef.current);

        // Hedef süreye ulaşıldığında kilit açma isteği gönder
        if (introWatchTimeInternalRef.current >= introWatchThreshold) {
          console.log("Tanıtım süresi doldu, kilitler açılıyor...");
          
          // Sayacı durdur
          if (introTimerRef.current) clearInterval(introTimerRef.current);
          
          // API isteği gönder
          api.post('/contents/weeks/complete-intro/')
             .then(() => {
                // Başarılı olduğunda içerikleri tazele (Kilit ikonlarının gitmesi için)
                fetchContents(true); 
             })
             .catch(err => {
                console.error("Tanıtım tamamlama isteği gönderilemedi:", err);
             });
        }
      }, 1000);
    }

    // Bileşen kapandığında veya sayfa değiştiğinde sayacı mutlaka temizle (Memory leak önleyici)
    return () => { 
      if (introTimerRef.current) clearInterval(introTimerRef.current); 
    };
    
    // Bağımlılıklardan introStatus.url kaldırıldı; artık video olsa da olmasa da çalışır.
  }, [isIntroView, introStatus.isWatched]);

  useEffect(() => {
    if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    if (!isIntroView && activeMaterial && (activeMaterial.content_type === 'video' || activeMaterial.content_type === 'podcast') && !completedMaterials.includes(String(activeMaterial.id)) && introStatus.isWatched) {
      watchTimeInternalRef.current = 0;
      watchTimerRef.current = setInterval(() => {
        watchTimeInternalRef.current += 1; setWatchTime(watchTimeInternalRef.current);
        if (watchTimeInternalRef.current >= materialWatchThreshold) { if (activeMaterialRef.current) handleCompleteMaterial(activeMaterialRef.current.id); }
      }, 1000);
    }
    return () => { if (watchTimerRef.current) clearInterval(watchTimerRef.current); };
  }, [activeMaterial?.id, isIntroView, completedMaterials.length, introStatus.isWatched]);

  // --- HAFTA DEĞİŞTİĞİNDE SINAV SONUCUNU TEMİZLE VEYA GETİR ---
  const handleWeekSelection = (weekData: WeeklyContent) => {
    if (weekData.is_locked) return;
    setSelectedWeek(weekData);
    setQuizResult(null); // Önce temizle
    setSelectedAnswers({});
    setCurrentAttemptId(null);
    setIsIntroView(false);
    
    // Seçilen haftada test varsa ve bitmişse sonucunu getir
    const quizMat = weekData.materials.find(m => m.content_type === 'form');
    if (quizMat && completedMaterials.includes(String(quizMat.id))) {
      api.get(`/contents/quiz/${quizMat.quiz?.id}/last-attempt/`).then(res => {
        setQuizResult({ score: res.data.score, correct: res.data.correct, wrong: res.data.wrong });
        setCurrentAttemptId(String(res.data.id));
      }).catch(() => {});
    }

    if (weekData.materials.length > 0) setActiveMaterial(getSortedMaterials(weekData.materials)[0]);
    else setActiveMaterial(null);
    setIsSidebarOpen(false); 
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-white flex-col gap-4 text-left text-secondary">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-primary text-[10px] font-black uppercase tracking-widest animate-pulse">YÜKLENİYOR...</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-roboto relative text-secondary text-left">
      
      {/* YEŞİL ŞEFFAF PUAN BİLDİRİMİ */}
      {pointsEarned.show && (
        <div className="fixed top-6 right-6 z-[1000] animate-in slide-in-from-right-10 duration-500">
           <div className="bg-green-500/10 backdrop-blur-md border border-green-500/20 text-green-700 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4">
              <div className="bg-green-500 text-white p-2 rounded-full shadow-lg shadow-green-500/30">
                <Award size={20} />
              </div>
              <div className="text-left leading-tight">
                <p className="text-[10px] font-bold uppercase opacity-70">Tebrikler!</p>
                <p className="text-sm font-black">+{pointsEarned.amount} Puan Kazandınız!</p>
              </div>
           </div>
        </div>
      )}

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
          <div className="w-full text-center ml-2">
            <h2 className="logo-text text-lg text-white tracking-widest text-primary font-bold uppercase leading-none">BÜ-LMS</h2>
            <p className="text-[9px] text-gray-500 uppercase mt-1.5 tracking-tighter text-center">ÖĞRENCİ PANELİ</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500 absolute right-4 top-5"><X size={20} /></button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar leading-tight text-left">
          <button onClick={() => { setIsIntroView(true); setActiveMaterial(null); }} className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all border ${isIntroView ? 'bg-primary border-primary text-white shadow-lg' : 'bg-gray-800/40 border-gray-700 text-gray-400 hover:bg-gray-800'}`}>
            <div className="bg-white/10 p-1.5 rounded-lg shrink-0"><Video size={16}/></div>
            <div className="text-left"><p className="text-[8px] font-black uppercase tracking-widest mb-1 text-gray-400">Tanıtım</p><p className="text-xs font-bold uppercase">TANITIM</p></div>
          </button>
          <div className="h-px bg-gray-700/50 mx-2 my-1" />
          {[1,2,3,4,5,6,7,8,9,10,11,12,13,14].map((num) => {
            const weekData = contents.find((c) => c.week_number === num);
            const isActive = selectedWeek?.week_number === num && !isIntroView;
            const isFinished = weekData?.is_completed;
            const introLocked = !introStatus.isWatched;
            const preTestLocked = !preTestResult?.is_completed;
            const isWeekLocked = num >= 1 && (introLocked || preTestLocked);
            const lockReason = introLocked 
  ? "Önce tanıtım videosunu izlemelisiniz." 
  : (preTestLocked ? "Önce ön değerlendirme testini bitirmelisiniz." : "");

            return (
              <div key={`sidebar-week-wrapper-${num}`} className="relative group">
                <button 
                  disabled={!weekData || isWeekLocked} 
                  onClick={() => weekData && handleWeekSelection(weekData)} 
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all border ${isActive ? 'bg-primary border-primary text-white shadow-lg' : isWeekLocked ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed opacity-40' : weekData ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-transparent border-dashed border-gray-700 text-gray-700 opacity-20'}`}
                >
                  <div className="flex items-center gap-3 text-left">
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
                  <div className="hidden group-hover:block absolute left-full ml-2 top-0 w-48 bg-black text-white text-[9px] p-2 rounded-lg z-[110] shadow-xl border border-gray-700 animate-in fade-in slide-in-from-left-1">
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

      <main className="flex-1 overflow-y-auto bg-white custom-scrollbar pt-14 lg:pt-0">
       {/* --- HAFTA İÇERİĞİ ANA ALANI --- */}
{/* --- HAFTA İÇERİĞİ ANA ALANI --- */}
{/* --- HAFTA İÇERİĞİ ANA ALANI --- */}
{selectedWeek ? (
  <div className="animate-in fade-in duration-500">
    
    {/* 1. KADEME KONTROL: SİSTEME İLK GİRİŞ (TANITIM VEYA GENEL ÖN TEST EKSİKSE) */}
    {(isIntroView || !introStatus.isWatched || !preTestResult?.is_completed) ? (
      <div className="max-w-4xl mx-auto p-6 md:p-14 space-y-12 animate-in fade-in duration-700">
        
        {/* TANITIM BÖLÜMÜ */}
        <div className="space-y-10 text-center leading-none">
          <div className="text-center space-y-4">
            <div className="bg-primary/10 text-primary w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border border-primary/20 animate-pulse">
              <Zap size={28} />
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-secondary uppercase tracking-tighter leading-none">
              {introStatus.title}
            </h2>
            <div className="bg-gray-50 px-4 py-2.5 rounded-xl border flex items-center gap-3 mx-auto w-fit shadow-sm">
              <ShieldCheck size={16} className={introStatus.isWatched ? "text-green-500" : "text-primary"} />
              <span className="text-[10px] font-black uppercase tracking-widest text-secondary">
                {introStatus.isWatched 
                  ? "TANITIM VİDEOSU İZLENDİ" 
                  : "SİSTEME GİRİŞ İÇİN ÖNCE VİDEOYU İZLEMELİSİNİZ"}
              </span>
            </div>
          </div>

          {introStatus.url && (
            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-gray-50 ring-1 ring-gray-200 bg-secondary">
              <iframe src={introStatus.url} className="w-full h-full" allowFullScreen></iframe>
            </div>
          )}

          {introStatus.description && (
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border-2 border-gray-50 shadow-xl text-left leading-relaxed">
              <p className="text-gray-600 text-sm md:text-base font-medium whitespace-pre-line italic">
                {introStatus.description}
              </p>
            </div>
          )}
        </div>

        {/* ÖN DEĞERLENDİRME TESTİ (GENEL GATEKEEPER) */}
        <div className="pt-10 space-y-8">
          <div className="flex items-center gap-4 justify-center">
            <div className="h-px bg-gray-200 flex-1"></div>
            <div className="bg-purple-50 text-purple-600 px-6 py-2.5 rounded-full border border-purple-100 flex items-center gap-2 shadow-sm">
              <ListChecks size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sistem Giriş Seviye Belirleme</span>
            </div>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          {preTestResult?.is_completed ? (
            <div className="bg-gradient-to-br from-green-50 to-white p-10 rounded-[3rem] border-2 border-green-100 shadow-xl text-center space-y-8 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-secondary uppercase tracking-tighter leading-none">ÖN DEĞERLENDİRME TAMAMLANDI</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-none">Akademik profiliniz oluşturuldu</p>
              </div>
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[8px] font-black text-gray-400 uppercase mb-2">DOĞRU</p>
                  <p className="text-lg font-black text-green-600">{preTestResult.correct ?? '0'}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[8px] font-black text-gray-400 uppercase mb-2">YANLIŞ</p>
                  <p className="text-lg font-black text-red-600">{preTestResult.wrong ?? '0'}</p>
                </div>
                <div className="bg-secondary p-4 rounded-2xl shadow-md">
                  <p className="text-[8px] font-black text-white/50 uppercase mb-2">SKOR</p>
                  <p className="text-lg font-black text-white">%{preTestResult.score}</p>
                </div>
              </div>
              <div className="pt-4">
                <div className="bg-secondary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] animate-pulse inline-flex items-center gap-3">
                  <Sparkles size={16} className="text-primary" />
                  EĞİTİM İÇERİKLERİ ERİŞİME AÇILDI!
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 md:p-14 rounded-[3rem] shadow-2xl border-2 border-gray-50 space-y-12">
              <div className="space-y-10">
                {preTestQuestions.map((q, qIdx) => (
                  <div key={q.id} className="space-y-6 text-left border-b border-gray-50 pb-8 last:border-0 last:pb-0">
                    <div className="flex gap-4 items-start">
                      <span className="bg-purple-600 text-white w-8 h-8 rounded-xl flex items-center justify-center font-black shrink-0 shadow-lg shadow-purple-200 text-sm">
                        {qIdx + 1}
                      </span>
                      <h3 className="text-base md:text-lg font-black text-secondary leading-tight pt-1">
                        {q.question_text}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                      {q.options.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setPreTestAnswers(prev => ({...prev, [q.id]: opt.id}))}
                          className={`p-4 rounded-2xl text-left text-xs font-bold border-2 transition-all flex items-center justify-between group ${
                            preTestAnswers[q.id] === opt.id 
                              ? 'bg-purple-600 border-purple-600 text-white shadow-xl scale-[1.02]' 
                              : 'bg-white border-gray-100 text-gray-500 hover:border-purple-200 hover:bg-purple-50/30'
                          }`}
                        >
                          <span className="flex-1 pr-2">{opt.option_text}</span>
                          {preTestAnswers[q.id] === opt.id && <CheckCircle2 size={16} className="shrink-0 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={handlePreTestSubmit} 
                disabled={preTestSubmitting || Object.keys(preTestAnswers).length < preTestQuestions.length} 
                className="w-full bg-secondary text-white py-6 rounded-3xl font-black tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 text-xs md:text-sm uppercase"
              >
                {preTestSubmitting ? (
                  <RefreshCcw size={20} className="animate-spin" />
                ) : (
                  <>ÖN TESTİ GÖNDER VE EĞİTİMİ BAŞLAT <ArrowRight size={20} /></>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    ) : selectedWeek.is_entry_test_required ? (
      /* --- 2. KADEME KONTROL: HAFTALIK GİRİŞ (HAZIRLIK) TESTİ (KIRMIZI-SİYAH-BEYAZ TEMA) --- */
     <div className="max-w-3xl mx-auto p-6 md:p-14 space-y-10 animate-in zoom-in-95 duration-500">
  {entryResult.isSuccess ? (
    /* --- ANALİZ VE SONUÇ EKRANI --- */
    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-primary/20 rounded-[2rem] animate-ping" />
          <div className="relative bg-secondary text-primary w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl border-2 border-primary">
            <ShieldAlert size={40} />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-secondary uppercase tracking-tighter italic leading-none">
            HAZIRLIK ANALİZİ TAMAMLANDI
          </h2>
          <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
            Performansınıza göre akademik yolunuz güncellendi
          </p>
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.07)] border-2 border-gray-50 space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Zap size={120} className="text-primary" />
        </div>

        <div className="relative z-10 space-y-10">
          {/* SKOR ÖZETİ */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-gray-100 flex flex-col items-center justify-center space-y-1">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Doğru</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-secondary italic">{entryResult.correctCount}</span>
                <CheckCircle2 size={20} className="text-green-500" />
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-gray-100 flex flex-col items-center justify-center space-y-1">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Yanlış</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-secondary italic">{entryResult.wrongCount}</span>
                <XCircle size={20} className="text-primary" />
              </div>
            </div>
          </div>

          {/* TELAFİ HAFTALARI UYARISI */}
          {entryResult.unlockedWeeks && entryResult.unlockedWeeks.length > 0 ? (
            <div className="space-y-6 text-center border-t border-gray-100 pt-8">
              <div className="space-y-2">
                <span className="bg-red-50 text-red-600 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-100">
                  TELAFİ ERİŞİMİ AKTİF
                </span>
                <p className="text-xs font-bold text-secondary uppercase tracking-tight leading-relaxed max-w-xs mx-auto">
                  Eksik tespit edilen şu haftalar tekrar erişime açıldı:
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {entryResult.unlockedWeeks.map(weekNum => (
                  <div key={weekNum} className="bg-secondary text-white w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-xl border-b-4 border-primary">
                    <span className="text-[7px] font-black opacity-40 uppercase">Hafta</span>
                    <span className="text-xl font-black italic">{weekNum}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4 border-t border-gray-100 pt-8">
              <div className="bg-green-50 text-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto border-2 border-green-100">
                <ShieldCheck size={24} />
              </div>
              <p className="text-xs font-black text-secondary uppercase tracking-widest">
                Kusursuz Performans! Tüm konulara hakimsiniz.
              </p>
            </div>
          )}

          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-secondary text-white py-6 rounded-[2rem] font-black tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 border-b-4 border-primary uppercase text-xs"
          >
            HAFTA İÇERİKLERİNE GİT <ChevronRight size={20} className="text-primary" />
          </button>
        </div>
      </div>
    </div>
  ) : (
    /* --- SORU FORMU EKRANI --- */
    <>
      <div className="text-center space-y-4">
        <div className="bg-primary/10 text-primary w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto border-2 border-primary/20 shadow-xl shadow-primary/10">
          <RefreshCcw size={32} />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-secondary uppercase tracking-tighter leading-none">
          HAFTALIK HAZIRLIK KAPISI
        </h2>
        <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed max-w-md mx-auto">
          İçeriklere erişmek için geçmiş konuları içeren hazırlık testini tamamlamalısınız.
        </p>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.07)] border-2 border-gray-50 space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <ShieldCheck size={120} className="text-primary" />
        </div>

        <div className="space-y-12 relative z-10">
          {selectedWeek.entry_questions?.map((q, qIdx) => (
            <div key={q.id} className="space-y-6 text-left border-b border-gray-100 pb-10 last:border-0 last:pb-0">
              <div className="flex gap-5 items-start">
                <span className="bg-primary text-white w-9 h-9 rounded-2xl flex items-center justify-center font-black shrink-0 shadow-lg shadow-red-200 text-sm italic">
                  {qIdx + 1}
                </span>
                <h3 className="text-base md:text-lg font-black text-secondary leading-tight pt-1 uppercase tracking-tight">
                  {q.question_text}
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-3 pl-14">
                {q.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setEntryAnswers(prev => ({...prev, [q.id]: opt.id}))}
                    className={`p-5 rounded-[1.25rem] text-left text-[11px] font-black border-2 transition-all flex items-center justify-between group ${
                      entryAnswers[q.id] === opt.id 
                        ? 'bg-primary border-primary text-white shadow-xl translate-x-2' 
                        : 'bg-gray-50 border-gray-50 text-gray-500 hover:border-primary/20 hover:bg-white'
                    }`}
                  >
                    <span className="flex-1 pr-2 uppercase tracking-wide">{opt.option_text}</span>
                    {entryAnswers[q.id] === opt.id && <CheckCircle2 size={18} className="shrink-0 text-white animate-in zoom-in" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={handleEntryTestSubmit}
          disabled={entrySubmitting || Object.keys(entryAnswers).length < (selectedWeek.entry_questions?.length || 0)}
          className="w-full bg-secondary text-white py-6 rounded-[2rem] font-black tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-[0.98] disabled:bg-gray-100 disabled:text-gray-400 uppercase flex items-center justify-center gap-3 text-xs md:text-sm border-b-4 border-primary"
        >
          {entrySubmitting ? (
            <RefreshCcw size={20} className="animate-spin" />
          ) : (
            <>TESTİ TAMAMLA VE HAFTAYI AÇ <ChevronRight size={20} className="text-primary" /></>
          )}
        </button>
      </div>

      <p className="text-center text-[9px] font-black text-gray-400 uppercase tracking-widest italic animate-pulse">
        * Yanlış cevap verdiğiniz soruların ait olduğu haftalar otomatik olarak telafi için açılacaktır.
      </p>
    </>
  )}
</div>
    ) : (
      /* --- 3. KADEME: NORMAL HAFTA İÇERİĞİ GÖRÜNÜMÜ (GRID YAPI) --- */
      <div className="max-w-screen-2xl mx-auto p-4 md:p-10">
        {/* Üst Bilgi Başlığı */}
        <div className="mb-10 border-b pb-8 border-gray-100 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-secondary text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
              HAFTA {selectedWeek.week_number}
            </span>
            {selectedWeek.current_attempt_round > 1 && (
              <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-amber-200 animate-pulse">
                <RefreshCcw size={8} className="inline mr-1" /> 2. TUR (GELİŞİM)
              </span>
            )}
          </div>
          <h1 className="text-xl md:text-3xl font-black text-secondary uppercase tracking-tighter leading-tight">
            {selectedWeek.title}
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-xs bg-gray-100 h-1.5 rounded-full overflow-hidden border shadow-inner">
              <div 
                className={`h-full transition-all duration-1000 ${selectedWeek.progress === 100 ? 'bg-green-500' : 'bg-primary'}`} 
                style={{ width: `${selectedWeek.progress || 0}%` }} 
              />
            </div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">%{selectedWeek.progress || 0} TAMAMLANDI</span>
          </div>
        </div>

        {/* ANA İÇERİK GRID: SOLDA LİSTE, SAĞDA İÇERİK */}
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* SOL TARAF: DİKEY MATERYAL SEÇİCİ */}
          <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-24 space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-2">Eğitim Materyalleri</p>
            <div className="flex flex-col gap-2.5">
              {getSortedMaterials(selectedWeek.materials).map((mat) => {
                const MatIcon = mat.content_type === 'video' ? Video : 
                              mat.content_type === 'podcast' ? Headphones : 
                              mat.content_type === 'pdf' ? Download : 
                              mat.content_type === 'assignment' ? Sparkles : ListChecks;
                
                const isLocked = mat.content_type === 'form' && isQuizLocked();
                const isDone = completedMaterials.includes(String(mat.id));
                const isActive = activeMaterial?.id === mat.id;

                return (
                  <button 
                    key={mat.id} 
                    onClick={() => setActiveMaterial(mat)} 
                    disabled={isLocked && !isDone}
                    className={`flex items-center gap-4 p-4 rounded-2xl text-[11px] font-black transition-all border-2 text-left group relative overflow-hidden ${
                      isActive 
                        ? 'bg-secondary border-secondary text-white shadow-2xl scale-[1.02] z-10' 
                        : isLocked 
                          ? 'bg-gray-50 border-transparent text-gray-300 cursor-not-allowed'
                          : 'bg-white border-gray-100 text-gray-500 hover:border-primary/30 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                      isActive ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-400 group-hover:text-primary'
                    }`}>
                       {isDone ? <CheckCircle2 size={18} className="text-green-500" /> : isLocked ? <Lock size={18} /> : <MatIcon size={18} />}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                       <span className="uppercase tracking-tight truncate leading-tight">{mat.title}</span>
                       <span className={`text-[8px] font-bold uppercase tracking-widest ${isActive ? 'text-white/50' : 'text-gray-400'}`}>
                         {mat.content_type}
                       </span>
                    </div>
                    {isActive && (
                      <div className="ml-auto animate-in slide-in-from-left-2">
                        <ChevronRight size={16} className="text-primary" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* SAĞ TARAF: AKTİF MATERYAL VE DERS NOTLARI */}
          <div className="flex-1 min-w-0 w-full">
            {activeMaterial ? (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <section className="material-display-area">
                  {activeMaterial.content_type === 'assignment' ? (
                    <div className="bg-white border-4 border-gray-50 p-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-8 text-center max-w-3xl mx-auto relative overflow-hidden">
                      <div className="absolute top-6 right-6 bg-amber-100 text-amber-700 px-4 py-2 rounded-2xl font-black text-[10px] shadow-sm border border-amber-200 tracking-widest uppercase">
                        +{activeMaterial.point_value || 0} PUAN
                      </div>
                      <div className="bg-amber-50 p-6 rounded-3xl text-amber-600 animate-pulse mt-4"><Sparkles size={64} /></div>
                      <div className="space-y-3">
                        <h3 className="text-2xl md:text-3xl font-black text-secondary uppercase tracking-tighter leading-none">HAFTALIK ÖDEV FORMU</h3>
                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed max-w-md mx-auto">
                          {selectedWeek.current_attempt_round > 1 ? "2. Tur kapsamında ödevi tekrar inceleyebilirsin." : "Ödevi tamamlayarak akademik puanını kazan!"}
                        </p>
                      </div>
                      <a href={activeMaterial.embed_url} target="_blank" rel="noopener noreferrer" onClick={() => handleCompleteMaterial(activeMaterial.id)} className="bg-secondary text-white px-12 py-5 rounded-2xl font-black tracking-[0.2em] flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all text-xs uppercase">
                        ÖDEVİ AÇ 
                      </a>
                    </div>
                  ) : activeMaterial.content_type === 'pdf' ? (
                    <div className="bg-white border-4 border-gray-50 p-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-8 text-center max-w-3xl mx-auto">
                      <div className="bg-primary/10 p-6 rounded-3xl text-primary animate-pulse"><FileText size={64} /></div>
                      <div className="space-y-2 leading-tight">
                        <h3 className="text-2xl font-black text-secondary uppercase tracking-tighter">{activeMaterial.title}</h3>
                        <p className="text-xs text-gray-500 font-medium">OneDrive üzerinden dökümana ulaşabilirsiniz.</p>
                      </div>
                      <a href={activeMaterial.embed_url} target="_blank" rel="noopener noreferrer" onClick={() => handleCompleteMaterial(activeMaterial.id)} className="bg-secondary text-white px-12 py-5 rounded-2xl font-black tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all text-xs uppercase"><Download size={18} className="text-primary" /> DERS NOTUNU AÇ / İNDİR</a>
                    </div>
                  ) : activeMaterial.content_type !== 'form' ? (
                    <div className="relative aspect-video shadow-2xl rounded-3xl overflow-hidden bg-black border-4 border-gray-50 ring-1 ring-gray-200 w-full"><iframe src={activeMaterial.embed_url} className="absolute inset-0 w-full h-full" allowFullScreen></iframe></div>
                  ) : (
                    <div className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden w-full flex flex-col animate-in fade-in">
                      <div className="bg-secondary p-6 flex items-center justify-between text-white border-b-2 border-primary">
                        <div className="flex items-center gap-4 text-left">
                          <div className="bg-primary p-2.5 rounded-xl shadow-lg shrink-0"><ListChecks size={20} /></div>
                          <div>
                            <h2 className="text-white font-black text-base md:text-lg uppercase tracking-tighter mb-1">{activeMaterial.quiz?.title || activeMaterial.title}</h2>
                            <p className="text-gray-400 text-[8px] font-bold uppercase tracking-widest">{selectedWeek.current_attempt_round}. Tur Değerlendirmesi</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-5 md:p-8 space-y-8 bg-gray-50/20">
                        {(completedMaterials.includes(String(activeMaterial.id)) || quizResult) ? (
                          <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
                            <div className="w-14 h-14 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto border-2 border-green-100 shadow-xl animate-bounce leading-none"><Award size={28} /></div>
                            {quizResult && (
                              <div className="space-y-4">
                                <h3 className="text-xl md:text-2xl font-black text-secondary uppercase tracking-tighter text-primary">Tebrikler!</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
                                  <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-100 shadow-sm"><p className="text-[8px] font-black text-gray-400 uppercase mb-2">SKOR</p><p className="text-xl font-black text-secondary">%{quizResult.score}</p></div>
                                  <div className="bg-green-50 p-4 rounded-xl border-2 border-green-100 shadow-sm"><p className="text-[8px] font-black text-green-600 uppercase mb-2">Doğru</p><p className="text-xl font-black text-green-600">{quizResult.correct}</p></div>
                                  <div className="bg-red-50 p-4 rounded-xl border-2 border-red-100 shadow-sm"><p className="text-[8px] font-black text-red-600 uppercase mb-2">Yanlış</p><p className="text-xl font-black text-red-600">{quizResult.wrong}</p></div>
                                </div>
                              </div>
                            )}
                            <button onClick={handleFetchAIAnalysis} className="mx-auto flex items-center gap-2 bg-secondary text-white px-10 py-5 rounded-2xl font-black text-[10px] shadow-xl uppercase hover:scale-105 active:scale-95 transition-all mt-4"><Sparkles size={16} className="text-primary animate-pulse" /> ANALİZİ GÖR VE DEVAM ET</button>
                          </div>
                        ) : (
                          <div className="space-y-10">
                            {activeMaterial.quiz?.questions.map((q, qIdx) => (
                              <div key={q.id} className="space-y-5 text-left border-b border-gray-100 pb-8 last:border-0 last:pb-0">
                                <h3 className="text-sm md:text-base font-black text-secondary flex gap-3 leading-tight"><span className="text-primary shrink-0">0{qIdx + 1}.</span> <span className="break-words">{q.question_text}</span></h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:pl-8">
                                  {q.options.map((opt) => (<button key={opt.id} onClick={() => setSelectedAnswers(prev => ({...prev, [q.id]: opt.id}))} className={`p-4 rounded-2xl text-left text-[11px] font-bold border-2 transition-all flex items-center justify-between group min-h-[56px] ${selectedAnswers[q.id] === opt.id ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-gray-100 text-gray-500 hover:border-red-100'}`}><span className="pr-2">{opt.option_text}</span>{selectedAnswers[q.id] === opt.id && <ArrowRight size={14} className="shrink-0" />}</button>))}
                                </div>
                              </div>
                            ))}
                            <button onClick={handleQuizSubmit} disabled={quizSubmitting} className="w-full bg-secondary text-white py-5 rounded-2xl font-black tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:bg-gray-200 uppercase mt-8 text-xs transition-all">{quizSubmitting ? "GÖNDERİLİYOR..." : "TESTİ TAMAMLA"}</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                <section className="flashcard-notes-grid space-y-12">
                  {selectedWeek.flashcards && selectedWeek.flashcards.length > 0 && (
                    <div className="bg-gray-50 p-6 md:p-10 rounded-[3rem] border border-gray-100 space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary p-3 rounded-2xl text-white shadow-lg shadow-red-500/20"><BookOpen size={24} /></div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Çalışma Kartları</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedWeek.flashcards.map((card) => (
                          <a key={card.id} href={card.answer} target="_blank" rel="noopener noreferrer" className="group bg-white p-5 rounded-2xl border-2 border-gray-100 hover:border-primary hover:shadow-xl transition-all flex items-center justify-between">
                            <div className="flex items-center gap-4 text-left min-w-0">
                              <div className="bg-red-50 text-primary p-3 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors shrink-0"><FileText size={20} /></div>
                              <div className="min-w-0 truncate"><p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">Döküman</p><p className="font-bold text-secondary text-xs group-hover:text-primary transition-colors uppercase truncate">{card.question}</p></div>
                            </div>
                            <ArrowRight size={18} className="text-gray-300 group-hover:text-primary shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="bg-white rounded-[3rem] border-2 border-gray-50 shadow-xl overflow-hidden flex flex-col min-h-[300px]">
                    <div className="bg-gray-50/80 px-8 py-6 border-b border-gray-100 flex items-center gap-4 shrink-0"><FileText size={24} className="text-primary" /><h3 className="font-black text-secondary uppercase tracking-widest text-[10px]">Haftalık Not Özeti</h3></div>
                    <div className="p-8 md:p-10 text-gray-600 leading-relaxed text-sm md:text-base italic font-light overflow-y-auto whitespace-pre-line text-left">{selectedWeek.description || "Bu haftaya ait ders notu bulunamadı."}</div>
                  </div>
                </section>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100 text-gray-300 gap-5">
                <Eye size={64} className="opacity-10" />
                <span className="font-black uppercase tracking-widest italic">MATERYAL SEÇİNİZ</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
) : (
  <div className="h-full flex flex-col items-center justify-center text-gray-200 p-8 gap-6">
    <PlayCircle size={120} strokeWidth={0.5} className="animate-pulse opacity-10" />
    <p className="text-xl font-black uppercase tracking-[0.5em] opacity-20 text-secondary">Hafta Seçiniz</p>
  </div>
)}
      </main>

      {/* AI CHAT PANELİ */}
      <div className="fixed bottom-4 right-4 z-[999] flex flex-col items-end gap-2 shrink-0 leading-none text-left text-left text-left text-left text-left">
        {isChatOpen && (
          <div className="w-[240px] md:w-[280px] h-[360px] bg-white rounded-[1.25rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 ring-1 ring-black/5 leading-none text-left text-left text-left">
            <div className="bg-secondary p-3 flex items-center justify-between text-white shadow-lg leading-none text-left "><div className="flex items-center gap-2 leading-none text-left "><div className="bg-primary p-1.5 rounded-lg shadow-md leading-none text-center text-left text-left text-left"><Bot size={14} className="text-left" /></div><h4 className="text-[9px] font-black tracking-widest uppercase leading-none text-left text-left text-left">BÜ-AI ASİSTAN</h4></div><button onClick={() => setIsChatOpen(false)} className="hover:text-primary transition-all leading-none text-left text-left text-left"><X size={14} className="text-left text-left" /></button></div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-gray-50/50 custom-scrollbar leading-relaxed text-left">
              {messages.map((msg, idx) => (<div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end text-left' : 'justify-start text-left'} animate-in fade-in leading-relaxed text-left `}><div className={`max-w-[90%] p-2 rounded-lg text-[9px] font-medium shadow-sm leading-relaxed text-left text-left ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none text-left' : 'bg-white text-secondary rounded-tl-none border border-gray-100 text-left'}`}>{msg.content}</div></div>))}
              {isTyping && <div className="flex justify-start leading-none text-left "><div className="bg-white p-2 rounded-lg rounded-tl-none shadow-sm flex gap-1 animate-pulse border border-gray-100 leading-none text-left text-left"><span className="w-1 h-1 bg-gray-300 rounded-full text-left text-left"></span><span className="w-1 h-1 bg-gray-300 rounded-full text-left text-left"></span><span className="w-1 h-1 bg-gray-300 rounded-full text-left"></span></div></div>}
              <div ref={chatEndRef} className="text-left " />
            </div>
            <form onSubmit={handleSendChatMessage} className="p-2.5 bg-white border-t border-gray-100 flex gap-2 leading-none text-left"><input type="text" placeholder="Sor..." className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-lg px-3 py-1.5 text-[9px] outline-none focus:border-primary transition-all font-bold text-secondary shadow-inner leading-none text-left text-left" value={chatInput} onChange={(e) => setChatInput(e.target.value)} /><button type="submit" className="bg-primary text-white p-2 rounded-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center leading-none text-left text-left"><Send size={12} className="text-left" /></button></form>
          </div>
        )}
        <button onClick={() => setIsChatOpen(!isChatOpen)} className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95 z-[1000] border-2 border-white leading-none text-left text-left text-left text-left text-left ${isChatOpen ? 'bg-secondary text-white' : 'bg-primary text-white'}`}>{isChatOpen ? <X size={18} /> : <Bot size={20} />}</button>
      </div>

      {/* AI ANALİZ MODALI */}
{isAnalysisModalOpen && (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-secondary/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto leading-none text-left">
    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden border-4 border-white my-auto flex flex-col max-h-[90vh] leading-none text-left">
      
      {/* MODAL BAŞLIK ALANI */}
      <div className="bg-secondary p-8 flex items-center justify-between text-white border-b-4 border-primary leading-none text-left">
        <div className="flex items-center gap-5 leading-none text-left">
          <div className="bg-primary p-3 rounded-2xl shadow-lg leading-none text-center shadow-red-500/20">
            <Bot size={28} className="text-left" />
          </div>
          <div className="leading-none text-left">
            <h3 className="font-black uppercase tracking-tighter text-xl leading-none text-left">BÜ-AI Analiz Raporu</h3>
            <p className="text-primary text-[10px] font-bold uppercase tracking-widest mt-1 leading-none text-left">Eğitim Mentörü</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAnalysisModalOpen(false)} 
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary transition-all leading-none text-center"
        >
          <X size={24} className="text-left" />
        </button>
      </div>

      {/* İÇERİK ALANI */}
      <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50 min-h-[300px] leading-relaxed text-left">
        {isAnalysisLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-8 leading-none text-center">
            <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-secondary font-black text-xl uppercase tracking-widest animate-pulse">Analiz Hazırlanıyor...</p>
          </div>
        ) : (
          <div className="bg-white border-2 border-primary/10 p-8 rounded-[2.5rem] shadow-sm leading-relaxed animate-in slide-in-from-bottom-4 text-left">
            <div className="flex items-center gap-3 mb-6 text-primary leading-none text-left">
              <Sparkles size={20} className="text-left" />
              <span className="font-black text-xs uppercase tracking-widest leading-none text-left">Akıllı Geri Bildirim</span>
            </div>
            {/* Hazır analiz metni: whitespace-pre-line satır sonlarını (Hata analizleri arasındaki boşlukları) korur */}
            <p className="text-secondary font-medium leading-relaxed text-base whitespace-pre-line text-left">
              {aiAnalysisFeedback}
            </p>
          </div>
        )}
      </div>

      {/* MODAL ALT BUTON ALANI */}
      <div className="p-8 bg-white border-t flex justify-center leading-none text-left">
        <button 
          onClick={async () => {
            // 1. Modalı kapat
            setIsAnalysisModalOpen(false);

            // 2. Arayüzü temizle (Yeni tur için hazırlık)
            setQuizResult(null); 
            setSelectedAnswers({});
            setCurrentAttemptId(null);
            
            // 3. Backend'den güncel verileri (Round 2 bilgisi vb.) çek
            await fetchContents(true); 
            
            // 4. Eğer 2. Tur tetiklendiyse kullanıcıya bilgi ver
            // selectedWeek içindeki verinin güncellendiğinden emin olmak için fetchContents sonrası kontrol edilir
          }} 
          className="w-full md:w-auto bg-secondary text-white px-16 py-5 rounded-[2rem] font-black text-xs uppercase shadow-xl active:scale-95 leading-none text-left transition-transform hover:scale-[1.02]"
        >
          Anladım, Devam Et
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}