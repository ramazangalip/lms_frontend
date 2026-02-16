"use client";
import React from 'react';
import Link from 'next/link';
import { Video, ArrowLeft, Info, HelpCircle } from 'lucide-react';

export default function GuidePage() {
  // OneDrive Video Embed Linkin (Buraya kendi iframe src linkini koymalısın)
  const videoIframeUrl = "https://bingol-my.sharepoint.com/personal/241161012_bingol_edu_tr/_layouts/15/embed.aspx?UniqueId=13a6a5a0-ff4a-47f4-9c2a-951d2b944dc7&embed=%7B%22ust%22%3Atrue%2C%22hv%22%3A%22CopyEmbedCode%22%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create";

  return (
    <div className="min-h-screen bg-gray-50 font-roboto flex flex-col items-center py-10 px-6">
      
      {/* Üst Navigasyon */}
      <div className="max-w-4xl w-full flex justify-between items-center mb-6">
        <Link 
          href="/login" 
          className="flex items-center gap-2 text-gray-500 hover:text-secondary transition-all font-bold text-xs uppercase tracking-widest group"
        >
          <div className="bg-white p-2 rounded-lg shadow-sm group-hover:bg-secondary group-hover:text-white transition-all">
            <ArrowLeft size={16} />
          </div>
          Giriş Ekranına Dön
        </Link>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
          <HelpCircle size={14} className="text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Sistem Rehberi</span>
        </div>
      </div>

      {/* Ana Rehber Kartı */}
      <div className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-2xl border-4 border-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Alanı */}
        <div className="bg-secondary p-8 md:p-12 text-center border-b-4 border-primary relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
             <Video size={120} />
          </div>
          <div className="bg-primary w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/20 animate-bounce">
            <Video className="text-white" size={28} />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-tight mb-3">
            Kullanım Kılavuzu & <br/> <span className="text-primary text-4xl">Sistem Rehberi</span>
          </h1>
          <p className="text-gray-400 text-[11px] md:text-xs font-bold uppercase tracking-[0.2em]">
            Dijital Sınıfı Keşfedin
          </p>
        </div>

        {/* Video Player Bölümü */}
        <div className="p-6 md:p-10 bg-gray-50/30">
          <div className="relative aspect-video rounded-[1.5rem] overflow-hidden shadow-2xl border-2 border-white ring-1 ring-gray-200 bg-black group">
            <iframe 
              src={videoIframeUrl}
              className="absolute inset-0 w-full h-full"
              frameBorder="0" 
              scrolling="no" 
              allowFullScreen
              title="Sistem Rehber Videosu"
            ></iframe>
          </div>

          {/* Bilgilendirme Kutusu */}
         
        </div>
      </div>

      {/* Footer Mesajı */}
      <div className="mt-10 text-center">
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.4em]">
          BÜ-LMS © 2026 YAPAY ZEKA DESTEKLİ DİJİTAL SINIF
        </p>
      </div>
    </div>
  );
}