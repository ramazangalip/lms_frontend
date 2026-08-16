"use client";
import React from 'react';
import {
  Filter,
  Bot,
  MessageSquare,
  Users,
  Calendar
} from 'lucide-react';
import { ChatbotReportData, getDeptName, departmentList } from '../types';

interface ChatbotAnalyticsTabProps {
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;
  chatbotData: ChatbotReportData[];
  handlePrintChatbot: () => void;
}

export const ChatbotAnalyticsTab: React.FC<ChatbotAnalyticsTabProps> = ({
  selectedDepartment,
  setSelectedDepartment,
  chatbotData,
  handlePrintChatbot
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      
      {/* ÜST KONTROL VE FİLTRELEME ÇUBUĞU */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-xl border border-gray-100 text-left">
        <div className="text-left leading-none">
          <h2 className="text-xl font-black text-[#1a1a1a] uppercase leading-none border-l-4 border-[#ce1212] pl-3">Chatbot Etkileşim İzleme</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest italic leading-none">Soru Analizi ve Merak Endeksi</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto leading-none text-left">
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-left shadow-inner">
            <Filter size={16} className="text-[#ce1212]" />
            <select 
              value={selectedDepartment} 
              onChange={(e) => setSelectedDepartment(e.target.value)} 
              className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer text-[#1a1a1a]"
            >
              {departmentList.map(d => (
                <option key={d.id} value={d.id} className="text-black">{d.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handlePrintChatbot}
            className="flex items-center justify-center gap-3 bg-[#ce1212] hover:bg-black text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all leading-none active:scale-95 text-left"
          >
            <Bot size={18} /> {getDeptName(selectedDepartment).toUpperCase()} CHATBOT RAPORU AL
          </button>
        </div>
      </div>

      {/* ÖZET İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-xl border-b-4 border-[#ce1212] flex items-center gap-4">
          <div className="bg-red-50 p-4 rounded-2xl text-[#ce1212] leading-none flex items-center justify-center">
            <MessageSquare size={32} />
          </div>
          <div className="text-left leading-none">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest leading-none mb-2">Toplam Soru</p>
            <p className="text-3xl font-black text-[#1a1a1a] leading-none">{chatbotData.reduce((acc, curr) => acc + curr.total_count, 0)}</p>
          </div>
        </div>
        <div className="bg-[#1a1a1a] p-6 rounded-3xl shadow-xl flex items-center gap-4 text-white">
          <div className="bg-white/10 p-4 rounded-2xl text-white leading-none flex items-center justify-center">
            <Users size={32} />
          </div>
          <div className="text-left leading-none">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest leading-none mb-2">Aktif Kullanıcı</p>
            <p className="text-3xl font-black leading-none text-white">{chatbotData.filter(d => d.total_count > 0).length} <span className="text-sm text-gray-500">/ {chatbotData.length}</span></p>
          </div>
        </div>
      </div>

      {/* DETAYLI ÖĞRENCİ LİSTESİ VE SORU GEÇMİŞİ */}
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-left leading-normal">
        <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center">
          <h2 className="font-black text-secondary uppercase text-xs tracking-widest flex items-center gap-2 leading-none">
            <Bot size={18} className="text-[#ce1212]" /> Öğrenci Soru Geçmişi Detayları
          </h2>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-[#1a1a1a] text-white text-[10px] font-black uppercase tracking-widest leading-none">
              <tr>
                <th className="p-6 w-1/4">ÖĞRENCİ BİLGİSİ</th>
                <th className="p-6 w-24 text-center">ADET</th>
                <th className="p-6">SORDUĞU SORULAR VE HAFTA ANALİZİ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chatbotData.map((student, i) => (
                <tr key={i} className="hover:bg-red-50/30 transition-all align-top">
                  <td className="p-6">
                    <p className="font-black text-black uppercase text-sm leading-none">{student.student_name}</p>
                    <p className="text-[8px] text-[#ce1212] font-black uppercase mt-2 tracking-tighter leading-none">
                      {getDeptName(selectedDepartment)}
                    </p>
                  </td>
                  <td className="p-6 text-center">
                    <span className="bg-[#1a1a1a] text-white px-4 py-2 rounded-xl font-black text-sm shadow-md inline-block leading-none">
                      {student.total_count}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-3 custom-scrollbar">
                      {student.questions.length > 0 ? (
                        student.questions.map((q, qi) => (
                          <div key={qi} className="bg-white p-3 rounded-2xl border border-gray-100 hover:border-red-200 transition-colors shadow-sm">
                            <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase mb-2 tracking-tighter leading-none">
                              <span className="flex items-center gap-1"><Calendar size={10} className="text-[#ce1212]" /> {q.date}</span>
                              <span className="bg-[#ce1212] px-2 py-0.5 rounded-full text-white font-black">HAFTA {q.week}</span>
                            </div>
                            <p className="text-[11px] text-gray-700 font-medium italic leading-relaxed">&quot;{q.text}&quot;</p>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center">
                          <span className="text-gray-300 italic text-[10px] uppercase font-bold tracking-widest">Henüz bir chatbot etkileşimi bulunmuyor.</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
