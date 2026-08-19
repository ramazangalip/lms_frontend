"use client";
import React from 'react';
import { Bot, X, Sparkles } from 'lucide-react';

interface AIAnalysisModalProps {
  isAnalysisModalOpen: boolean;
  isAnalysisLoading: boolean;
  aiAnalysisFeedback: string | null;
  setIsAnalysisModalOpen: (open: boolean) => void;
  handleCloseModalAndRefresh: () => void;
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({
  isAnalysisModalOpen,
  isAnalysisLoading,
  aiAnalysisFeedback,
  setIsAnalysisModalOpen,
  handleCloseModalAndRefresh,
}) => {
  if (!isAnalysisModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-secondary/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto leading-none text-left">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden border-4 border-white my-auto flex flex-col max-h-[90vh] leading-none text-left">
        {/* MODAL BAŞLIK ALANI */}
        <div className="bg-secondary p-8 flex items-center justify-between text-white border-b-4 border-primary leading-none text-left">
          <div className="flex items-center gap-5 leading-none text-left">
            <div className="bg-primary p-3 rounded-2xl shadow-lg leading-none text-center shadow-red-500/20">
              <Bot size={28} className="text-left" />
            </div>
            <div className="leading-none text-left">
              <h3 className="font-black uppercase tracking-tighter text-xl leading-none text-left">
                BÜ-AI Analiz Raporu
              </h3>
              <p className="text-primary text-[10px] font-bold uppercase tracking-widest mt-1 leading-none text-left">
                Eğitim Mentörü
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAnalysisModalOpen(false)}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary transition-all leading-none text-center"
          >
            <X size={24} className="text-left" />
          </button>
        </div>

        {/* İÇERİK ALANI */}
        <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50 min-h-[300px] leading-relaxed text-left">
          {isAnalysisLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-8 leading-none text-center">
              <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-secondary font-black text-xl uppercase tracking-widest animate-pulse">
                Analiz Hazırlanıyor...
              </p>
            </div>
          ) : (
            <div className="bg-white border-2 border-primary/10 p-8 rounded-[2.5rem] shadow-sm leading-relaxed animate-in slide-in-from-bottom-4 text-left">
              <div className="flex items-center gap-3 mb-6 text-primary leading-none text-left">
                <Sparkles size={20} className="text-left" />
                <span className="font-black text-xs uppercase tracking-widest leading-none text-left">
                  Akıllı Geri Bildirim
                </span>
              </div>
              <p className="text-secondary font-medium leading-relaxed text-base whitespace-pre-line text-left">
                {aiAnalysisFeedback}
              </p>
            </div>
          )}
        </div>

        {/* MODAL ALT BUTON ALANI */}
        <div className="p-8 bg-white border-t flex justify-center leading-none text-left">
          <button
            onClick={handleCloseModalAndRefresh}
            className="w-full md:w-auto bg-secondary text-white px-16 py-5 rounded-[2rem] font-black text-xs uppercase shadow-xl active:scale-95 leading-none text-left transition-transform hover:scale-[1.02]"
          >
            Anladım, Devam Et
          </button>
        </div>
      </div>
    </div>
  );
};
