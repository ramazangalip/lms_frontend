"use client";
import React from 'react';
import {
  Video,
  Headphones,
  Download,
  Sparkles,
  ListChecks,
  CheckCircle2,
  Lock,
  ChevronRight,
  FileText,
  Eye
} from 'lucide-react';
import { Material, WeeklyContent } from '../types';
import { QuizSection } from './QuizSection';

interface MaterialViewerProps {
  activeMaterial: Material | null;
  selectedWeek: WeeklyContent;
  completedMaterials: string[];
  isQuizLocked: boolean;
  getSortedMaterials: (mats: Material[]) => Material[];
  setActiveMaterial: (m: Material) => void;
  handleCompleteMaterial: (id: number | string) => void;
  quizResult: { score: number; correct: number; wrong: number } | null;
  selectedAnswers: Record<number, number>;
  quizSubmitting: boolean;
  setSelectedAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  handleQuizSubmit: () => void;
  handleFetchAIAnalysis: () => void;
}

export const MaterialViewer: React.FC<MaterialViewerProps> = ({
  activeMaterial,
  selectedWeek,
  completedMaterials,
  isQuizLocked,
  getSortedMaterials,
  setActiveMaterial,
  handleCompleteMaterial,
  quizResult,
  selectedAnswers,
  quizSubmitting,
  setSelectedAnswers,
  handleQuizSubmit,
  handleFetchAIAnalysis,
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-10 items-start">
      {/* SOL: DİKEY MATERYAL SEÇİCİ */}
      <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-24 space-y-3">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-2">
          Eğitim Materyalleri
        </p>
        <div className="flex flex-col gap-2.5">
          {getSortedMaterials(selectedWeek.materials).map((mat) => {
            const MatIcon =
              mat.content_type === 'video'
                ? Video
                : mat.content_type === 'podcast'
                ? Headphones
                : mat.content_type === 'pdf'
                ? Download
                : mat.content_type === 'assignment'
                ? Sparkles
                : ListChecks;

            const isLocked = mat.content_type === 'form' && isQuizLocked;
            const isDone = completedMaterials.includes(String(mat.id));
            const isActive = activeMaterial?.id === mat.id;

            return (
              <button
                key={mat.id}
                onClick={() => setActiveMaterial(mat)}
                disabled={isLocked && !isDone}
                className={`flex items-center gap-4 p-4 rounded-2xl text-[11px] font-black transition-all border-2 text-left group relative overflow-hidden ${
                  isActive
                    ? 'bg-secondary border-secondary text-white shadow-2xl scale-[1.02] z-10'
                    : isLocked
                    ? 'bg-gray-50 border-transparent text-gray-300 cursor-not-allowed'
                    : 'bg-white border-gray-100 text-gray-500 hover:border-primary/30 hover:bg-gray-50'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'bg-gray-100 text-gray-400 group-hover:text-primary'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} className="text-green-500" />
                  ) : isLocked ? (
                    <Lock size={18} />
                  ) : (
                    <MatIcon size={18} />
                  )}
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="uppercase tracking-tight truncate leading-tight">
                    {mat.title}
                  </span>
                  <span
                    className={`text-[8px] font-bold uppercase tracking-widest ${
                      isActive ? 'text-white/50' : 'text-gray-400'
                    }`}
                  >
                    {mat.content_type}
                  </span>
                </div>
                {isActive && (
                  <div className="ml-auto animate-in slide-in-from-left-2">
                    <ChevronRight size={16} className="text-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* SAĞ: AKTİF MATERYAL VE DERS NOTLARI */}
      <div className="flex-1 min-w-0 w-full">
        {activeMaterial ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <section className="material-display-area">
              {activeMaterial.content_type === 'assignment' ? (
                <div className="bg-white border-4 border-gray-50 p-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-8 text-center max-w-3xl mx-auto relative overflow-hidden">
                  <div className="absolute top-6 right-6 bg-amber-100 text-amber-700 px-4 py-2 rounded-2xl font-black text-[10px] shadow-sm border border-amber-200 tracking-widest uppercase">
                    +{activeMaterial.point_value || 0} PUAN
                  </div>
                  <div className="bg-amber-50 p-6 rounded-3xl text-amber-600 animate-pulse mt-4">
                    <Sparkles size={64} />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl md:text-3xl font-black text-secondary uppercase tracking-tighter leading-none">
                      HAFTALIK ÖDEV FORMU
                    </h3>
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed max-w-md mx-auto">
                      {selectedWeek.current_attempt_round > 1
                        ? "2. Tur kapsamında ödevi tekrar inceleyebilirsin."
                        : "Ödevi tamamlayarak akademik puanını kazan!"}
                    </p>
                  </div>
                  <a
                    href={activeMaterial.embed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleCompleteMaterial(activeMaterial.id)}
                    className="bg-secondary text-white px-12 py-5 rounded-2xl font-black tracking-[0.2em] flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all text-xs uppercase"
                  >
                    ÖDEVİ AÇ
                  </a>
                </div>
              ) : activeMaterial.content_type === 'pdf' ? (
                <div className="bg-white border-4 border-gray-50 p-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-8 text-center max-w-3xl mx-auto">
                  <div className="bg-primary/10 p-6 rounded-3xl text-primary animate-pulse">
                    <FileText size={64} />
                  </div>
                  <div className="space-y-2 leading-tight">
                    <h3 className="text-2xl font-black text-secondary uppercase tracking-tighter">
                      {activeMaterial.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      OneDrive üzerinden dökümana ulaşabilirsiniz.
                    </p>
                  </div>
                  <a
                    href={activeMaterial.embed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleCompleteMaterial(activeMaterial.id)}
                    className="bg-secondary text-white px-12 py-5 rounded-2xl font-black tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all text-xs uppercase"
                  >
                    <Download size={18} className="text-primary" /> DERS NOTUNU AÇ / İNDİR
                  </a>
                </div>
              ) : activeMaterial.content_type !== 'form' ? (
                <div className="relative aspect-video shadow-2xl rounded-3xl overflow-hidden bg-black border-4 border-gray-50 ring-1 ring-gray-200 w-full">
                  <iframe
                    src={activeMaterial.embed_url}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <QuizSection
                  activeMaterial={activeMaterial}
                  selectedWeek={selectedWeek}
                  completedMaterials={completedMaterials}
                  quizResult={quizResult}
                  selectedAnswers={selectedAnswers}
                  quizSubmitting={quizSubmitting}
                  setSelectedAnswers={setSelectedAnswers}
                  handleQuizSubmit={handleQuizSubmit}
                  handleFetchAIAnalysis={handleFetchAIAnalysis}
                />
              )}
            </section>
          </div>
        ) : (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100 text-gray-300 gap-5">
            <Eye size={64} className="opacity-10" />
            <span className="font-black uppercase tracking-widest italic">
              MATERYAL SEÇİNİZ
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
