"use client";

import React, { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import {
  ArrowLeft,
  User as UserIcon,
  GraduationCap,
  Award,
  Check,
  Lock,
  TrendingUp,
  Target,
  Activity,
  BookOpen,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  X
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

interface Badge {
  id: number;
  name: string;
  description: string;
  icon_name: string;
  color?: string;
  requirement_text: string;
  is_earned: boolean;
  earned_at?: string | null;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  department: string;
  total_points: number;
  last_test_score?: number | null;
}

interface WeeklyContent {
  id: number | string;
  week_number: number;
  title: string;
  progress: number;
  is_completed: boolean;
}

export default function ProfilePage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [contents, setContents] = useState<WeeklyContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users/profile/').catch(() => null),
      api.get('/contents/list/').catch(() => null),
      api.get('/contents/student-badges/').catch(() => null)
    ])
      .then(([profileRes, contentsRes, badgesRes]) => {
        if (profileRes?.data) setUser(profileRes.data);
        if (contentsRes?.data) setContents(contentsRes.data);
        if (badgesRes?.data) setBadges(badgesRes.data);
      })
      .catch((err) => console.error("Veri yükleme hatası:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white flex-col gap-4 text-secondary">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-600 border-t-transparent"></div>
        <p className="text-red-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
          YÜKLENİYOR...
        </p>
      </div>
    );
  }

  // Metrik Hesaplamaları
  const totalBadgesCount = badges.length;
  const earnedBadgesCount = badges.filter((b) => b.is_earned).length;

  const overallProgress =
    contents.length > 0
      ? Math.round(contents.reduce((acc, w) => acc + (w.progress || 0), 0) / contents.length)
      : 0;

  // Son Başarı Metrik Gösterimi (DB'den gelen last_test_score veya -)
  const lastTestScoreDisplay =
    user?.last_test_score !== undefined && user?.last_test_score !== null
      ? `%${user.last_test_score}`
      : `-`;

  // Self-referenced Dinamik Feedback Metni
  const getFeedbackMessage = () => {
    if (overallProgress >= 80) {
      return "Mükemmel performans! İlerlemen %80 üzerine ulaştı. Tüm ustalık hedeflerine ulaşmak üzeresin!";
    }
    if (overallProgress >= 50) {
      return "Harika gelişim! Öğrenme hedeflerinin yarısından fazlasını tamamladın. İstikrarını sürdür!";
    }
    if (overallProgress > 0) {
      return "İyi bir başlangıç! Düzenli çalışarak haftalık kazanımları tamamlayabilir ve rozetler kazanabilirsin.";
    }
    return "Öğrenme yolculuğuna başlamak için haftalık materyalleri ve bilgi testlerini tamamlayabilirsin.";
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 font-sans text-black">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* ÜST BAR: GERİ DÖN VE SAYFA BAŞLIĞI */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-600 transition-all group w-fit"
          >
            <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-red-50 transition-colors">
              <ArrowLeft size={16} />
            </div>
            Ders Paneline Dön
          </Link>

          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-black flex items-center gap-3">
              <span className="bg-red-600 text-white p-2 rounded-xl shadow-lg shadow-red-600/20">
                <BarChart3 size={20} />
              </span>
              BİREYSEL GELİŞİM PANELİ
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right hidden md:block">
              Öğrenme İlerlemem & Kişisel Başarı Analizi
            </p>
          </div>
        </div>

        {/* ÜST PANEL: KULLANICI KARTI & 3 ÖZET METRİK */}
        <div className="bg-black text-white rounded-3xl p-6 md:p-8 shadow-2xl border-b-8 border-red-600 flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* SOL: PROFİL BİLGİSİ */}
          <div className="flex items-center gap-5 shrink-0 w-full lg:w-auto">
            <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0 rotate-2">
              <UserIcon size={36} className="-rotate-2" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none mb-2">
                {user?.first_name} {user?.last_name}
              </h2>
              <div className="inline-flex items-center gap-2 text-red-500 uppercase font-black text-[10px] tracking-[0.2em] bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <GraduationCap size={14} />
                <span>{user?.department || "BİLGİSAYAR PROGRAMCILIĞI"}</span>
              </div>
            </div>
          </div>

          {/* SAĞ: 3 ÖZET METRİK KARTI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            {/* Metrik 1: Genel İlerleme */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-[130px] hover:bg-white/10 transition-all">
              <div className="flex items-center justify-center gap-1.5 text-red-500 mb-1">
                <Activity size={14} />
                <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Genel İlerleme</span>
              </div>
              <p className="text-3xl font-black tabular-nums tracking-tighter text-white leading-none">
                %{overallProgress}
              </p>
            </div>

            {/* Metrik 2: Son Hafta / Test Başarısı (DİNAMİK DB VERİSİ) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-[130px] hover:bg-white/10 transition-all">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 mb-1">
                <Target size={14} />
                <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Son Başarı</span>
              </div>
              <p className="text-3xl font-black tabular-nums tracking-tighter text-white leading-none">
                {lastTestScoreDisplay}
              </p>
            </div>

            {/* Metrik 3: Ustalık Rozetleri */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-[130px] hover:bg-white/10 transition-all">
              <div className="flex items-center justify-center gap-1.5 text-green-400 mb-1">
                <Award size={14} />
                <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Ustalık Rozetleri</span>
              </div>
              <p className="text-3xl font-black tabular-nums tracking-tighter text-white leading-none">
                {earnedBadgesCount} <span className="text-sm font-bold text-gray-500">/ {totalBadgesCount}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ORTA BÖLÜM: BİREYSEL GELİŞİM & KAZANIM USTALIK DÜZEYLERİ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 1. HAFTALIK BİREYSEL GELİŞİM (SELF-REFERENCED PROGRESS) */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-gray-100 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-black uppercase tracking-tighter flex items-center gap-2 text-black">
                  <span className="bg-black text-white p-2 rounded-xl shadow-md">
                    <TrendingUp size={18} />
                  </span>
                  Haftalık Bireysel Gelişim
                </h3>
                <span className="text-[9px] font-black bg-red-50 text-red-600 px-3 py-1 rounded-full uppercase tracking-widest">
                  Kişisel Analiz
                </span>
              </div>

              {/* Haftalık İlerleme Listesi */}
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                {contents.map((week) => (
                  <div
                    key={week.id}
                    className="p-3 bg-gray-50/70 border border-gray-100 rounded-2xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-xl bg-black text-white font-black text-[10px] flex items-center justify-center shrink-0">
                        {week.week_number}
                      </span>
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {week.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-24 bg-gray-200 h-2 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className={`h-full transition-all duration-700 ${
                            week.is_completed ? 'bg-green-500' : 'bg-red-600'
                          }`}
                          style={{ width: `${week.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-black w-10 text-right">
                        %{Math.round(week.progress || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Self-referenced Feedback Box */}
            <div className="bg-gradient-to-r from-red-600 to-black p-4 rounded-2xl text-white shadow-lg flex items-start gap-3 mt-4">
              <div className="bg-white/10 p-2 rounded-xl shrink-0">
                <Sparkles size={20} className="text-amber-300 animate-pulse" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-300 mb-1">
                  Bireysel Geri Bildirim
                </p>
                <p className="text-xs font-bold leading-relaxed">
                  {getFeedbackMessage()}
                </p>
              </div>
            </div>
          </div>

          {/* 2. KAZANIM USTALIK DÜZEYLERİ (VERİTABANINDAKİ 14-15 HAFTALIK DERS BAŞLIKLARINA GÖRE DİNAMİK) */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-gray-100 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-black uppercase tracking-tighter flex items-center gap-2 text-black">
                  <span className="bg-red-600 text-white p-2 rounded-xl shadow-md shadow-red-600/20">
                    <ShieldCheck size={18} />
                  </span>
                  Kazanım Ustalık Düzeyleri
                </h3>
                <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-3 py-1 rounded-full uppercase tracking-widest border">
                  Haftalık Konular
                </span>
              </div>

              {/* Veritabanından Gelen Haftalık Konu Başlıkları Ustalık Listesi */}
              {contents.length > 0 ? (
                <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                  {contents.map((week) => {
                    const prog = Math.round(week.progress || 0);
                    let statusLabel = "Başlanmadı";
                    let badgeStyle = "bg-gray-100 text-gray-400 border-gray-200";
                    let barColor = "bg-gray-300";

                    if (prog >= 80) {
                      statusLabel = "Ustalık Sağlandı";
                      badgeStyle = "bg-green-50 text-green-600 border-green-200";
                      barColor = "bg-green-500";
                    } else if (prog >= 50) {
                      statusLabel = "Geliştirilmeli";
                      badgeStyle = "bg-amber-50 text-amber-600 border-amber-200";
                      barColor = "bg-amber-500";
                    } else if (prog > 0) {
                      statusLabel = "Devam Ediyor";
                      badgeStyle = "bg-blue-50 text-blue-600 border-blue-200";
                      barColor = "bg-blue-500";
                    }

                    return (
                      <div key={week.id} className="space-y-2 p-3 bg-gray-50/70 rounded-2xl border border-gray-100">
                        <div className="flex justify-between items-start text-xs gap-3">
                          <div className="min-w-0">
                            <span className="font-black text-black block leading-snug truncate">
                              {week.week_number}. Hafta: {week.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                              {statusLabel}
                            </span>
                            <span className="font-black text-xs text-black w-8 text-right">
                              %{prog}
                            </span>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden p-0.5 border border-gray-200/50">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                            style={{ width: `${prog}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">
                  İçerik verisi bulunamadı.
                </div>
              )}
            </div>

            {/* Bilgilendirme Notu */}
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-gray-600 flex items-center gap-3">
              <BookOpen size={20} className="text-red-600 shrink-0" />
              <p className="text-[10px] font-bold leading-normal">
                Kazanım ustalık düzeylerin, materyal okumaları ve haftalık bilgi testlerinden elde ettiğin başarı puanlarına göre dinamik olarak güncellenir.
              </p>
            </div>
          </div>

        </div>

        {/* ALT BÖLÜM: BAŞARI ROZETLERİ (DB DİNAMİK VERİSİ) */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3 text-black">
              <span className="bg-red-600 text-white p-2.5 rounded-2xl shadow-lg shadow-red-600/20">
                <Award size={22} />
              </span>
              BAŞARI ROZETLERİM
            </h2>
            <div className="h-[2px] flex-1 bg-gray-100"></div>
            <span className="text-[10px] font-black bg-black text-white px-4 py-1.5 rounded-full uppercase tracking-widest">
              {earnedBadgesCount} / {totalBadgesCount} KAZANILDI
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {badges.map((badge) => {
              const iconKey = badge.icon_name as keyof typeof Icons;
              const IconComponent = (Icons[iconKey] as React.ElementType) || Award;

              return (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`relative group p-5 rounded-3xl border-2 transition-all duration-300 flex flex-col justify-between min-h-[190px] cursor-pointer hover:scale-[1.03] active:scale-95 ${
                    badge.is_earned
                      ? 'bg-white border-red-600 shadow-xl shadow-red-600/5'
                      : 'bg-gray-50/80 border-gray-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                  }`}
                >
                  <div>
                    {/* Rozet İkonu */}
                    <div
                      className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6 ${
                        badge.is_earned
                          ? 'bg-red-50 text-red-600 shadow-inner border border-red-100'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <IconComponent size={28} strokeWidth={2.5} />
                    </div>

                    {/* Rozet Adı ve Açıklaması */}
                    <div className="text-center">
                      <h3
                        className={`text-xs font-black uppercase tracking-tight mb-1.5 leading-tight ${
                          badge.is_earned ? 'text-black' : 'text-gray-500'
                        }`}
                      >
                        {badge.name}
                      </h3>
                      <p className="text-[9px] text-gray-400 font-bold leading-relaxed line-clamp-2">
                        {badge.description || badge.requirement_text}
                      </p>
                    </div>
                  </div>

                  {/* Alt Durum Göstergesi */}
                  <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                    {badge.is_earned ? (
                      <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                        <CheckCircle2 size={10} /> Kazanıldı
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        <Lock size={10} /> Kilitli (Detay İçin Tıkla)
                      </span>
                    )}
                  </div>

                  {/* Kazanıldı Onay Rozeti (Top-Right) */}
                  {badge.is_earned && (
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <Check size={12} strokeWidth={4} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ROZET İÇERİK DETAY MODALI */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 shadow-2xl border-2 border-gray-100 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Kapat Butonu */}
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            {/* Modal Üst Başlık & İkon */}
            <div className="text-center space-y-4 pt-2">
              {(() => {
                const iconKey = selectedBadge.icon_name as keyof typeof Icons;
                const IconComp = (Icons[iconKey] as React.ElementType) || Award;
                return (
                  <div
                    className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-inner ${
                      selectedBadge.is_earned
                        ? 'bg-red-50 text-red-600 border-2 border-red-100 shadow-red-500/10'
                        : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    }`}
                  >
                    <IconComp size={40} strokeWidth={2.5} />
                  </div>
                );
              })()}

              <div>
                <h3 className="text-xl font-black text-black uppercase tracking-tight">
                  {selectedBadge.name}
                </h3>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                  {selectedBadge.is_earned ? (
                    <span className="bg-green-50 text-green-700 border border-green-200 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 size={13} className="text-green-600" /> Kazanıldı
                      {selectedBadge.earned_at && (
                        <span className="text-gray-400 font-bold ml-1">
                          ({new Date(selectedBadge.earned_at).toLocaleDateString('tr-TR')})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 border border-gray-200 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                      <Lock size={13} /> Henüz Kazanılmadı
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Detay Bilgileri */}
            <div className="space-y-4 pt-2 border-t border-gray-100 text-left">
              {/* Açıklama */}
              {selectedBadge.description && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                    Rozet Açıklaması
                  </p>
                  <p className="text-xs font-bold text-gray-800 leading-relaxed">
                    {selectedBadge.description}
                  </p>
                </div>
              )}

              {/* Kazanma Şartı */}
              {selectedBadge.requirement_text && (
                <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/80 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-red-600 flex items-center gap-1">
                    <Target size={12} /> Kazanma Şartı
                  </p>
                  <p className="text-xs font-bold text-gray-900 leading-relaxed">
                    {selectedBadge.requirement_text}
                  </p>
                </div>
              )}
            </div>

            {/* Kapat Butonu */}
            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full bg-black hover:bg-gray-800 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl transition-all shadow-lg active:scale-95"
            >
              KAPAT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}