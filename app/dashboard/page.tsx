"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { 
  PlayCircle, 
  Headphones, 
  FileText, 
  ChevronRight, 
  LogOut, 
  Music,
  Video,
  FileSpreadsheet,
  CheckCircle2,
  Timer,
  CheckCircle
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
  progress?: number; 
  is_completed?: boolean;
}

interface ProgressData {
  weekly_content: number;
  completion_percentage: number;
  is_completed: boolean;
}

export default function StudentDashboard() {
  const [contents, setContents] = useState<WeeklyContent[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeeklyContent | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedMaterials, setCompletedMaterials] = useState<number[]>([]);
  
  const [watchTime, setWatchTime] = useState(0);
  const watchThreshold = 600; // 10 Dakika (Test için ideal)

  const trackingInterval = useRef<NodeJS.Timeout | null>(null);
  const watchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. VERİLERİ ÇEKME
  const fetchContents = useCallback(async (isUpdate = false) => {
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

      const sortedData = mergedData.sort((a, b) => a.week_number - b.week_number);
      setContents(sortedData);
      
      // EĞER İLK YÜKLEME İSE (isUpdate false) VE HENÜZ HAFTA SEÇİLMEDİYSE
      if (!isUpdate && sortedData.length > 0 && !selectedWeek) {
        setSelectedWeek(sortedData[0]);
        if (sortedData[0].materials.length > 0) setActiveMaterial(sortedData[0].materials[0]);
      } 
      // EĞER GÜNCELLEME İSE, SADECE SEÇİLİ HAFTANIN VERİSİNİ TAZELE (Sıfırlama yapma)
      else if (selectedWeek) {
        const updated = sortedData.find((c: WeeklyContent) => c.id === selectedWeek.id);
        if (updated) setSelectedWeek(updated);
      }
    } catch (err) {
      console.error("Veri çekme hatası:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedWeek]);

  // İlk yükleme için Effect
  useEffect(() => {
    fetchContents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Bağımlılık dizisini boş bırakarak döngüyü kırdık

  // 2. MATERYAL TAMAMLAMA İŞLEMİ
  const handleCompleteMaterial = async (materialId: number) => {
    try {
      await api.post('/contents/complete-material/', { material_id: materialId });
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
      setWatchTime(0);
      await fetchContents(true); // isUpdate = true gönderiyoruz
    } catch (err) {
      console.error("Tamamlama hatası");
    }
  };

  // 3. SAYAÇ MEKANİZMASI
  useEffect(() => {
    if (watchTimerRef.current) clearInterval(watchTimerRef.current);

    if (activeMaterial && 
        (activeMaterial.content_type === 'video' || activeMaterial.content_type === 'podcast') && 
        !completedMaterials.includes(activeMaterial.id)) {
      
      setWatchTime(0);

      watchTimerRef.current = setInterval(() => {
        setWatchTime((prev) => {
          const nextTime = prev + 1;
          if (nextTime >= watchThreshold) {
            handleCompleteMaterial(activeMaterial.id);
            if (watchTimerRef.current) clearInterval(watchTimerRef.current);
            return 0;
          }
          return nextTime;
        });
      }, 1000);

    } else {
      setWatchTime(0);
    }

    return () => {
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    };
  }, [activeMaterial?.id, completedMaterials.length]);

  const formatTime = (seconds: number) => {
    const totalRemaining = watchThreshold - seconds;
    const mins = Math.floor(totalRemaining / 60);
    const secs = totalRemaining % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 4. PING SİSTEMİ
  useEffect(() => {
    if (selectedWeek) {
      if (trackingInterval.current) clearInterval(trackingInterval.current);
      const sendPing = async () => {
        try {
          await api.post('/contents/track-activity/', {
            weekly_content_id: selectedWeek.id,
            seconds: 30 
          });
        } catch (err) { console.error("Ping hatası"); }
      };
      trackingInterval.current = setInterval(sendPing, 30000);
    }
    return () => { if (trackingInterval.current) clearInterval(trackingInterval.current); };
  }, [selectedWeek?.id]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-white flex-col gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-primary font-bold tracking-widest animate-pulse">YÜKLENİYOR...</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-roboto">
      <aside className="w-80 bg-secondary shadow-2xl flex flex-col border-r border-gray-800">
        <div className="p-6 border-b border-gray-700 bg-black/20 text-center">
          <h2 className="logo-text text-xl text-white tracking-widest text-primary font-bold uppercase">BÜ-LMS</h2>
          <p className="text-[10px] text-gray-400 uppercase mt-1 tracking-tighter text-center">ÖĞRENCİ PANELİ</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {Array.from({ length: 14 }, (_, i) => i + 1).map((weekNum) => {
            const weekData = contents.find((c: WeeklyContent) => c.week_number === weekNum);
            const isActive = selectedWeek?.week_number === weekNum;
            const isFinished = weekData?.is_completed;

            return (
              <button
                key={weekNum}
                disabled={!weekData}
                onClick={() => {
                   if(weekData) {
                      setSelectedWeek(weekData);
                      if(weekData.materials.length > 0) setActiveMaterial(weekData.materials[0]);
                   }
                }}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border ${
                  isActive 
                    ? 'bg-primary border-primary text-white shadow-lg scale-[1.02]' 
                    : isFinished
                      ? 'bg-green-600/20 border-green-500/40 text-green-400 hover:bg-green-600/30'
                      : weekData 
                        ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700' 
                        : 'bg-transparent border-dashed border-gray-700 text-gray-600 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isFinished ? (
                    <CheckCircle2 size={18} className="text-green-400" />
                  ) : (
                    <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>
                      {weekNum < 10 ? `0${weekNum}` : weekNum}
                    </span>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-semibold">Hafta {weekNum}</p>
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

        <button onClick={handleLogout} className="p-6 border-t border-gray-700 flex items-center justify-center gap-2 text-gray-400 hover:text-primary transition-colors font-bold text-xs tracking-widest">
          <LogOut size={16} /> GÜVENLİ ÇIKIŞ
        </button>
      </aside>

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
                  
                  <div className="w-full max-w-md bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200 shadow-inner">
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
                      onClick={() => setActiveMaterial(mat)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                        activeMaterial?.id === mat.id
                          ? 'bg-white text-primary shadow-md scale-105'
                          : 'text-gray-500 hover:text-secondary'
                      }`}
                    >
                      {completedMaterials.includes(mat.id) ? (
                        <CheckCircle size={14} className="text-green-500" />
                      ) : (
                        mat.content_type === 'video' ? <Video size={14} /> : 
                        mat.content_type === 'podcast' ? <Headphones size={14} /> : 
                        <FileSpreadsheet size={14} />
                      )}
                      {mat.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeMaterial ? (
              <div className="space-y-6">
                <div className={`video-aspect-container shadow-2xl rounded-[2rem] overflow-hidden bg-black border-4 border-gray-100 relative ${activeMaterial.content_type === 'form' ? 'min-h-[800px]' : ''}`}>
                  <iframe src={activeMaterial.embed_url} className="w-full h-full" allowFullScreen></iframe>
                  
                  {!completedMaterials.includes(activeMaterial.id) && activeMaterial.content_type !== 'form' && (
                    <div className="absolute bottom-6 left-6 bg-black/70 backdrop-blur-md text-white px-5 py-3 rounded-2xl border border-white/20 flex items-center gap-4">
                      <Timer size={24} className="text-primary animate-pulse" />
                      <div>
                         <p className="text-[10px] uppercase font-black text-gray-400 mb-0.5 tracking-widest">İlerleme Kaydediliyor</p>
                         <p className="text-sm font-mono font-bold text-white">
                            Kalan: {formatTime(watchTime)} / 10:00
                         </p>
                      </div>
                    </div>
                  )}
                </div>

                {activeMaterial.content_type === 'form' && !completedMaterials.includes(activeMaterial.id) && (
                  <div className="bg-blue-50 border border-blue-200 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                    <div className="flex items-center gap-4 text-blue-900">
                      <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg">
                        <FileSpreadsheet size={24} />
                      </div>
                      <p className="font-bold text-lg leading-snug">Testi yukarıdaki formdan çözüp &quot;Gönder&quot; butonuna bastıktan sonra aşağıdaki butona tıklayın.</p>
                    </div>
                    <button 
                      onClick={() => handleCompleteMaterial(activeMaterial.id)}
                      className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 uppercase tracking-widest"
                    >
                      TESTİ BİTİRDİM VE GÖNDERDİM
                    </button>
                  </div>
                )}

                {completedMaterials.includes(activeMaterial.id) && (
                  <div className="bg-green-50 text-green-700 p-6 rounded-[2rem] text-center text-sm font-black border border-green-200 shadow-inner flex items-center justify-center gap-3">
                    <CheckCircle2 size={20} /> BU MATERYALİ BAŞARIYLA TAMAMLADINIZ
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-3xl p-24 text-center border-4 border-dashed border-gray-100 text-gray-400 font-bold uppercase tracking-widest">
                Henüz materyal eklenmemiştir.
              </div>
            )}

            <div className="mt-12 bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
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
          <div className="h-full flex flex-col items-center justify-center text-gray-200">
            <PlayCircle size={100} strokeWidth={0.5} className="mb-6 animate-pulse opacity-20" />
            <p className="text-2xl font-black tracking-tighter uppercase opacity-30">Lütfen Bir Eğitim Haftası Seçin</p>
          </div>
        )}
      </main>
    </div>
  );
}