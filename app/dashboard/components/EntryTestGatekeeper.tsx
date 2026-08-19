"use client";
import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RefreshCcw
} from 'lucide-react';
import { WeeklyContent } from '../types';

interface EntryTestGatekeeperProps {
  selectedWeek: WeeklyContent;
  entryResult: {
    unlockedWeeks: number[];
    isSuccess: boolean;
    correctCount: number;
    wrongCount: number;
  };
  entryAnswers: Record<number, number>;
  entrySubmitting: boolean;
  setEntryAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  handleEntryTestSubmit: () => void;
}

export const EntryTestGatekeeper: React.FC<EntryTestGatekeeperProps> = ({
  selectedWeek,
  entryResult,
  entryAnswers,
  entrySubmitting,
  setEntryAnswers,
  handleEntryTestSubmit,
}) => {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-14 space-y-10 animate-in zoom-in-95 duration-500">
      {entryResult.isSuccess ? (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
          <div className="text-center space-y-4">
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 bg-primary/20 rounded-[2rem] animate-ping" />
              <div className="relative bg-secondary text-primary w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl border-2 border-primary">
                <ShieldAlert size={40} />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-secondary uppercase tracking-tighter italic leading-none">
                HAZIRLIK ANALİZİ TAMAMLANDI
              </h2>
              <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                Performansınıza göre akademik yolunuz güncellendi
              </p>
            </div>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.07)] border-2 border-gray-50 space-y-10 relative overflow-hidden">
            <div className="relative z-10 space-y-10">
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-gray-100 flex flex-col items-center justify-center space-y-1">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                    Doğru
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-secondary italic">
                      {entryResult.correctCount}
                    </span>
                    <CheckCircle2 size={20} className="text-green-500" />
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-gray-100 flex flex-col items-center justify-center space-y-1">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                    Yanlış
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-secondary italic">
                      {entryResult.wrongCount}
                    </span>
                    <XCircle size={20} className="text-primary" />
                  </div>
                </div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-secondary text-white py-6 rounded-[2rem] font-black tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 border-b-4 border-primary uppercase text-xs"
              >
                HAFTA İÇERİKLERİNE GİT <ChevronRight size={20} className="text-primary" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center space-y-4">
            <div className="bg-primary/10 text-primary w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto border-2 border-primary/20 shadow-xl shadow-primary/10">
              <RefreshCcw size={32} />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-secondary uppercase tracking-tighter leading-none">
              HAFTALIK HAZIRLIK KAPISI
            </h2>
            <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed max-w-md mx-auto">
              İçeriklere erişmek için geçmiş konuları içeren hazırlık testini tamamlamalısınız.
            </p>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.07)] border-2 border-gray-50 space-y-10 relative overflow-hidden">
            <div className="space-y-12 relative z-10">
              {selectedWeek.entry_questions?.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="space-y-6 text-left border-b border-gray-100 pb-10 last:border-0 last:pb-0"
                >
                  <div className="flex gap-5 items-start">
                    <span className="bg-primary text-white w-9 h-9 rounded-2xl flex items-center justify-center font-black shrink-0 shadow-lg shadow-red-200 text-sm italic">
                      {qIdx + 1}
                    </span>
                    <h3 className="text-base md:text-lg font-black text-secondary leading-tight pt-1 uppercase tracking-tight">
                      {q.question_text}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3 pl-14">
                    {q.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() =>
                          setEntryAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                        }
                        className={`p-5 rounded-[1.25rem] text-left text-[11px] font-black border-2 transition-all flex items-center justify-between group ${
                          entryAnswers[q.id] === opt.id
                            ? 'bg-primary border-primary text-white shadow-xl translate-x-2'
                            : 'bg-gray-50 border-gray-50 text-gray-500 hover:border-primary/20 hover:bg-white'
                        }`}
                      >
                        <span className="flex-1 pr-2 uppercase tracking-wide">
                          {opt.option_text}
                        </span>
                        {entryAnswers[q.id] === opt.id && (
                          <CheckCircle2
                            size={18}
                            className="shrink-0 text-white animate-in zoom-in"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleEntryTestSubmit}
              disabled={
                entrySubmitting ||
                Object.keys(entryAnswers).length <
                  (selectedWeek.entry_questions?.length || 0)
              }
              className="w-full bg-secondary text-white py-6 rounded-[2rem] font-black tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-[0.98] disabled:bg-gray-100 disabled:text-gray-400 uppercase flex items-center justify-center gap-3 text-xs md:text-sm border-b-4 border-primary"
            >
              {entrySubmitting ? (
                <RefreshCcw size={20} className="animate-spin" />
              ) : (
                <>
                  TESTİ TAMAMLA VE HAFTAYI AÇ <ChevronRight size={20} className="text-primary" />
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
