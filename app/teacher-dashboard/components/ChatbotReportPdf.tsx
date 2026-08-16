"use client";
import React from 'react';
import { Bot, Calendar } from 'lucide-react';
import { ChatbotReportData, getDeptName } from '../types';

interface ChatbotReportPdfProps {
  chatbotData: ChatbotReportData[];
  selectedDepartment: string;
}

export const ChatbotReportPdf: React.FC<ChatbotReportPdfProps> = ({
  chatbotData,
  selectedDepartment
}) => {
  return (
    <div id="chatbot-report-pdf" className="hidden print:block bg-white p-0 text-left">
      {chatbotData
        .filter(student => student.total_count > 0)
        .map((student, pageIdx, filteredArray) => (
        <div key={pageIdx} className="p-10 text-left min-h-screen flex flex-col" style={{ pageBreakAfter: 'always' }}>
          
          {/* LOGO VE BAŞLIK ALANI */}
          <div className="flex flex-col items-center mb-8 border-b-4 border-[#1a1a1a] pb-6 text-center">
            <img 
              src="/okul-logo.png" 
              alt="Okul Logosu" 
              className="h-24 object-contain mb-4" 
              onError={(e) => (e.currentTarget.style.display = 'none')} 
            />
            <h1 className="text-2xl font-black uppercase tracking-tighter text-[#1a1a1a]">YAPAY ZEKA ETKİLEŞİM VE SORU ANALİZİ</h1>
            <p className="text-lg font-bold text-[#ce1212] mt-1 uppercase tracking-widest">
              {getDeptName(selectedDepartment).toUpperCase()} BÖLÜMÜ
            </p>
            <div className="flex gap-8 mt-3 text-[10px] font-black uppercase text-gray-400">
              <span>Rapor Tarihi: {new Date().toLocaleDateString('tr-TR')}</span>
              <span className="text-[#1a1a1a]">Sorgu No: #AI-{student.total_count}-{pageIdx + 1}</span>
            </div>
          </div>

          {/* ÖĞRENCİ KİMLİK KARTI */}
          <div className="bg-[#1a1a1a] text-white p-6 rounded-t-3xl flex justify-between items-center shadow-lg">
            <div className="text-left">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-1">Öğrenci Adı Soyadı</p>
              <h2 className="text-xl font-black uppercase">{student.student_name}</h2>
            </div>
            <div className="text-right bg-white/10 px-6 py-2 rounded-2xl border border-white/20">
              <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Toplam Soru</p>
              <p className="text-2xl font-black leading-none text-red-500">{student.total_count}</p>
            </div>
          </div>

          {/* SORULAR ALANI */}
          <div className="border-2 border-[#1a1a1a] border-t-0 p-8 bg-white flex-1 rounded-b-3xl shadow-sm">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b pb-2 flex items-center gap-2">
               <Bot size={14} className="text-[#ce1212]" /> Aktif Chatbot Soru Geçmişi
            </h3>
            
            <div className="space-y-6">
              {student.questions.map((q, qIdx) => (
                <div key={qIdx} className="bg-gray-50 p-5 rounded-2xl border-l-[10px] border-[#ce1212] shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-center font-black text-[9px] text-gray-400 uppercase italic mb-3">
                    <span className="flex items-center gap-1.5"><Calendar size={12} className="text-gray-300" /> {q.date}</span>
                    <span className="bg-[#1a1a1a] text-white px-4 py-1 rounded-full not-italic tracking-widest">HAFTA {q.week}</span>
                  </div>
                  
                  <p className="text-[#1a1a1a] font-bold text-sm leading-relaxed relative z-10 pr-6">
                    &quot; {q.text} &quot;
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SAYFA ALTI BİLGİSİ */}
          <div className="mt-auto pt-8 flex justify-between items-center border-t border-gray-100">
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic">Sadece chatbot etkileşimi olan öğrenciler raporlanmıştır.</p>
            <p className="text-[10px] font-black text-[#1a1a1a]">Sayfa {pageIdx + 1} / {filteredArray.length}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
