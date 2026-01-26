"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { jwtDecode } from 'jwt-decode';
import { AxiosError } from 'axios';

interface CustomTokenPayload {
  is_teacher: boolean;
  is_staff: boolean;
  is_student: boolean;
  full_name: string;
  // department_name kaldırıldı
  email: string;
  user_id: number;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await api.post('/users/login/', { email, password });
      const { access, refresh } = res.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      const decoded = jwtDecode<CustomTokenPayload>(access);
      
      // Token içeriğini görmek için kullandığınız alert'ten departmanı sildik
      console.log("Giriş Yapan Kullanıcı:", decoded.full_name);

      // Yönlendirme mantığı
      if (decoded.is_teacher) {
        router.push('/teacher-dashboard');
      } else {
        // Öğrenci veya diğer roller için varsayılan dashboard
        router.push('/dashboard');
      }
      
    } catch (err) {
      const error = err as AxiosError<{ detail?: string }>;
      alert(error.response?.data?.detail || "Giriş başarısız! Bilgilerinizi kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-8 rounded-xl border border-gray-100 p-8 shadow-2xl">
        <div className="text-center">
          <h2 className="logo-text text-4xl text-primary font-bold">BİNGÖL</h2>
          <h3 className="logo-text text-2xl text-gray-800 font-bold uppercase">Üniversitesi</h3>
          <p className="mt-4 font-roboto text-gray-600 font-medium">LMS Giriş Sistemi</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <input 
              type="email" 
              placeholder="E-posta adresi" 
              required 
              className="w-full rounded-lg border border-gray-300 p-3 text-black bg-white focus:ring-2 focus:ring-primary outline-none"
              onChange={e => setEmail(e.target.value)} 
            />
            <input 
              type="password" 
              placeholder="Şifre" 
              required 
              className="w-full rounded-lg border border-gray-300 p-3 text-black bg-white focus:ring-2 focus:ring-primary outline-none"
              onChange={e => setPassword(e.target.value)} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full rounded-lg bg-primary py-3 font-bold text-white transition-all hover:opacity-90 disabled:bg-gray-400"
          >
            {loading ? "GİRİŞ YAPILIYOR..." : "GİRİŞ YAP"}
          </button>
        </form>

        <div className="text-center text-sm pt-4">
          <p className="text-gray-600">
            Hesabınız yok mu? <Link href="/register" className="font-bold text-primary hover:underline">Kayıt Ol</Link>
          </p>
          <p className="text-gray-600">
            Şifrenizi mi Unuttunuz? <Link href="/forgot-password" className="font-bold text-primary hover:underline">Şifreyi Sıfırla</Link>
          </p>
        </div>
      </div>
    </div>
  );
}