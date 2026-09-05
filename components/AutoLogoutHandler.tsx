"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AutoLogoutHandlerProps {
  inactivityTimeMs?: number; // Varsayılan: 15 dakika (900.000 ms)
  warningTimeSec?: number;    // Varsayılan: 10 saniye
}

export default function AutoLogoutHandler({
  inactivityTimeMs = 15 * 60 * 1000, // 15 dakika
  warningTimeSec = 10                // 10 saniye
}: AutoLogoutHandlerProps) {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [countdown, setCountdown] = useState(warningTimeSec);
  const lastActivityRef = useRef<number>(Date.now());
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Oturum açılmamış sayfalarda (login, register vb.) çalışmasın
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/guide';

  // Oturum kapatma işlemi
  const handleLogout = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setIsWarningOpen(false);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    alert("Oturumunuz pasiflik nedeniyle otomatik olarak kapatılmıştır.");
    router.push('/login');
  }, [router]);

  // Kullanıcı hareketlerini dinle
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Event listener'ları bağla
  useEffect(() => {
    if (isAuthPage) return;

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    
    const handleUserEvent = () => {
      // Eğer uyarı popup'ı açık değilse son hareket zamanını güncelle
      if (!isWarningOpen) {
        resetActivity();
      }
    };

    events.forEach(event => {
      window.addEventListener(event, handleUserEvent, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserEvent);
      });
    };
  }, [isAuthPage, isWarningOpen, resetActivity]);

  // Pasiflik kontrolü ve Geri Sayım Döngüsü
  useEffect(() => {
    if (isAuthPage) return;

    const checkInterval = setInterval(() => {
      const token = localStorage.getItem('access_token');
      if (!token) return; // Giriş yapılmamışsa pas geç

      // Eğer "Beni Hatırla" işaretlendiyse pasiflik uyarısını tetikleme (30 Gün Oturum Açık Kalsın)
      const isRemembered = localStorage.getItem('remember_me') === 'true';
      if (isRemembered) return;

      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      // 15 Dakika (veya belirlenen süre) boyunca hiçbir hareket yoksa Popup Aç
      if (elapsed >= inactivityTimeMs && !isWarningOpen) {
        setIsWarningOpen(true);
        setCountdown(warningTimeSec);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [isAuthPage, inactivityTimeMs, warningTimeSec, isWarningOpen]);

  // Geri Sayım (Popup Açıldığında 10 Saniyeden Geriye Sayar)
  useEffect(() => {
    if (!isWarningOpen) return;

    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isWarningOpen, handleLogout]);

  // Kullanıcı "EVET, AKTİFİM" butonuna bastığında
  const handleStayLoggedIn = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setIsWarningOpen(false);
    resetActivity();
    setCountdown(warningTimeSec);
  };

  if (!isWarningOpen || isAuthPage) return null;

  const progressPercentage = (countdown / warningTimeSec) * 100;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-200 relative overflow-hidden">
        
        {/* Üst Kırmızı/Turuncu Vurgu Çubuğu */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500" />

        {/* İkon */}
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 shadow-inner animate-pulse">
          <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600" />
        </div>

        {/* Başlık */}
        <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
          Hala Aktif misiniz?
        </h3>

        {/* Açıklama */}
        <p className="text-xs sm:text-sm text-gray-600 font-medium mt-3 leading-relaxed">
          10 saniye içerisinde bu bilgi kutusuna cevap vermezseniz oturumunuz otomatik olarak kapatılacaktır.
        </p>

        {/* Geri Sayım Sayacı */}
        <div className="my-5 p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Kapanmaya Kalan Süre
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-red-600 tracking-tight">
            {countdown} <span className="text-sm font-bold text-gray-500">sn</span>
          </div>
          {/* İlerleme Çubuğu */}
          <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden mt-1">
            <div 
              className="bg-red-500 h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Evet Aktifim Butonu */}
        <button
          type="button"
          onClick={handleStayLoggedIn}
          className="w-full py-4 bg-primary hover:opacity-90 active:scale-95 text-white font-black text-base rounded-2xl shadow-lg shadow-primary/25 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
        >
          <CheckCircle2 className="w-5 h-5 text-white" />
          EVET, AKTİFİM
        </button>

      </div>
    </div>
  );
}
