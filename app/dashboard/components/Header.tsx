"use client";
import React from 'react';
import { Menu, Award, Trophy, User } from 'lucide-react';
import Link from 'next/link';
import { WeeklyContent } from '../types';

interface HeaderProps {
  selectedWeek: WeeklyContent | null;
  userTotalPoints: number;
  pointsEarned: { show: boolean; amount: number };
  setIsSidebarOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedWeek,
  userTotalPoints,
  pointsEarned,
  setIsSidebarOpen,
}) => {
  return (
    <>
      {/* YEŞİL ŞEFFAF PUAN BİLDİRİMİ */}
      {pointsEarned.show && (
        <div className="fixed top-6 right-6 z-[1000] animate-in slide-in-from-right-10 duration-500">
          <div className="bg-green-500/10 backdrop-blur-md border border-green-500/20 text-green-700 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4">
            <div className="bg-green-500 text-white p-2 rounded-full shadow-lg shadow-green-500/30">
              <Award size={20} />
            </div>
            <div className="text-left leading-tight">
              <p className="text-[10px] font-bold uppercase opacity-70">Tebrikler!</p>
              <p className="text-sm font-black">+{pointsEarned.amount} Puan Kazandınız!</p>
            </div>
          </div>
        </div>
      )}

      {/* MOBİL ÜST BAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-secondary flex items-center justify-between px-6 z-[60] shadow-md">
        <h2 className="text-white font-black uppercase text-xs tracking-widest text-primary">
          BÜ-LMS
        </h2>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="text-white p-1.5 bg-gray-800 rounded-lg"
        >
          <Menu size={20} />
        </button>
      </div>
    </>
  );
};
