"use client";

import React, { useState, useEffect } from 'react';
import { ListChecks, Award, Sparkles, Target, Compass, CheckCircle2, AlertCircle } from 'lucide-react';
import { Material, WeeklyContent } from '../types';

interface QuizSectionProps {
  activeMaterial: Material;
  selectedWeek: WeeklyContent;
  completedMaterials: string[];
  quizResult: { score: number; correct: number; wrong: number; predicted_score?: number; calibration_gap?: number } | null;
  selectedAnswers: Record<number, number>;
  quizSubmitting: boolean;
  setSelectedAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  handleQuizSubmit: (predictedScore?: number) => void;
  handleFetchAIAnalysis: () => void;
}

export const QuizSection: React.FC<QuizSectionProps> = ({
  activeMaterial,
  selectedWeek,
  completedMaterials,
  quizResult,
  selectedAnswers,
  quizSubmitting,
  setSelectedAnswers,
  handleQuizSubmit,
  handleFetchAIAnalysis,
}) => {
  const isCompleted = completedMaterials.includes(String(activeMaterial.id)) || quizResult !== null;

  // Üstbilişsel Tahmin (Kalibrasyon) State'leri
  const [predictedScore, setPredictedScore] = useState<number>(75);
  const [isEstimationConfirmed, setIsEstimationConfirmed] = useState<boolean>(false);

  // Aktif materyal değiştiğinde zorunlu tahmin adımı sıfırlansın
  useEffect(() => {
    setIsEstimationConfirmed(false);
    setPredictedScore(75);
  }, [activeMaterial.id]);

  // Kalibrasyon Geri Bildirim Mesajı Üretici
  const getCalibrationFeedback = (pred: number, actual: number) => {
    const gap = Math.abs(pred - actual);
    if (gap <= 10) {
      return {
        style: "bg-green-50 text-green-700 border-green-200",
        icon: <CheckCircle2 size={18} className="text-green-600 shrink-0" />,
        text: "Harika üstbilişsel farkındalık! Kendi bilgini ve öğrenme düzeyini çok doğru tahmin ettin."
      };
    }
    if (gap <= 20) {
      return {
        style: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <Compass size={18} className="text-blue-600 shrink-0" />,
        text: "İyi bir tahmin! Kendi performansınla uyumlu bir beklentin var."
      };
    }
    return {
      style: "bg-amber-50 text-amber-800 border-amber-200",
      icon: <AlertCircle size={18} className="text-amber-600 shrink-0" />,
      text: "Tahminin ile gerçek başarın arasında fark var; eksik konuları pekiştirme turunda tekrar gözden geçirebilirsin."
    };
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden w-full flex flex-col animate-in fade-in">
      
      {/* ÜST HEADER */}
      <div className="bg-secondary p-6 flex items-center justify-between text-white border-b-2 border-primary">
        <div className="flex items-center gap-4 text-left">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg shrink-0">
            <ListChecks size={20} />
          </div>
          <div>
            <h2 className="text-white font-black text-base md:text-lg uppercase tracking-tighter mb-1">
              {activeMaterial.quiz?.title || activeMaterial.title}
            </h2>
            <p className="text-gray-400 text-[8px] font-bold uppercase tracking-widest">
              {selectedWeek.current_attempt_round || 1}. Tur Değerlendirmesi
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-8 space-y-8 bg-gray-50/20">
        
        {/* CASE 1: TEST ZATEN TAMAMLANDIYSA (SONUÇ VE KALİBRASYON KARTI) */}
        {isCompleted ? (
          <div className="text-center py-4 space-y-6 animate-in zoom-in-95 max-w-3xl mx-auto">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto border-2 border-green-100 shadow-xl animate-bounce leading-none">
              <Award size={32} />
            </div>

            {quizResult && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-secondary uppercase tracking-tighter text-primary mb-1">
                    Tebrikler! Testi Tamamladınız
                  </h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Haftalık Değerlendirme & Üstbilişsel Kalibrasyon Raporu
                  </p>
                </div>

                {/* TEMEL PUAN KARTLARI */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm text-center">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">GERÇEK SKOR</p>
                    <p className="text-2xl font-black text-secondary">%{quizResult.score}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-2xl border-2 border-green-100 shadow-sm text-center">
                    <p className="text-[8px] font-black text-green-600 uppercase mb-1">DOĞRU SAYISI</p>
                    <p className="text-2xl font-black text-green-600">{quizResult.correct}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-2xl border-2 border-red-100 shadow-sm text-center">
                    <p className="text-[8px] font-black text-red-600 uppercase mb-1">YANLIŞ SAYISI</p>
                    <p className="text-2xl font-black text-red-600">{quizResult.wrong}</p>
                  </div>
                </div>

                {/* ÜSTBİLİŞSEL KALİBRASYON ANALİZİ KARTI */}
                {quizResult.predicted_score !== undefined && quizResult.predicted_score !== null && (
                  <div className="bg-gradient-to-r from-gray-900 to-black text-white rounded-3xl p-6 shadow-xl text-left space-y-4 border-b-4 border-red-600">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-amber-400">
                        <Target size={16} /> ÜSTBİLİŞSEL TAHMİN & KALİBRASYON KARTI
                      </h4>
                      <span className="text-[9px] font-black bg-white/10 px-2.5 py-1 rounded-full uppercase tracking-widest">
                        Ön Tahmin Analizi
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center bg-white/5 p-3 rounded-2xl border border-white/10">
                      <div>
                        <span className="text-[8px] font-black text-gray-400 block uppercase">Ön Tahmin</span>
                        <span className="text-lg font-black text-amber-300">%{quizResult.predicted_score}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-gray-400 block uppercase">Gerçek Başarı</span>
                        <span className="text-lg font-black text-white">%{quizResult.score}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-gray-400 block uppercase">Kalibrasyon Sapması</span>
                        <span className="text-lg font-black text-red-400">
                          ±{Math.abs(quizResult.predicted_score - quizResult.score)} Puan
                        </span>
                      </div>
                    </div>

                    {/* Dinamik Kalibrasyon Mesajı */}
                    {(() => {
                      const fb = getCalibrationFeedback(quizResult.predicted_score, quizResult.score);
                      return (
                        <div className={`p-3 rounded-2xl border flex items-start gap-3 text-xs font-bold leading-relaxed ${fb.style}`}>
                          {fb.icon}
                          <span>{fb.text}</span>
                        </div>
                      );
                    })()}
                  </div>
                )}

              </div>
            )}

            <button
              onClick={handleFetchAIAnalysis}
              className="mx-auto flex items-center gap-2 bg-secondary text-white px-10 py-5 rounded-2xl font-black text-[10px] shadow-xl uppercase hover:scale-105 active:scale-95 transition-all mt-4"
            >
              <Sparkles size={16} className="text-primary animate-pulse" /> ANALİZİ GÖR VE DEVAM ET
            </button>
          </div>
        ) : !isEstimationConfirmed ? (
          /* CASE 2: ZORUNLU TAHMİN ADIMI (TEST SORULARI AÇILMADAN ÖNCE) */
          <div className="py-8 px-4 max-w-xl mx-auto text-center space-y-8 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto border-2 border-red-100 shadow-xl rotate-3">
              <Target size={40} className="-rotate-3" />
            </div>

            <div>
              <span className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-full uppercase tracking-widest border border-red-100">
                ZORUNLU ÜSTBİLİŞSEL ADIM
              </span>
              <h3 className="text-xl md:text-2xl font-black text-black uppercase tracking-tight mt-3 mb-2">
                TEST ÖNCESİ BAŞARI TAHMİNİ
              </h3>
              <p className="text-xs text-gray-500 font-bold leading-relaxed">
                Test sorularını görmeden önce kendi bilgi seviyeni değerlendir. Bu testten kaç puan almayı tahmin ediyorsun? (%0 - %100)
              </p>
            </div>

            {/* YÜZDELİK GİRİŞ ALANI: SAYISAL INPUT + RANGE SLIDER + HIZLI BUTONLAR */}
            <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-lg space-y-6 text-left">
              
              {/* Sayısal Girdi & Büyük Gösterge */}
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <label className="text-xs font-black uppercase text-gray-700">
                  Tahmini Başarı Yüzden:
                </label>
                <div className="flex items-center gap-1 bg-red-50 px-4 py-2 rounded-2xl border-2 border-red-200">
                  <span className="text-xl font-black text-red-600">%</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={predictedScore}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                      setPredictedScore(val);
                    }}
                    className="w-16 text-2xl font-black text-red-600 bg-transparent text-right outline-none"
                  />
                </div>
              </div>

              {/* Range Slider (%0 - %100 Sürükleme) */}
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase">
                  <span>%0</span>
                  <span>%50</span>
                  <span>%100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={predictedScore}
                  onChange={(e) => setPredictedScore(Number(e.target.value))}
                  className="w-full h-3 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
              </div>

              {/* Hızlı Seçim Butonları (%0 - %100 Tüm Yüzdelikler) */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-gray-400 uppercase block">Hızlı Seçim:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {[0, 25, 50, 60, 75, 80, 90, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPredictedScore(val)}
                      className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase transition-all ${
                        predictedScore === val
                          ? 'bg-red-600 text-white shadow-md scale-105'
                          : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      %{val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ONAY BUTONU: SORULARI AÇAR */}
            <button
              type="button"
              onClick={() => setIsEstimationConfirmed(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-black tracking-[0.15em] shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] uppercase text-xs transition-all"
            >
              <Target size={18} /> TAHMİNİ ONAYLA VE TESTE BAŞLA
            </button>
          </div>
        ) : (
          /* CASE 3: TAHMİN ONAYLANDIKTAN SONRA SORULAR GÖRÜNÜR */
          <div className="space-y-10">

            {/* ONAYLANAN TAHMİN ÖZET BARI */}
            <div className="bg-gray-100/80 p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase">
                <Target size={16} className="text-red-600" />
                <span>Kayıtlı Test Öncesi Tahmininiz:</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-red-600 bg-white px-3 py-1 rounded-xl border border-red-200 shadow-sm">
                  %{predictedScore}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEstimationConfirmed(false)}
                  className="text-[9px] font-black text-gray-400 hover:text-red-600 underline uppercase"
                >
                  Değiştir
                </button>
              </div>
            </div>

            {/* SORULAR LİSTESİ */}
            {activeMaterial.quiz?.questions.map((q, qIdx) => (
              <div
                key={q.id}
                className="space-y-5 text-left border-b border-gray-100 pb-8 last:border-0 last:pb-0"
              >
                <h3 className="text-sm md:text-base font-black text-secondary flex gap-3 leading-tight">
                  <span className="text-primary shrink-0">0{qIdx + 1}.</span>
                  <span className="break-words">{q.question_text}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:pl-8">
                  {q.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() =>
                        setSelectedAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                      }
                      className={`p-4 rounded-2xl text-left text-[11px] font-bold border-2 transition-all flex items-center justify-between group min-h-[56px] ${
                        selectedAnswers[q.id] === opt.id
                          ? 'bg-primary border-primary text-white shadow-lg'
                          : 'bg-white border-gray-100 text-gray-500 hover:border-red-100'
                      }`}
                    >
                      <span className="pr-2">{opt.option_text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* TESTİ TAMAMLA VE GÖNDER BUTONU */}
            <button
              onClick={() => handleQuizSubmit(predictedScore)}
              disabled={quizSubmitting}
              className="w-full bg-secondary text-white py-5 rounded-2xl font-black tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:bg-gray-200 uppercase mt-8 text-xs transition-all"
            >
              {quizSubmitting ? "GÖNDERİLİYOR..." : "TESTİ TAMAMLA VE GÖNDER"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
