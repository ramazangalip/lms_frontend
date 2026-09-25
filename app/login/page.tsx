"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { jwtDecode } from 'jwt-decode';
import { AxiosError } from 'axios';
import { Eye, EyeOff, Info } from 'lucide-react';

interface CustomTokenPayload {
  is_teacher: boolean;
  is_staff: boolean;
  is_student: boolean;
  full_name: string;
  // department_name kaldırıldı
  email: string;
  user_id: number;
  exp?: number;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (accessToken) {
      try {
        const decoded = jwtDecode<CustomTokenPayload>(accessToken);
        if (decoded && decoded.exp && decoded.exp * 1000 > Date.now()) {
          if (decoded.is_teacher) {
            router.replace('/teacher-dashboard');
          } else {
            router.replace('/dashboard');
          }
          return;
        }
      } catch (e) {
        console.error("Token geçersiz:", e);
      }
    }

    if (refreshToken) {
      api.post('/users/token/refresh/', { refresh: refreshToken })
        .then(res => {
          const newAccess = res.data.access;
          localStorage.setItem('access_token', newAccess);
          const decoded = jwtDecode<CustomTokenPayload>(newAccess);
          if (decoded.is_teacher) {
            router.replace('/teacher-dashboard');
          } else {
            router.replace('/dashboard');
          }
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('remember_me');
        });
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await api.post('/users/login/', { email, password, remember_me: rememberMe });
      const { access, refresh } = res.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remember_me');
      }

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
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Şifre" 
                required 
                className="w-full rounded-lg border border-gray-300 p-3 pr-20 text-black bg-white focus:ring-2 focus:ring-primary outline-none"
                onChange={e => setPassword(e.target.value)} 
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5">
                {/* Şifre Formatı Bilgilendirme İkonu & Popover Tooltip */}
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                    onMouseEnter={() => setShowInfoTooltip(true)}
                    onMouseLeave={() => setShowInfoTooltip(false)}
                    className="p-1 text-gray-400 hover:text-primary transition-colors focus:outline-none cursor-pointer"
                    aria-label="Şifre formatı bilgisi"
                  >
                    <Info className="h-5 w-5" />
                  </button>

                  {showInfoTooltip && (
                    <div 
                      className="absolute right-[-2rem] sm:right-0 bottom-full mb-3 w-[calc(100vw-3.5rem)] max-w-[290px] sm:max-w-xs rounded-xl bg-gray-900/95 backdrop-blur-sm p-3.5 sm:p-4 text-xs text-white shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 border border-gray-700/60 font-normal"
                      onMouseEnter={() => setShowInfoTooltip(true)}
                      onMouseLeave={() => setShowInfoTooltip(false)}
                    >
                      <div className="font-bold text-amber-400 mb-2 flex items-center justify-between gap-1.5 text-xs border-b border-gray-700/80 pb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Info className="h-4 w-4 shrink-0 text-amber-400" /> Standart Şifre Formatı
                        </span>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setShowInfoTooltip(false); }}
                          className="sm:hidden text-gray-400 hover:text-white p-0.5 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="space-y-2 text-[10.5px] sm:text-[11px] leading-relaxed">
                        <p className="text-gray-300 font-medium">
                          Sistem şifreniz aşağıdaki şablona göre oluşturulmuştur:
                        </p>
                        
                        {/* Şablon Kutu */}
                        <div className="bg-gray-800/90 p-2 rounded-lg text-[9.5px] sm:text-[10.5px] font-mono text-center text-emerald-400 border border-emerald-500/30 tracking-tight font-bold break-all">
                          [İsim İlk Harf] + [Oğrenci No Son 4 Hane] + ! + [Bölüm Kodu]
                        </div>

                        {/* Örnek */}
                        <div className="text-[10px] sm:text-[10.5px] text-gray-300 bg-gray-800/50 p-2 rounded border border-gray-700/40 leading-normal">
                          📌 <strong>Örnek:</strong> Mustafa (No: ...1016, Matematik.) <br/>
                          ➔ Şifre: <strong className="text-amber-300 font-mono font-bold text-xs">M1016!mt</strong>
                        </div>

                        {/* Bölüm Kodları Listesi */}
                        <div className="pt-1">
                          <p className="font-bold text-gray-200 text-[9.5px] sm:text-[10px] uppercase tracking-wider mb-1">Bölüm Kodları (Küçük Harf):</p>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9.5px] sm:text-[10px] text-gray-300 font-medium">
                            <span>• Türk Dili Ve Edebiyatı: <strong className="text-emerald-400 font-mono">td</strong></span>
                            <span>• Siyaset Bilimi ve Kamu Yönetimi: <strong className="text-emerald-400 font-mono">sb</strong></span>
                            <span>• Matematik: <strong className="text-emerald-400 font-mono">mt</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="absolute right-5 sm:right-3 -bottom-1.5 h-3 w-3 rotate-45 bg-gray-900 border-r border-b border-gray-700/60" />
                    </div>
                  )}
                </div>

                {/* Şifre Göster/Gizle Göz İkonu */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none cursor-pointer"
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Beni Hatırla Seçeneği */}
            <div className="flex items-center justify-between pt-1">
              <label htmlFor="rememberMe" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  id="rememberMe"
                  checked={rememberMe} 
                  onChange={e => setRememberMe(e.target.checked)} 
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <span className="text-xs font-medium text-gray-700">Beni Hatırla </span>
              </label>
            </div>
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
          {/* <p className="text-gray-600">
            Hesabınız yok mu? <Link href="/register" className="font-bold text-primary hover:underline">Kayıt Ol</Link>
          </p> */}
          {/* <p className="text-gray-600">
            Şifrenizi mi Unuttunuz? <Link href="/forgot-password" className="font-bold text-primary hover:underline">Şifreyi Sıfırla</Link>
          </p> */}
          <p className="text-gray-600">
            Yardım mı Almak İstiyorsunuz? <Link href="/guide" className="font-bold text-primary hover:underline">Site ve Mobil Uygulama Hakkında Yardım Almak için tıklayınız</Link>
          </p>
        </div>
      </div>
    </div>
  );
}