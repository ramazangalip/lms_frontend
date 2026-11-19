"use client";
import React from 'react';

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

interface ExamScoreReportPdfProps {
  examData: ExamScoreData | null;
}

export const ExamScoreReportPdf: React.FC<ExamScoreReportPdfProps> = ({ examData }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  const deptDisplay = examData?.department_display || 'Bölüm';
  const cutoffDate = examData?.cutoff_date || '06.11.2026';
  const totalStudents = examData?.total_students || 0;
  const totalBefore = examData?.total_before_points || 0;
  const totalAfter = examData?.total_after_points || 0;
  const totalPts = examData?.total_points || 0;
  const students = examData?.students || [];

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .exam-pdf-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 8px !important;
          }
          .exam-pdf-table th {
            background-color: #f3f0ff !important;
            border: 1px solid #d4d0e8 !important;
            padding: 6px 4px !important;
            text-align: center !important;
            font-size: 8.5px !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            color: #4a3f6b !important;
          }
          .exam-pdf-table td {
            border: 1px solid #e5e7eb !important;
            padding: 5px 4px !important;
            font-size: 9px !important;
            vertical-align: middle !important;
          }
          .exam-pdf-table tr:nth-child(even) {
            background-color: #fafafa !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div
        id="exam-score-report-pdf"
        className="hidden print:block bg-white text-left p-2"
        style={{
          fontFamily: 'Arial, Helvetica, sans-serif',
          color: '#1a1a1a',
          maxWidth: '210mm',
          margin: '0 auto',
        }}
      >
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '8.5px', color: '#888' }}>{dateStr} {timeStr}</div>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#444', marginTop: '2px' }}>BÜ  LMS | Yapay Zeka Destekli  Sınıf</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '8.5px', color: '#888' }}>Rapor Tarihi: {dateStr} {timeStr}</div>
            <div style={{ fontSize: '8.5px', color: '#666', marginTop: '2px', fontWeight: 700 }}>Kategori: D1 (Yapay Zeka Destekli)</div>
          </div>
        </div>

        {/* TITLE */}
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#111', letterSpacing: '-0.3px' }}>
            BİNGÖL ÜNİVERSİTESİ - LMS  SINIF
          </div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#4a3f6b', marginTop: '3px' }}>
            D1 KATEGORİSİ MATERYAL PUAN RAPORU (VİZE ÖNCESİ & SONRASI)
          </div>
          <div style={{ fontSize: '9px', color: '#666', marginTop: '3px' }}>
            Bölüm: <strong>{deptDisplay}</strong> | Sınav Referansı: <strong>{cutoffDate} (Vize)</strong>
          </div>
        </div>

        {/* 4 ÖZET KUTU */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
          <div style={{ flex: 1, border: '1.5px solid #e5e7eb', borderRadius: '6px', padding: '6px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Öğrenci Sayısı:</div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#1a1a1a' }}>{totalStudents} Öğrenci</div>
          </div>
          <div style={{ flex: 1, border: '1.5px solid #86efac', borderRadius: '6px', padding: '6px 10px', textAlign: 'center', backgroundColor: '#f0fdf4' }}>
            <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Vizeden Önce Puan:</div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#16a34a' }}>{totalBefore} Puan</div>
          </div>
          <div style={{ flex: 1, border: '1.5px solid #d8b4fe', borderRadius: '6px', padding: '6px 10px', textAlign: 'center', backgroundColor: '#faf5ff' }}>
            <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#6b21a8', textTransform: 'uppercase' }}>Vizeden Sonra Puan:</div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#9333ea' }}>{totalAfter} Puan</div>
          </div>
          <div style={{ flex: 1, border: '1.5px solid #fca5a5', borderRadius: '6px', padding: '6px 10px', textAlign: 'center', backgroundColor: '#fef2f2' }}>
            <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>Toplam Puan:</div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#dc2626' }}>{totalPts} Puan</div>
          </div>
        </div>

        {/* BÖLÜM BİLGİ ŞERİDİ */}
        <div style={{ background: '#f3f0ff', border: '1px solid #d4d0e8', borderRadius: '6px', padding: '6px 12px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#4a3f6b' }}>{deptDisplay.toUpperCase()}</span>
            <span style={{ fontSize: '8.5px', color: '#666', marginLeft: '8px' }}>Kategori: D1 | Toplam {totalStudents} Öğrenci</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '9px', fontWeight: 700 }}>
            <span>Vizeden Önce: <strong style={{ color: '#16a34a' }}>{totalBefore}</strong> Puan</span>
            <span>Vizeden Sonra: <strong style={{ color: '#9333ea' }}>{totalAfter}</strong> Puan</span>
            <span>Bölüm Toplamı: <strong style={{ color: '#dc2626' }}>{totalPts}</strong> Puan</span>
          </div>
        </div>

        {/* ÖĞRENCİ TABLOSU */}
        <table className="exam-pdf-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '25px', textAlign: 'center' }}>#</th>
              <th style={{ textAlign: 'left', paddingLeft: '8px' }}>ÖĞRENCİ ADI SOYADI</th>
              <th style={{ textAlign: 'left', paddingLeft: '8px' }}>E-POSTA / NO</th>
              <th style={{ textAlign: 'center', width: '95px' }}>VİZEDEN ÖNCE PUAN</th>
              <th style={{ textAlign: 'center', width: '95px' }}>VİZEDEN SONRA PUAN</th>
              <th style={{ textAlign: 'center', width: '85px', backgroundColor: '#ebe5ff' }}>TOPLAM PUAN</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '15px', color: '#888' }}>
                  Bu bölümde listelenecek öğrenci verisi bulunamadı.
                </td>
              </tr>
            ) : (
              students.map((student, idx) => (
                <tr key={student.id}>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#888' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 700, paddingLeft: '8px' }}>{student.first_name} {student.last_name}</td>
                  <td style={{ fontSize: '8.5px', color: '#555', paddingLeft: '8px' }}>{student.email}</td>
                  <td style={{ textAlign: 'center' }}>
                    <strong style={{ color: '#16a34a' }}>{student.before_exam_points} Puan</strong>
                    <br />
                    <span style={{ fontSize: '7.5px', color: '#888' }}>({student.before_exam_material_count} materyal)</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <strong>{student.after_exam_points} Puan</strong>
                    <br />
                    <span style={{ fontSize: '7.5px', color: '#888' }}>({student.after_exam_material_count} materyal)</span>
                  </td>
                  <td style={{ textAlign: 'center', backgroundColor: '#faf5ff' }}>
                    <strong style={{ color: '#7c3aed', fontSize: '10.5px' }}>{student.total_points} Puan</strong>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* FOOTER */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', color: '#aaa' }}>
          <span>https://www.yapayzekadesteklidijitalsinif.com.tr/teacher-dashboard</span>
          <span>1/1</span>
        </div>
      </div>
    </>
  );
};
