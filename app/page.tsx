"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import api from '@/lib/api';

interface CustomTokenPayload {
  is_teacher: boolean;
  exp: number;
}

export default function Home() {
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
        console.error("Access token doğrulanamadı:", e);
      }
    }

    // Access token yoksa veya süresi dolduysa refresh token ile yenilemeyi dene
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
        .catch(err => {
          console.error("Refresh token geçersiz:", err);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('remember_me');
          router.replace('/login');
        });
      return;
    }

    // Hiçbir token yoksa direkt login'e yönlendir
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-500">Oturum kontrol ediliyor...</p>
      </div>
    </div>
  );
}