"use client";
import { useState } from 'react';
import api from '@/lib/api';
import { Mail, Lock, ShieldCheck, ArrowRight, RefreshCcw, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { AxiosError } from 'axios';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email gir, 2: Kod ve Yeni Şifre gir, 3: Başarı
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    email: '',
    code: '',
    new_password: '',
  });

  // --- ADIM 1: OTP KODU İSTE ---
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/users/password-reset-send-otp/', { email: formData.email });
      setMessage({ type: 'success', text: 'Sıfırlama kodu e-postanıza gönderildi.' });
      setStep(2);
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      setMessage({ 
        type: 'error', 
        text: axiosError.response?.data?.error || 'Kullanıcı bulunamadı veya bir hata oluştu.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // --- ADIM 2: ŞİFREYİ SIFIRLA ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/users/password-reset-confirm/', formData);
      setMessage({ type: 'success', text: 'Şifreniz başarıyla güncellendi!' });
      setStep(3); 
    } catch (err) {
      const axiosError = err as AxiosError<Record<string, string | string[]>>;
      const errorData = axiosError.response?.data;
      
      let errorMsg = 'Kod hatalı veya süresi dolmuş.';
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMsg = errorData;
        } else {
          const firstError = Object.values(errorData)[0];
          errorMsg = Array.isArray(firstError) ? firstError[0] : (firstError as string);
        }
      }
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 font-roboto">
      <div className="w-full max-w-sm space-y-8 rounded-xl border border-gray-100 p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        
        {/* LOGO / BAŞLIK (Giriş sayfasıyla aynı stil) */}
        <div className="text-center">
          <h2 className="logo-text text-4xl text-primary font-bold">BİNGÖL</h2>
          <h3 className="logo-text text-2xl text-gray-800 font-bold uppercase">Üniversitesi</h3>
          <p className="mt-4 text-gray-600 font-medium">Şifre Sıfırlama</p>
        </div>

        {/* HATA/BAŞARI MESAJLARI */}
        {message.text && (
          <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 border ${
            message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={16}/> : <ShieldCheck size={16}/>}
            {message.text}
          </div>
        )}

        {/* ADIM 1: E-POSTA GİRİŞİ */}
        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="mt-8 space-y-6">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                placeholder="E-posta adresi"
                className="w-full rounded-lg border border-gray-300 p-3 pl-10 text-black bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <button
              disabled={loading}
              className="w-full rounded-lg bg-primary py-3 font-bold text-white transition-all hover:opacity-90 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCcw className="animate-spin" size={18} /> : "KOD GÖNDER"}
            </button>
          </form>
        )}

        {/* ADIM 2: KOD VE ŞİFRE GİRİŞİ */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="mt-8 space-y-4">
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                required
                maxLength={6}
                placeholder="6 Haneli Doğrulama Kodu"
                className="w-full rounded-lg border border-gray-300 p-3 pl-10 text-black bg-white focus:ring-2 focus:ring-primary outline-none font-mono tracking-widest"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="password"
                required
                placeholder="Yeni Şifre"
                className="w-full rounded-lg border border-gray-300 p-3 pl-10 text-black bg-white focus:ring-2 focus:ring-primary outline-none"
                value={formData.new_password}
                onChange={(e) => setFormData({...formData, new_password: e.target.value})}
              />
            </div>
            <button
              disabled={loading}
              className="w-full rounded-lg bg-primary py-3 font-bold text-white transition-all hover:opacity-90 disabled:bg-gray-400"
            >
              {loading ? "İŞLENİYOR..." : "ŞİFREYİ GÜNCELLE"}
            </button>
          </form>
        )}

        {/* ADIM 3: BAŞARI EKRANI */}
        {step === 3 && (
          <div className="text-center space-y-6 py-4">
            <p className="text-gray-600 font-medium">Şifreniz başarıyla değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.</p>
            <Link 
              href="/login"
              className="block w-full rounded-lg bg-primary py-3 font-bold text-white text-center hover:opacity-90 shadow-lg"
            >
              GİRİŞE DÖN
            </Link>
          </div>
        )}

        {/* ALT LİNKLER */}
        <div className="text-center text-sm pt-4">
          <Link href="/login" className="font-bold text-primary hover:underline flex items-center justify-center gap-1">
            Giriş Sayfasına Dön
          </Link>
        </div>
      </div>
    </div>
  );
}