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
  FileSpreadsheet, 
  CheckCircle2, 
  Timer, 
  CheckCircle,
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Award,
  ArrowRight,
  ListChecks,
  BookOpen,
  RefreshCcw
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
        {/* ÖN YÜZ */}
        <div className="absolute inset-0 w-full h-full bg-white border-2 border-gray-100 rounded-3xl shadow-sm flex flex-col items-center justify-center p-8 [backface-visibility:hidden]">
          <div className="bg-red-50 text-primary p-3 rounded-2xl mb-4"><BookOpen size={24} /></div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">SORU</span>
          <p className="text-center font-bold text-secondary text-base leading-tight">{question}</p>
          <div className="absolute bottom-4 flex items-center gap-2 text-[9px] text-primary font-bold uppercase animate-pulse">
            <RefreshCcw size={10} /> Cevabı Gör
          </div>
        </div>
        {/* ARKA YÜZ */}
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
  const [loading, setLoading] = useState(true);
  const [completedMaterials, setCompletedMaterials] = useState<number[]>([]);
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // --- QUIZ STATE'LERİ ---
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{score: number, correct: number, wrong: number} | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  // AI CHAT STATE'LERİ
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{role: 'user' | 'bot', content: string}[]>([
    { role: 'bot', content: 'Merhaba! Ben BÜ-LMS Yapay Zeka asistanıyım. Sana nasıl yardımcı olabilirim?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [watchTime, setWatchTime] = useState(0);
  const watchThreshold = 1200; 

  const trackingInterval = useRef<NodeJS.Timeout | null>(null);
  const watchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

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
        const firstWeek = mergedData.sort((a,b) => a.week_number - b.week_number)[0];
        setSelectedWeek(firstWeek);
        if (firstWeek.materials.length > 0) setActiveMaterial(firstWeek.materials[0]);
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

  // --- QUIZ GÖNDERME FONKSİYONU ---
  const handleQuizSubmit = async () => {
    if (!activeMaterial?.quiz) return;
    
    const totalQuestions = activeMaterial.quiz.questions.length;
    if (Object.keys(selectedAnswers).length < totalQuestions) {
      alert("Lütfen tüm soruları cevaplayın.");
      return;
    }

    setQuizSubmitting(true);
    try {
      // Backend'in StudentAnswer tablosunu doldurması için gereken doğru JSON formatı
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
      
      // Materyal listesini ve ilerlemeyi güncelle
      await fetchContents(true);
    } catch (err) {
      console.error("Quiz submit hatası:", err);
      alert("Sınav sonuçları gönderilirken bir hata oluştu.");
    } finally {
      setQuizSubmitting(false);
    }
  };

  useEffect(() => {
    if (watchTimerRef.current) {
      clearInterval(watchTimerRef.current);
      watchTimerRef.current = null;
    }

    if (activeMaterial && 
        (activeMaterial.content_type === 'video' || activeMaterial.content_type === 'podcast') && 
        !completedMaterials.includes(activeMaterial.id)) {
      
      setWatchTime(0);
      watchTimerRef.current = setInterval(() => {
        setWatchTime((prev) => {
          const nextTime = prev + 1;
          if (nextTime >= watchThreshold) {
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
  }, [activeMaterial?.id, completedMaterials]);

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
    setSelectedWeek(weekData);
    setQuizResult(null);
    setSelectedAnswers({});
    setCurrentCardIndex(0); 
    if (weekData.materials.length > 0) {
      setActiveMaterial(weekData.materials[0]);
    } else {
      setActiveMaterial(null);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-white flex-col gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-primary font-bold tracking-widest animate-pulse uppercase">YÜKLENİYOR...</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-roboto relative">
      {/* SOL MENÜ */}
      <aside className="w-80 bg-secondary shadow-2xl flex flex-col border-r border-gray-800">
        <div className="p-6 border-b border-gray-700 bg-black/20 text-center">
          <h2 className="logo-text text-xl text-white tracking-widest text-primary font-bold uppercase">BÜ-LMS</h2>
          <p className="text-[10px] text-gray-400 uppercase mt-1 tracking-tighter text-center">ÖĞRENCİ PANELİ</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {[1,2,3,4,5,6,7,8,9,10,11,12,13,14].map((num) => {
            const weekData = contents.find((c) => c.week_number === num);
            const isActive = selectedWeek?.week_number === num;
            const isFinished = weekData?.is_completed;

            return (
              <button
                key={`sidebar-week-${num}`}
                disabled={!weekData}
                onClick={() => weekData && handleWeekSelection(weekData)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border ${
                  isActive 
                    ? 'bg-primary border-primary text-white shadow-lg scale-[1.02]' 
                    : isFinished
                      ? 'bg-green-600/20 border-green-500/40 text-green-400 hover:bg-green-600/30'
                      : weekData 
                        ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700' 
                        : 'bg-transparent border-dashed border-gray-700 text-gray-600 cursor-not-allowed opacity-40'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isFinished ? (
                    <CheckCircle2 size={18} className="text-green-400" />
                  ) : (
                    <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>
                      {num < 10 ? `0${num}` : num}
                    </span>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-semibold">Hafta {num}</p>
                    {weekData && (
                      <p className={`text-[10px] font-bold ${isFinished ? 'text-green-300' : 'text-gray-500'}`}>
                        %{weekData.progress || 0} BİTTİ
                      </p>
                    )}
                  </div>
                </div>
                {weekData && <ChevronRight size={14} className={isActive ? 'text-white' : isFinished ? 'text-green-400' : 'text-gray-500'} />}
              </button>
            );
          })}
        </nav>

        <button onClick={handleLogout} className="p-6 border-t border-gray-700 flex items-center justify-center gap-2 text-gray-400 hover:text-primary transition-colors font-bold text-xs tracking-widest uppercase">
          <LogOut size={16} /> GÜVENLİ ÇIKIŞ
        </button>
      </aside>

      {/* ANA İÇERİK ALANI */}
      <main className="flex-1 overflow-y-auto bg-white custom-scrollbar">
        {selectedWeek ? (
          <div className="max-w-screen-xl mx-auto p-4 md:p-8"> 
            <div className="mb-8 border-b pb-8 border-gray-100">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-secondary text-white text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-widest">
                      Hafta {selectedWeek.week_number}
                    </span>
                    {selectedWeek.is_completed && (
                      <span className="bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-widest flex items-center gap-1 shadow-lg">
                        <CheckCircle2 size={10} /> Tamamlandı
                      </span>
                    )}
                  </div>
                  <h1 className="text-4xl font-extrabold text-secondary leading-tight tracking-tight mb-4">
                    {selectedWeek.title}
                  </h1>
                  
                  <div className="w-full max-md bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200 shadow-inner">
                    <div 
                      className={`h-full transition-all duration-700 ease-out ${selectedWeek.is_completed ? 'bg-green-500' : 'bg-primary'}`} 
                      style={{ width: `${selectedWeek.progress || 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 font-black uppercase tracking-widest">
                    Haftalık Materyal İlerlemesi: %{selectedWeek.progress || 0}
                  </p>
                </div>

                <div className="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner border border-gray-200">
                  {selectedWeek.materials.map((mat) => (
                    <button
                      key={mat.id}
                      onClick={() => {
                        setActiveMaterial(mat);
                        setQuizResult(null);
                        setSelectedAnswers({});
                      }}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                        activeMaterial?.id === mat.id
                          ? 'bg-white text-primary shadow-md scale-105'
                          : completedMaterials.includes(mat.id)
                          ? 'text-green-600 hover:text-green-700'
                          : 'text-gray-500 hover:text-secondary'
                      }`}
                    >
                      {completedMaterials.includes(mat.id) ? (
                        <CheckCircle size={14} className="text-green-500" />
                      ) : (
                        mat.content_type === 'video' ? <Video size={14} /> : 
                        mat.content_type === 'podcast' ? <Headphones size={14} /> : 
                        <ListChecks size={14} />
                      )}
                      {mat.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeMaterial ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                {activeMaterial.content_type !== 'form' ? (
                  <div className="video-aspect-container shadow-2xl rounded-[2.5rem] overflow-hidden bg-black border-4 border-gray-100 relative min-h-[500px]">
                    <iframe src={activeMaterial.embed_url} className="w-full h-full" allowFullScreen></iframe>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl overflow-hidden">
                    <div className="bg-secondary p-8 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary p-3 rounded-2xl">
                          <ListChecks className="text-white" size={24}/>
                        </div>
                        <div>
                          <h2 className="text-white font-black text-xl uppercase tracking-tighter">
                            {activeMaterial.quiz?.title || activeMaterial.title}
                          </h2>
                          <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">
                            {activeMaterial.quiz?.questions.length || 0} Soru Bilgi Testi
                          </p>
                        </div>
                      </div>
                      {completedMaterials.includes(activeMaterial.id) && (
                        <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-xl border border-green-500/30 font-black text-xs">
                          <CheckCircle2 size={16}/> TEST TAMAMLANDI
                        </div>
                      )}
                    </div>

                    <div className="p-8 space-y-10">
                      {quizResult ? (
                        <div className="text-center py-12 space-y-6 animate-in zoom-in-95 duration-500">
                          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto border-4 border-green-100 shadow-xl">
                            <Award size={48} />
                          </div>
                          <div>
                            <h3 className="text-3xl font-black text-secondary uppercase tracking-tighter">Tebrikler!</h3>
                            <p className="text-gray-500 font-medium">Sınav sonucun başarıyla kaydedildi.</p>
                          </div>
                          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                            <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Puan</p>
                              <p className="text-2xl font-black text-secondary">%{quizResult.score}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-3xl border border-green-100">
                              <p className="text-[10px] font-black text-green-600 uppercase mb-1">Doğru</p>
                              <p className="text-2xl font-black text-green-600">{quizResult.correct}</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-3xl border border-red-100">
                              <p className="text-[10px] font-black text-red-600 uppercase mb-1">Yanlış</p>
                              <p className="text-2xl font-black text-red-600">{quizResult.wrong}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        activeMaterial.quiz?.questions.map((q, qIdx) => (
                          <div key={q.id} className="question-block space-y-5">
                            <h3 className="text-lg font-bold text-secondary flex gap-4">
                              <span className="text-primary font-black">0{qIdx + 1}.</span> {q.question_text}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-10">
                              {q.options.map((opt) => (
                                <button
                                  key={opt.id}
                                  disabled={completedMaterials.includes(activeMaterial.id)}
                                  onClick={() => setSelectedAnswers(prev => ({...prev, [q.id]: opt.id}))}
                                  className={`p-4 rounded-2xl text-left text-sm font-bold border-2 transition-all flex items-center justify-between group
                                  ${selectedAnswers[q.id] === opt.id 
                                    ? 'bg-primary border-primary text-white shadow-lg' 
                                    : 'bg-white border-gray-100 text-gray-500 hover:border-red-200 hover:bg-red-50'}`}
                                >
                                  {opt.option_text}
                                  {selectedAnswers[q.id] === opt.id && <ArrowRight size={16} className="animate-pulse"/>}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                      
                      {!quizResult && !completedMaterials.includes(activeMaterial.id) && (
                        <button 
                          onClick={handleQuizSubmit} 
                          disabled={quizSubmitting}
                          className="w-full bg-secondary hover:bg-black text-white py-6 rounded-[2rem] font-black tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:bg-gray-300 uppercase"
                        >
                          <Send size={20} className="text-primary"/> 
                          {quizSubmitting ? "KONTROL EDİLİYOR..." : "SINAVI BİTİR VE PUANLA"}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* FLASHCARDS SECTION */}
                {selectedWeek.flashcards && selectedWeek.flashcards.length > 0 && (
                  <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-red-500/20 text-white">
                          <BookOpen size={24}/>
                        </div>
                        <div>
                          <h3 className="font-black text-secondary uppercase tracking-tighter text-xl">Hızlı Tekrar Kartları</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Görsel Hafıza Teknikleri</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setCurrentCardIndex(prev => Math.max(0, prev - 1))} 
                          disabled={currentCardIndex === 0}
                          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md disabled:opacity-30 border border-gray-100 hover:text-primary transition-all"
                        >
                          <ChevronLeft size={20}/>
                        </button>
                        <span className="text-xs font-black text-secondary">{currentCardIndex + 1} / {selectedWeek.flashcards.length}</span>
                        <button 
                          onClick={() => setCurrentCardIndex(prev => Math.min(selectedWeek.flashcards.length - 1, prev + 1))} 
                          disabled={currentCardIndex === selectedWeek.flashcards.length - 1}
                          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md disabled:opacity-30 border border-gray-100 hover:text-primary transition-all"
                        >
                          <ChevronRight size={20}/>
                        </button>
                      </div>
                    </div>

                    <div className="max-w-2xl mx-auto py-2">
                      <Flashcard 
                        key={`fc-${selectedWeek.flashcards[currentCardIndex].id}`}
                        question={selectedWeek.flashcards[currentCardIndex].question}
                        answer={selectedWeek.flashcards[currentCardIndex].answer}
                      />
                    </div>
                  </div>
                )}

                {/* DERS NOTLARI */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                  <div className="bg-gray-50/50 px-10 py-5 border-b border-gray-100 flex items-center gap-3">
                    <FileText size={24} className="text-primary" />
                    <h3 className="font-black text-secondary uppercase tracking-widest text-xs">Akademik Ders Notları</h3>
                  </div>
                  <div className="p-10 text-gray-600 leading-relaxed text-lg font-light italic">
                    {selectedWeek.description || "Ders notu bulunmamaktadır."}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-3xl p-24 text-center border-4 border-dashed border-gray-100 text-gray-400 font-bold uppercase tracking-widest italic">
                Henüz materyal eklenmemiştir.
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-200">
            <PlayCircle size={100} strokeWidth={0.5} className="mb-6 animate-pulse opacity-20" />
            <p className="text-2xl font-black tracking-tighter uppercase opacity-30 tracking-widest">Lütfen Bir Eğitim Haftası Seçin</p>
          </div>
        )}
      </main>

      {/* AI CHAT PANELİ */}
      <div className="fixed bottom-8 right-8 z-[999] flex flex-col items-end">
        {isChatOpen && (
          <div className="w-[350px] h-[500px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-secondary p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary p-2 rounded-xl">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="text-white text-xs font-black tracking-widest uppercase">AI Asistan</h4>
                  <p className="text-[10px] text-green-400 font-bold italic">Online</p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={`chat-msg-${idx}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-none shadow-red-500/10' 
                    : 'bg-white text-secondary rounded-tl-none border border-gray-100'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChatMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input
                type="text"
                placeholder="Bir soru sor..."
                className="flex-1 bg-gray-100 rounded-xl px-4 py-2 text-xs outline-none focus:ring-1 focus:ring-primary transition-all text-secondary"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button 
                type="submit" 
                className="bg-primary text-white p-2 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-500/20"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
            isChatOpen ? 'bg-secondary text-white' : 'bg-primary text-white'
          }`}
        >
          {isChatOpen ? <X size={28} /> : <Bot size={28} />}
        </button>
      </div>
    </div>
  );
}