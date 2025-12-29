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
    code: ''
  });
  const router = useRouter();

  const handleSendOTP = async () => {
    if (!formData.email.endsWith('@bingol.edu.tr')) {
      alert("Sadece @bingol.edu.tr uzantılı mail adresi kullanılabilir.");
      return;
    }

    try {
      // Bölüm ID kontrolü tamamen kaldırıldı
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
      // Backend artık department beklemediği için formData direkt gönderiliyor
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
          <h2 className="logo-text text-3xl">BİNGÖL ÜNİVERSİTESİ</h2>
          <p className="mt-2 text-sm text-foreground font-roboto italic">Öğrenci Kayıt Sistemi</p>
        </div>

        {step === 1 ? (
          <div className="mt-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="Ad" 
                required 
                className="w-full rounded-lg border border-gray-300 p-3 text-foreground outline-primary"
                onChange={e => setFormData({...formData, first_name: e.target.value})} 
              />
              <input 
                type="text" 
                placeholder="Soyad" 
                required 
                className="w-full rounded-lg border border-gray-300 p-3 text-foreground outline-primary"
                onChange={e => setFormData({...formData, last_name: e.target.value})} 
              />
            </div>
            
            <input 
              type="email" 
              placeholder="öğrencinumarası@bingol.edu.tr" 
              required 
              className="w-full rounded-lg border border-gray-300 p-3 text-foreground outline-primary"
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
            
            <p className="text-[10px] text-gray-400 text-center italic">
              Kayıt işlemi için üniversite e-postanıza bir doğrulama kodu gönderilecektir.
            </p>

            <button 
              onClick={handleSendOTP} 
              className="w-full rounded-lg bg-primary py-3 font-bold text-white transition hover:opacity-90"
            >
              DOĞRULAMA KODU GÖNDER
            </button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="mt-8 space-y-4">
            <input 
              type="text" 
              placeholder="6 Haneli Kod" 
              required 
              maxLength={6} 
              className="w-full rounded-lg border border-gray-300 p-3 text-center text-2xl font-bold tracking-widest text-primary outline-primary"
              onChange={e => setFormData({...formData, code: e.target.value})} 
            />
            <input 
              type="password" 
              placeholder="Şifre Belirleyin" 
              required 
              className="w-full rounded-lg border border-gray-300 p-3 text-foreground outline-primary"
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
            <button 
              type="submit" 
              className="w-full rounded-lg bg-primary py-3 font-bold text-white transition hover:opacity-90"
            >
              KAYDI TAMAMLA
            </button>
            <button 
              type="button" 
              onClick={() => setStep(1)} 
              className="w-full text-sm text-gray-500"
            >
              Geri Dön
            </button>
          </form>
        )}
        
        <p className="text-center text-sm text-gray-600">
          Hesabınız var mı? <Link href="/login" className="font-bold text-primary">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}