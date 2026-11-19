"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
  Users,
  Calendar,
  Trophy,
  Layers,
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  Video,
  Headphones,
  ClipboardList,
  Printer,
  Award,
  Clock
} from 'lucide-react';

// --- TYPES ---
interface ExamScoreMaterial {
  title: string;
  completed_at: string;
  points: number;
  content_type: string;
  week_number: number;
}

interface ExamScoreStudent {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  before_exam_points: number;
  before_exam_material_count: number;
  after_exam_points: number;
  after_exam_material_count: number;
  total_points: number;
  before_exam_materials: ExamScoreMaterial[];
  after_exam_materials: ExamScoreMaterial[];
}

interface ExamScoreData {
  department: string;
  department_display: string;
  cutoff_date: string;
  total_students: number;
  total_before_points: number;
  total_after_points: number;
  total_points: number;
  students: ExamScoreStudent[];
}

interface ExamScoreReportTabProps {
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;
  onDataLoaded?: (data: ExamScoreData) => void;
  handlePrintExamScore?: () => void;
}

const DEPT_NAMES: Record<string, string> = {
  'matematik': 'Matematik',
  'siyasetbilimi': 'Siyaset Bilimi ve Kamu Yönetimi',
  'turkdili': 'Türk Dili Ve Edebiyatı'
};

const DEPARTMENTS = ['matematik', 'siyasetbilimi', 'turkdili'];

const getMaterialIcon = (contentType: string) => {
  switch (contentType) {
    case 'pdf': return <FileText size={14} className="text-amber-400" />;
    case 'video': return <Video size={14} className="text-red-400" />;
    case 'podcast': return <Headphones size={14} className="text-purple-400" />;
    case 'form': return <ClipboardList size={14} className="text-green-400" />;
    default: return <FileText size={14} className="text-gray-400" />;
  }
};

export const ExamScoreReportTab: React.FC<ExamScoreReportTabProps> = ({
  selectedDepartment,
  setSelectedDepartment,
  onDataLoaded,
  handlePrintExamScore,
}) => {
  const [examData, setExamData] = useState<ExamScoreData | null>(null);
  const [allDeptData, setAllDeptData] = useState<Record<string, ExamScoreData>>({});
  const [loading, setLoading] = useState(true);
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async (dept: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/contents/exam-score-report/?department=${dept}`);
      setExamData(res.data);
      setAllDeptData(prev => ({ ...prev, [dept]: res.data }));
      onDataLoaded?.(res.data);
    } catch (err) {
      console.error("Vize puan raporu yüklenemedi:", err);
      setExamData(null);
    } finally {
      setLoading(false);
    }
  }, [onDataLoaded]);

  // Fetch all departments for tab counts
  useEffect(() => {
    DEPARTMENTS.forEach(async (dept) => {
      if (!allDeptData[dept]) {
        try {
          const res = await api.get(`/contents/exam-score-report/?department=${dept}`);
          setAllDeptData(prev => ({ ...prev, [dept]: res.data }));
        } catch {}
      }
    });
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetchData(selectedDepartment);
    }
  }, [selectedDepartment, fetchData]);

  const toggleStudent = (studentId: number) => {
    setExpandedStudents(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (!examData) return;
    if (expandedStudents.size === examData.students.length) {
      setExpandedStudents(new Set());
    } else {
      setExpandedStudents(new Set(examData.students.map(s => s.id)));
    }
  };

  const handlePrint = () => {
    if (handlePrintExamScore) {
      handlePrintExamScore();
      return;
    }
    const otherReports = ['bulk-report-pdf', 'chatbot-report-pdf', 'weekly-pretest-report-pdf'];
    otherReports.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const examReport = document.getElementById('exam-score-report-pdf');
    if (examReport) examReport.style.display = 'block';
    window.print();
    setTimeout(() => {
      if (examReport) examReport.style.display = 'none';
    }, 1000);
  };

  const filteredStudents = examData?.students.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  }) || [];

  const deptDisplay = examData?.department_display || DEPT_NAMES[selectedDepartment] || selectedDepartment;

  return (
    <div className="w-full text-white text-left font-roboto space-y-5">
      {/* 1. ÜST BANNER KARTI */}
      <div className="bg-[#161616] border border-white/5 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-red-950/60 text-red-400 border border-red-800/40 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-3">
              <Calendar size={12} /> D1 KATEGORİSİ MATERYAL PUANLARI
            </span>
            <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight">
              VİZE ÖNCESİ VE SONRASI MATERYAL PUAN RAPORU
            </h1>
            <p className="text-[11px] md:text-[12px] text-gray-400 mt-2 leading-relaxed max-w-3xl">
              Öğrencilerin materyalleri tamamlama tarihlerine göre <strong className="text-white font-bold">Vizeden Önce</strong> ve <strong className="text-white font-bold">Vizeden Sonra</strong> kazandıkları puanlar bölüm bölüm ayrılarak aşağıda listelenmiştir.
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all shrink-0 shadow-lg shadow-red-600/30 active:scale-95"
          >
            <Printer size={16} /> PDF OLARAK YAZDIR / KAYDET
          </button>
        </div>
      </div>

      {/* 2. DÖRT ADET ÖZET KART */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KART 1: ÖĞRENCİ SAYISI */}
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-5 flex items-center gap-4 shadow-lg">
          <div className="bg-blue-500/10 p-3.5 rounded-2xl text-blue-400 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-[9.5px] font-black text-gray-400 uppercase tracking-wider leading-none mb-1.5">{deptDisplay.toUpperCase()} ÖĞRENCİ</p>
            <p className="text-2xl md:text-3xl font-black text-white leading-none">{examData?.total_students || 0}</p>
          </div>
        </div>

        {/* KART 2: VİZEDEN ÖNCE PUAN */}
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-5 flex items-center gap-4 shadow-lg">
          <div className="bg-green-500/10 p-3.5 rounded-2xl text-green-400 shrink-0">
            <Calendar size={22} />
          </div>
          <div>
            <p className="text-[9.5px] font-black text-gray-400 uppercase tracking-wider leading-none mb-1.5">VİZEDEN ÖNCE PUAN</p>
            <p className="text-2xl md:text-3xl font-black text-[#22c55e] leading-none">{examData?.total_before_points || 0}</p>
          </div>
        </div>

        {/* KART 3: VİZEDEN SONRA PUAN */}
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-5 flex items-center gap-4 shadow-lg">
          <div className="bg-purple-500/10 p-3.5 rounded-2xl text-purple-400 shrink-0">
            <Award size={22} />
          </div>
          <div>
            <p className="text-[9.5px] font-black text-gray-400 uppercase tracking-wider leading-none mb-1.5">VİZEDEN SONRA PUAN</p>
            <p className="text-2xl md:text-3xl font-black text-[#c084fc] leading-none">{examData?.total_after_points || 0}</p>
          </div>
        </div>

        {/* KART 4: BÖLÜM TOPLAM PUANI */}
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-5 flex items-center gap-4 shadow-lg">
          <div className="bg-red-500/10 p-3.5 rounded-2xl text-red-400 shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <p className="text-[9.5px] font-black text-gray-400 uppercase tracking-wider leading-none mb-1.5">BÖLÜM TOPLAM PUANI</p>
            <p className="text-2xl md:text-3xl font-black text-[#ef4444] leading-none">{examData?.total_points || 0}</p>
          </div>
        </div>
      </div>

      {/* 3. BÖLÜM SEKMELERİ + ARAMA ÇUBUĞU */}
      <div className="bg-[#161616] border border-white/5 rounded-2xl p-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
        {/* Bölüm Butonları */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {DEPARTMENTS.map(dept => {
            const count = allDeptData[dept]?.total_students || (dept === selectedDepartment ? examData?.total_students || 0 : 0);
            const isActive = selectedDepartment === dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-[#222222] hover:bg-[#282828] text-gray-300 border border-white/5'
                }`}
              >
                {DEPT_NAMES[dept]} ({count})
              </button>
            );
          })}
        </div>

        {/* Arama ve Tümünü Genişlet */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Öğrenci veya e-posta ara..."
              className="bg-[#222222] border border-white/5 rounded-xl pl-9 pr-4 py-2 text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 w-full"
            />
          </div>
          <button
            onClick={expandAll}
            className="bg-[#222222] hover:bg-[#282828] text-gray-300 font-bold text-[11px] px-4 py-2 rounded-xl border border-white/5 transition-all whitespace-nowrap shrink-0"
          >
            {expandedStudents.size === (examData?.students.length || 0) && (examData?.students.length || 0) > 0 ? 'Tümünü Daralt' : 'Tümünü Genişlet'}
          </button>
        </div>
      </div>

      {/* 4. YÜKLENİYOR DURUMU */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-[#161616] border border-white/5 rounded-3xl">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        /* 5. TABLO KARTI */
        <div className="bg-[#161616] border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-xl">
          {/* Bölüm Başlığı & Sağ Rozetler */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-7 bg-red-600 rounded-full shrink-0" />
              <div>
                <h2 className="text-base md:text-lg font-black text-white uppercase tracking-wide leading-none">{deptDisplay.toUpperCase()}</h2>
                <p className="text-[10px] text-gray-400 font-medium mt-1 leading-none">Kategori: D1 | Toplam {examData?.total_students || 0} Öğrenci</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="border border-green-500/30 bg-green-500/10 text-gray-300 text-[10.5px] font-bold px-3 py-1.5 rounded-xl">
                Vizeden Önce: <span className="text-green-400 font-black">{examData?.total_before_points || 0} Puan</span>
              </div>
              <div className="border border-purple-500/30 bg-purple-500/10 text-gray-300 text-[10.5px] font-bold px-3 py-1.5 rounded-xl">
                Vizeden Sonra: <span className="text-purple-400 font-black">{examData?.total_after_points || 0} Puan</span>
              </div>
              <div className="border border-red-500/30 bg-red-500/10 text-gray-300 text-[10.5px] font-bold px-3 py-1.5 rounded-xl">
                Bölüm Toplamı: <span className="text-red-400 font-black">{examData?.total_points || 0} Puan</span>
              </div>
            </div>
          </div>

          {/* Tablo Konteynırı */}
          <div className="overflow-x-auto">
            {/* Tablo Başlıkları */}
            <div className="min-w-[760px] grid grid-cols-[40px_1fr_1.1fr_130px_130px_100px_90px] gap-2 px-4 py-3 border-b border-white/5 text-[9px] font-black text-gray-400 uppercase tracking-wider items-center">
              <span>#</span>
              <span>ÖĞRENCİ ADI SOYADI</span>
              <span>E-POSTA / NO</span>
              <span className="text-center">
                <span className="border border-green-500/40 text-green-400 px-2 py-0.5 rounded-md text-[9px] font-black uppercase inline-block">
                  VİZEDEN ÖNCE PUAN
                </span>
              </span>
              <span className="text-center">
                <span className="border border-purple-500/40 text-purple-400 px-2 py-0.5 rounded-md text-[9px] font-black uppercase inline-block">
                  VİZEDEN SONRA PUAN
                </span>
              </span>
              <span className="text-center">
                <span className="border border-red-500/40 text-red-400 px-2 py-0.5 rounded-md text-[9px] font-black uppercase inline-block">
                  TOPLAM PUAN
                </span>
              </span>
              <span className="text-center">MATERYAL DETAYI</span>
            </div>

            {/* Öğrenci Satırları */}
            {filteredStudents.map((student, idx) => {
              const isExpanded = expandedStudents.has(student.id);
              return (
                <div key={student.id}>
                  <div className={`min-w-[760px] grid grid-cols-[40px_1fr_1.1fr_130px_130px_100px_90px] gap-2 px-4 py-3.5 items-center border-b border-white/5 hover:bg-white/[0.02] transition-colors ${isExpanded ? 'bg-white/[0.03]' : ''}`}>
                    <span className="text-[11px] text-gray-500 font-bold">{idx + 1}</span>
                    <span className="text-[12px] text-white font-bold">{student.first_name} {student.last_name}</span>
                    <span className="text-[11px] text-gray-400 font-medium">{student.email}</span>
                    <div className="text-center">
                      <span className="inline-block bg-[#16291e] border border-green-500/30 text-green-400 text-[11px] font-black px-3.5 py-1 rounded-xl">
                        {student.before_exam_points} Puan
                      </span>
                      <p className="text-[9px] text-gray-500 mt-0.5">({student.before_exam_material_count} materyal)</p>
                    </div>
                    <div className="text-center">
                      <span className="inline-block bg-[#241b30] border border-purple-500/30 text-purple-300 text-[11px] font-black px-3.5 py-1 rounded-xl">
                        {student.after_exam_points} Puan
                      </span>
                      <p className="text-[9px] text-gray-500 mt-0.5">({student.after_exam_material_count} materyal)</p>
                    </div>
                    <div className="text-center">
                      <span className="inline-block bg-red-600 text-white text-[11px] font-black px-4 py-1.5 rounded-xl shadow-md shadow-red-600/30">
                        {student.total_points} Puan
                      </span>
                    </div>
                    <div className="text-center">
                      <button
                        onClick={() => toggleStudent(student.id)}
                        className="bg-[#222222] hover:bg-[#282828] text-gray-300 font-bold text-[10px] px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1 mx-auto transition-all"
                      >
                        {isExpanded ? 'Kapat' : 'İncele'} {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* GENİŞLEYEN MATERYAL LİSTESİ (3. GÖRSEL İLE BİREBİR) */}
                  {isExpanded && (
                    <div className="min-w-[760px] bg-[#0f0f0f] border-b border-white/5 p-4 md:p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* SOL: VİZEDEN ÖNCE TAMAMLANANLAR */}
                        <div className="bg-[#141414] border border-green-500/30 rounded-2xl overflow-hidden shadow-lg">
                          <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-400" />
                              <span className="text-[11px] font-black text-green-400 uppercase tracking-wide">
                                VİZEDEN ÖNCE TAMAMLANANLAR ({student.before_exam_material_count})
                              </span>
                            </div>
                            <span className="text-[11px] font-black text-green-400">{student.before_exam_points} Puan</span>
                          </div>
                          <div className="max-h-72 overflow-y-auto custom-scrollbar p-1">
                            {student.before_exam_materials.length === 0 ? (
                              <p className="text-[11px] text-gray-500 p-4 text-center font-medium">Bu dönemde tamamlanan materyal bulunmuyor.</p>
                            ) : (
                              student.before_exam_materials.map((mat, mi) => (
                                <div key={mi} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/[0.02] border-b border-white/5 last:border-b-0">
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-3">
                                    <div className="shrink-0">{getMaterialIcon(mat.content_type)}</div>
                                    <span className="text-[11px] text-gray-300 font-medium truncate">{mat.title}</span>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[10px] text-gray-500 font-mono">{mat.completed_at}</span>
                                    <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-[9px] font-black px-2 py-0.5 rounded-md">+{mat.points}p</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* SAĞ: VİZEDEN SONRA TAMAMLANANLAR */}
                        <div className="bg-[#141414] border border-purple-500/30 rounded-2xl overflow-hidden shadow-lg">
                          <div className="bg-purple-500/10 border-b border-purple-500/20 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-purple-400" />
                              <span className="text-[11px] font-black text-purple-400 uppercase tracking-wide">
                                VİZEDEN SONRA TAMAMLANANLAR ({student.after_exam_material_count})
                              </span>
                            </div>
                            <span className="text-[11px] font-black text-purple-400">{student.after_exam_points} Puan</span>
                          </div>
                          <div className="max-h-72 overflow-y-auto custom-scrollbar p-1">
                            {student.after_exam_materials.length === 0 ? (
                              <p className="text-[11px] text-gray-500 p-4 text-center font-medium">Bu dönemde tamamlanan materyal bulunmuyor.</p>
                            ) : (
                              student.after_exam_materials.map((mat, mi) => (
                                <div key={mi} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/[0.02] border-b border-white/5 last:border-b-0">
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-3">
                                    <div className="shrink-0">{getMaterialIcon(mat.content_type)}</div>
                                    <span className="text-[11px] text-gray-300 font-medium truncate">{mat.title}</span>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[10px] text-gray-500 font-mono">{mat.completed_at}</span>
                                    <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[9px] font-black px-2 py-0.5 rounded-md">+{mat.points}p</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredStudents.length === 0 && (
              <div className="text-center py-12 text-gray-500 text-[12px] font-medium">
                {searchQuery ? 'Arama kriterlerine uygun öğrenci bulunamadı.' : 'Bu bölümde listelenecek öğrenci verisi bulunmamaktadır.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
