"use client";
import React from 'react';
import {
  LayoutGrid,
  Plus,
  BarChart3,
  Bot,
  PieChart,
  Clock,
  LogOut
} from 'lucide-react';

export type TabType = 'content' | 'analytics' | 'chatbot' | 'survey_results' | 'time_analytics';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="bg-[#1a1a1a] p-4 md:p-6 shadow-xl sticky top-0 z-50 print:hidden text-left border-b border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-4 lg:gap-6 text-left">
        
        {/* LOGO ALANI */}
        <div className="flex items-center gap-3 w-full lg:w-auto text-left leading-none shrink-0">
          <div className="bg-[#ce1212] p-2 rounded-lg shadow-lg shrink-0 flex items-center justify-center">
            <LayoutGrid size={24} className="text-white" />
          </div>
          <div className="text-left leading-none">
            <h1 className="text-lg md:text-xl font-black text-white uppercase leading-none">Akademisyen Paneli</h1>
            <p className="text-[9px] md:text-[10px] text-gray-400 uppercase tracking-widest leading-none mt-1 font-bold">AKADEMİK YÖNETİM</p>
          </div>
        </div>

        {/* MENÜ BUTONLARI KAPSAYICISI */}
        <div className="flex flex-wrap bg-white/5 p-1 rounded-2xl border border-white/10 w-full lg:w-auto gap-1 justify-center leading-none text-left shrink-0">
          <button 
            onClick={() => setActiveTab('content')} 
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 rounded-xl text-[11px] font-black transition-all whitespace-nowrap leading-none ${activeTab === 'content' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Plus size={14} /> İÇERİK YÖNETİMİ
          </button>
          <button 
            onClick={() => setActiveTab('analytics')} 
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 rounded-xl text-[11px] font-black transition-all whitespace-nowrap leading-none ${activeTab === 'analytics' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <BarChart3 size={14} /> ÖĞRENCİ ANALİZLERİ
          </button>
          <button 
            onClick={() => setActiveTab('chatbot')} 
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 rounded-xl text-[11px] font-black transition-all whitespace-nowrap leading-none ${activeTab === 'chatbot' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Bot size={14} /> CHATBOT ANALİZİ
          </button>
          <button 
            onClick={() => setActiveTab('survey_results')} 
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 rounded-xl text-[11px] font-black transition-all whitespace-nowrap leading-none ${activeTab === 'survey_results' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <PieChart size={14} /> ANKET SONUÇLARI
          </button>
          <button 
            onClick={() => setActiveTab('time_analytics')} 
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap leading-none ${activeTab === 'time_analytics' ? 'bg-[#ce1212] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Clock size={16} /> SİSTEM ZAMAN ANALİTİĞİ
          </button>
        </div>

        {/* GÜVENLİ ÇIKIŞ BUTONU */}
        <button 
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }} 
          className="w-full lg:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl text-white font-bold text-[10px] uppercase leading-none transition-all active:scale-95 text-left shadow-sm shrink-0"
        >
          <LogOut size={16} /> GÜVENLİ ÇIKIŞ
        </button>
        
      </div>
    </header>
  );
};
