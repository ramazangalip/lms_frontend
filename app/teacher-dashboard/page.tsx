"use client";
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { AxiosError } from 'axios';
import { 
  LayoutGrid, Video, Headphones, Save, Plus, Trash2, LogOut, 
  BarChart3, Users, Clock, X, Search, MessageSquare, ListChecks, Check, RefreshCcw,
  BookOpen, HelpCircle, AlertCircle, CheckCircle
} from 'lucide-react';

// --- ARAYÜZ TANIMLAMALARI ---
interface Option {
  option_text: string;
  is_correct: boolean;
}

interface Question {
  question_text: string;
  options: Option[];
}

interface Quiz {
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
  content_type: 'video' | 'podcast' | 'form';
  embed_url: string;
  title: string;
  quiz?: Quiz;
}

interface QuizDetailAnalysis {
  question_text: string;
  selected_option: string;
  correct_option: string;
  is_correct: boolean;
}

interface WeeklyProgress {
  week_number: number;
  progress: number;
  duration: string;
  questions?: string[];
  quiz_results?: QuizDetailAnalysis[]; 
}

interface StudentAnalytics {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  total_time_spent: string;
  overall_progress: number;
  weekly_breakdown: WeeklyProgress[];
}

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<'content' | 'analytics'>('content');
  const [loading, setLoading] = useState(false);
  const [fetchingWeek, setFetchingWeek] = useState(false);
  const [analytics, setAnalytics] = useState<StudentAnalytics[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentAnalytics | null>(null);
  
  // İçerik Formu State'leri
  const [weekNumber, setWeekNumber] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [materials, setMaterials] = useState<Material[]>([{ content_type: 'video', embed_url: '', title: '' }]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  // --- SEÇİLEN HAFTANIN VERİLERİNİ ÇEKME ---
  const fetchWeekDetail = useCallback(async (week: number) => {
    setFetchingWeek(true);
    try {
      const res = await api.get(`/contents/list/?week_number=${week}`);
      const data = res.data;

      setTitle(data.title || '');
      setDescription(data.description || '');
      
      if (data.materials && data.materials.length > 0) {
        setMaterials(data.materials);
      } else {
        setMaterials([{ content_type: 'video', embed_url: '', title: '' }]);
      }

      if (data.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards);
      } else {
        setFlashcards([]);
      }
    } catch (err) {
      setTitle('');
      setDescription('');
      setMaterials([{ content_type: 'video', embed_url: '', title: '' }]);
      setFlashcards([]);
    } finally {
      setFetchingWeek(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'content') {
      fetchWeekDetail(weekNumber);
    }
  }, [weekNumber, activeTab, fetchWeekDetail]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await api.get('/contents/analytics/');
      setAnalytics(res.data);
    } catch (err) {
      console.error("Analiz verileri yüklenemedi");
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab, fetchAnalytics]);

  const addMaterialRow = () => setMaterials([...materials, { content_type: 'video', embed_url: '', title: '' }]);
  
  const removeMaterialRow = (index: number) => {
    if (materials.length > 1) setMaterials(materials.filter((_, i) => i !== index));
  };

  const updateFlashcard = (index: number, field: keyof Flashcard, value: string) => {
    const newCards = [...flashcards];
    newCards[index] = { ...newCards[index], [field]: value };
    setFlashcards(newCards);
  };
  
  const updateMaterial = (index: number, field: keyof Material, value: unknown) => {
    const newMaterials = [...materials];
    
    if (field === 'content_type') {
        newMaterials[index].content_type = value as 'video' | 'podcast' | 'form';
    } else if (field === 'title') {
        newMaterials[index].title = value as string;
    } else if (field === 'embed_url') {
        newMaterials[index].embed_url = value as string;
    }
    
    if (field === 'content_type' && value === 'form' && !newMaterials[index].quiz) {
      newMaterials[index].quiz = {
        title: newMaterials[index].title || "Haftalık Değerlendirme",
        description: "",
        questions: [{ 
          question_text: "", 
          options: [
            { option_text: "", is_correct: true },
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false }
          ]
        }]
      };
    }
    setMaterials(newMaterials);
  };

  const addQuestion = (mIndex: number) => {
    const newMaterials = [...materials];
    if (newMaterials[mIndex].quiz) {
        newMaterials[mIndex].quiz!.questions.push({
            question_text: "",
            options: [
              { option_text: "", is_correct: true },
              { option_text: "", is_correct: false },
              { option_text: "", is_correct: false },
              { option_text: "" , is_correct: false }
            ]
        });
    }
    setMaterials(newMaterials);
  };

  const updateQuestionText = (mIndex: number, qIndex: number, text: string) => {
    const newMaterials = [...materials];
    if (newMaterials[mIndex].quiz) {
      newMaterials[mIndex].quiz!.questions[qIndex].question_text = text;
    }
    setMaterials(newMaterials);
  };

  const updateOption = (mIndex: number, qIndex: number, oIndex: number, text: string) => {
    const newMaterials = [...materials];
    if (newMaterials[mIndex].quiz) {
      newMaterials[mIndex].quiz!.questions[qIndex].options[oIndex].option_text = text;
    }
    setMaterials(newMaterials);
  };

  const setCorrectOption = (mIndex: number, qIndex: number, oIndex: number) => {
    const newMaterials = [...materials];
    if (newMaterials[mIndex].quiz) {
      newMaterials[mIndex].quiz!.questions[qIndex].options.forEach((opt, i) => {
        opt.is_correct = i === oIndex;
      });
    }
    setMaterials(newMaterials);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { 
        week_number: Number(weekNumber), 
        title, 
        description, 
        materials: materials.map(m => ({
          id: m.id,
          content_type: m.content_type,
          title: m.title,
          embed_url: m.embed_url,
          quiz: m.quiz
        })),
        flashcards: flashcards.map((f, index) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
          order: index
        }))
      };
      await api.post('/contents/list/', payload);
      alert("İçerik ve Bilgi Kartları başarıyla güncellendi!");
      fetchWeekDetail(weekNumber);
    } catch (err) {
      const error = err as AxiosError<{ detail?: string }>;
      alert(error.response?.data?.detail || "Hata oluştu.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-roboto text-secondary">
      {/* HEADER */}
      <header className="bg-[#1a1a1a] p-6 shadow-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#ce1212] p-2 rounded-lg shadow-lg">
              <LayoutGrid size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight uppercase">Akademisyen Paneli</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Akademik Yönetim</p>
            </div>
          </div>

          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            <button onClick={() => setActiveTab('content')} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'content' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
              <Plus size={16} /> İÇERİK YÖNETİMİ
            </button>
            <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'analytics' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
              <BarChart3 size={16} /> ÖĞRENCİ ANALİZLERİ
            </button>
          </div>

          <button onClick={() => { localStorage.clear(); window.location.href='/login'; }} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-white font-bold text-[10px] uppercase">
            <LogOut size={16} /> ÇIKIŞ
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-12">
        {activeTab === 'content' ? (
          <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 relative">
              {fetchingWeek && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-[2.5rem]">
                    <div className="flex items-center gap-2 font-black text-[#ce1212] animate-pulse">
                        <RefreshCcw className="animate-spin" /> VERİLER YÜKLENİYOR...
                    </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div className="md:col-span-1">
                  <label className="block text-xs font-black text-gray-700 uppercase mb-3 tracking-widest">Hafta Seçimi</label>
                  <select value={weekNumber} onChange={(e) => setWeekNumber(Number(e.target.value))} className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-black font-bold outline-none focus:border-red-500 transition-colors">
                    {Array.from({ length: 14 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}. Hafta</option>)}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-black text-gray-700 uppercase mb-3 tracking-widest">Haftalık Konu Başlığı</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-black outline-none focus:border-red-500 font-bold transition-all" placeholder="Bu haftanın ana konusu..." />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <h3 className="font-black text-secondary uppercase text-xs tracking-widest">İçerik Listesi</h3>
                  <button type="button" onClick={addMaterialRow} className="bg-red-50 text-[#ce1212] flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black hover:bg-red-600 hover:text-white transition-all shadow-sm">
                    <Plus size={16} /> YENİ MATERYAL EKLE
                  </button>
                </div>
                <div className="grid gap-6">
                  {materials.map((mat, mIndex) => (
                    <div key={mIndex} className="p-6 bg-gray-50 rounded-[2.5rem] border border-gray-200 space-y-4 hover:border-red-200 transition-all">
                      <div className="flex flex-col md:flex-row gap-4 items-center">
                        <select value={mat.content_type} onChange={(e) => updateMaterial(mIndex, 'content_type', e.target.value)} className="w-full md:w-40 p-3 rounded-xl border border-gray-200 text-black text-sm font-bold bg-white outline-none">
                          <option value="video">Video</option>
                          <option value="podcast">Podcast</option>
                          <option value="form">Test / Quiz</option>
                        </select>
                        <input type="text" placeholder="Başlık" className="flex-1 p-3 rounded-xl border border-gray-200 text-black text-sm font-medium outline-none" value={mat.title} onChange={(e) => updateMaterial(mIndex, 'title', e.target.value)} />
                        {mat.content_type !== 'form' && (
                          <input type="url" placeholder="Embed URL" className="flex-[2] p-3 rounded-xl border border-gray-200 text-black text-sm font-mono outline-none" value={mat.embed_url} onChange={(e) => updateMaterial(mIndex, 'embed_url', e.target.value)} />
                        )}
                        <button type="button" onClick={() => removeMaterialRow(mIndex)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={20} /></button>
                      </div>

                      {mat.content_type === 'form' && mat.quiz && (
                        <div className="mt-6 bg-white p-6 rounded-[2rem] border-2 border-dashed border-red-200 space-y-6">
                          <div className="flex items-center gap-2 text-red-600 font-black text-xs uppercase tracking-widest">
                            <ListChecks size={18} /> Sınav Düzenleyici
                          </div>
                          
                          {mat.quiz.questions.map((q, qIndex) => (
                            <div key={qIndex} className="p-5 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                              <div className="flex items-start gap-4">
                                <span className="bg-[#ce1212] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">{qIndex + 1}</span>
                                <input type="text" placeholder="Soru metni..." className="flex-1 p-3 rounded-xl border border-gray-200 text-sm font-bold outline-none" value={q.question_text} onChange={(e) => updateQuestionText(mIndex, qIndex, e.target.value)} />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                                {q.options.map((opt, oIndex) => (
                                  <div key={oIndex} className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${opt.is_correct ? 'bg-green-50 border-green-500' : 'bg-white border-gray-100'}`}>
                                    <button type="button" onClick={() => setCorrectOption(mIndex, qIndex, oIndex)} className={`p-2 rounded-lg ${opt.is_correct ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}><Check size={14} /></button>
                                    <input type="text" placeholder="Şık" className="flex-1 bg-transparent text-xs font-medium outline-none" value={opt.option_text} onChange={(e) => updateOption(mIndex, qIndex, oIndex, e.target.value)} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          <button type="button" onClick={() => addQuestion(mIndex)} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-black text-gray-400 hover:text-red-500 uppercase">+ Soru Ekle</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* FLASHCARD YÖNETİM ALANI */}
              <div className="mt-12 space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2 text-secondary font-black text-xs uppercase tracking-widest">
                    <BookOpen size={18} className="text-blue-600" /> Haftalık Flashcardlar
                  </div>
                  <button type="button" onClick={() => setFlashcards([...flashcards, { question: '', answer: '' }])} className="bg-blue-50 text-blue-600 flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                    <Plus size={16} /> KART EKLE
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {flashcards.map((card, idx) => (
                    <div key={idx} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-200 space-y-4 relative group">
                      <button type="button" onClick={() => setFlashcards(flashcards.filter((_, i) => i !== idx))} className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Soru (Ön Yüz)</label>
                          <input type="text" placeholder="Soru..." className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:border-blue-500" value={card.question} onChange={(e) => updateFlashcard(idx, 'question', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Cevap (Arka Yüz)</label>
                          <textarea rows={2} placeholder="Cevap..." className="w-full p-3 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-blue-500" value={card.answer} onChange={(e) => updateFlashcard(idx, 'answer', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <label className="block text-xs font-black text-gray-700 uppercase mb-3 tracking-widest">Haftalık Notlar</label>
                <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-6 rounded-[2rem] border-2 border-gray-100 bg-gray-50 text-black outline-none focus:border-red-500 transition-all font-bold" placeholder="Öğrenciler için açıklamalar..." />
              </div>

              <button type="submit" disabled={loading} className="w-full mt-10 bg-[#1a1a1a] text-white py-6 rounded-[2rem] font-black tracking-[0.2em] hover:bg-black transition-all flex justify-center items-center gap-3 shadow-2xl disabled:bg-gray-400">
                <Save size={20} className="text-red-500" /> {loading ? "KAYDEDİLİYOR..." : "TÜM DEĞİŞİKLİKLERİ YAYINLA"}
              </button>
            </div>
          </form>
        ) : (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 flex items-center gap-6 max-w-sm">
              <div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><Users size={32} /></div>
              <div><p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Kayıtlı Öğrenci</p><p className="text-3xl font-black">{analytics.length}</p></div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 bg-gray-50/50 font-black text-secondary uppercase text-xs tracking-widest">Haftalık Karne</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="p-8">Öğrenci</th>
                      <th className="p-8">Toplam Süre</th>
                      <th className="p-8 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {analytics.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50/50 transition-all group">
                        <td className="p-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#ce1212] text-white rounded-full flex items-center justify-center font-bold uppercase shadow-md">{student.first_name[0]}{student.last_name[0]}</div>
                            <div>
                              <p className="font-bold text-black text-base">{student.first_name} {student.last_name}</p>
                              <p className="text-xs text-gray-400 font-medium">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-8"><div className="flex items-center gap-2 text-gray-700 font-bold text-sm"><Clock size={16} className="text-amber-500" /> {student.total_time_spent}</div></td>
                        <td className="p-8 text-center">
                          <button onClick={() => setSelectedStudent(student)} className="inline-flex items-center gap-2 text-[10px] font-black uppercase bg-secondary text-white px-5 py-2.5 rounded-2xl hover:bg-black transition-all">
                            <Search size={14} /> Haftalık Karne
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
      </main>

      {/* MODAL: HAFTALIK DETAY RAPORU (TEST ANALİZLERİ DAHİL) */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-8 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tighter text-secondary">Haftalık Karne</h3>
                <p className="text-xs text-[#ce1212] font-black uppercase tracking-widest mt-1">{selectedStudent.first_name} {selectedStudent.last_name}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="bg-white p-3 rounded-full hover:bg-red-50 border border-gray-100 transition-all text-gray-400"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-white">
              {selectedStudent.weekly_breakdown?.map((week) => (
                <div key={week.week_number} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-white rounded-2xl flex flex-col items-center justify-center border border-gray-100 font-black text-secondary shadow-sm">
                      <span className="text-[10px] text-gray-400 uppercase">H</span>
                      <span className="text-lg">{week.week_number}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[9px] font-bold text-amber-600 flex items-center gap-1 uppercase italic"><Clock size={10} /> Aktif Süre: {week.duration || "0m"}</span>
                        <span className={`text-sm font-black ${week.progress === 100 ? 'text-green-600' : 'text-secondary'}`}>%{week.progress}</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden border border-gray-200 shadow-inner">
                        <div className={`h-full transition-all duration-1000 ${week.progress === 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-[#ce1212]'}`} style={{ width: `${week.progress}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* TEST CEVAPLARI ANALİZİ */}
                  {week.quiz_results && week.quiz_results.length > 0 && (
                    <div className="pt-4 border-t border-gray-200/60">
                      <div className="flex items-center gap-2 mb-3 text-secondary">
                        <ListChecks size={14} className="text-[#ce1212]" />
                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Test Cevapları Analizi</h5>
                      </div>
                      <div className="grid gap-3">
                        {week.quiz_results.map((result, idx) => (
                          <div key={idx} className={`p-4 rounded-2xl border ${result.is_correct ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                            <div className="flex items-start gap-3">
                              {result.is_correct ? <CheckCircle className="text-green-500 mt-1 shrink-0" size={14} /> : <AlertCircle className="text-red-500 mt-1 shrink-0" size={14} />}
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-800 leading-tight">{result.question_text}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                  <p className="text-[10px]"><span className="text-gray-400 font-bold uppercase tracking-tighter">Verilen:</span> <span className={result.is_correct ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{result.selected_option}</span></p>
                                  {!result.is_correct && (
                                    <p className="text-[10px]"><span className="text-gray-400 font-bold uppercase tracking-tighter">Doğru:</span> <span className="text-green-600 font-bold">{result.correct_option}</span></p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI SORULARI BÖLÜMÜ */}
                  <div className="pt-4 border-t border-gray-200/60">
                    <div className="flex items-center gap-2 mb-3 text-secondary">
                      <MessageSquare size={14} className="text-[#ce1212]" />
                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AI Soruları</h5>
                    </div>
                    <div className="flex flex-col gap-2">
                      {week.questions && week.questions.length > 0 ? (
                        week.questions.map((q, i) => (
                          <div key={i} className="bg-white border border-gray-200 px-4 py-3 rounded-2xl text-[11px] text-gray-700 italic shadow-sm">&quot;{q}&quot;</div>
                        ))
                      ) : (
                        <p className="text-[10px] text-gray-300 italic pl-6">Soru sorulmadı.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}