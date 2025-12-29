"use client";
import { useState } from 'react';
import api from '@/lib/api';
import { AxiosError } from 'axios';
import { 
  LayoutGrid, Video, Headphones, Save, Plus, Trash2, LogOut, FileSpreadsheet 
} from 'lucide-react';

interface Material {
  content_type: 'video' | 'podcast' | 'form';
  embed_url: string;
  title: string;
}

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(false);
  const [weekNumber, setWeekNumber] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Başlangıçta tek bir boş materyal satırı
  const [materials, setMaterials] = useState<Material[]>([{ content_type: 'video', embed_url: '', title: '' }]);

  const addMaterialRow = () => setMaterials([...materials, { content_type: 'video', embed_url: '', title: '' }]);
  const removeMaterialRow = (index: number) => materials.length > 1 && setMaterials(materials.filter((_, i) => i !== index));
  
  const updateMaterial = (index: number, field: keyof Material, value: string) => {
    const newMaterials = [...materials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setMaterials(newMaterials);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // KRİTİK GÜNCELLEME: Sadece URL alanı doldurulmuş materyalleri filtreleyip gönderiyoruz
      const validMaterials = materials.filter(m => m.embed_url.trim() !== "");

      // Eğer hoca hiçbir materyal girmemişse ve açıklama da boşsa uyarı ver
      if (validMaterials.length === 0 && !description.trim()) {
        alert("Lütfen en az bir içerik (Video/Podcast/Form) ekleyin veya bir ders notu yazın.");
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
      
      // Formu temizle
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

  return (
    <div className="min-h-screen bg-gray-50 font-roboto text-secondary">
      <header className="bg-[#1a1a1a] p-6 shadow-xl">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#ce1212] p-2 rounded-lg">
              <LayoutGrid size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">AKADEMİSYEN PANELİ</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Esnek İçerik Yönetimi</p>
            </div>
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all border border-white/20"
          >
            <LogOut size={16} className="text-white" />
            <span className="text-white font-bold text-sm">GÜVENLİ ÇIKIŞ</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-12">
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-gray-100">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <label className="block text-xs font-black text-gray-700 uppercase mb-3">Hafta</label>
              <select 
                value={weekNumber} 
                onChange={(e) => setWeekNumber(Number(e.target.value))}
                className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-black font-bold outline-none focus:border-primary"
              >
                {Array.from({ length: 14 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}. Hafta</option>)}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-black text-gray-700 uppercase mb-3">Haftalık Konu Başlığı</label>
              <input 
                type="text" required value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-black outline-none focus:border-primary font-bold"
                placeholder="Örn: 01. Hafta - Giriş ve Temel Kavramlar"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h3 className="font-black text-secondary uppercase text-xs tracking-widest">Materyaller (İsteğe Bağlı)</h3>
              <button 
                type="button" onClick={addMaterialRow} 
                className="bg-red-50 text-[#ce1212] flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black hover:bg-[#ce1212] hover:text-white transition-all"
              >
                <Plus size={16} /> MATERYAL SATIRI EKLE
              </button>
            </div>

            <div className="grid gap-4">
              {materials.map((mat, index) => (
                <div key={index} className="p-6 bg-gray-50 rounded-[2rem] flex flex-col md:flex-row gap-4 items-center border border-transparent hover:border-red-100 transition-all">
                  <div className="w-full md:w-40">
                          <select 
                      value={mat.content_type}
                      className="w-full p-3 rounded-xl border border-gray-200 text-black text-sm font-bold"
                     
                      onChange={(e) => updateMaterial(index, 'content_type', e.target.value as Material['content_type'])}
                    >
                      <option value="video">Video</option>
                      <option value="podcast">Podcast</option>
                      <option value="form">Google Form</option>
        </select>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Başlık (Örn: Ders Videosu)"
                    className="flex-1 p-3 rounded-xl border border-gray-200 text-black text-sm"
                    value={mat.title} 
                    onChange={(e) => updateMaterial(index, 'title', e.target.value)}
                 
                  />
                  <input 
                    type="url" 
                    placeholder="YouTube veya Form Linki"
                    className="flex-[2] p-3 rounded-xl border border-gray-200 text-black text-sm font-mono"
                    value={mat.embed_url} 
                    onChange={(e) => updateMaterial(index, 'embed_url', e.target.value)}
                
                  />
                  {materials.length > 1 && (
                    <button type="button" onClick={() => removeMaterialRow(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
              <p className="text-[10px] text-gray-400 italic px-4">* URL alanı boş olan materyaller kaydedilmeyecektir.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase mb-3">Ders Notları & Açıklama</label>
            <textarea 
              rows={4} value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-6 rounded-3xl border-2 border-gray-100 bg-gray-50 text-black outline-none focus:border-primary"
              placeholder="Öğrenciler için notlarınızı buraya ekleyebilirsiniz..."
            ></textarea>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-[#1a1a1a] py-5 rounded-[2rem] shadow-xl hover:bg-black transition-all disabled:bg-gray-400 group"
          >
            <div className="flex items-center justify-center gap-3">
              <Save size={20} className="text-[#ce1212]" />
              <span className="text-white font-black text-sm tracking-widest uppercase">
                {loading ? "YÜKLENİYOR..." : "İÇERİĞİ SİSTEME YAYINLA"}
              </span>
            </div>
          </button>
        </form>
      </main>
    </div>
  );
}