"use client";
import React, { useEffect } from 'react';
import { X, Video, Sparkles, PlayCircle } from 'lucide-react';

interface IntroVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  title?: string;
}

export const IntroVideoModal: React.FC<IntroVideoModalProps> = ({
  isOpen,
  onClose,
  videoUrl = "https://www.youtube.com/embed/yeYMTkqG-ZE?si=yHJFj_ycQzpO34rw",
  title = "BÜ-LMS Tanıtım ve Kullanım Videosu",
}) => {
  // ESC tuşu ile kapatma ve arka plan kaydırmasını engelleme
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Standart youtube url'sini embed url'sine dönüştür
  const getEmbedUrl = (url: string) => {
    if (!url) return "https://www.youtube.com/embed/ulFHl4c0QpE";
    if (url.includes("embed/")) return url;
    if (url.includes("watch?v=")) {
      const videoId = url.split("watch?v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const finalVideoUrl = getEmbedUrl(videoUrl);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/75 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Modal Kutusu */}
      <div 
        className="relative w-full max-w-4xl bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl border-4 border-white overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-secondary via-gray-900 to-secondary p-4 md:p-6 text-white flex items-center justify-between border-b-4 border-primary shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 md:p-2.5 rounded-xl border border-primary/40 text-primary">
              <PlayCircle className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm md:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                {title}
                <Sparkles className="w-4 h-4 text-primary animate-pulse hidden sm:inline-block" />
              </h3>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-wider">
                Yapay Zeka Destekli LMS Sistemini Keşfedin
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white bg-white/10 hover:bg-primary rounded-xl transition-all duration-200 focus:outline-none cursor-pointer"
            aria-label="Kapat"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Video İçerik Alanı */}
        <div className="p-3 sm:p-6 md:p-8 bg-gray-900/95 flex-1 overflow-y-auto space-y-4">
          <div className="relative aspect-video w-full rounded-2xl md:rounded-[1.8rem] overflow-hidden shadow-2xl border-2 border-gray-700/80 bg-black">
            <iframe
              src={finalVideoUrl}
              title={title}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* Alt Bilgilendirme & Buton */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left pt-1">
            <div className="flex items-center gap-2 text-gray-300 text-[11px] sm:text-xs font-medium">
              <Video className="w-4 h-4 text-primary shrink-0" />
              <span>Sistemi daha verimli kullanmak için tanıtım videosunu izleyebilirsiniz.</span>
            </div>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
            >
              Giriş Sayfasına Devam Et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
