"use client";
import React from 'react';
import { FileText, Sparkles, RefreshCcw, ChevronRight } from 'lucide-react';
import { WeeklyContent } from '../types';

interface SurveyGatekeeperProps {
  selectedWeek: WeeklyContent;
  surveyAnswers: Record<number, number>;
  surveySubmitting: boolean;
  setSurveyAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  handleSurveySubmit: () => void;
}

export const SurveyGatekeeper: React.FC<SurveyGatekeeperProps> = ({
  selectedWeek,
  surveyAnswers,
  surveySubmitting,
  setSurveyAnswers,
  handleSurveySubmit,
}) => {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-14 space-y-10 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <div className="bg-purple-100 text-purple-600 w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto border-2 border-purple-200 shadow-xl shadow-purple-500/10">
          <FileText size={32} />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-secondary uppercase italic">
          {selectedWeek.survey_data?.title && selectedWeek.survey_data.title.length > 2
            ? selectedWeek.survey_data.title
            : "BİLİMSEL ANALİZ VE DEĞERLENDİRME"}
        </h2>
        <div className="h-1 w-20 bg-purple-500 mx-auto rounded-full" />
        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed max-w-md mx-auto">
          Haftalık materyallere erişmek için lütfen bu bilimsel ölçeği size en uygun cevaplarla doldurunuz.
        </p>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border-2 border-purple-50 space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-purple-600">
          <Sparkles size={120} />
        </div>

        <div className="space-y-12 relative z-10">
          {selectedWeek.survey_data?.questions.map((q, qIdx) => (
            <div
              key={q.id}
              className="space-y-6 text-left border-b border-gray-50 pb-10 last:border-0 last:pb-0"
            >
              <div className="flex gap-5 items-start">
                <span className="bg-purple-600 text-white w-8 h-8 rounded-xl flex items-center justify-center font-black shrink-0 shadow-lg shadow-purple-200 text-xs italic">
                  {qIdx + 1}
                </span>
                <h3 className="text-sm md:text-base font-black text-secondary leading-tight pt-1 uppercase">
                  {q.text}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pl-14">
                {(q.options && q.options.length > 0
                  ? q.options
                  : [
                      { option_text: "Hiçbir zaman", value: 1 },
                      { option_text: "Ender olarak", value: 2 },
                      { option_text: "Bazen", value: 3 },
                      { option_text: "Sıklıkla", value: 4 },
                      { option_text: "Her zaman", value: 5 }
                    ]
                )
                  .sort((a, b) => Number(a.value) - Number(b.value))
                  .map((opt, oIdx) => {
                    const currentValue = opt.value || oIdx + 1;
                    const uniqueKey = `q-${q.id}-opt-${currentValue}`;

                    return (
                      <button
                        key={uniqueKey}
                        onClick={() =>
                          setSurveyAnswers((prev) => ({ ...prev, [q.id]: currentValue }))
                        }
                        className={`p-4 rounded-2xl text-[10px] font-black border-2 transition-all flex flex-col items-center justify-center gap-2 group ${
                          surveyAnswers[q.id] === currentValue
                            ? 'bg-purple-600 border-purple-600 text-white shadow-xl scale-105'
                            : 'bg-gray-50 border-gray-50 text-gray-400 hover:border-purple-200 hover:bg-white'
                        }`}
                      >
                        <span className="text-xs font-black">{currentValue}</span>
                        <span className="text-[7px] uppercase text-center leading-tight opacity-80">
                          {opt.option_text}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSurveySubmit}
          disabled={
            surveySubmitting ||
            Object.keys(surveyAnswers).length <
              (selectedWeek.survey_data?.questions.length || 0)
          }
          className="w-full bg-secondary text-white py-6 rounded-[2rem] font-black tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 uppercase text-xs border-b-4 border-purple-600 active:scale-95 disabled:bg-gray-100 disabled:text-gray-400"
        >
          {surveySubmitting ? (
            <RefreshCcw size={20} className="animate-spin" />
          ) : (
            <>
              ANKETİ TAMAMLA VE DEVAM ET <ChevronRight size={20} className="text-purple-400" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
