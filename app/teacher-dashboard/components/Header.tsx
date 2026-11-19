"use client";
import React from 'react';
import {
  LayoutGrid,
  Plus,
  BarChart3,
  Bot,
  PieChart,
  Clock,
  ClipboardList,
  LogOut,
  FileBarChart
} from 'lucide-react';

export type TabType = 'content' | 'analytics' | 'chatbot' | 'survey_results' | 'time_analytics' | 'weekly_pretest' | 'exam_scores';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <header className="bg-[#1a1a1a] py-3 px-4 md:px-6 shadow-xl sticky top-0 z-50 print:hidden text-left border-b border-white/5">
      <div className="max-w-[1650px] mx-auto flex flex-col 2xl:flex-row justify-between items-center gap-3 text-left">
        
        {/* LOGO VE TABLET/MOBİL ÇIKIŞ ALANI */}
        <div className="flex items-center justify-between w-full 2xl:w-auto text-left leading-none shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#ce1212] p-2 rounded-lg shadow-lg shrink-0 flex items-center justify-center">
              <LayoutGrid size={22} className="text-white" />
            </div>
            <div className="text-left leading-none">
              <h1 className="text-base md:text-lg font-black text-white uppercase leading-none">Akademisyen Paneli</h1>
              <p className="text-[9px] text-gray-400 uppercase tracking-widest leading-none mt-1 font-bold">AKADEMİK YÖNETİM</p>
            </div>
          </div>

          {/* TABLET / LAPTOP İÇİN ÇIKIŞ BUTONU */}
          <button 
            onClick={handleLogout} 
            className="2xl:hidden flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl text-white font-bold text-[10px] uppercase leading-none transition-all active:scale-95 text-left shadow-sm shrink-0"
          >
            <LogOut size={14} /> GÜVENLİ ÇIKIŞ
          </button>
        </div>

        {/* MENÜ BUTONLARI KAPSAYICISI */}
        <div className="flex flex-wrap lg:flex-nowrap overflow-x-auto max-w-full bg-white/5 p-1 rounded-2xl border border-white/10 gap-1 justify-center leading-none text-left shrink-0 custom-scrollbar">
          <button 
            onClick={() => setActiveTab('content')} 
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10.5px] font-black transition-all whitespace-nowrap leading-none ${activeTab === 'content' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Plus size={13} /> İÇERİK YÖNETİMİ
          </button>
          <button 
            onClick={() => setActiveTab('analytics')} 
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10.5px] font-black transition-all whitespace-nowrap leading-none ${activeTab === 'analytics' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <BarChart3 size={13} /> ÖĞRENCİ ANALİZLERİ
          </button>
          <button 
            onClick={() => setActiveTab('weekly_pretest')} 
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10.5px] font-black transition-all whitespace-nowrap leading-none ${activeTab === 'weekly_pretest' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <ClipboardList size={13} /> PEKİŞTİRME TESTİ ANALİZİ
          </button>
          <button 
            onClick={() => setActiveTab('chatbot')} 
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10.5px] font-black transition-all whitespace-nowrap leading-none ${activeTab === 'chatbot' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Bot size={13} /> CHATBOT ANALİZİ
          </button>
          <button 
            onClick={() => setActiveTab('time_analytics')} 
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10.5px] font-black transition-all whitespace-nowrap leading-none ${activeTab === 'time_analytics' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Clock size={13} /> SİSTEM ZAMAN ANALİTİĞİ
          </button>
          <button 
            onClick={() => setActiveTab('exam_scores')} 
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10.5px] font-black transition-all whitespace-nowrap leading-none ${activeTab === 'exam_scores' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <FileBarChart size={13} /> D1 MATERYAL PUANLARI
          </button>
        </div>

        {/* GENİŞ EKRAN (2XL) GÜVENLİ ÇIKIŞ BUTONU */}
        <button 
          onClick={handleLogout} 
          className="hidden 2xl:flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl text-white font-bold text-[10px] uppercase leading-none transition-all active:scale-95 text-left shadow-sm shrink-0"
        >
          <LogOut size={15} /> GÜVENLİ ÇIKIŞ
        </button>
        
      </div>
    </header>
  );
};
