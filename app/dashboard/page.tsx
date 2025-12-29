"use client";
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
  PlayCircle, 
  Headphones, 
  FileText, 
  ChevronRight, 
  LogOut, 
  Music,
  Video,
  FileSpreadsheet
} from 'lucide-react';

interface Material {
  id: number;
  content_type: 'video' | 'podcast' | 'form';
  embed_url: string;
  title: string;
}

interface WeeklyContent {
  id: number;
  week_number: number;
  title: string;
  description: string;
  materials: Material[];
}

export default function StudentDashboard() {
  const [contents, setContents] = useState<WeeklyContent[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeeklyContent | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const res = await api.get('/contents/list/');
        const sortedData = res.data.sort((a: WeeklyContent, b: WeeklyContent) => a.week_number - b.week_number);
        setContents(sortedData);
        
        if (sortedData.length > 0) {
          setSelectedWeek(sortedData[0]);
          if (sortedData[0].materials.length > 0) {
            setActiveMaterial(sortedData[0].materials[0]);
          }
        }
      } catch (err) {
        console.error("İçerik yükleme hatası");
      } finally {
        setLoading(false);
      }
    };
    fetchContents();
  }, []);

  const handleWeekSelect = (week: WeeklyContent) => {
    setSelectedWeek(week);
    if (week.materials.length > 0) {
      setActiveMaterial(week.materials[0]);
    } else {
      setActiveMaterial(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-primary font-bold">YÜKLENİYOR...</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-roboto">
      {/* SOL MENÜ */}
      <aside className="w-80 bg-secondary shadow-2xl flex flex-col border-r border-gray-800">
        <div className="p-6 border-b border-gray-700 bg-black/20 text-center">
          <h2 className="logo-text text-xl text-white tracking-widest">BÜ-LMS</h2>
          <p className="text-[10px] text-gray-400 uppercase mt-1">Öğrenci Paneli</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {Array.from({ length: 14 }, (_, i) => i + 1).map((weekNum) => {
            const weekData = contents.find(c => c.week_number === weekNum);
            const isActive = selectedWeek?.week_number === weekNum;

            return (
              <button
                key={weekNum}
                disabled={!weekData}
                onClick={() => weekData && handleWeekSelect(weekData)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border ${
                  isActive 
                    ? 'bg-primary border-primary text-white shadow-lg scale-[1.02]' 
                    : weekData 
                      ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700' 
                      : 'bg-transparent border-dashed border-gray-700 text-gray-600 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>
                    {weekNum < 10 ? `0${weekNum}` : weekNum}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-semibold">Hafta {weekNum}</p>
                    {weekData && (
                      <div className="flex gap-1 mt-1">
                        {weekData.materials.some(m => m.content_type === 'video') && <Video size={10} />}
                        {weekData.materials.some(m => m.content_type === 'podcast') && <Headphones size={10} />}
                        {weekData.materials.some(m => m.content_type === 'form') && <FileSpreadsheet size={10} />}
                      </div>
                    )}
                  </div>
                </div>
                {weekData && <ChevronRight size={14} className={isActive ? 'text-white' : 'text-gray-500'} />}
              </button>
            );
          })}
        </nav>

        <button onClick={handleLogout} className="p-6 border-t border-gray-700 flex items-center justify-center gap-2 text-gray-400 hover:text-primary transition-colors font-bold text-xs">
          <LogOut size={16} /> GÜVENLİ ÇIKIŞ
        </button>
      </aside>

      {/* ANA İÇERİK ALANI */}
      <main className="flex-1 overflow-y-auto bg-white custom-scrollbar">
        {selectedWeek ? (
          <div className="max-w-screen-xl mx-auto p-4 md:p-8"> 
            
            {/* ÜST BAŞLIK VE SEKME YÖNETİMİ */}
            <div className="mb-8 border-b pb-6 border-gray-100">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex-1">
                  <span className="bg-secondary text-white text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-widest mb-3 inline-block">
                    Hafta {selectedWeek.week_number}
                  </span>
                  <h1 className="text-4xl font-extrabold text-secondary leading-tight tracking-tight">
                    {selectedWeek.title}
                  </h1>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl">
                  {selectedWeek.materials.map((mat) => (
                    <button
                      key={mat.id}
                      onClick={() => setActiveMaterial(mat)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        activeMaterial?.id === mat.id
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-gray-500 hover:text-secondary'
                      }`}
                    >
                      {mat.content_type === 'video' && <PlayCircle size={16} />}
                      {mat.content_type === 'podcast' && <Headphones size={16} />}
                      {mat.content_type === 'form' && <FileSpreadsheet size={16} />}
                      {mat.title || 'Materyal'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* DİNAMİK OYNATICI VE FORM ALANI */}
            {activeMaterial ? (
              <div className={`video-aspect-container shadow-2xl rounded-2xl overflow-hidden bg-black ${activeMaterial.content_type === 'form' ? 'min-h-[700px]' : ''}`}>
                {activeMaterial.content_type === 'video' ? (
                  <iframe
                    src={activeMaterial.embed_url}
                    title={activeMaterial.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                ) : activeMaterial.content_type === 'form' ? (
                  <iframe
                    src={activeMaterial.embed_url}
                    width="100%"
                    height="700"
                    frameBorder="0"
                    marginHeight={0}
                    marginWidth={0}
                    className="w-full h-full bg-white"
                  >
                    Yükleniyor…
                  </iframe>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-900 via-secondary to-black p-8">
                    <div className="w-full max-w-2xl bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg animate-pulse">
                        <Music size={32} className="text-white" />
                      </div>
                      <h2 className="text-white text-xl font-bold mb-1">{activeMaterial.title}</h2>
                      <p className="text-gray-400 text-xs mb-8 uppercase tracking-widest">Sesli Ders Kaydı</p>
                      <iframe
                        src={activeMaterial.embed_url}
                        width="100%"
                        height="152"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="rounded-xl"
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-20 text-center border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">Bu hafta için içerik henüz eklenmemiştir.</p>
              </div>
            )}

            {/* DERS NOTLARI */}
            <div className="mt-12 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-3">
                <FileText size={22} className="text-primary" />
                <h3 className="font-bold text-secondary uppercase tracking-wider text-sm">Haftalık Notlar</h3>
              </div>
              <div className="p-8 text-gray-700 leading-relaxed text-lg font-light">
                {selectedWeek.description || "Ders notu bulunmamaktadır."}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-300">
            <PlayCircle size={80} strokeWidth={1} className="opacity-30 mb-4" />
            <p className="text-xl font-medium tracking-wide">Lütfen sol menüden bir hafta seçin</p>
          </div>
        )}
      </main>
    </div>
  );
}