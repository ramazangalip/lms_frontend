"use client";
import React, { useState } from 'react';
import {
  Filter,
  ClipboardList,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Search,
  BookOpen,
  Video,
  Headphones,
  FileText,
  HelpCircle,
  Printer
} from 'lucide-react';
import { 
  WeeklyPreTestStudentData, 
  getDeptName, 
  departmentList, 
  formatDuration 
} from '../types';

interface WeeklyPreTestAnalyticsTabProps {
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;
  weeklyPreTestData: WeeklyPreTestStudentData[];
  loading: boolean;
  handlePrintWeeklyPreTest: () => void;
}

export const WeeklyPreTestAnalyticsTab: React.FC<WeeklyPreTestAnalyticsTabProps> = ({
  selectedDepartment,
  setSelectedDepartment,
  weeklyPreTestData,
  loading,
  handlePrintWeeklyPreTest,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudents, setExpandedStudents] = useState<Record<number, boolean>>({});

  const toggleStudent = (id: number) => {
    setExpandedStudents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<number, boolean> = {};
    weeklyPreTestData.forEach(s => {
      allExpanded[s.student_id] = true;
    });
    setExpandedStudents(allExpanded);
  };

  const collapseAll = () => {
    setExpandedStudents({});
  };

  const filteredData = weeklyPreTestData.filter(s => {
    const term = searchTerm.toLowerCase();
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const email = s.email.toLowerCase();
    return fullName.includes(term) || email.includes(term);
  });

  const totalD1Students = weeklyPreTestData.length;
  const pretestTakers = weeklyPreTestData.filter(s => s.total_pretests_taken > 0).length;
  const activeLockStudents = weeklyPreTestData.filter(s => s.active_locks_count > 0).length;
  const totalRemediationSeconds = weeklyPreTestData.reduce((acc, curr) => acc + curr.total_remediation_duration_seconds, 0);

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video size={13} className="text-blue-500 shrink-0" />;
      case 'podcast':
        return <Headphones size={13} className="text-purple-500 shrink-0" />;
      case 'pdf':
        return <FileText size={13} className="text-red-500 shrink-0" />;
      case 'form':
        return <HelpCircle size={13} className="text-amber-500 shrink-0" />;
      default:
        return <BookOpen size={13} className="text-gray-500 shrink-0" />;
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 text-left">
      
      {/* ÜST KONTROL VE FİLTRELEME ÇUBUĞU */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-xl border border-gray-100 text-left">
        <div className="text-left leading-none">
          <div className="flex items-center gap-2">
            <span className="bg-[#ce1212]/10 text-[#ce1212] text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-[#ce1212]/20">
              SADECE D1 GRUBU
            </span>
          </div>
          <h2 className="text-xl font-black text-[#1a1a1a] uppercase leading-none border-l-4 border-[#ce1212] pl-3 mt-2">
            Ön Test Sonuçları & Telafi Analizi
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest italic leading-none">
            Haftalık Ön Değerlendirme Hataları ve Bağımsız Telafi Kilit Takibi
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto leading-none text-left">
          {/* Bölüm Seçici */}
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 text-left shadow-inner">
            <Filter size={16} className="text-[#ce1212]" />
            <select 
              value={selectedDepartment} 
              onChange={(e) => setSelectedDepartment(e.target.value)} 
              className="bg-transparent text-[11px] font-black uppercase outline-none cursor-pointer text-[#1a1a1a]"
            >
              {departmentList.map(d => (
                <option key={d.id} value={d.id} className="text-black">{d.name}</option>
              ))}
            </select>
          </div>

          {/* PDF Butonu */}
          <button 
            onClick={handlePrintWeeklyPreTest}
            className="flex items-center justify-center gap-2.5 bg-[#ce1212] hover:bg-black text-white px-7 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all leading-none active:scale-95 text-left shrink-0"
          >
            <Printer size={16} /> PDF RAPORU AL
          </button>
        </div>
      </div>

      {/* BİLGİLENDİRME BİLGİ KUTUSU */}
      <div className="bg-blue-50/70 border-l-4 border-blue-500 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
        <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-[11px] text-blue-900 leading-relaxed font-medium">
          <span className="font-black uppercase tracking-wider text-blue-950">Bağımsız Telafi Takibi Sistemi: </span>
          Öğrencinin haftalık giriş testinde yanlış yaptığı konulara ait önceki haftaların kilidi <strong className="text-blue-950">2 günlüğüne telafi amaçlı</strong> açılır. 
          Bu süreçte mevcut haftanın kilidi asla kapanmaz. Telafi sürecinde harcanan süreler, materyal tamamlamaları ve tamamlama yüzdeleri veritabanında ayrı tutulur; 
          normal analizlerdeki <strong>T1, T2 sürelerini ve normal yüzdeleri kesinlikle etkilemez veya sıfırlamaz</strong>.
        </div>
      </div>

      {/* ÖZET İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-lg border-b-4 border-gray-900 flex items-center gap-4">
          <div className="bg-gray-100 p-3.5 rounded-2xl text-gray-800 leading-none flex items-center justify-center">
            <ClipboardList size={26} />
          </div>
          <div>
            <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Toplam D1 Öğrenci</p>
            <p className="text-2xl font-black text-[#1a1a1a]">{totalD1Students}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-lg border-b-4 border-blue-600 flex items-center gap-4">
          <div className="bg-blue-50 p-3.5 rounded-2xl text-blue-600 leading-none flex items-center justify-center">
            <CheckCircle2 size={26} />
          </div>
          <div>
            <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Ön Teste Girenler</p>
            <p className="text-2xl font-black text-[#1a1a1a]">
              {pretestTakers} <span className="text-xs text-gray-400 font-bold">/ {totalD1Students}</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-lg border-b-4 border-amber-500 flex items-center gap-4">
          <div className="bg-amber-50 p-3.5 rounded-2xl text-amber-600 leading-none flex items-center justify-center">
            <Unlock size={26} />
          </div>
          <div>
            <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Aktif Telafi Kilidi</p>
            <p className="text-2xl font-black text-amber-600">
              {activeLockStudents} <span className="text-xs text-gray-400 font-bold">Öğrenci</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-lg border-b-4 border-[#ce1212] flex items-center gap-4">
          <div className="bg-red-50 p-3.5 rounded-2xl text-[#ce1212] leading-none flex items-center justify-center">
            <Clock size={26} />
          </div>
          <div>
            <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Toplam Telafi Süresi</p>
            <p className="text-2xl font-black text-[#ce1212]">{formatDuration(totalRemediationSeconds)}</p>
          </div>
        </div>
      </div>

      {/* ARAMA VE TÜMÜNÜ AÇ/KAPAT ÇUBUĞU */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Öğrenci Adı veya E-posta ile Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 pl-10 pr-4 py-2 rounded-xl text-xs font-semibold outline-none focus:border-[#ce1212] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={expandAll}
            className="text-[10px] font-black uppercase tracking-wider bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-all"
          >
            Tümünü Aç
          </button>
          <button
            onClick={collapseAll}
            className="text-[10px] font-black uppercase tracking-wider bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-all"
          >
            Tümünü Kapat
          </button>
        </div>
      </div>

      {/* YÜKLENİYOR / BOŞ DURUMU */}
      {loading ? (
        <div className="bg-white p-16 rounded-3xl shadow-xl text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#ce1212] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Ön Test ve Telafi Verileri Yükleniyor...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl shadow-xl text-center space-y-3">
          <ClipboardList size={48} className="text-gray-300 mx-auto" />
          <h3 className="text-base font-black uppercase text-gray-600">Öğrenci Verisi Bulunamadı</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            {selectedDepartment ? `${getDeptName(selectedDepartment)} bölümünde kayıtlı D1 grubu öğrencisi veya ön test kaydı bulunamadı.` : 'Lütfen yukarıdan bir bölüm seçiniz.'}
          </p>
        </div>
      ) : (
        /* ÖĞRENCİ KARTLARI LİSTESİ */
        <div className="space-y-4">
          {filteredData.map((student, sIdx) => {
            const isExpanded = expandedStudents[student.student_id] ?? false;
            const hasActiveLock = student.active_locks_count > 0;

            return (
              <div 
                key={student.student_id}
                className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transition-all hover:shadow-2xl"
              >
                {/* ÖĞRENCİ BAŞLIK ÇUBUĞU (AKORDEON TETİKLEYİCİ) */}
                <div
                  onClick={() => toggleStudent(student.student_id)}
                  className="p-5 md:p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none hover:bg-gray-50/70 transition-all border-b border-gray-100"
                >
                  {/* SOL: ÖĞRENCİ PROFİLİ */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-md ${
                      hasActiveLock 
                        ? 'bg-amber-500 text-white animate-pulse' 
                        : 'bg-[#1a1a1a] text-white'
                    }`}>
                      {hasActiveLock ? <Unlock size={22} /> : (sIdx + 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-secondary uppercase text-sm md:text-base leading-tight">
                          {student.full_name}
                        </h3>
                        <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider border border-amber-200">
                          D1 KILAVUZLU YZ
                        </span>
                        {hasActiveLock && (
                          <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1 shadow">
                            <Unlock size={10} /> {student.active_locks_count} TELAFİ KİLİDİ AKTİF
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 font-semibold mt-1">
                        {student.email} • {getDeptName(student.department)}
                      </p>
                    </div>
                  </div>

                  {/* SAĞ: ÖZET ROZETLER & OK BUTONU */}
                  <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
                    <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-center">
                      <p className="text-[8px] text-gray-400 font-black uppercase tracking-wider">GİRİLEN ÖN TEST</p>
                      <p className="text-xs font-black text-secondary">{student.total_pretests_taken}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl text-center">
                      <p className="text-[8px] text-red-500 font-black uppercase tracking-wider">TOPLAM YANLIŞ</p>
                      <p className="text-xs font-black text-[#ce1212]">{student.total_wrong_questions}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-center">
                      <p className="text-[8px] text-blue-500 font-black uppercase tracking-wider">TELAFİ ÇALIŞMA SÜRESİ</p>
                      <p className="text-xs font-black text-blue-700">{formatDuration(student.total_remediation_duration_seconds)}</p>
                    </div>

                    <div className="text-gray-400 hover:text-black p-1">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* DETAY İÇERİK (GENİŞLEYEN ALAN) */}
                {isExpanded && (
                  <div className="p-6 md:p-8 bg-gray-50/40 space-y-8 animate-in fade-in duration-300 border-t border-gray-100">
                    
                    {/* BÖLÜM 1: HAFTALIK ÖN DEĞERLENDİRME TESTLERİ & YANLIŞ CEVAP DETAYLARI */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-secondary flex items-center gap-2 border-b border-gray-200 pb-2">
                        <ClipboardList size={16} className="text-[#ce1212]" /> 
                        Haftalık Giriş Testi Performansı ve Yanlış Yapılan Sorular
                      </h4>

                      {student.pretests.length === 0 ? (
                        <p className="text-xs text-gray-400 italic bg-white p-4 rounded-2xl border border-gray-200">
                          Öğrenci henüz hiçbir haftanın ön değerlendirme testine katılmamıştır.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {student.pretests.map((pt, pIdx) => (
                            <div 
                              key={pIdx} 
                              className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4"
                            >
                              {/* Test Başlığı ve Skor */}
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-3">
                                <div className="flex items-center gap-3">
                                  <span className="bg-secondary text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                    {pt.appearing_week}. HAFTA GİRİŞ TESTİ
                                  </span>
                                  {pt.completed_at && (
                                    <span className="text-[10px] text-gray-400 font-semibold">
                                      Tarih: {pt.completed_at}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="bg-green-100 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-lg">
                                    {pt.correct_count} DOĞRU
                                  </span>
                                  <span className="bg-red-100 text-red-700 text-[10px] font-black px-2.5 py-1 rounded-lg">
                                    {pt.wrong_count} YANLIŞ
                                  </span>
                                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
                                    pt.score_percentage >= 70 ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'
                                  }`}>
                                    BAŞARI: %{pt.score_percentage}
                                  </span>
                                </div>
                              </div>

                              {/* Yanlış Yapılan Soruların Detayı */}
                              {pt.wrong_answers.length === 0 ? (
                                <div className="flex items-center gap-2 text-green-600 bg-green-50/70 p-3 rounded-xl text-xs font-bold">
                                  <CheckCircle2 size={16} /> Bu testteki tüm sorular doğru yanıtlanmıştır. Telafi kilidi açılmasına gerek kalmamıştır.
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <p className="text-[10px] font-black uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                                    <XCircle size={14} /> Yanlış Yapılan Sorular ve Hedeflenen Telafi Konuları ({pt.wrong_answers.length} Soru):
                                  </p>
                                  <div className="grid grid-cols-1 gap-2.5">
                                    {pt.wrong_answers.map((wa, wIdx) => (
                                      <div 
                                        key={wIdx} 
                                        className="bg-red-50/30 border border-red-200/60 rounded-xl p-3.5 space-y-2 text-left"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex items-start gap-2">
                                            <span className="bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                              {wIdx + 1}
                                            </span>
                                            <p className="text-xs font-bold text-gray-800 leading-snug">
                                              {wa.question_text}
                                            </p>
                                          </div>
                                          {wa.target_week && (
                                            <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shrink-0 border border-amber-300">
                                              HEDEF: {wa.target_week}. HAFTA KONUSU
                                            </span>
                                          )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7 pt-1">
                                          <div className="bg-white p-2 rounded-lg border border-red-200 flex items-center gap-2 text-[10px]">
                                            <XCircle size={12} className="text-red-500 shrink-0" />
                                            <span className="text-gray-400 font-bold uppercase">Öğrencinin Yanıtı:</span>
                                            <span className="font-black text-red-600">{wa.selected_option_text}</span>
                                          </div>
                                          <div className="bg-white p-2 rounded-lg border border-green-200 flex items-center gap-2 text-[10px]">
                                            <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                                            <span className="text-gray-400 font-bold uppercase">Doğru Cevap:</span>
                                            <span className="font-black text-green-700">{wa.correct_option_text}</span>
                                          </div>
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

                    {/* BÖLÜM 2: TELAFİ KİLİT DURUMLARI & TELAFİDE HARCANAN SÜRELER */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-secondary flex items-center gap-2 border-b border-gray-200 pb-2">
                        <Unlock size={16} className="text-amber-500" /> 
                        Telafi Kilitleri ve Telafi Sürecinde Harcanan Süreler (Normal Sürelerden Bağımsız)
                      </h4>

                      {student.remediation_records.length === 0 ? (
                        <p className="text-xs text-gray-400 italic bg-white p-4 rounded-2xl border border-gray-200">
                          Öğrencinin geçmiş haftalara ait aktif veya geçmiş bir telafi kilit kaydı bulunmamaktadır.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {student.remediation_records.map((rec, rIdx) => (
                            <div 
                              key={rIdx}
                              className={`bg-white rounded-2xl p-5 border shadow-sm space-y-4 transition-all ${
                                rec.is_active 
                                  ? 'border-amber-300 ring-2 ring-amber-400/20 shadow-amber-50' 
                                  : 'border-gray-200'
                              }`}
                            >
                              {/* Hafta Başlığı ve Durum */}
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-sm text-secondary uppercase">
                                      {rec.week_number}. Hafta Telafisi
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                    {rec.week_title}
                                  </p>
                                </div>

                                {rec.is_active ? (
                                  <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1 shadow-sm">
                                    <Unlock size={10} /> KİLİT AKTİF ({rec.remaining_hours} SAAT KALDI)
                                  </span>
                                ) : (
                                  <span className="bg-gray-100 text-gray-600 text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                                    <Lock size={10} /> SÜRE DOLDU
                                  </span>
                                )}
                              </div>

                              {/* Kilit Zaman Çizelgesi */}
                              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-[9px] flex justify-between items-center text-gray-500 font-bold">
                                <span>Açılma: {rec.unlocked_at || '-'}</span>
                                <span>Bitiş: {rec.unlock_until || '-'}</span>
                              </div>

                              {/* Telafi Tamamlama Yüzdesi & Süre */}
                              <div className="grid grid-cols-2 gap-3 bg-red-50/30 p-3 rounded-xl border border-red-100">
                                <div>
                                  <p className="text-[8px] text-gray-400 font-black uppercase tracking-wider">TELAFİ İLERLEMESİ</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full ${rec.completion_percentage >= 100 ? 'bg-green-500' : 'bg-[#ce1212]'}`}
                                        style={{ width: `${Math.min(100, rec.completion_percentage)}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] font-black text-secondary">
                                      %{rec.completion_percentage}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <p className="text-[8px] text-gray-400 font-black uppercase tracking-wider">HARCANAN SÜRE</p>
                                  <p className="text-sm font-black text-[#ce1212] mt-0.5">
                                    {formatDuration(rec.remediation_duration_seconds)}
                                  </p>
                                </div>
                              </div>

                              {/* Materyal Bazlı Telafi Süreleri */}
                              {rec.materials.filter(m => m.content_type !== 'form').length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <p className="text-[8px] font-black uppercase tracking-wider text-gray-400">
                                    Telafi Sürecinde Materyal Çalışmaları:
                                  </p>
                                  <div className="divide-y divide-gray-100 bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden">
                                    {rec.materials.filter(m => m.content_type !== 'form').map(m => (
                                      <div key={m.material_id} className="p-2 flex items-center justify-between text-[10px]">
                                        <div className="flex items-center gap-2 truncate pr-2">
                                          {getMaterialIcon(m.content_type)}
                                          <span className="truncate font-bold text-gray-700">{m.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className="font-black text-gray-600">
                                            {formatDuration(m.duration_seconds)}
                                          </span>
                                          {m.is_completed ? (
                                            <CheckCircle2 size={13} className="text-green-500" />
                                          ) : (
                                            <span className="w-3.5 h-3.5 rounded-full border border-gray-300 inline-block" />
                                          )}
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

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
