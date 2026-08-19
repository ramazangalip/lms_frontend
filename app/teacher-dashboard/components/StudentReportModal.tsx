"use client";
import React from 'react';
import {
  Users,
  X,
  GraduationCap,
  Check,
  ListChecks,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Bot,
  Clock
} from 'lucide-react';
import { StudentAnalytics, getDeptName, formatDuration } from '../types';

interface StudentReportModalProps {
  selectedStudent: StudentAnalytics | null;
  setSelectedStudent: (student: StudentAnalytics | null) => void;
}

export const StudentReportModal: React.FC<StudentReportModalProps> = ({
  selectedStudent,
  setSelectedStudent
}) => {
  if (!selectedStudent) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-2 md:p-4 animate-in fade-in duration-300 overflow-y-auto text-left leading-none">
      <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border-4 border-white my-auto text-left">

        {/* HEADER */}
        <div className="p-6 md:p-10 border-b bg-gray-50 flex justify-between items-center shrink-0 text-left leading-none">
          <div className="flex items-center gap-4 text-left leading-none">
            <div className="bg-secondary p-3 rounded-2xl text-white shadow-xl shrink-0 flex items-center justify-center">
              <Users size={28} />
            </div>
            <div className="text-left leading-none">
              <h3 className="font-black text-xl md:text-2xl uppercase tracking-tighter text-secondary leading-none mb-2">Akademik Performans Karnesi</h3>
              <p className="text-[10px] text-[#ce1212] font-black uppercase italic leading-none">
                {selectedStudent.first_name} {selectedStudent.last_name} | {getDeptName(selectedStudent.department)}
              </p>
            </div>
          </div>
          <button onClick={() => setSelectedStudent(null)} className="bg-white p-3 rounded-full hover:bg-red-50 border transition-all text-gray-400 shadow-sm active:scale-90 flex items-center justify-center">
            <X size={24} />
          </button>
        </div>

        {/* ÖN TEST (BAŞLANGIÇ SEVİYESİ) KARTI */}
        {selectedStudent?.pre_test_data && (
          <div className="mx-6 md:mx-10 mt-6 p-5 bg-gradient-to-r from-purple-50 to-white border-l-8 border-purple-500 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 p-3 rounded-xl text-white shadow-lg shrink-0">
                <GraduationCap size={24} />
              </div>
              <div className="text-left leading-tight">
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] mb-1">
                  SİSTEM GİRİŞ SEVİYESİ (ÖN TEST)
                </p>
                <p className="text-xl font-black text-secondary uppercase leading-none">
                  BAŞARI SKORU: %{selectedStudent.pre_test_data.score}
                </p>
                <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">
                  Tamamlanma Tarihi: {selectedStudent.pre_test_data.date}
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="px-4 py-2 bg-white rounded-xl border border-purple-100 shadow-sm text-center min-w-[70px]">
                <p className="text-[8px] font-bold text-gray-400 uppercase leading-none mb-1">Doğru</p>
                <p className="text-sm font-black text-green-600 leading-none">{selectedStudent.pre_test_data.correct}</p>
              </div>
              <div className="px-4 py-2 bg-white rounded-xl border border-purple-100 shadow-sm text-center min-w-[70px]">
                <p className="text-[8px] font-bold text-gray-400 uppercase leading-none mb-1">Yanlış</p>
                <p className="text-sm font-black text-red-600 leading-none">{selectedStudent.pre_test_data.wrong}</p>
              </div>
            </div>
          </div>
        )}

        {/* HAFTALIK DETAYLAR LİSTESİ */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 bg-white custom-scrollbar text-left leading-normal">
          {selectedStudent.weekly_breakdown?.map((week) => (
            <div key={week.week_number} className="p-6 md:p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6 relative overflow-hidden text-left leading-normal">

              {/* HAFTA BAŞLIĞI */}
              <div className="flex items-center gap-4 text-left leading-none">
                <div className="w-14 h-14 bg-white rounded-2xl flex flex-col items-center justify-center border font-black text-secondary shrink-0 shadow-sm leading-none">
                  <span className="text-[9px] text-[#ce1212] uppercase leading-none mb-1">HAFTA</span>
                  <span className="text-xl leading-none">{week.week_number}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-base font-black text-secondary leading-none">%{week.progress} Tamamlandı</span>
                  {week.progress === 100 && <span className="text-[10px] text-green-600 font-bold flex items-center gap-1"><Check size={12} /> BAŞARIYLA BİTİRİLDİ</span>}
                </div>
              </div>

              {/* MATERYAL BAZLI TUR 1 / TUR 2 SÜRE DAĞILIMI */}
              {week.material_details && week.material_details.length > 0 && (
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2 text-secondary leading-none mb-1">
                    <Clock size={16} className="text-blue-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">
                      Materyal Bazlı Süre Detayları (T1 / T2)
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                    {week.material_details.map((mat, mi) => (
                      <div key={mi} className="p-3 bg-white rounded-xl border border-gray-200 flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-800 truncate mr-2">• {mat.title}</span>
                        <span className="font-black text-[10px] text-blue-800 bg-blue-50 px-2 py-1 rounded-lg shrink-0 border border-blue-100">
                          T1: {formatDuration(mat.duration_seconds_t1 || 0)} | T2: {mat.duration_seconds_t2 ? formatDuration(mat.duration_seconds_t2) : '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 1. SINAV DETAY ANALİZİ */}
              {week.quiz_results && week.quiz_results.length > 0 && (
                <div className="space-y-4 text-left leading-normal border-t border-gray-200 pt-6">
                  <div className="flex items-center gap-2 text-secondary leading-none mb-2">
                    <ListChecks size={16} className="text-[#ce1212]" />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">Haftalık Sınav Sonuç Analizi</p>
                  </div>
                  <div className="grid gap-3 text-left">
                    {week.quiz_results.map((r, ri) => (
                      <div key={ri} className={`p-4 rounded-2xl border-2 transition-all text-left ${r.is_correct ? 'bg-green-50/30 border-green-100' : 'bg-red-50/30 border-red-100'}`}>
                        <div className="flex justify-between items-start gap-3 text-left leading-tight">
                          <span className="text-[11px] font-bold text-secondary flex gap-2">
                            <span className="opacity-40">{ri + 1}.</span> {r.question_text}
                          </span>
                          {r.is_correct ? <CheckCircle size={14} className="text-green-500 shrink-0" /> : <AlertCircle size={14} className="text-red-500 shrink-0" />}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-6 border-t border-black/5 pt-3 text-left">
                          <div className="flex flex-col items-start leading-tight">
                            <span className="text-[8px] font-black text-gray-400 uppercase mb-1">Seçilen Şık</span>
                            <span className={`text-[10px] font-black ${r.is_correct ? 'text-green-600' : 'text-red-600'}`}>{r.selected_option}</span>
                          </div>
                          {!r.is_correct && (
                            <div className="flex flex-col items-start leading-tight">
                              <span className="text-[8px] font-black text-gray-400 uppercase mb-1">Doğru Şık</span>
                              <span className="text-[10px] font-black text-green-600">{r.correct_option}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. YAPAY ZEKA SORULARI */}
              {week.questions && week.questions.length > 0 && (
                <div className="bg-blue-50/30 p-6 rounded-3xl border-2 border-blue-100/50 space-y-4 text-left leading-normal border-t border-blue-100 mt-4">
                  <div className="flex items-center gap-2 text-blue-600 leading-none">
                    <MessageSquare size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">Yapay Zekaya Sorduğu Sorular</p>
                  </div>
                  <div className="space-y-3 text-left">
                    {week.questions.map((q, qi) => (
                      <div key={qi} className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm relative group text-left">
                        <p className="text-[11px] font-medium italic text-gray-600 leading-relaxed text-left">
                          &quot;{q}&quot;
                        </p>
                        <Bot size={14} className="absolute top-4 right-4 text-blue-200 opacity-20" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AKTİVİTE YOKSA DURUMU */}
              {(!week.quiz_results || week.quiz_results.length === 0) && (!week.questions || week.questions.length === 0) && (
                <div className="text-left py-4 opacity-30 italic text-[10px] font-bold uppercase tracking-widest leading-none">
                  Bu hafta henüz bir sınav veya AI etkileşimi bulunmuyor.
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="p-8 bg-gray-50 border-t flex justify-center shrink-0 leading-none">
          <button
            onClick={() => setSelectedStudent(null)}
            className="w-full md:w-auto bg-secondary text-white px-16 py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 shadow-xl transition-all flex items-center justify-center leading-none"
          >
            PANELİ KAPAT VE LİSTEYE DÖN
          </button>
        </div>
      </div>
    </div>
  );
};
