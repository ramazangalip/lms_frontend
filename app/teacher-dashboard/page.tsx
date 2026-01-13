"use client";
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { AxiosError } from 'axios';
import { 
  LayoutGrid, Video, Headphones, Save, Plus, Trash2, LogOut, 
  FileSpreadsheet, BarChart3, Users, Clock, CheckCircle2, X, Search, MessageSquare
} from 'lucide-react';

interface Material {
  content_type: 'video' | 'podcast' | 'form';
  embed_url: string;
  title: string;
}

interface WeeklyProgress {
  week_number: number;
  progress: number;
  duration: string;
  questions?: string[]; // AI Soruları dizisi
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
  const [analytics, setAnalytics] = useState<StudentAnalytics[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentAnalytics | null>(null);
  
  // İçerik Formu State'leri
  const [weekNumber, setWeekNumber] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [materials, setMaterials] = useState<Material[]>([{ content_type: 'video', embed_url: '', title: '' }]);

  // Analiz Verilerini Çekme
  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await api.get('/contents/analytics/');
      setAnalytics(res.data);
    } catch (err) {
      console.error("Analiz verileri yüklenemedi");
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, fetchAnalytics]);

  const addMaterialRow = () => setMaterials([...materials, { content_type: 'video', embed_url: '', title: '' }]);
  const removeMaterialRow = (index: number) => {
    if (materials.length > 1) {
      setMaterials(materials.filter((_, i) => i !== index));
    }
  };
  
  const updateMaterial = (index: number, field: keyof Material, value: string) => {
    const newMaterials = [...materials];
    if (field === 'content_type') {
      newMaterials[index] = { ...newMaterials[index], [field]: value as Material['content_type'] };
    } else {
      newMaterials[index] = { ...newMaterials[index], [field]: value };
    }
    setMaterials(newMaterials);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const validMaterials = materials.filter(m => m.embed_url.trim() !== "");
      if (validMaterials.length === 0 && !description.trim()) {
        alert("Lütfen en az bir içerik ekleyin veya bir ders notu yazın.");
        setLoading(false);
        return;
      }
      const payload = { 
        week_number: weekNumber, 
        title, 
        description, 
        materials: validMaterials 
      };
      await api.post('/contents/list/', payload);
      alert("İçerik başarıyla yayınlandı!");
      setTitle(''); 
      setDescription('');
      setMaterials([{ content_type: 'video', embed_url: '', title: '' }]);
    } catch (err) {
      const error = err as AxiosError<{ detail?: string }>;
      alert(error.response?.data?.detail || "İçerik yayınlanırken bir hata oluştu.");
    } finally { 
      setLoading(false); 
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
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
            <button 
              onClick={() => setActiveTab('content')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'content' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              <Plus size={16} /> İÇERİK YÜKLE
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'analytics' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              <BarChart3 size={16} /> ÖĞRENCİ ANALİZLERİ
            </button>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all border border-white/20 text-white font-bold text-[10px] tracking-widest uppercase"
          >
            <LogOut size={16} /> ÇIKIŞ
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-12">
        {activeTab === 'content' ? (
          <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div className="md:col-span-1">
                  <label className="block text-xs font-black text-gray-700 uppercase mb-3 tracking-widest">Hafta</label>
                  <select value={weekNumber} onChange={(e) => setWeekNumber(Number(e.target.value))} className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-black font-bold outline-none focus:border-red-500 transition-colors">
                    {Array.from({ length: 14 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}. Hafta</option>)}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-black text-gray-700 uppercase mb-3 tracking-widest">Ders Başlığı</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-black outline-none focus:border-red-500 font-bold transition-all" placeholder="Dersin bu haftaki konusu..." />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <h3 className="font-black text-secondary uppercase text-xs tracking-widest">Materyaller</h3>
                  <button type="button" onClick={addMaterialRow} className="bg-red-50 text-[#ce1212] flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black hover:bg-red-600 hover:text-white transition-all shadow-sm">
                    <Plus size={16} /> MATERYAL EKLE
                  </button>
                </div>
                <div className="grid gap-4">
                  {materials.map((mat, index) => (
                    <div key={index} className="p-5 bg-gray-50 rounded-[2rem] flex flex-col md:flex-row gap-4 items-center border border-transparent hover:border-red-200 transition-all group">
                      <select value={mat.content_type} onChange={(e) => updateMaterial(index, 'content_type', e.target.value)} className="w-full md:w-40 p-3 rounded-xl border border-gray-200 text-black text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-red-500">
                        <option value="video">Video</option>
                        <option value="podcast">Podcast</option>
                        <option value="form">Test / Form</option>
                      </select>
                      <input type="text" placeholder="Materyal Başlığı" className="flex-1 p-3 rounded-xl border border-gray-200 text-black text-sm font-medium outline-none" value={mat.title} onChange={(e) => updateMaterial(index, 'title', e.target.value)} />
                      <input type="url" placeholder="Gömme (Embed) URL" className="flex-[2] p-3 rounded-xl border border-gray-200 text-black text-sm font-mono outline-none" value={mat.embed_url} onChange={(e) => updateMaterial(index, 'embed_url', e.target.value)} />
                      {materials.length > 1 && (
                        <button type="button" onClick={() => removeMaterialRow(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={20} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <label className="block text-xs font-black text-gray-700 uppercase mb-3 tracking-widest">Haftalık Notlar</label>
                <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-6 rounded-[2rem] border-2 border-gray-100 bg-gray-50 text-black outline-none focus:border-red-500 transition-all" placeholder="Öğrenciler için açıklamalar..." />
              </div>

              <button type="submit" disabled={loading} className="w-full mt-10 bg-[#1a1a1a] text-white py-6 rounded-[2rem] font-black tracking-[0.2em] hover:bg-black transition-all flex justify-center items-center gap-3 shadow-2xl disabled:bg-gray-400">
                <Save size={20} className="text-red-500" /> {loading ? "YÜKLENİYOR..." : "İÇERİĞİ SİSTEME YAYINLA"}
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
              <div className="p-8 border-b border-gray-50 bg-gray-50/50 font-black text-secondary uppercase text-xs tracking-widest">Öğrenci Gelişim Çizelgesi</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="p-8">Öğrenci</th>
                      <th className="p-8">Toplam Süre</th>
                      <th className="p-8">Müfredat İlerlemesi</th>
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
                        <td className="p-8">
                          <div className="flex items-center gap-2 text-gray-700 font-bold text-sm"><Clock size={16} className="text-amber-500" /> {student.total_time_spent}</div>
                        </td>
                        <td className="p-8">
                          <div className="w-full max-w-[180px] space-y-2">
                            <div className="flex justify-between text-[10px] font-black tracking-tighter">
                              <span className="text-gray-400 uppercase">Tamamlanan</span>
                              <span className="text-red-600">%{student.overall_progress}</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200 shadow-inner">
                              <div className="bg-[#ce1212] h-full transition-all duration-1000 ease-out" style={{ width: `${student.overall_progress}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-8 text-center">
                          <button 
                            onClick={() => setSelectedStudent(student)} 
                            className="inline-flex items-center gap-2 text-[10px] font-black uppercase bg-secondary text-white px-5 py-2.5 rounded-2xl hover:bg-black transition-all shadow-md active:scale-95"
                          >
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

      {/* MODAL: HAFTALIK DETAY RAPORU */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-8 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tighter text-secondary">Haftalık Karne</h3>
                <div className="flex items-center gap-4 mt-1">
                    <p className="text-xs text-[#ce1212] font-black uppercase tracking-widest">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                    <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        <Clock size={10} /> Toplam Süre: {selectedStudent.total_time_spent}
                    </div>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="bg-white p-3 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 border border-gray-100 transition-all shadow-sm">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-white">
              {selectedStudent.weekly_breakdown?.map((week) => (
                <div key={week.week_number} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 transition-all space-y-4">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-white rounded-[1.25rem] flex flex-col items-center justify-center shadow-sm border border-gray-100 font-black text-secondary">
                      <span className="text-[10px] text-gray-400 uppercase">H</span>
                      <span className="text-lg">{week.week_number}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[9px] font-bold text-amber-600 flex items-center gap-1 uppercase italic">
                          <Clock size={10} /> Aktif Süre: {week.duration || "0m"}
                        </span>
                        <span className={`text-sm font-black ${week.progress === 100 ? 'text-green-600' : 'text-secondary'}`}>%{week.progress}</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden border border-gray-200 shadow-inner">
                        <div className={`h-full transition-all duration-1000 ease-out ${week.progress === 100 ? 'bg-green-500' : 'bg-[#ce1212]'}`} style={{ width: `${week.progress}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* ÖĞRENCİ SORULARI BÖLÜMÜ */}
                  <div className="pt-4 border-t border-gray-200/60">
                    <div className="flex items-center gap-2 mb-3 text-secondary">
                      <MessageSquare size={14} className="text-[#ce1212]" />
                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Öğrencinin AI'ya Sorduğu Sorular</h5>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {week.questions && week.questions.length > 0 ? (
                        week.questions.map((q, i) => (
                          <div key={i} className="bg-white border border-gray-200 px-4 py-3 rounded-2xl text-[11px] text-gray-700 italic shadow-sm relative group overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ce1212]/20 group-hover:bg-[#ce1212] transition-colors" />
                            "{q}"
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-gray-300 italic pl-6">Soru sorulmadı.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 bg-gray-50 border-t flex justify-center items-center gap-8">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tamamlandı</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ce1212]"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Devam Ediyor</span>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}