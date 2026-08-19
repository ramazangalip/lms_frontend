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
                        <div className="flex flex-col gap-1 h-full justify-between">
                          {/* TUR 1 BAŞARI & D/Y & HAFTALIK SÜRE ROZETİ */}
                          <div className="flex flex-col border-b border-gray-300 pb-1 w-full items-center bg-blue-50/20 rounded-sm p-0.5">
                            <div className="flex justify-between w-full px-0.5 mb-0.5">
                              <span className="text-gray-500 font-black text-[8px]">T1</span>
                              <span className="text-blue-700 font-black text-[10px]">%{Math.round(week.progress)}</span>
                            </div>
                            <div className="flex flex-col items-center gap-0.5 w-full">
                              <span className="text-[8.5px] text-gray-800 font-bold">{week.correct}D / {week.wrong}Y</span>
                              <span className="text-[8.5px] text-blue-700 font-black bg-blue-100/80 px-1 py-0.5 rounded w-full text-center">
                                T1: {formatDuration(week.duration_seconds)}
                              </span>
                            </div>
                          </div>

                          {/* KALİBRASYON GÖSTERGESİ (VARSA) */}
                          {week.predicted_score_1 !== undefined && week.predicted_score_1 !== null ? (
                            <div className="text-[7.5px] font-bold text-amber-900 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 text-center my-0.5">
                              Tahmin: %{week.predicted_score_1} | Gerçek: %{week.score_1} | Sapma: ±{week.calibration_gap_1}
                            </div>
                          ) : null}

                          {/* MATERYALLER LİSTESİ */}
                          <div className="flex flex-col gap-0.5 px-0.5 my-1">
                            <p className="text-[8px] font-black text-gray-500 uppercase border-b border-gray-100 mb-0.5 text-left">
                              Materyaller:
                            </p>
                            {week.material_details && week.material_details.length > 0 ? (
                              week.material_details.map((mat, mi) => (
                                <div
                                  key={mi}
                                  className="flex flex-col text-[8px] text-gray-700 leading-tight mb-1 border-b border-gray-50 pb-0.5"
                                >
                                  <span className="text-left font-semibold break-words">• {mat.title}</span>
                                  <span className="font-bold text-[7.5px] text-red-700">
                                    [T1: {formatDuration(mat.duration_seconds_t1 || 0)} | T2: {mat.duration_seconds_t2 ? formatDuration(mat.duration_seconds_t2) : '-'}]
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-[7.5px] text-gray-400 italic text-center">Yok</span>
                            )}
                          </div>

                          {/* TUR 2 VERİLERİ (VARS A) */}
                          {week.is_round_2_started ? (
                            <div className="flex flex-col w-full items-center pt-1 border-t border-amber-300 bg-amber-50/50 rounded-sm p-0.5 mt-auto">
                              <span className="text-amber-800 font-black text-[8px]">T2 PEKİŞTİRME</span>
                              <span className="text-green-700 font-bold text-[8.5px]">{week.correct_2}D / {week.wrong_2}Y</span>
                              <span className="text-[8.5px] text-amber-800 font-black bg-amber-100 px-1 py-0.5 rounded w-full text-center">
                                T2: {formatDuration(week.duration_seconds_2)}
                              </span>
                            </div>
                          ) : null}
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
