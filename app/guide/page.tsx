"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Video, ArrowLeft, HelpCircle, Download, Monitor, Smartphone, PlayCircle } from 'lucide-react';

export default function GuidePage() {
  // Aktif menü sekmesini tutan state
  const [activeTab, setActiveTab] = useState<'guide' | 'extra' | 'mobile'>('guide');

  // URL Tanımlamaları
  const guideVideoUrl = "https://www.youtube.com/embed/ulFHl4c0QpE"; // 1. Video
  const extraVideoUrl = "https://www.youtube.com/embed/ulFHl4c0QpE"; // 2. Video (Burayı değiştirirsin)
  const apkDownloadUrl = "https://drive.google.com/uc?export=download&id=BURAYA_DRIVE_ID_GELECEK"; // APK Linki

  return (
    <div className="min-h-screen bg-gray-50 font-roboto flex flex-col items-center py-10 px-6 text-left">
      
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
          <HelpCircle size={14} className="text-[#ce1212]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Destek Merkezi</span>
        </div>
      </div>

      {/* Ana Rehber Kartı */}
      <div className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-2xl border-4 border-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Alanı */}
        <div className="bg-secondary p-8 md:p-12 text-center border-b-4 border-[#ce1212] relative overflow-hidden">
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-tight mb-3">
            BÜ-LMS <span className="text-[#ce1212]">DİJİTAL REHBER</span>
          </h1>
          <p className="text-gray-400 text-[11px] md:text-xs font-bold uppercase tracking-[0.2em]">
            Sistemi Keşfedin ve Uygulamayı İndirin
          </p>
        </div>

        {/* --- MENÜ NAVİGASYONU --- */}
        <div className="flex bg-gray-100 p-2 gap-2 border-b">
          <button 
            onClick={() => setActiveTab('guide')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black tracking-widest transition-all ${activeTab === 'guide' ? 'bg-white shadow-md text-[#ce1212]' : 'text-gray-400 hover:bg-gray-200'}`}
          >
            <Monitor size={16} /> SİSTEM REHBERİ
          </button>
          <button 
            onClick={() => setActiveTab('extra')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black tracking-widest transition-all ${activeTab === 'extra' ? 'bg-white shadow-md text-[#ce1212]' : 'text-gray-400 hover:bg-gray-200'}`}
          >
            <PlayCircle size={16} /> EK EĞİTİM
          </button>
          <button 
            onClick={() => setActiveTab('mobile')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black tracking-widest transition-all ${activeTab === 'mobile' ? 'bg-white shadow-md text-[#ce1212]' : 'text-gray-400 hover:bg-gray-200'}`}
          >
            <Smartphone size={16} /> MOBİL (APK)
          </button>
        </div>

        {/* İÇERİK ALANI */}
        <div className="p-6 md:p-10 bg-gray-50/30">
          
          {/* 1. SEKME: SİSTEM REHBERİ VİDEO */}
          {activeTab === 'guide' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="relative aspect-video rounded-[1.5rem] overflow-hidden shadow-2xl border-2 border-white bg-black">
                <iframe src={guideVideoUrl} className="absolute inset-0 w-full h-full" allowFullScreen title="Rehber 1"></iframe>
              </div>
              <p className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Sistemin genel kullanımını bu videodan izleyebilirsiniz.</p>
            </div>
          )}

          {/* 2. SEKME: EK EĞİTİM VİDEO */}
          {activeTab === 'extra' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="relative aspect-video rounded-[1.5rem] overflow-hidden shadow-2xl border-2 border-white bg-black">
                <iframe src={extraVideoUrl} className="absolute inset-0 w-full h-full" allowFullScreen title="Rehber 2"></iframe>
              </div>
              <p className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Yapay Zeka modülleri ve detaylı kullanım eğitimi.</p>
            </div>
          )}

          {/* 3. SEKME: MOBİL UYGULAMA İNDİRME */}
          {activeTab === 'mobile' && (
            <div className="flex flex-col items-center py-10 space-y-8 animate-in zoom-in-95 duration-500">
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col items-center max-w-sm w-full text-center">
                <div className="bg-green-50 p-6 rounded-3xl text-green-600 mb-6">
                  <Smartphone size={48} />
                </div>
                <h3 className="text-lg font-black text-secondary uppercase mb-2">Android Uygulaması</h3>
                <p className="text-xs text-gray-400 font-medium mb-8">Sistemi mobil cihazınızda daha hızlı kullanmak için APK dosyasını indirin.</p>
                
                <a 
                  href={apkDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-3 bg-secondary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg"
                >
                  <Download size={18} /> APK DOSYASINI İNDİR
                </a>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">* Google Drive üzerinden güvenli indirme bağlantısıdır.</p>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 text-center">
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.4em]">
          BÜ-LMS © 2026 YAPAY ZEKA DESTEKLİ  SINIF
        </p>
      </div>
    </div>
  );
}