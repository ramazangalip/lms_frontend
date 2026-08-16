"use client";
import React from 'react';
import {
  Users,
  Filter,
  FileText,
  BarChart3,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { StudentAnalytics, getDeptName, departmentList } from '../types';

interface StudentAnalyticsTabProps {
  totalCount: number;
  analytics: StudentAnalytics[];
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  fetchAnalytics: (dept?: string, page?: number) => Promise<void>;
  handlePrintAcademic: () => void;
  setSelectedStudent: (student: StudentAnalytics | null) => void;
  loading: boolean;
}

export const StudentAnalyticsTab: React.FC<StudentAnalyticsTabProps> = ({
  totalCount,
  analytics,
  selectedDepartment,
  setSelectedDepartment,
  currentPage,
  setCurrentPage,
  fetchAnalytics,
  handlePrintAcademic,
  setSelectedStudent,
  loading
}) => {
  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6 md:space-y-8 pb-10 text-left">
      
      {/* Üst Bilgi Kartı ve Filtreler */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-xl border border-gray-100 text-left">
        <div className="flex items-center gap-6 leading-none">
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 flex items-center justify-center leading-none">
            <Users size={32} />
          </div>
          <div className="text-left leading-none">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 leading-none">Toplam Kayıtlı Öğrenci</p>
            <p className="text-3xl font-black">{totalCount || analytics.length}</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto leading-none text-left">
          <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 text-left">
            <Filter size={16} className="text-gray-400" />
            <select 
              value={selectedDepartment} 
              onChange={(e) => {
                const newDept = e.target.value;
                setSelectedDepartment(newDept);
                setCurrentPage(1);
                fetchAnalytics(newDept, 1);
              }} 
              className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer"
            >
              {departmentList.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          
          <button onClick={handlePrintAcademic} className="flex items-center justify-center gap-3 bg-red-700 hover:bg-red-800 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all leading-none active:scale-95">
            <FileText size={18} /> {getDeptName(selectedDepartment).toUpperCase()} AKADEMİK RAPOR
          </button>
        </div>
      </div>

      {/* Analiz Tablosu */}
      <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden text-left">
        <div className="p-6 md:p-8 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-[#ce1212]" />
            <h2 className="font-black text-secondary uppercase text-[10px] md:text-xs tracking-widest">
              Akademik Takip Çizelgesi (Sayfa {currentPage})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-100/50 text-gray-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">
                <th className="p-5 md:p-8">AD SOYAD / BÖLÜM</th>
                <th className="p-5 md:p-8">PUAN / AKTİF İLERLEME</th>
                <th className="p-5 md:p-8">TOPLAM SÜRE</th>
                <th className="p-5 md:p-8 text-center">İŞLEM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 suppressHydrationWarning">
              {analytics.length > 0 ? (
                analytics.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-all group">
                    <td className="p-5 md:p-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary text-white rounded-full flex items-center justify-center font-bold text-xs shadow-md shrink-0 uppercase">
                          {student.first_name?.[0]}{student.last_name?.[0]}
                        </div>
                        <div className="min-w-0 flex-1 leading-tight">
                          <p className="font-black text-black text-sm truncate uppercase">{student.first_name} {student.last_name}</p>
                          <p className="text-[9px] text-[#ce1212] font-black mt-1 uppercase">{getDeptName(student.department)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 md:p-8">
                      <div className="flex items-center gap-4">
                        <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg font-black text-[10px] border border-amber-200 shadow-sm">{student.total_points} Puan</div>
                        <div className="space-y-1.5 w-32">
                          <div className="flex justify-between items-center leading-none">
                            <span className="text-[10px] font-bold text-secondary">%{student.overall_progress}</span>
                            <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter">GÜNCEL</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden border shadow-inner">
                            <div 
                              className={`h-full transition-all duration-1000 ${student.overall_progress === 100 ? 'bg-green-500' : 'bg-[#ce1212]'}`} 
                              style={{ width: `${student.overall_progress}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 md:p-8">
                      <div className="flex items-center gap-2 text-gray-700 font-black text-xs md:text-sm">
                        <Clock size={16} className="text-amber-500 shrink-0" /> 
                        {student.total_time_spent}
                      </div>
                    </td>
                    <td className="p-5 md:p-8 text-center">
                      <button 
                        onClick={() => setSelectedStudent(student)} 
                        className="inline-flex items-center gap-2 text-[9px] font-black uppercase bg-secondary text-white px-5 py-2.5 rounded-xl hover:bg-black transition-all active:scale-95 shadow-md"
                      >
                        <Search size={14} /> HAFTALIK KARNE
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">
                    {loading ? "Veriler Hazırlanıyor..." : "Bu bölümde öğrenci bulunamadı."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* SAYFALANDIRMA KONTROLLERİ */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Toplam {totalCount} öğrenciden {analytics.length} tanesi gösteriliyor
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1 || loading}
              onClick={() => {
                const prevPage = Math.max(currentPage - 1, 1);
                if (prevPage !== currentPage) {
                  setCurrentPage(prevPage);
                  fetchAnalytics(selectedDepartment, prevPage);
                }
              }}
              className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm text-secondary disabled:opacity-30 hover:bg-gray-100 transition-all active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="bg-white border border-gray-200 px-6 py-2.5 rounded-xl shadow-sm text-[11px] font-black text-secondary">
              SAYFA {currentPage}
            </div>

            <button 
              disabled={analytics.length < 10 || loading}
              onClick={() => {
                const nextPage = currentPage + 1;
                setCurrentPage(nextPage);
                fetchAnalytics(selectedDepartment, nextPage);
              }}
              className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm text-secondary disabled:opacity-30 hover:bg-gray-100 transition-all active:scale-90"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
