"use client";
import React from 'react';
import {
  Video,
  CheckCircle2,
  Lock,
  ChevronRight,
  AlertCircle,
  LogOut,
  X
} from 'lucide-react';
import { WeeklyContent, Material } from '../types';

interface SidebarProps {
  contents: WeeklyContent[];
  selectedWeek: WeeklyContent | null;
  isIntroView: boolean;
  isSidebarOpen: boolean;
  introStatus: { url: string; title: string; isWatched: boolean; description: string };
  preTestResult: { score: number; correct?: number; wrong?: number; is_completed: boolean } | null;
  setIsSidebarOpen: (open: boolean) => void;
  setIsIntroView: (intro: boolean) => void;
  setActiveMaterial: (material: Material | null) => void;
  handleWeekSelection: (weekData: WeeklyContent) => void;
  handleLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  contents,
  selectedWeek,
  isIntroView,
  isSidebarOpen,
  introStatus,
  preTestResult,
  setIsSidebarOpen,
  setIsIntroView,
  setActiveMaterial,
  handleWeekSelection,
  handleLogout,
}) => {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[100] w-72 bg-secondary shadow-2xl flex flex-col border-r border-gray-800 transition-transform duration-300 transform lg:relative lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-5 border-b border-gray-700 bg-black/20 text-center flex items-center justify-between shrink-0">
        <div className="w-full text-center ml-2">
          <h2 className="logo-text text-lg text-white tracking-widest text-primary font-bold uppercase leading-none">
            BÜ-LMS
          </h2>
          <p className="text-[9px] text-gray-500 uppercase mt-1.5 tracking-tighter text-center">
            ÖĞRENCİ PANELİ
          </p>
        </div>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden text-gray-500 absolute right-4 top-5"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar leading-tight text-left">
        <button
          onClick={() => {
            setIsIntroView(true);
            setActiveMaterial(null);
          }}
          className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all border ${
            isIntroView
              ? 'bg-primary border-primary text-white shadow-lg'
              : 'bg-gray-800/40 border-gray-700 text-gray-400 hover:bg-gray-800'
          }`}
        >
          <div className="bg-white/10 p-1.5 rounded-lg shrink-0">
            <Video size={16} />
          </div>
          <div className="text-left">
            <p className="text-[8px] font-black uppercase tracking-widest mb-1 text-gray-400">
              Tanıtım
            </p>
            <p className="text-xs font-bold uppercase">TANITIM</p>
          </div>
        </button>

        <div className="h-px bg-gray-700/50 mx-2 my-1" />

        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((num) => {
          const weekData = contents.find((c) => c.week_number === num);
          const isActive = selectedWeek?.week_number === num && !isIntroView;
          const isFinished = weekData?.is_completed;

          // Temel kilitler (Intro ve Pre-test)
          const introLocked = !introStatus.isWatched;
          const preTestLocked = !preTestResult?.is_completed;

          // Backend'den gelen dinamik kilit (Tarih ve Sıralı İlerleme)
          const isBackendLocked = weekData?.is_locked === true;

          // Toplam kilit durumu
          const isWeekLocked = num >= 1 && (introLocked || preTestLocked || isBackendLocked);

          // Kilit mesajını belirle
          let lockReason = "";
          if (introLocked) {
            lockReason = "Önce tanıtım videosunu izlemelisiniz.";
          } else if (preTestLocked) {
            lockReason = "Önce ön değerlendirme testini bitirmelisiniz.";
          } else if (isBackendLocked) {
            lockReason = weekData?.lock_reason || "Bu içerik şu an erişime kapalıdır.";
          }

          return (
            <div key={`sidebar-week-wrapper-${num}`} className="relative group">
              <button
                disabled={!weekData || isWeekLocked}
                onClick={() => weekData && handleWeekSelection(weekData)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all border ${
                  isActive
                    ? 'bg-primary border-primary text-white shadow-lg'
                    : isWeekLocked
                    ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed opacity-40'
                    : weekData
                    ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700'
                    : 'bg-transparent border-dashed border-gray-700 text-gray-700 opacity-20'
                }`}
              >
                <div className="flex items-center gap-3 text-left">
                  {isWeekLocked ? (
                    <Lock size={14} className="text-gray-600" />
                  ) : isFinished ? (
                    <CheckCircle2 size={16} className="text-green-400" />
                  ) : (
                    <span className="text-[10px] font-bold">{num < 10 ? `0${num}` : num}</span>
                  )}
                  <div className="text-left leading-tight">
                    <p className="text-xs font-semibold">Hafta {num}</p>
                    {weekData && !isWeekLocked && (
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-0.5">
                        %{weekData.progress || 0} TAMAMLANDI
                      </p>
                    )}
                    {isWeekLocked && weekData && (
                      <p className="text-[7px] text-red-500 font-bold uppercase mt-0.5">KİLİTLİ</p>
                    )}
                  </div>
                </div>
                {weekData && !isWeekLocked && (
                  <ChevronRight size={12} className="opacity-40" />
                )}
              </button>

              {/* Tooltip: Kilit Nedenini Göster */}
              {isWeekLocked && weekData && (
                <div className="hidden group-hover:block absolute left-full ml-2 top-0 w-48 bg-black text-white text-[9px] p-2 rounded-lg z-[110] shadow-xl border border-gray-700 animate-in fade-in slide-in-from-left-1">
                  <p className="font-bold flex items-center gap-1 text-red-400 uppercase mb-1">
                    <AlertCircle size={10} /> Erişim Engellendi
                  </p>
                  {lockReason}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="p-5 border-t border-gray-700 flex items-center justify-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold text-[10px] tracking-widest uppercase shrink-0"
      >
        <LogOut size={14} /> GÜVENLİ ÇIKIŞ
      </button>
    </aside>
  );
};
