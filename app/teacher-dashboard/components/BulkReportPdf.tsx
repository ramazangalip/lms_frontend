"use client";
import React from 'react';
import { BulkStudentData, getDeptName, formatDuration } from '../types';

interface BulkReportPdfProps {
  filteredBulkData: BulkStudentData[];
  selectedDepartment: string;
}

export const BulkReportPdf: React.FC<BulkReportPdfProps> = ({
  filteredBulkData,
  selectedDepartment
}) => {
  // Sayfa başına maksimum 3 öğrenci (Ferah, okunabilir ve geniş A4 Yatay düzen)
  const STUDENTS_PER_PAGE = 3;
  const totalPages = Math.ceil(filteredBulkData.length / STUDENTS_PER_PAGE);

  return (
    <>
      {/* PDF Baskı Stilleri (Yatay A4 ve Sayfa Sonu Kuralları) */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm 6mm 6mm 6mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .pdf-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div id="bulk-report-pdf" className="hidden print:block bg-white p-0 text-left">
        {Array.from({ length: totalPages }, (_, i) =>
          filteredBulkData.slice(i * STUDENTS_PER_PAGE, i * STUDENTS_PER_PAGE + STUDENTS_PER_PAGE)
        ).map((studentGroup, pageIdx) => (
          <div
            key={pageIdx}
            className="p-2 text-left pdf-page-break"
            style={{
              pageBreakAfter: 'always',
              width: '285mm',
              margin: '0 auto'
            }}
          >
            {/* LOGO VE BAŞLIK */}
            <div className="flex flex-col items-center mb-3 border-b-2 border-black pb-2 text-center">
              <img
                src="/okul-logo.png"
                alt="Okul Logosu"
                className="h-12 object-contain mb-1"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <h1 className="text-base md:text-lg font-black uppercase tracking-tighter text-black">
                SİSTEM GENELİ AKADEMİK GELİŞİM VE PERFORMANS ÇİZELGESİ
              </h1>
              <p className="text-[10px] font-bold text-gray-700 mt-0.5 uppercase tracking-widest">
                Bölüm: {getDeptName(selectedDepartment).toUpperCase()} (Sayfa {pageIdx + 1} / {totalPages})
              </p>
            </div>

            {/* GRUP TABLOSU (17 KOLON EKSİKSİZ VE FERAH) */}
            <table className="w-full border-collapse border-2 border-black table-fixed">
              <thead>
                <tr className="bg-black text-white text-center">
                  <th className="border-2 border-black p-1.5 text-[11px] font-black uppercase leading-tight text-left w-[8.5%]">
                    Öğrenci
                  </th>
                  <th className="border-2 border-black p-1.5 text-[11px] font-black uppercase leading-tight text-center bg-gray-200 text-black w-[5.5%]">
                    ÖN TEST
                  </th>

                  {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
                    <th
                      key={n}
                      className="border-2 border-black p-1 text-[10px] font-black uppercase leading-tight text-center w-[5.6%]"
                    >
                      H.{n}
                    </th>
                  ))}

                  <th className="border-2 border-black p-1.5 text-[11px] font-black uppercase leading-tight text-center bg-gray-800 text-white w-[7.6%]">
                    GENEL TOPLAM
                  </th>
                </tr>
              </thead>
              <tbody className="text-left font-bold">
                {studentGroup.map((student, idx) => (
                  <tr key={idx} className="text-center hover:bg-gray-50 leading-tight border-b border-black">
                    {/* ÖĞRENCİ BİLGİSİ */}
                    <td className="border-2 border-black p-2 text-[10px] font-black text-left uppercase leading-tight break-words">
                      {student.full_name}
                      <span className="block text-[8px] font-normal text-gray-500 lowercase mt-0.5 truncate">
                        {student.email}
                      </span>
                    </td>

                    {/* ÖN TEST */}
                    <td className="border-2 border-black p-1.5 text-[10px] font-black text-center italic bg-gray-50/50">
                      {student.pre_test_score || "-"}
                    </td>

                    {/* HAFTALIK VERİLER (H.1 - H.14) */}
                    {student.weekly_breakdown.map((week, wIdx) => (
                      <td
                        key={wIdx}
                        className="border-2 border-black p-1 text-[9px] font-bold leading-tight align-top overflow-hidden"
                      >
                        <div className="flex flex-col h-full justify-between gap-1 text-left">
                          {/* 1. TUR KARTI (T1) */}
                          <div className="rounded-lg border border-[#bfdbfe] bg-[#f8faff] p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-left">
                            {/* Üst Satır: T1 & % İlerleme */}
                            <div className="flex justify-between items-center w-full">
                              <span className="text-[#1e3a8a] font-black text-[9px] leading-none">T1</span>
                              <span className="text-[#2563eb] font-black text-[9px] leading-none">%{Math.round(week.progress)}</span>
                            </div>

                            {/* İkinci Satır: Doğru/Yanlış ve T1 Süresi */}
                            <div className="flex justify-between items-center w-full mt-1">
                              <span className="text-gray-400 font-bold text-[7.5px] leading-none">
                                {week.correct || 0}D / {week.wrong || 0}Y
                              </span>
                              <span className="text-gray-700 font-bold text-[7.5px] leading-none">
                                T1: {formatDuration(week.duration_seconds || 0)}
                              </span>
                            </div>

                            {/* Kalibrasyon Satırı (Tahmin & Gerçek & Fark) */}
                            {(() => {
                              const hasPred = week.predicted_score_1 !== undefined && week.predicted_score_1 !== null;
                              const pred = hasPred ? Math.round(week.predicted_score_1!) : null;
                              const real = week.score_1 !== undefined && week.score_1 !== null
                                ? Math.round(week.score_1)
                                : ((week.correct + week.wrong > 0) ? Math.round((week.correct / (week.correct + week.wrong)) * 100) : null);

                              if (pred !== null || real !== null) {
                                const diff = (real ?? 0) - (pred ?? 0);
                                const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
                                return (
                                  <>
                                    <div className="border-t border-gray-200/80 my-1 w-full" />
                                    <div className="flex items-center text-[7px] leading-tight font-bold text-gray-800 whitespace-nowrap">
                                      <span>T:% {pred ?? '-'} G:% {real ?? '-'}</span>
                                      {pred !== null && real !== null && (
                                        <span className={`ml-1 font-black ${diff >= 0 ? 'text-[#15803d]' : 'text-[#c2410c]'}`}>
                                          (F: {diffStr})
                                        </span>
                                      )}
                                    </div>
                                  </>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          {/* 2. MATERYALLER BAŞLIĞI VE LİSTESİ */}
                          <div className="flex flex-col text-left my-1">
                            <span className="text-[7.5px] font-black text-[#64748b] uppercase tracking-wider text-left mb-1">
                              MATERYALLER
                            </span>
                            {week.material_details && week.material_details.length > 0 ? (
                              <div className="flex flex-col gap-1 text-left">
                                {week.material_details.map((mat, mi) => (
                                  <div key={mi} className="flex flex-col text-left leading-tight">
                                    <span className="font-bold text-[7.5px] text-gray-900 leading-tight break-words">
                                      • {mat.title}
                                    </span>
                                    <span className="font-mono font-bold text-[7px] text-[#dc2626] leading-tight pl-2">
                                      [ T1: {formatDuration(mat.duration_seconds_t1 || 0)} | T2: {formatDuration(mat.duration_seconds_t2 || 0)} ]
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[7px] text-gray-400 italic text-left pl-1">Materyal kaydı yok</span>
                            )}
                          </div>

                          {/* 3. TUR KARTI (T2) */}
                          {(() => {
                            const hasT2 = week.is_round_2_started || 
                              (week.duration_seconds_2 && week.duration_seconds_2 > 0) || 
                              (week.correct_2 > 0 || week.wrong_2 > 0) || 
                              (week.predicted_score_2 !== null && week.predicted_score_2 !== undefined);
                            
                            if (!hasT2) return null;

                            const t2Progress = (week.correct_2 > 0 || week.wrong_2 > 0 || (week.score_2 !== undefined && week.score_2 !== null))
                              ? 100 
                              : (week.is_round_2_started ? 50 : 0);

                            const hasPred2 = week.predicted_score_2 !== undefined && week.predicted_score_2 !== null;
                            const pred2 = hasPred2 ? Math.round(week.predicted_score_2!) : null;
                            const real2 = week.score_2 !== undefined && week.score_2 !== null
                              ? Math.round(week.score_2)
                              : ((week.correct_2 + week.wrong_2 > 0) ? Math.round((week.correct_2 / (week.correct_2 + week.wrong_2)) * 100) : null);

                            return (
                              <div className="rounded-lg border border-[#fde047] bg-[#fffbeb] p-1.5 mt-auto text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                {/* Üst Satır: T2 & % İlerleme */}
                                <div className="flex justify-between items-center w-full">
                                  <span className="text-[#92400e] font-black text-[9px] leading-none">T2</span>
                                  <span className="text-[#92400e] font-black text-[9px] leading-none">%{t2Progress}</span>
                                </div>

                                {/* İkinci Satır: Doğru/Yanlış ve T2 Süresi */}
                                <div className="flex justify-between items-center w-full mt-1">
                                  <span className="text-gray-400 font-bold text-[7.5px] leading-none">
                                    {week.correct_2 || 0}D / {week.wrong_2 || 0}Y
                                  </span>
                                  <span className="text-gray-700 font-bold text-[7.5px] leading-none">
                                    T2: {formatDuration(week.duration_seconds_2 || 0)}
                                  </span>
                                </div>

                                {/* Kalibrasyon Satırı (Tahmin & Gerçek & Fark) */}
                                {(pred2 !== null || real2 !== null) && (
                                  <>
                                    <div className="border-t border-amber-200/80 my-1 w-full" />
                                    {(() => {
                                      const diff2 = (real2 ?? 0) - (pred2 ?? 0);
                                      const diffStr2 = diff2 > 0 ? `+${diff2}` : `${diff2}`;
                                      return (
                                        <div className="flex items-center text-[7px] leading-tight font-bold text-gray-800 whitespace-nowrap">
                                          <span>T:% {pred2 ?? '-'} G:% {real2 ?? '-'}</span>
                                          {pred2 !== null && real2 !== null && (
                                            <span className={`ml-1 font-black ${diff2 >= 0 ? 'text-[#15803d]' : 'text-[#c2410c]'}`}>
                                              (F: {diffStr2})
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                    ))}

                    {/* GENEL TOPLAM KOLONU */}
                    <td className="border-2 border-black p-1.5 bg-gray-100 align-middle">
                      <div className="flex flex-col items-center justify-center gap-1 leading-tight">
                        <span className="text-[11px] font-black text-blue-900 leading-none">
                          {student.total_points} PUAN
                        </span>
                        <div className="w-full border-t border-black/20 my-1"></div>
                        <span className="text-[8.5px] font-bold text-gray-700 leading-tight">
                          T1: {formatDuration(student.total_time_t1 || 0)}
                        </span>
                        <span className="text-[8.5px] font-bold text-amber-800 leading-tight">
                          T2: {formatDuration(student.total_time_t2 || 0)}
                        </span>
                        <span className="text-[9.5px] font-black text-black leading-tight bg-white px-1 py-0.5 rounded border border-gray-300 w-full text-center mt-0.5">
                          TOP: {formatDuration(student.total_time)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </>
  );
};
