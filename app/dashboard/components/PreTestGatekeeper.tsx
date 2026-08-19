"use client";
import React from 'react';
import {
  Zap,
  ShieldCheck,
  ListChecks,
  CheckCircle2,
  Sparkles,
  RefreshCcw,
  ArrowRight
} from 'lucide-react';
import { Question } from '../types';

interface PreTestGatekeeperProps {
  introStatus: { url: string; title: string; isWatched: boolean; description: string };
  preTestResult: { score: number; correct?: number; wrong?: number; is_completed: boolean } | null;
  preTestQuestions: Question[];
  preTestAnswers: Record<number, number>;
  preTestSubmitting: boolean;
  setPreTestAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  handlePreTestSubmit: () => void;
}

export const PreTestGatekeeper: React.FC<PreTestGatekeeperProps> = ({
  introStatus,
  preTestResult,
  preTestQuestions,
  preTestAnswers,
  preTestSubmitting,
  setPreTestAnswers,
  handlePreTestSubmit,
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-14 space-y-12 animate-in fade-in duration-700">
      {/* TANITIM BÖLÜMÜ */}
      <div className="space-y-10 text-center leading-none">
        <div className="text-center space-y-4">
          <div className="bg-primary/10 text-primary w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border border-primary/20 animate-pulse">
            <Zap size={28} />
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-secondary uppercase tracking-tighter leading-none">
            {introStatus.title}
          </h2>
          <div className="bg-gray-50 px-4 py-2.5 rounded-xl border flex items-center gap-3 mx-auto w-fit shadow-sm">
            <ShieldCheck size={16} className={introStatus.isWatched ? "text-green-500" : "text-primary"} />
            <span className="text-[10px] font-black uppercase tracking-widest text-secondary">
              {introStatus.isWatched
                ? "TANITIM VİDEOSU İZLENDİ"
                : "SİSTEME GİRİŞ İÇİN ÖNCE VİDEOYU İZLEMELİSİNİZ"}
            </span>
          </div>
        </div>

        {introStatus.url && (
          <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-gray-50 ring-1 ring-gray-200 bg-secondary">
            <iframe src={introStatus.url} className="w-full h-full" allowFullScreen></iframe>
          </div>
        )}

        {introStatus.description && (
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border-2 border-gray-50 shadow-xl text-left leading-relaxed">
            <p className="text-gray-600 text-sm md:text-base font-medium whitespace-pre-line italic">
              {introStatus.description}
            </p>
          </div>
        )}
      </div>

      {/* ÖN DEĞERLENDİRME TESTİ (GENEL GATEKEEPER) */}
      <div className="pt-10 space-y-8">
        <div className="flex items-center gap-4 justify-center">
          <div className="h-px bg-gray-200 flex-1"></div>
          <div className="bg-purple-50 text-purple-600 px-6 py-2.5 rounded-full border border-purple-100 flex items-center gap-2 shadow-sm">
            <ListChecks size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Sistem Giriş Seviye Belirleme
            </span>
          </div>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {preTestResult?.is_completed ? (
          <div className="bg-gradient-to-br from-green-50 to-white p-10 rounded-[3rem] border-2 border-green-100 shadow-xl text-center space-y-8 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200">
              <CheckCircle2 size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-secondary uppercase tracking-tighter leading-none">
                ÖN DEĞERLENDİRME TAMAMLANDI
              </h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-none">
                Akademik profiliniz oluşturuldu
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[8px] font-black text-gray-400 uppercase mb-2">DOĞRU</p>
                <p className="text-lg font-black text-green-600">{preTestResult.correct ?? '0'}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[8px] font-black text-gray-400 uppercase mb-2">YANLIŞ</p>
                <p className="text-lg font-black text-red-600">{preTestResult.wrong ?? '0'}</p>
              </div>
              <div className="bg-secondary p-4 rounded-2xl shadow-md">
                <p className="text-[8px] font-black text-white/50 uppercase mb-2">SKOR</p>
                <p className="text-lg font-black text-white">%{preTestResult.score}</p>
              </div>
            </div>
            <div className="pt-4">
              <div className="bg-secondary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] animate-pulse inline-flex items-center gap-3">
                <Sparkles size={16} className="text-primary" />
                EĞİTİM İÇERİKLERİ ERİŞİME AÇILDI!
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 md:p-14 rounded-[3rem] shadow-2xl border-2 border-gray-50 space-y-12">
            <div className="space-y-10">
              {preTestQuestions.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="space-y-6 text-left border-b border-gray-50 pb-8 last:border-0 last:pb-0"
                >
                  <div className="flex gap-4 items-start">
                    <span className="bg-purple-600 text-white w-8 h-8 rounded-xl flex items-center justify-center font-black shrink-0 shadow-lg shadow-purple-200 text-sm">
                      {qIdx + 1}
                    </span>
                    <h3 className="text-base md:text-lg font-black text-secondary leading-tight pt-1">
                      {q.question_text}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                    {q.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() =>
                          setPreTestAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                        }
                        className={`p-4 rounded-2xl text-left text-xs font-bold border-2 transition-all flex items-center justify-between group ${
                          preTestAnswers[q.id] === opt.id
                            ? 'bg-purple-600 border-purple-600 text-white shadow-xl scale-[1.02]'
                            : 'bg-white border-gray-100 text-gray-500 hover:border-purple-200 hover:bg-purple-50/30'
                        }`}
                      >
                        <span className="flex-1 pr-2">{opt.option_text}</span>
                        {preTestAnswers[q.id] === opt.id && (
                          <CheckCircle2 size={16} className="shrink-0 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handlePreTestSubmit}
              disabled={
                preTestSubmitting ||
                Object.keys(preTestAnswers).length < preTestQuestions.length
              }
              className="w-full bg-secondary text-white py-6 rounded-3xl font-black tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 text-xs md:text-sm uppercase"
            >
              {preTestSubmitting ? (
                <RefreshCcw size={20} className="animate-spin" />
              ) : (
                <>
                  ÖN TESTİ GÖNDER VE EĞİTİMİ BAŞLAT <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
