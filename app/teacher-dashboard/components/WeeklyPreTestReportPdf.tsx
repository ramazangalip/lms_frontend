"use client";
import React from 'react';
import { 
  ClipboardList, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Unlock, 
  Lock, 
  Clock 
} from 'lucide-react';
import { 
  WeeklyPreTestStudentData, 
  getDeptName, 
  formatDuration 
} from '../types';

interface WeeklyPreTestReportPdfProps {
  weeklyPreTestData: WeeklyPreTestStudentData[];
  selectedDepartment: string;
}

export const WeeklyPreTestReportPdf: React.FC<WeeklyPreTestReportPdfProps> = ({
  weeklyPreTestData,
  selectedDepartment
}) => {
  // Sadece D1 öğrencileri ve veri içerenler
  const filteredStudents = weeklyPreTestData.filter(s => 
    !s.category || s.category.toLowerCase() === 'd1'
  );

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 8mm 8mm 8mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .pdf-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          .pdf-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div id="weekly-pretest-report-pdf" className="hidden print:block bg-white p-0 text-left">
        {filteredStudents.length === 0 ? (
          <div className="p-10 text-center text-gray-500 font-bold">
            Bu bölüme ait D1 grubu ön test veya telafi kaydı bulunmamaktadır.
          </div>
        ) : (
          filteredStudents.map((student, pageIdx) => (
            <div 
              key={student.student_id} 
              className="p-4 md:p-6 text-left min-h-screen flex flex-col pdf-page-break"
              style={{ pageBreakAfter: 'always' }}
            >
              {/* LOGO VE BAŞLIK ALANI */}
              <div className="flex flex-col items-center mb-6 border-b-4 border-[#1a1a1a] pb-4 text-center">
                <img 
                  src="/okul-logo.png" 
                  alt="Okul Logosu" 
                  className="h-16 object-contain mb-2" 
                  onError={(e) => (e.currentTarget.style.display = 'none')} 
                />
                <h1 className="text-xl font-black uppercase tracking-tight text-[#1a1a1a]">
                  HAFTALIK ÖN DEĞERLENDİRME VE TELAFİ ANALİZ RAPORU
                </h1>
                <p className="text-sm font-bold text-[#ce1212] mt-0.5 uppercase tracking-wider">
                  {getDeptName(selectedDepartment).toUpperCase()} BÖLÜMÜ • D1 KILAVUZLU YZ ÖĞRENME GRUBU
                </p>
                <div className="flex gap-6 mt-2 text-[9px] font-black uppercase text-gray-500">
                  <span>Rapor Tarihi: {new Date().toLocaleDateString('tr-TR')}</span>
                  <span className="text-[#1a1a1a]">Öğrenci No: #{student.student_id}</span>
                  <span className="text-red-600 font-bold">Sayfa {pageIdx + 1} / {filteredStudents.length}</span>
                </div>
              </div>

              {/* ÖĞRENCİ KİMLİK VE ÖZET KARTI */}
              <div className="bg-[#1a1a1a] text-white p-4 rounded-2xl flex justify-between items-center shadow-md mb-5">
                <div className="text-left">
                  <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-0.5">Öğrenci Bilgisi</p>
                  <h2 className="text-base font-black uppercase leading-tight">{student.full_name}</h2>
                  <p className="text-[10px] text-gray-400 font-semibold">{student.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                    <p className="text-[8px] font-black text-gray-300 uppercase leading-none mb-1">GİRİLEN ÖN TEST</p>
                    <p className="text-sm font-black leading-none text-white">{student.total_pretests_taken}</p>
                  </div>
                  <div className="text-center bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                    <p className="text-[8px] font-black text-red-300 uppercase leading-none mb-1">TOPLAM YANLIŞ</p>
                    <p className="text-sm font-black leading-none text-red-400">{student.total_wrong_questions}</p>
                  </div>
                  <div className="text-center bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                    <p className="text-[8px] font-black text-amber-300 uppercase leading-none mb-1">AKTİF TELAFİ KİLİDİ</p>
                    <p className="text-sm font-black leading-none text-amber-400">{student.active_locks_count}</p>
                  </div>
                  <div className="text-center bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                    <p className="text-[8px] font-black text-blue-300 uppercase leading-none mb-1">TELAFİ ÇALIŞMA SÜRESİ</p>
                    <p className="text-sm font-black leading-none text-blue-300">{formatDuration(student.total_remediation_duration_seconds)}</p>
                  </div>
                </div>
              </div>

              {/* BİLGİ NOTU */}
              <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl mb-5 text-[9px] text-blue-900 leading-tight">
                <strong>Not:</strong> Bu rapordaki telafi süreleri ve materyal tamamlamaları, öğrencinin yanlış cevapları sonucu geçici açılan haftalarda gerçekleştirdiği bağımsız çalışmalardır. Normal T1/T2 sürelerini etkilemez.
              </div>

              {/* BÖLÜM 1: HAFTALIK ÖN TEST SONUÇLARI VE YANLIŞ YAPILAN SORULAR */}
              <div className="mb-6 space-y-3">
                <h3 className="text-xs font-black uppercase text-secondary tracking-wider border-b-2 border-gray-300 pb-1 flex items-center gap-1.5">
                  <ClipboardList size={14} className="text-[#ce1212]" /> 1. Haftalık Giriş Testleri ve Yanlış Yapılan Sorular
                </h3>

                {student.pretests.length === 0 ? (
                  <p className="text-[10px] text-gray-500 italic p-3 bg-gray-50 rounded-xl border">
                    Öğrencinin ön test kaydı bulunmamaktadır.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {student.pretests.map((pt, pIdx) => (
                      <div 
                        key={pIdx} 
                        className="bg-gray-50/70 border border-gray-200 rounded-xl p-3.5 space-y-2.5 pdf-avoid-break"
                      >
                        <div className="flex justify-between items-center text-[10px] font-black border-b border-gray-200 pb-1.5">
                          <span className="bg-[#1a1a1a] text-white px-2 py-0.5 rounded text-[9px] uppercase">
                            {pt.appearing_week}. Hafta Ön Değerlendirme Testi
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500 font-semibold">{pt.completed_at || '-'}</span>
                            <span className="text-green-700">{pt.correct_count} Doğru</span>
                            <span className="text-red-700">{pt.wrong_count} Yanlış</span>
                            <span className="bg-secondary text-white px-2 py-0.5 rounded text-[9px]">
                              %{pt.score_percentage} Başarı
                            </span>
                          </div>
                        </div>

                        {pt.wrong_answers.length === 0 ? (
                          <p className="text-[10px] text-green-700 font-bold flex items-center gap-1">
                            <CheckCircle2 size={12} /> Tüm sorular doğru yanıtlanmıştır. Telafi kilidi gereksinimi oluşmamıştır.
                          </p>
                        ) : (
                          <div className="space-y-2 pt-1">
                            <p className="text-[9px] font-black text-red-600 uppercase tracking-wider">
                              Yanlış Yapılan Sorular ({pt.wrong_answers.length} Adet):
                            </p>
                            <div className="space-y-1.5">
                              {pt.wrong_answers.map((wa, wIdx) => (
                                <div key={wIdx} className="bg-white p-2.5 rounded-lg border border-red-200 text-[10px] space-y-1">
                                  <div className="flex justify-between items-start gap-2">
                                    <p className="font-bold text-gray-900 leading-snug">
                                      <span className="text-red-600 font-black mr-1">{wIdx + 1}.</span> {wa.question_text}
                                    </p>
                                    {wa.target_week && (
                                      <span className="bg-amber-100 text-amber-900 font-black text-[8px] px-1.5 py-0.5 rounded uppercase shrink-0 border border-amber-200">
                                        Hedef: {wa.target_week}. Hafta
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-[9px] pt-0.5">
                                    <span className="text-red-600">
                                      <strong>Öğrencinin Yanıtı:</strong> {wa.selected_option_text}
                                    </span>
                                    <span className="text-green-700">
                                      <strong>Doğru Yanıt:</strong> {wa.correct_option_text}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BÖLÜM 2: TELAFİ KİLİDİ DURUMLARI VE HARCANAN SÜRELER */}
              <div className="mb-6 space-y-3">
                <h3 className="text-xs font-black uppercase text-secondary tracking-wider border-b-2 border-gray-300 pb-1 flex items-center gap-1.5">
                  <Unlock size={14} className="text-amber-600" /> 2. Telafi Kilit Durumları ve Telafi Sürecinde Harcanan Süreler
                </h3>

                {student.remediation_records.length === 0 ? (
                  <p className="text-[10px] text-gray-500 italic p-3 bg-gray-50 rounded-xl border">
                    Öğrenciye ait telafi kilidi veya çalışma süresi kaydı bulunmamaktadır.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {student.remediation_records.map((rec, rIdx) => (
                      <div 
                        key={rIdx} 
                        className="bg-gray-50/70 border border-gray-200 rounded-xl p-3 space-y-2 pdf-avoid-break text-[10px]"
                      >
                        <div className="flex justify-between items-start border-b border-gray-200 pb-1.5">
                          <div>
                            <span className="font-black text-xs text-secondary uppercase">
                              {rec.week_number}. Hafta Telafisi
                            </span>
                            <p className="text-[8px] text-gray-400 font-bold uppercase">{rec.week_title}</p>
                          </div>
                          {rec.is_active ? (
                            <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-300">
                              KİLİT AKTİF ({rec.remaining_hours} SAAT)
                            </span>
                          ) : (
                            <span className="bg-gray-200 text-gray-600 text-[8px] font-black px-1.5 py-0.5 rounded">
                              SÜRE BİTTİ
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded-lg border border-gray-100 text-[9px]">
                          <div>
                            <span className="text-gray-400 block font-bold uppercase">Telafi İlerlemesi</span>
                            <span className="font-black text-secondary">%{rec.completion_percentage}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-bold uppercase">Telafi Çalışma Süresi</span>
                            <span className="font-black text-[#ce1212]">{formatDuration(rec.remediation_duration_seconds)}</span>
                          </div>
                        </div>

                        {rec.materials.filter(m => m.content_type !== 'form').length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">
                              Materyal Çalışmaları:
                            </span>
                            <div className="divide-y divide-gray-100 bg-white rounded border border-gray-100 text-[8px]">
                              {rec.materials.filter(m => m.content_type !== 'form').map(m => (
                                <div key={m.material_id} className="p-1.5 flex justify-between items-center">
                                  <span className="truncate pr-2 font-bold text-gray-700">{m.title}</span>
                                  <span className="font-black shrink-0 text-gray-900">
                                    {formatDuration(m.duration_seconds)} {m.is_completed ? '✓' : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SAYFA ALTI / FOOTER */}
              <div className="mt-auto pt-4 border-t border-gray-200 flex justify-between items-center text-[8px] font-black text-gray-400 uppercase tracking-widest">
                <span>D1 Kılavuzlu YZ Öğrenme Grubu • Ön Değerlendirme & Telafi Raporu</span>
                <span>Sayfa {pageIdx + 1} / {filteredStudents.length}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};
