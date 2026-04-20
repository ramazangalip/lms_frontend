"use client";

import React, { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

// --- Veri Yapıları (Interface) ---
interface Badge {
  id: number;
  name: string;
  description: string;
  icon_name: string;
  color: string;
  requirement_text: string;
  is_earned: boolean;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  department: string;
  total_points: number;
}

interface LeaderboardStudent {
  rank: number;
  full_name: string;
  total_points: number;
  is_me: boolean;
}

interface LeaderboardData {
  department_name: string;
  students: LeaderboardStudent[];
}

export default function ProfilePage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Profil Bilgileri
    api.get('/users/profile/')
      .then(res => setUser(res.data))
      .catch(err => console.error("Profil hatası:", err));

    // 2. Bölüm Liderlik Tablosu (İlk 5)
    api.get('/users/leaderboard/')
      .then(res => setLeaderboard(res.data))
      .catch(err => console.error("Liderlik tablosu hatası:", err));

    // 3. Rozetler
    api.get('/contents/student-badges/')
      .then(res => setBadges(res.data))
      .catch(err => console.error("Rozet hatası:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 font-sans text-black">
      <div className="max-w-4xl mx-auto">
        
        {/* ÜST BAR: GERİ DÖN */}
        <div className="flex justify-start mb-6">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-600 transition-all group"
          >
            <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-red-50">
              <Icons.ArrowLeft size={14} />
            </div>
            Geri Dön
          </Link>
        </div>

        {/* ÜST PANEL: KULLANICI KARTI */}
        <div className="bg-black text-white rounded-2xl p-6 md:p-8 shadow-2xl mb-10 border-b-8 border-red-600 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 rotate-2">
            <Icons.User size={40} className="-rotate-2" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none mb-3">
              {user?.first_name} {user?.last_name}
            </h1>
            <div className="inline-flex items-center gap-2 text-red-500 uppercase font-black text-[11px] tracking-[0.2em]">
              <Icons.GraduationCap size={16} />
              <span>{user?.department || "BİLGİSAYAR PROGRAMCILIĞI"}</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl px-8 py-4 text-center min-w-[140px]">
            <div className="flex items-center justify-center gap-2 text-red-500 mb-2">
              <Icons.Trophy size={16} fill="currentColor" />
              <span className="text-[9px] font-black uppercase tracking-widest opacity-80">TOPLAM PUAN</span>
            </div>
            <p className="text-5xl font-black tabular-nums tracking-tighter text-white leading-none">
              {user?.total_points || 0}
            </p>
          </div>
        </div>

        {/* LİDERLİK TABLOSU BÖLÜMÜ */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3 text-black">
              <span className="bg-black text-white p-2 rounded-xl shadow-lg">
                <Icons.ListOrdered size={20} />
              </span> 
              BÖLÜM SIRALAMASI
            </h2>
            <span className="text-[10px] font-black bg-gray-100 px-4 py-1.5 rounded-full text-gray-500 uppercase tracking-widest border border-gray-200">
              {leaderboard?.department_name || 'BÖLÜM ANALİZİ'}
            </span>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black text-white text-[10px] font-black uppercase tracking-[0.2em]">
                  <th className="px-6 py-4 w-20 text-center">Sıra</th>
                  <th className="px-6 py-4">Öğrenci</th>
                  <th className="px-6 py-4 text-right">Puan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaderboard?.students.map((student) => (
                  <tr 
                    key={student.rank} 
                    className={`transition-colors ${student.is_me ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs ${
                        student.rank === 1 
                          ? 'bg-red-600 text-white shadow-lg shadow-red-200' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {student.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold uppercase tracking-tight ${
                          student.is_me ? 'text-red-600' : 'text-gray-800'
                        }`}>
                          {student.full_name}
                        </span>
                        {student.is_me && (
                          <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded-md font-black uppercase tracking-tighter">
                            Siz
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-black tabular-nums ${
                        student.is_me ? 'text-red-600' : 'text-black'
                      }`}>
                        {student.total_points}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!leaderboard || leaderboard.students.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Sıralama verisi henüz oluşmadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ROZETLER BÖLÜMÜ */}
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3 text-black">
            <span className="bg-red-600 text-white p-2 rounded-xl shadow-lg shadow-red-600/20">
              <Icons.Award size={20} />
            </span> 
            BAŞARI ROZETLERİM
          </h2>
          <div className="h-[2px] flex-1 bg-gray-100"></div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {badges.map((badge) => {
            const iconKey = badge.icon_name as keyof typeof Icons;
            const IconComponent = (Icons[iconKey] as React.ElementType) || Icons.Medal;
            
            return (
              <div 
                key={badge.id} 
                className={`relative group p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between min-h-[160px] ${
                  badge.is_earned 
                    ? 'bg-white border-red-600 shadow-xl shadow-red-600/5 scale-[1.02]' 
                    : 'bg-gray-50 border-gray-100 opacity-40 grayscale hover:opacity-60'
                }`}
              >
                <div>
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12 ${
                    badge.is_earned ? 'bg-red-50 text-red-600' : 'bg-gray-200 text-gray-400'
                  }`}>
                    <IconComponent size={24} strokeWidth={2.5} />
                  </div>

                  <div className="text-center">
                    <h3 className={`text-[11px] font-black uppercase tracking-tight mb-2 leading-tight ${
                      badge.is_earned ? 'text-black' : 'text-gray-400'
                    }`}>
                      {badge.name}
                    </h3>
                    <p className="text-[9px] text-gray-500 font-bold leading-relaxed">
                      {badge.is_earned ? badge.description : badge.requirement_text}
                    </p>
                  </div>
                </div>

                {badge.is_earned && (
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <Icons.Check size={12} strokeWidth={4} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}