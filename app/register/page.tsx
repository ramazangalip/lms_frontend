"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { AxiosError } from 'axios';

interface ApiErrorData {
  error?: string;
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '', 
    first_name: '', 
    last_name: '', 
    password: '', 
    code: '',
    department: '' 
  });
  const router = useRouter();


  const departments = [
    { id: 'ilahiyat', name: 'İlahiyat' },
    { id: 'isg', name: 'İş Sağlığı Ve Güvenliği' },
    { id: 'saglikkurumlariisletmeciligi', name: 'Sağlık Kurumları İşletmeciliği' },
    { id: 'beslenmevediyetetik', name: 'Beslenme Ve Diyetetik' },
    { id: 'hemsirelik', name: 'Hemşirelik' },
    { id: 'webtasarimvekodlama', name: 'Web Tasarım Ve Kodlama' }
  ];

  const handleSendOTP = async () => {
    if (!formData.email.endsWith('@bingol.edu.tr')) {
      alert("Sadece @bingol.edu.tr uzantılı mail adresi kullanılabilir.");
      return;
    }

    if (!formData.department) {
      alert("Lütfen önce bölümünüzü seçiniz.");
      return;
    }

    try {
      await api.post('/users/send-otp/', { email: formData.email });
      alert("Doğrulama kodu gönderildi.");
      setStep(2);
    } catch (err) {
      const error = err as AxiosError<ApiErrorData>;
      alert(error.response?.data?.error || "Kod gönderilirken hata oluştu.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {

      await api.post('/users/register/', formData);
      alert("Kayıt başarılı! Giriş yapabilirsiniz.");
      router.push('/login');
    } catch (err) {
      console.error("Kayıt hatası:", err);
      alert("Kayıt sırasında bir hata oluştu. Lütfen kodunuzu ve şifrenizi kontrol edin.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-gray-200 p-8 shadow-2xl">
        <div className="text-center">
          <h2 className="logo-text text-3xl font-black text-secondary">BİNGÖL ÜNİVERSİTESİ</h2>
          <p className="mt-2 text-sm text-foreground font-roboto  uppercase tracking-widest">Öğrenci Kayıt Sistemi</p>
        </div>

        {step === 1 ? (
          <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="Ad" 
                required 
                className="w-full rounded-lg border border-gray-300 p-3 text-foreground outline-primary font-bold"
                onChange={e => setFormData({...formData, first_name: e.target.value})} 
              />
              <input 
                type="text" 
                placeholder="Soyad" 
                required 
                className="w-full rounded-lg border border-gray-300 p-3 text-foreground outline-primary font-bold"
                onChange={e => setFormData({...formData, last_name: e.target.value})} 
              />
            </div>

            <select 
              required
              className="w-full rounded-lg border border-gray-300 p-3 text-foreground outline-primary font-bold bg-white"
              value={formData.department}
              onChange={e => setFormData({...formData, department: e.target.value})}
            >
              <option value="">Bölümünüzü Seçiniz</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            
            <input 
              type="email" 
              placeholder="öğrencinumarası@bingol.edu.tr" 
              required 
              className="w-full rounded-lg border border-gray-300 p-3 text-foreground outline-primary font-bold"
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
            
            <p className="text-[10px] text-gray-400 text-center italic">
              Kayıt işlemi için üniversite e-postanıza bir doğrulama kodu gönderilecektir.
            </p>

            <button 
              onClick={handleSendOTP} 
              className="w-full rounded-lg bg-primary py-4 font-black text-white tracking-[0.2em] transition hover:opacity-90 shadow-lg active:scale-95"
            >
              DOĞRULAMA KODU GÖNDER
            </button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="mt-8 space-y-4 animate-in zoom-in-95 duration-500">
            <input 
              type="text" 
              placeholder="6 Haneli Kod" 
              required 
              maxLength={6} 
              className="w-full rounded-lg border border-gray-300 p-3 text-center text-3xl font-black tracking-[0.5em] text-primary outline-primary bg-gray-50 shadow-inner"
              onChange={e => setFormData({...formData, code: e.target.value})} 
            />
            <input 
              type="password" 
              placeholder="Şifre Belirleyin" 
              required 
              className="w-full rounded-lg border border-gray-300 p-3 text-foreground outline-primary font-bold"
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
            <button 
              type="submit" 
              className="w-full rounded-lg bg-secondary py-4 font-black text-white tracking-[0.2em] transition hover:bg-black shadow-lg active:scale-95"
            >
              KAYDI TAMAMLA
            </button>
            <button 
              type="button" 
              onClick={() => setStep(1)} 
              className="w-full text-[10px] font-black uppercase text-gray-400 tracking-tighter hover:text-primary transition-colors"
            >
              ← Bilgileri Güncelle
            </button>
          </form>
        )}
        
        <p className="text-center text-xs text-gray-600 font-bold uppercase tracking-tighter">
          Hesabınız var mı? <Link href="/login" className="font-black text-primary hover:underline underline-offset-4">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}