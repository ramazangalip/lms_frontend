"use client";
import React from 'react';
import { BookOpen, FileText, ArrowRight } from 'lucide-react';
import { WeeklyContent } from '../types';

interface FlashcardsSectionProps {
  selectedWeek: WeeklyContent;
}

export const FlashcardsSection: React.FC<FlashcardsSectionProps> = ({ selectedWeek }) => {
  return (
    <section className="flashcard-notes-grid space-y-12">
      {selectedWeek.flashcards && selectedWeek.flashcards.length > 0 && (
        <div className="bg-gray-50 p-6 md:p-10 rounded-[3rem] border border-gray-100 space-y-8">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-3 rounded-2xl text-white shadow-lg shadow-red-500/20">
              <BookOpen size={24} />
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              Çalışma Kartları
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedWeek.flashcards.map((card) => (
              <a
                key={card.id}
                href={card.answer}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white p-5 rounded-2xl border-2 border-gray-100 hover:border-primary hover:shadow-xl transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-4 text-left min-w-0">
                  <div className="bg-red-50 text-primary p-3 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 truncate">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">
                      Döküman
                    </p>
                    <p className="font-bold text-secondary text-xs group-hover:text-primary transition-colors uppercase truncate">
                      {card.question}
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-gray-300 group-hover:text-primary shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-[3rem] border-2 border-gray-50 shadow-xl overflow-hidden flex flex-col min-h-[300px]">
        <div className="bg-gray-50/80 px-8 py-6 border-b border-gray-100 flex items-center gap-4 shrink-0">
          <FileText size={24} className="text-primary" />
          <h3 className="font-black text-secondary uppercase tracking-widest text-[10px]">
            Haftalık Not Özeti
          </h3>
        </div>
        <div className="p-8 md:p-10 text-gray-600 leading-relaxed text-sm md:text-base italic font-light overflow-y-auto whitespace-pre-line text-left">
          {selectedWeek.description || "Bu haftaya ait ders notu bulunamadı."}
        </div>
      </div>
    </section>
  );
};
