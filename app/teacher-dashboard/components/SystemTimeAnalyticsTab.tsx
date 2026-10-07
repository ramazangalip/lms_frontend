"use client";
import React from 'react';
import {
  Filter,
  FileText
} from 'lucide-react';
import { departmentList, getDeptName } from '../types';

interface SystemTimeAnalyticsTabProps {
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;
  systemTimeLoading: boolean;
  systemTimeData: any;
  selectedWeekTab: string;
  setSelectedWeekTab: (week: string) => void;
}

export const SystemTimeAnalyticsTab: React.FC<SystemTimeAnalyticsTabProps> = ({
  selectedDepartment,
  setSelectedDepartment,
  systemTimeLoading,
  systemTimeData,
  selectedWeekTab,
  setSelectedWeekTab
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      
      {/* ÜST SEÇİM KONTROLÜ VE BÖLÜM FİLTRESİ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-xl border border-gray-100 text-left">
        <div className="text-left leading-none">
          <h2 className="text-xl font-black text-purple-950 uppercase leading-none border-l-4 border-purple-600 pl-3">Sistem Zaman Yönetimi Verileri</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest italic leading-none">Öğrencilerin Aktif Kalma Süreleri ve Materyal Dağılım Analizleri</p>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 text-left shadow-inner w-full md:w-auto">
          <Filter size={16} className="text-purple-600" />
          <select 
            value={selectedDepartment} 
            onChange={(e) => setSelectedDepartment(e.target.value)} 
            className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer text-purple-950 w-full font-black"
          >
            {Array.isArray(departmentList) && departmentList.map(d => (
              <option key={d.id} value={d.id} className="text-black">{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* YÜKLENİYOR DURUM KONTROLÜ */}
      {systemTimeLoading ? (
        <div className="bg-white p-16 text-center text-gray-400 font-black uppercase text-xs tracking-widest rounded-3xl border border-dashed shadow-sm animate-pulse">
          Sistem Zaman Analizleri Veritabanından Jet Hızıyla Çekiliyor...
        </div>
      ) : (
        (() => {
          const currentWeekTab = selectedWeekTab || 'all';

          const rawMax = systemTimeData?.max_engagement || { student: "Veri Yok", time: "0 Saat" };
          const rawMin = systemTimeData?.min_engagement || { student: "Veri Yok", time: "0 Saat" };
          const activityList = Array.isArray(systemTimeData?.activity_distribution) ? systemTimeData?.activity_distribution : [];
          const generalStudentList = Array.isArray(systemTimeData?.raw_student_list) ? systemTimeData?.raw_student_list : [];
          const weeklyList = Array.isArray(systemTimeData?.weekly_analysis) ? systemTimeData?.weekly_analysis : [];
          
          const activityHoursArray = activityList.map((item: any) => Number(item?.hours) || 0);
          const maxActivityHours = activityHoursArray.length > 0 ? Math.max(...activityHoursArray) : 1;

          const convertHoursToText = (timeVal: string | number) => {
            if (!timeVal || timeVal === "0 Saat" || timeVal === 0) return "0 dk";
            const numericHours = typeof timeVal === 'number' ? timeVal : parseFloat(String(timeVal).replace(/[^0-9.]/g, ''));
            if (isNaN(numericHours) || numericHours === 0) return "0 dk";
            
            const totalMinutes = Math.round(numericHours * 60);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            
            if (hours === 0) return `${minutes} dk`;
            if (minutes === 0) return `${hours} sa`;
            return `${hours} sa ${minutes} dk`;
          };

          const maxEngagement = { student: rawMax.student, time: convertHoursToText(rawMax.time) };
          const minEngagement = { student: rawMin.student, time: convertHoursToText(rawMin.time) };

          let displayStudents = generalStudentList;
          let activeRepTitle = "Genel Katilim Sıralama Listesi";
          
          if (currentWeekTab !== 'all') {
            const matchedWeek = weeklyList.find((w: any) => String(w.week_number) === String(currentWeekTab));
            if (matchedWeek && Array.isArray(matchedWeek.student_list)) {
              displayStudents = matchedWeek.student_list;
              activeRepTitle = `${currentWeekTab}. Hafta Katılım Sıralama Listesi`;
            }
          }

          const exportZamanRaporPDF = async () => {
            const { jsPDF } = await import('jspdf');
            const autoTable = (await import('jspdf-autotable')).default;
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            
            const fixTR = (str: string) => !str ? "" : str.replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ç/g, "c").replace(/ö/g, "o").replace(/ü/g, "u").replace(/İ/g, "I").replace(/Ş/g, "S").replace(/Ğ/g, "G").replace(/Ç/g, "C").replace(/Ö/g, "O").replace(/Ü/g, "U");

            doc.setFont("Helvetica", "bold"); doc.setFillColor(67, 24, 108); doc.rect(0, 0, 210, 25, "F");
            doc.setTextColor(255, 255, 255); doc.setFontSize(13); 
            doc.text(fixTR(activeRepTitle.toUpperCase()), 15, 15);

            const pdfRows = displayStudents.map((item: any) => [
              `#${item?.rank || ''}`,
              fixTR(item?.student || ''),
              selectedDepartment ? fixTR(getDeptName(selectedDepartment).toUpperCase()) : "SIYASET BILIMI VE KAMU YONETIMI",
              fixTR(convertHoursToText(item?.time || 0))
            ]);

            autoTable(doc, {
              startY: 35,
              head: [[fixTR('Sıralama'), fixTR('Ogrenci Adi Soyadi'), fixTR('Bolum / Departman'), fixTR('Toplam Tekil Sure')]],
              body: pdfRows,
              styles: { font: 'Helvetica', fontSize: 9 }
            });
            doc.save(`${activeRepTitle.replace(/\s+/g, '_')}.pdf`);
          };

          return (
            <>
              {/* EN AKTİF / EN AZ AKTİF ÖĞRENCİ KARTLARI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-xl border-l-[10px] border-green-500 text-left flex flex-col justify-between min-h-[130px]">
                  <div><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Sistemde En Uzun Süre Kalan Öğrenci</span><h3 className="text-lg font-black text-purple-950 uppercase truncate">{maxEngagement.student}</h3></div>
                  <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-4"><span className="text-[10px] text-gray-400 font-bold uppercase">Toplam Aktif Çalışma</span><span className="bg-green-100 text-green-700 font-black px-3 py-1 rounded-xl text-sm">{maxEngagement.time}</span></div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-xl border-l-[10px] border-orange-500 text-left flex flex-col justify-between min-h-[130px]">
                  <div><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Sistemde En Az Süre Kalan Öğrenci</span><h3 className="text-lg font-black text-purple-950 uppercase truncate">{minEngagement.student}</h3></div>
                  <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-4"><span className="text-[10px] text-gray-400 font-bold uppercase">Toplam Aktif Çalışma</span><span className="bg-orange-100 text-orange-700 font-black px-3 py-1 rounded-xl text-sm">{minEngagement.time}</span></div>
                </div>
              </div>

              {/* ETKİNLİK DAĞILIM BARLARI GRAFİĞİ */}
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 text-left space-y-4">
                <h3 className="text-xs font-black text-purple-950 uppercase tracking-widest border-l-4 border-indigo-500 pl-2">Materyal ve Etkinlik Türlerine Göre Zaman Dağılımları</h3>
                <div className="grid grid-cols-1 gap-3">
                  {activityList.map((act: any, idx: number) => {
                    const currentPct = Math.round((act.hours / maxActivityHours) * 100) || 0;
                    return (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50">
                        <div className="sm:w-48 shrink-0"><span className="text-xs font-black text-purple-950 block">{act.type}</span></div>
                        <div className="flex-1 bg-gray-200 h-3.5 rounded-full overflow-hidden p-0.5 shadow-inner"><div className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 rounded-full" style={{ width: `${currentPct}%` }} /></div>
                        <div className="sm:w-28 text-right font-black text-xs text-purple-950 shrink-0">{convertHoursToText(act.hours)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* HAFTALIK ZAMAN VE KATILIM KIRILIM DETAYLARI PANALİ */}
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 text-left space-y-6">
                <h3 className="text-xs font-black text-purple-950 uppercase tracking-widest border-l-4 border-red-500 pl-2">
                  Haftalık Zaman ve Katılım Kırılım Detayları
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {weeklyList.length > 0 ? (
                    weeklyList.map((wItem: any, wIdx: number) => {
                      const wActivityHoursArray = Array.isArray(wItem.activity_distribution) ? wItem.activity_distribution.map((item: any) => item.hours) : [];
                      const wMaxHours = wActivityHoursArray.length > 0 ? Math.max(...wActivityHoursArray) : 1;

                      return (
                        <div key={wIdx} className="bg-gray-50/60 p-5 rounded-2xl border border-gray-200/60 space-y-4">
                          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                            <span className="bg-purple-950 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
                              {wItem.week_number}. HAFTA
                            </span>
                            <span className="text-xs font-black text-purple-950">
                              Toplam: {convertHoursToText(wItem.total_hours)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-[11px] leading-tight">
                            <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-left">
                              <span className="text-[8px] text-gray-400 font-bold block uppercase mb-1">En Çok Kalan</span>
                              <span className="font-black text-purple-950 block truncate">{wItem.max_engagement?.student}</span>
                              <span className="text-green-600 font-black text-[10px]">{convertHoursToText(wItem.max_engagement?.time)}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-left">
                              <span className="text-[8px] text-gray-400 font-bold block uppercase mb-1">En Az Kalan</span>
                              <span className="font-black text-purple-950 block truncate">{wItem.min_engagement?.student}</span>
                              <span className="text-orange-600 font-black text-[10px]">{convertHoursToText(wItem.min_engagement?.time)}</span>
                            </div>
                          </div>

                          <div className="space-y-2 pt-1">
                            <span className="text-[9px] text-gray-400 font-black block uppercase tracking-wider mb-1">Haftalık Materyal Dağılımı</span>
                            {Array.isArray(wItem.activity_distribution) && wItem.activity_distribution.map((wAct: any, aIdx: number) => {
                              const wPct = Math.round((wAct.hours / wMaxHours) * 100) || 0;
                              return (
                                <div key={aIdx} className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-bold text-gray-600">
                                    <span>{wAct.type}</span>
                                    <span className="font-black text-purple-950">{convertHoursToText(wAct.hours)}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden p-0.5 shadow-inner">
                                    <div className="h-full bg-purple-600 rounded-full" style={{ width: `${wPct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 text-center p-8 text-gray-400 text-xs font-black uppercase tracking-wider">
                      Haftalık kırılım analizi bulunamadı...
                    </div>
                  )}
                </div>
              </div>

              {/* SEKMELER */}
              <div className="flex flex-wrap gap-2 text-left justify-start items-center bg-gray-100 p-2 rounded-2xl border border-gray-200">
                <button 
                  type="button"
                  onClick={() => setSelectedWeekTab('all')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${selectedWeekTab === 'all' ? 'bg-purple-950 text-white shadow-md' : 'bg-transparent text-gray-500 hover:text-purple-950'}`}
                >
                  🌍 Tüm Dönem (Genel)
                </button>
                {weeklyList.map((w: any) => (
                  <button
                    key={w.week_number}
                    type="button"
                    onClick={() => setSelectedWeekTab(String(w.week_number))}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${String(selectedWeekTab) === String(w.week_number) ? 'bg-purple-600 text-white shadow-md' : 'bg-transparent text-gray-500 hover:text-purple-600'}`}
                  >
                    📆 {w.week_number}. Hafta
                  </button>
                ))}
              </div>

              {/* DİNAMİK LİDERLİK SIRALAMA TABLOSU */}
              <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-left">
                <div className="p-6 border-b bg-purple-50/20 flex justify-between items-center">
                  <h2 className="font-black text-purple-950 uppercase text-xs tracking-widest flex items-center gap-2 leading-none">
                    ⏱️ {activeRepTitle}
                  </h2>
                  <button onClick={exportZamanRaporPDF} className="bg-purple-950 hover:bg-purple-900 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"><FileText size={13} /> PDF Al</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-purple-950 text-white text-[10px] font-black uppercase tracking-widest">
                      <tr><th className="p-5 w-24 text-center">SIRA</th><th className="p-5">ÖĞRENCİ ADI SOYADI</th><th className="p-5 text-center w-48">TOPLAM AKTİF SÜRE</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-bold text-sm">
                      {displayStudents.length > 0 ? (
                        displayStudents.map((item: any, index: number) => (
                          <tr key={index} className="hover:bg-purple-50/20 transition-all">
                            <td className="p-4 text-center"><span className="px-2.5 py-1 rounded-lg text-xs font-black bg-gray-50 text-gray-500">#{item.rank || (index + 1)}</span></td>
                            <td className="p-4 text-purple-950 font-black uppercase">{item.student}</td>
                            <td className="p-4 text-center"><span className="bg-purple-600 text-white px-3 py-1.5 rounded-xl text-xs font-black">{convertHoursToText(item.time)}</span></td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-gray-400 font-bold text-xs uppercase">Bu Haftaya Ait Katılım Verisi Bulunmuyor.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          );
        })()
      )}
    </div>
  );
};
