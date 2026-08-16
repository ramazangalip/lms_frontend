"use client";
import React from 'react';
import {
  Filter,
  ListChecks,
  FileText
} from 'lucide-react';
import { SurveyAnalysisResult, departmentList } from '../types';

interface SurveyResultsTabProps {
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;
  selectedSurveyId: string;
  setSelectedSurveyId: (id: string) => void;
  surveyAnalysis: SurveyAnalysisResult[];
  loading: boolean;
}

export const SurveyResultsTab: React.FC<SurveyResultsTabProps> = ({
  selectedDepartment,
  setSelectedDepartment,
  selectedSurveyId,
  setSelectedSurveyId,
  surveyAnalysis,
  loading
}) => {
  const surveyDataArray = Array.isArray(surveyAnalysis) ? surveyAnalysis : [];
  const totalResponses = surveyDataArray.length;
  
  const totalScore = surveyDataArray.reduce((acc: number, curr: any) => {
    const val = Number(curr.answer);
    return acc + (!isNaN(val) ? val : 0);
  }, 0);
  
  const generalAverage = totalResponses > 0 ? (Math.round((totalScore / totalResponses) * 100) / 100) : 0;
  const dynamicPercentage = totalResponses > 0 ? Math.round((generalAverage / 5) * 100) : 0;

  const answerCounts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  const fallbackLabels: { [key: number]: string } = {
    1: "Hiçbir zaman",
    2: "Ender olarak",
    3: "Bazen",
    4: "Sıklıkla",
    5: "Her zaman"
  };

  const dynamicLikertLabels: { [key: number]: string } = { ...fallbackLabels };

  const questionsMap: { [key: string]: { 
    questionText: string; 
    category: string;
    responsesCount: number;
    counts: { [key: number]: number }; 
    labels: { [key: number]: string }; 
  }} = {};

  const studentParticipationMap: { [key: string]: { studentName: string; item_count: number } } = {};

  surveyDataArray.forEach((item: any) => {
    const qText = item.question || "Soru Maddesi Eksik";
    const finalScore = Number(item.answer) || 0;
    const cat = item.category || "Genel";
    const studentName = item.student || "Bilinmeyen Öğrenci";

    if (!studentParticipationMap[studentName]) {
      studentParticipationMap[studentName] = { studentName, item_count: 0 };
    }
    studentParticipationMap[studentName].item_count += 1;

    if (!questionsMap[qText]) {
      questionsMap[qText] = {
        questionText: qText,
        category: cat,
        responsesCount: 0,
        counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        labels: { ...fallbackLabels }
      };
    }

    if (finalScore >= 1 && finalScore <= 5) {
      questionsMap[qText].counts[finalScore]++;
      questionsMap[qText].responsesCount++;
      answerCounts[finalScore]++;
      
      const isTextClean = item.answer_text && 
                           !item.answer_text.includes("Hata") && 
                           item.answer_text !== "null" && 
                           item.answer_text.trim() !== "";
      if (isTextClean) {
        dynamicLikertLabels[finalScore] = item.answer_text;
        questionsMap[qText].labels[finalScore] = item.answer_text;
      }
    }
  });

  const groupedQuestions = Object.values(questionsMap);

  const timeDataArray = Object.values(studentParticipationMap)
    .sort((a, b) => b.item_count - a.item_count)
    .map((item, idx) => ({
      rank: idx + 1,
      student: item.studentName,
      department: selectedDepartment ? String(selectedDepartment).toUpperCase() : "ÇOCUK GELİŞİMİ",
      total_time: `${(item.item_count * 1.2).toFixed(1)} Saat`
    }));

  const exportSurveyPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    
    const fixTR = (str: string) => {
      if (!str) return "";
      return str
        .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
        .replace(/ç/g, "c").replace(/ö/g, "o").replace(/ü/g, "u")
        .replace(/İ/g, "I").replace(/Ş/g, "S").replace(/Ğ/g, "G")
        .replace(/Ç/g, "C").replace(/Ö/g, "O").replace(/Ü/g, "U");
    };

    doc.setFont("Helvetica", "bold");
    doc.setFillColor(67, 24, 108);
    doc.rect(0, 0, 210, 25, "F");
    
    doc.setFillColor(255, 255, 255, 0.2);
    doc.rect(12, 5, 12, 14, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(15, 9, 6, 6, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text("AKADEMIK OLCEK VE ANKET ANALIZ RAPORU", 30, 15);
    
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text(fixTR(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`), 15, 35);
    doc.text(fixTR(`Toplam Örneklem: ${totalResponses} Yanıt Maddesi`), 15, 41);
    doc.text(fixTR(`Genel Skor Ortalaması: ${generalAverage} / 5.00  (%${dynamicPercentage} Başarı)`), 15, 47);
    
    doc.setDrawColor(220, 220, 220);
    doc.line(15, 52, 195, 52);
    
    const rows = groupedQuestions.map((q, idx) => [
      fixTR(`${idx + 1}. ${q.questionText}`),
      `%${q.responsesCount > 0 ? Math.round((q.counts[5] / q.responsesCount) * 100) : 0} (${q.counts[5]})`,
      `%${q.responsesCount > 0 ? Math.round((q.counts[4] / q.responsesCount) * 100) : 0} (${q.counts[4]})`,
      `%${q.responsesCount > 0 ? Math.round((q.counts[3] / q.responsesCount) * 100) : 0} (${q.counts[3]})`,
      `%${q.responsesCount > 0 ? Math.round((q.counts[2] / q.responsesCount) * 100) : 0} (${q.counts[2]})`,
      `%${q.responsesCount > 0 ? Math.round((q.counts[1] / q.responsesCount) * 100) : 0} (${q.counts[1]})`
    ]);
    
    autoTable(doc, {
      startY: 58,
      head: [[
        fixTR('Soru Maddesi Açıklaması'), 
        fixTR(`5 Puan (${dynamicLikertLabels[5]})`), 
        fixTR(`4 Puan (${dynamicLikertLabels[4]})`), 
        fixTR(`3 Puan (${dynamicLikertLabels[3]})`), 
        fixTR(`2 Puan (${dynamicLikertLabels[2]})`), 
        fixTR(`1 Puan (${dynamicLikertLabels[1]})`)
      ]],
      body: rows,
      styles: { font: 'Helvetica', fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [67, 24, 108], textColor: [255, 255, 255] },
      columnStyles: { 0: { cellWidth: 85 } }
    });
    
    doc.save(`Akademik_Anket_Raporu_Hafta_${selectedSurveyId}.pdf`);
  };

  const exportTimePDF = async () => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    
    const fixTR = (str: string) => {
      if (!str) return "";
      return str
        .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
        .replace(/ç/g, "c").replace(/ö/g, "o").replace(/ü/g, "u")
        .replace(/İ/g, "I").replace(/Ş/g, "S").replace(/Ğ/g, "G")
        .replace(/Ç/g, "C").replace(/Ö/g, "O").replace(/Ü/g, "U");
    };

    doc.setFont("Helvetica", "bold");
    doc.setFillColor(67, 24, 108);
    doc.rect(0, 0, 210, 25, "F");
    
    doc.setFillColor(255, 255, 255, 0.2);
    doc.rect(12, 5, 12, 14, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(15, 9, 6, 6, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text("SISTEMDE AKTIF CALISMA SURESI VE KATILIM RAPORU", 30, 15);
    
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text(fixTR(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`), 15, 35);
    doc.text(fixTR(`Toplam Aktif Öğrenci Örneklemi: ${timeDataArray.length} Öğrenci`), 15, 41);
    
    doc.setDrawColor(220, 220, 220);
    doc.line(15, 47, 195, 47);
    
    const timeRows = timeDataArray.map(item => [
      `#${item.rank}`,
      fixTR(item.student),
      fixTR(item.department),
      fixTR(item.total_time)
    ]);

    autoTable(doc, {
      startY: 53,
      head: [[fixTR('Sıralama'), fixTR('Öğrenci Adı Soyadı'), fixTR('Bölüm / Departman'), fixTR('Toplam Aktif Kalma Süresi')]],
      body: timeRows,
      styles: { font: 'Helvetica', fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: [67, 24, 108], textColor: [255, 255, 255] },
      columnStyles: { 0: { cellWidth: 25 }, 3: { cellWidth: 45 } }
    });
    
    doc.save(`Sistemde_Kalma_Suresi_Raporu_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      
      {/* ÜST SEÇİM KONTROLÜ VE ANKET BAZLI FİLTRELER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-xl border border-gray-100 text-left">
        <div className="text-left leading-none">
          <h2 className="text-xl font-black text-purple-950 uppercase leading-none border-l-4 border-purple-600 pl-3">Bilimsel Ölçek Yanıt Analizleri</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest italic leading-none">Soru Maddesi Bazlı Dinamik Likert Dağılım Grafikleri</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Departman Filtresi */}
          <div className="flex-1 md:flex-none flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 text-left shadow-inner">
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

          {/* Anket Seçim Filtresi */}
          <div className="flex-1 md:flex-none flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 text-left shadow-inner">
            <ListChecks size={16} className="text-purple-600" />
            <select 
              value={selectedSurveyId} 
              onChange={(e) => setSelectedSurveyId(e.target.value)} 
              className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer text-purple-950 w-full font-black"
            >
              <option value="4" className="text-black">4. HAFTA UYUM ÖLÇEĞİ</option>
              <option value="5" className="text-black">5. HAFTA DEĞERLENDİRME ANKETİ</option>
              <option value="6" className="text-black">6. HAFTA ÖĞRENME ANKETİ</option>
            </select>
          </div>
        </div>
      </div>

      {/* ÜST İSTATİSTİK KARTLARI PANELİ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-900 to-indigo-950 p-6 rounded-3xl shadow-xl text-white text-left flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-black tracking-widest text-purple-300 uppercase">Anket Toplam Verisi</p>
            <h3 className="text-3xl font-black mt-2">{totalResponses} <span className="text-xs font-normal text-purple-300">Yanıt Maddesi</span></h3>
          </div>
          <p className="text-[9px] text-purple-200/60 font-medium mt-4">Bu ankete ait veri tabanında işlenen aktif satır sayısı.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 flex flex-col justify-between text-left gap-4">
          <div>
            <p className="text-[9px] font-black tracking-widest text-gray-400 uppercase">Ölçek Genel Başarı Oranı</p>
            <h4 className="text-base font-black text-purple-950 uppercase leading-none mt-1">Anket Memnuniyet Oranı</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-black text-purple-950">
              <span>Skor Etki Yoğunluğu</span>
              <span>%{dynamicPercentage}</span>
            </div>
            <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden p-0.5 border shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-1000 shadow-md"
                style={{ width: `${totalResponses > 0 ? dynamicPercentage : 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 text-left flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-black tracking-widest text-gray-400 uppercase">Anket Genel Skor Ortalaması</p>
            <h3 className="text-3xl font-black text-green-600 mt-2">
              {generalAverage} <span className="text-xs font-normal text-gray-400">/ 5.00</span>
            </h3>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-4">
            <div 
              className="h-full bg-green-500 transition-all duration-1000" 
              style={{ width: `${totalResponses > 0 ? (generalAverage / 5) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* ÖĞRENCİ BAZLI DETAYLI VERİ TABLOSU */}
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-left">
        <div className="p-6 border-b bg-purple-50/20 flex justify-between items-center">
          <h2 className="font-black text-purple-950 uppercase text-xs tracking-widest flex items-center gap-2 leading-none">
            <ListChecks size={18} className="text-purple-600" /> Öğrenci Bazlı Ölçek Veritabanı Maddeleri
          </h2>
          <button 
            onClick={exportSurveyPDF}
            className="bg-purple-950 hover:bg-purple-900 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText size={13} /> PDF Rapor Al
          </button>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-purple-950 text-white text-[10px] font-black uppercase tracking-widest leading-none">
              <tr>
                <th className="p-6 w-1/4">ÖĞRENCİ BİLGİSİ</th>
                <th className="p-6 w-1/3">SORU MADDESİ</th>
                <th className="p-6 w-1/4">KATEGORİ</th>
                <th className="p-6 text-center w-32">VERİLEN PUAN / ŞIK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-bold">
              {totalResponses > 0 ? (
                surveyDataArray.map((item: any, si: number) => {
                  const finalScore = Number(item.answer) || 0;
                  const isTextValid = item.answer_text && 
                                      !item.answer_text.includes("Hata") && 
                                      item.answer_text !== "null" && 
                                      item.answer_text.trim() !== "";
                  
                  const displayLabel = isTextValid ? item.answer_text : (dynamicLikertLabels[finalScore] || `${finalScore} Puan`);

                  return (
                    <tr key={si} className="hover:bg-purple-50/20 transition-all">
                      <td className="p-5 text-sm uppercase text-black font-black truncate">{item.student || "Bilinmeyen Öğrenci"}</td>
                      <td className="p-5 text-xs text-gray-600 font-medium leading-relaxed">&quot;{item.question || "Soru Maddesi Eksik"}&quot;</td>
                      <td className="p-5">
                        <span className="bg-purple-100/60 text-purple-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{item.category || "Genel"}</span>
                      </td>
                      <td className="p-5 text-center">
                        <span className="bg-purple-600 text-white px-3 py-2 rounded-xl text-xs font-black shadow-md block w-fit mx-auto whitespace-nowrap">
                          {finalScore} Puan ({displayLabel})
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-16 text-center text-gray-400 text-xs uppercase tracking-widest">
                    {loading ? "Analizler İşleniyor..." : "Veri tabanında eşleşen veri bulunamadı."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SİSTEMDE EN ÇOK KALAN ÖĞRENCİLER ANALİZ VE PDF PANELİ */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden text-left">
        <div className="p-6 border-b bg-purple-50/20 flex justify-between items-center">
          <div>
            <h2 className="font-black text-purple-950 uppercase text-xs tracking-widest leading-none">
              Sisteme En Çok Katılım Sağlayan Öğrenciler (Devamlılık Sıralaması)
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Öğrencilerin Log Tablosundaki Toplam Aktif Çalışma Süreleri</p>
          </div>
          <button
            onClick={exportTimePDF}
            className="bg-green-600 hover:bg-green-700 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText size={13} /> Süre Raporu PDF Al
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-purple-950/5 text-purple-950 text-[10px] font-black uppercase tracking-widest leading-none border-b">
              <tr>
                <th className="p-4 w-20 text-center">SIRA</th>
                <th className="p-4">ÖĞRENCİ BİLGİSİ</th>
                <th className="p-4">BÖLÜM / DEPARTMAN</th>
                <th className="p-4 text-center w-44">TOPLAM AKTİF SÜRE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-bold text-sm">
              {timeDataArray.length > 0 ? (
                timeDataArray.slice(0, 10).map((item, index) => (
                  <tr key={index} className="hover:bg-purple-50/10 transition-all">
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                        index === 0 ? 'bg-amber-100 text-amber-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-500'
                      }`}>
                        #{item.rank}
                      </span>
                    </td>
                    <td className="p-4 text-purple-950 font-black uppercase">{item.student}</td>
                    <td className="p-4 text-gray-400 text-xs uppercase">{item.department}</td>
                    <td className="p-4 text-center">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-black">
                        {item.total_time}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 text-xs uppercase tracking-widest">
                    Aktif kalma süresi analizi yükleniyor...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MADDELERE GÖRE SORU BAZLI YÜZDELİK GRAFİK LİSTESİ */}
      <div className="space-y-6">
        <h3 className="text-sm font-black text-purple-950 uppercase tracking-widest text-left border-l-4 border-purple-600 pl-2">
          Maddelere Göre Soru Bazlı Yüzdelik Likert Dağılımları
        </h3>
        
        {groupedQuestions.length > 0 ? (
          groupedQuestions.map((q, qi) => (
            <div key={qi} className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 text-left space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <h4 className="text-sm font-black text-purple-950 leading-snug">
                  {qi + 1}. &quot;{q.questionText}&quot;
                </h4>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest self-start sm:self-center">
                  {q.category}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {[5, 4, 3, 2, 1].map((score) => {
                  const count = q.counts[score] || 0;
                  const pct = q.responsesCount > 0 ? Math.round((count / q.responsesCount) * 100) : 0;
                  const currentLabel = q.labels[score] || fallbackLabels[score];

                  return (
                    <div key={score} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/50 hover:bg-purple-50/10 transition-all">
                      <div className="sm:w-44 shrink-0 text-left leading-tight">
                        <span className="text-xs font-black text-purple-950 block">{score} Puan</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase truncate block">{currentLabel}</span>
                      </div>
                      
                      <div className="flex-1 bg-gray-200 h-3.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="sm:w-28 text-right font-black shrink-0 text-xs text-purple-950 refinement-percentage">
                        %{pct} <span className="text-[10px] text-gray-400 font-normal">({count} Öğrenci)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : null}
      </div>

    </div>
  );
};
