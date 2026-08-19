"use client";
import React from 'react';
import { ListChecks, Award, Sparkles, ArrowRight } from 'lucide-react';
import { Material, WeeklyContent } from '../types';

interface QuizSectionProps {
  activeMaterial: Material;
  selectedWeek: WeeklyContent;
  completedMaterials: string[];
  quizResult: { score: number; correct: number; wrong: number } | null;
  selectedAnswers: Record<number, number>;
  quizSubmitting: boolean;
  setSelectedAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  handleQuizSubmit: () => void;
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

  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden w-full flex flex-col animate-in fade-in">
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
              {selectedWeek.current_attempt_round}. Tur Değerlendirmesi
            </p>
          </div>
        </div>
      </div>
      <div className="p-5 md:p-8 space-y-8 bg-gray-50/20">
        {isCompleted ? (
          <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto border-2 border-green-100 shadow-xl animate-bounce leading-none">
              <Award size={28} />
            </div>
            {quizResult && (
              <div className="space-y-4">
                <h3 className="text-xl md:text-2xl font-black text-secondary uppercase tracking-tighter text-primary">
                  Tebrikler!
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
                  <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-100 shadow-sm">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-2">SKOR</p>
                    <p className="text-xl font-black text-secondary">%{quizResult.score}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border-2 border-green-100 shadow-sm">
                    <p className="text-[8px] font-black text-green-600 uppercase mb-2">Doğru</p>
                    <p className="text-xl font-black text-green-600">{quizResult.correct}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-xl border-2 border-red-100 shadow-sm">
                    <p className="text-[8px] font-black text-red-600 uppercase mb-2">Yanlış</p>
                    <p className="text-xl font-black text-red-600">{quizResult.wrong}</p>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={handleFetchAIAnalysis}
              className="mx-auto flex items-center gap-2 bg-secondary text-white px-10 py-5 rounded-2xl font-black text-[10px] shadow-xl uppercase hover:scale-105 active:scale-95 transition-all mt-4"
            >
              <Sparkles size={16} className="text-primary animate-pulse" /> ANALİZİ GÖR VE DEVAM ET
            </button>
          </div>
        ) : (
          <div className="space-y-10">
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
                      {selectedAnswers[q.id] === opt.id && (
                        <ArrowRight size={14} className="shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={handleQuizSubmit}
              disabled={quizSubmitting}
              className="w-full bg-secondary text-white py-5 rounded-2xl font-black tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:bg-gray-200 uppercase mt-8 text-xs transition-all"
            >
              {quizSubmitting ? "GÖNDERİLİYOR..." : "TESTİ TAMAMLA"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
