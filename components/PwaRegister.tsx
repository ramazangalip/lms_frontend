"use client";
import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('PWA Service Worker başarıyla kaydedildi:', registration.scope);
          })
          .catch((error) => {
            console.error('PWA Service Worker kaydı başarısız:', error);
          });
      });
    }
  }, []);

  return null;
}
