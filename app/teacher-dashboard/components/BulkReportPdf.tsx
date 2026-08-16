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
  return (
    <div id="bulk-report-pdf" className="hidden print:block bg-white p-0 text-left">
      {Array.from({ length: Math.ceil(filteredBulkData.length / 6) }, (_, i) =>
        filteredBulkData.slice(i * 6, i * 6 + 6)
      ).map((studentGroup, pageIdx) => (
        <div 
          key={pageIdx} 
          className="p-4 text-left" 
          style={{ 
            pageBreakAfter: 'always', 
            width: '297mm', // Yatay A4 standardı
            margin: '0 auto' 
          }}
        >
          {/* LOGO VE BAŞLIK */}
          <div className="flex flex-col items-center mb-6 border-b-4 border-black pb-4 text-center">
            <img 
              src="/okul-logo.png" 
              alt="Okul Logosu" 
              className="h-16 object-contain mb-3" 
              onError={(e) => (e.currentTarget.style.display = 'none')} 
            />
            <h1 className="text-xl font-black uppercase tracking-tighter text-black">
              SİSTEM GENELİ AKADEMİK GELİŞİM VE PERFORMANS ÇİZELGESİ
            </h1>
            <p className="text-xs font-bold text-gray-700 mt-1 uppercase tracking-widest">
              Bölüm: {getDeptName(selectedDepartment).toUpperCase()} (Sayfa {pageIdx + 1})
            </p>
          </div>

          {/* GRUP TABLOSU */}
          <table className="w-full border-collapse border-2 border-black table-fixed">
            <thead>
              <tr className="bg-black text-white text-center">
                <th className="border-2 border-black p-1 text-[8px] font-black uppercase leading-none text-left w-[8%]">Öğrenci</th>
                <th className="border-2 border-black p-1 text-[8px] font-black uppercase leading-none text-center bg-gray-200 text-black w-[4%]">ÖN TEST</th>
                
                {Array.from({ length: 14 }, (_, i) => i + 1).map(n => (
                  <th key={n} className="border-2 border-black p-0.5 text-[6px] font-black uppercase leading-none text-center w-[5.75%]">
                    H.{n}
                  </th>
                ))}
                
                <th className="border-2 border-black p-1 text-[9px] font-black uppercase leading-none text-center bg-gray-800 w-[7.5%]">GENEL TOPLAM</th>
              </tr>
            </thead>
            <tbody className="text-left font-bold">
              {studentGroup.map((student, idx) => (
                <tr key={idx} className="text-center hover:bg-gray-50 leading-none border-b border-black">
                  <td className="border-2 border-black p-1.5 text-[7px] font-black text-left uppercase leading-tight break-all">
                    {student.full_name}
                  </td>
                  
                  <td className="border-2 border-black p-1 text-[8px] font-black text-center italic bg-gray-50/50">
                    {student.pre_test_score || "-"}
                  </td>
                  
                  {student.weekly_breakdown.map((week, wIdx) => (
                    <td key={wIdx} className="border-2 border-black p-0.5 text-[5px] font-bold leading-none align-top overflow-hidden">
                      <div className="flex flex-col gap-1">
                        {/* TUR 1 VERİLERİ */}
                        <div className="flex flex-col border-b border-gray-300 pb-0.5 w-full items-center bg-blue-50/10">
                          <div className="flex justify-between w-full px-0.5 mb-0.5 scale-[0.85]">
                            <span className="text-gray-400 font-black">T1</span>
                            <span className="text-blue-700 font-black">%{Math.round(week.progress)}</span>
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[4px] text-gray-700">{week.correct}D / {week.wrong}Y</span>
                            <span className="text-[4px] text-blue-600 font-black">{formatDuration(week.duration_seconds)}</span>
                          </div>
                        </div>

                        {/* MATERYALLER */}
                        <div className="flex flex-col gap-0.5 px-0.5">
                          <p className="text-[3.5px] font-black text-gray-400 uppercase border-b border-gray-50 mb-0.5 text-left">Materyaller:</p>
                          {week.material_details && week.material_details.length > 0 ? (
                            week.material_details.map((mat, mi) => (
                              <div key={mi} className="flex justify-between items-start gap-0.5 text-[4px] text-gray-600 leading-[1.1] mb-0.5">
                                <span className="text-left break-words w-full">• {mat.title}</span>
                                <span className="font-black shrink-0 text-secondary">{formatDuration(mat.duration_seconds)}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-[4px] text-gray-300 italic text-center">Yok</span>
                          )}
                        </div>

                        {/* TUR 2 VERİLERİ */}
                        {week.is_round_2_started ? (
                          <div className="flex flex-col w-full items-center pt-0.5 border-t border-amber-200 bg-amber-50/30 mt-auto">
                            <span className="text-amber-700 font-black scale-[0.6]">T2 AKTİF</span>
                            <span className="text-green-700 font-black scale-[0.8]">{week.correct_2}D/{week.wrong_2}Y</span>
                            <span className="text-[4px] text-amber-700 font-bold">{formatDuration(week.duration_seconds_2)}</span>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  ))}

                  {/* BİRLEŞTİRİLMİŞ PUAN VE SÜRE */}
                  <td className="border-2 border-black p-1 bg-gray-100">
                    <div className="flex flex-col items-center justify-center gap-0.5">
                       <span className="text-[9px] font-black text-blue-800 leading-none">{student.total_points} P.</span>
                       <div className="w-full border-t border-black/20 my-1"></div>
                       <span className="text-[7px] font-black italic text-gray-700 leading-none">{formatDuration(student.total_time)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};
