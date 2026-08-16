"use client";
import React from 'react';
import {
  RefreshCcw,
  Filter,
  ShieldCheck,
  Type,
  PlayCircle,
  ListChecks,
  Trash2,
  Check,
  Award,
  BookOpen,
  Download,
  Calendar,
  Lock,
  Plus,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  Save,
  Clock
} from 'lucide-react';
import {
  Material,
  Flashcard,
  Question,
  EntryQuestion,
  SurveyQuestion,
  departmentList
} from '../types';

interface ContentManagementTabProps {
  handleSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  fetchingWeek: boolean;
  weekNumber: number;
  setWeekNumber: (val: number) => void;
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  releaseDate: string;
  setReleaseDate: (val: string) => void;
  dueDate: string;
  setDueDate: (val: string) => void;
  scheduleDept: string;
  setScheduleDept: (val: string) => void;
  weekSchedules: Record<string, { release_date: string | null; due_date: string | null }>;
  introTitle: string;
  setIntroTitle: (val: string) => void;
  introVideoUrl: string;
  setIntroVideoUrl: (val: string) => void;
  introDescription: string;
  setIntroDescription: (val: string) => void;
  materials: Material[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  addMaterialRow: () => void;
  removeMaterialRow: (index: number) => void;
  updateMaterial: (index: number, field: keyof Material, value: unknown) => void;
  addQuestion: (mIndex: number) => void;
  updateQuestionText: (mIndex: number, qIndex: number, text: string) => void;
  updateOption: (mIndex: number, qIndex: number, oIndex: number, text: string) => void;
  setCorrectOption: (mIndex: number, qIndex: number, oIndex: number) => void;
  flashcards: Flashcard[];
  setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>;
  updateFlashcard: (index: number, field: keyof Flashcard, value: string) => void;
  preTestQuestions: Question[];
  setPreTestQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  entryQuestions: EntryQuestion[];
  setEntryQuestions: React.Dispatch<React.SetStateAction<EntryQuestion[]>>;
  addEntryQuestion: () => void;
  updateEntryQuestion: (index: number, field: keyof EntryQuestion, value: any) => void;
  updateEntryOption: (qIdx: number, oIdx: number, text: string) => void;
  setCorrectEntryOption: (qIdx: number, oIdx: number) => void;
  isSurveyActive: boolean;
  setIsSurveyActive: (val: boolean) => void;
  selectedSurveyId: string;
  setSelectedSurveyId: (val: string) => void;
  surveyQuestions: SurveyQuestion[];
  setSurveyQuestions: React.Dispatch<React.SetStateAction<SurveyQuestion[]>>;
  addSurveyQuestion: () => void;
  updateSurveyQuestion: (index: number, field: keyof SurveyQuestion, value: string) => void;
  updateSurveyOption: (qIdx: number, oIdx: number, text: string) => void;
}

export const ContentManagementTab: React.FC<ContentManagementTabProps> = ({
  handleSubmit,
  loading,
  fetchingWeek,
  weekNumber,
  setWeekNumber,
  title,
  setTitle,
  description,
  setDescription,
  releaseDate,
  setReleaseDate,
  dueDate,
  setDueDate,
  scheduleDept,
  setScheduleDept,
  weekSchedules,
  introTitle,
  setIntroTitle,
  introVideoUrl,
  setIntroVideoUrl,
  introDescription,
  setIntroDescription,
  materials,
  addMaterialRow,
  removeMaterialRow,
  updateMaterial,
  addQuestion,
  updateQuestionText,
  updateOption,
  setCorrectOption,
  flashcards,
  setFlashcards,
  updateFlashcard,
  preTestQuestions,
  setPreTestQuestions,
  entryQuestions,
  setEntryQuestions,
  addEntryQuestion,
  updateEntryQuestion,
  updateEntryOption,
  setCorrectEntryOption,
  isSurveyActive,
  setIsSurveyActive,
  selectedSurveyId,
  setSelectedSurveyId,
  surveyQuestions,
  setSurveyQuestions,
  addSurveyQuestion,
  updateSurveyQuestion,
  updateSurveyOption
}) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 text-left">
      <div className="bg-white p-5 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-gray-100 relative overflow-hidden text-left leading-normal">
        {fetchingWeek && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center text-left">
            <div className="flex flex-col items-center gap-3 font-black text-[#ce1212] animate-pulse text-center leading-none text-left">
              <RefreshCcw className="animate-spin text-left" size={32} />
              <span className="text-xs uppercase tracking-widest font-bold leading-none text-left">VERİLER ALINIYOR...</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
          <div className="lg:col-span-1 text-left leading-none">
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest leading-none">Düzenlenen Hafta</label>
            <select value={weekNumber} onChange={(e) => setWeekNumber(Number(e.target.value))} className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-black font-bold outline-none focus:border-red-500 transition-colors text-sm shadow-inner leading-none">
              {Array.from({ length: 14 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}. Hafta</option>)}
            </select>
          </div>
          <div className="lg:col-span-1 text-left leading-none">
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest leading-none">Haftalık Konu Başlığı</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-black outline-none focus:border-red-500 font-bold transition-all text-sm shadow-inner leading-none" placeholder="Haftanın ana başlığını giriniz..." />
          </div>
          <div className="lg:col-span-1 text-left leading-none">
            <label className="block text-[10px] font-black text-[#ce1212] uppercase mb-2 tracking-widest leading-none flex items-center gap-1">
              <Filter size={12} /> Tarih İçin Bölüm
            </label>
            <select 
              value={scheduleDept} 
              onChange={(e) => {
                const newDept = e.target.value;
                setScheduleDept(newDept);
                if (weekSchedules[newDept]) {
                  const sch = weekSchedules[newDept];
                  setReleaseDate(sch.release_date ? sch.release_date.split('T')[0] : '');
                  setDueDate(sch.due_date ? sch.due_date.split('T')[0] : '');
                } else {
                  setReleaseDate('');
                  setDueDate('');
                }
              }}
              className="w-full p-4 rounded-2xl border-2 border-red-100 bg-red-50/40 text-black font-bold outline-none focus:border-red-500 shadow-inner leading-none cursor-pointer text-xs uppercase"
            >
              {departmentList.map(d => (
                <option key={d.id} value={d.id}>📍 {d.name.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-1 text-left leading-none">
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest leading-none">Erişim Tarihi (Aktif)</label>
            <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 font-bold outline-none focus:border-red-500 shadow-inner leading-none" />
          </div>
          <div className="lg:col-span-1 text-left leading-none">
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest leading-none">Kapanış Tarihi (Pasif)</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 font-bold outline-none focus:border-red-500 shadow-inner leading-none" />
          </div>
        </div>

        {weekNumber === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500 mt-10">
            <div className="p-6 md:p-8 bg-gradient-to-br from-red-50 to-white rounded-3xl border-2 border-[#ce1212]/20 shadow-sm space-y-6 text-left leading-normal">
              <div className="flex items-center gap-3 text-[#ce1212] border-b border-red-100 pb-4 leading-none">
                <ShieldCheck size={24} />
                <div className="text-left leading-none">
                  <h3 className="font-black uppercase text-[10px] md:text-xs tracking-widest leading-none">SİSTEM GENELİ ORYANTASYON VİDEOSU</h3>
                  <p className="text-[9px] text-gray-400 font-bold mt-2 uppercase tracking-tighter">* Sisteme girişte izlenmesi zorunlu olan rehber içeriktir.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-none">
                <div className="text-left">
                  <label className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest"><Type size={12} /> Oryantasyon Başlığı</label>
                  <input type="text" value={introTitle} onChange={(e) => setIntroTitle(e.target.value)} className="w-full p-3.5 rounded-xl border border-gray-200 text-xs font-bold outline-none focus:border-red-500 bg-white" />
                </div>
                <div className="text-left">
                  <label className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest"><PlayCircle size={12} /> Video Embed URL</label>
                  <input type="url" value={introVideoUrl} onChange={(e) => setIntroVideoUrl(e.target.value)} className="w-full p-3.5 rounded-xl border border-gray-200 text-xs font-mono outline-none focus:border-red-500 bg-white" />
                </div>
                <div className="md:col-span-2 text-left mt-4">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Oryantasyon Metni (Opsiyonel)</label>
                  <textarea value={introDescription} onChange={(e) => setIntroDescription(e.target.value)} rows={4} className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-black font-bold outline-none focus:border-red-500 transition-all text-sm shadow-inner leading-relaxed" placeholder="Hoş geldiniz metni veya sistem rehberini buraya yazabilirsiniz..." />
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-gradient-to-br from-blue-50 to-white rounded-3xl border-2 border-blue-200 shadow-sm space-y-6 text-left leading-normal">
              <div className="flex items-center justify-between border-b border-blue-100 pb-4">
                <div className="flex items-center gap-3 text-blue-600 leading-none">
                  <ListChecks size={24} />
                  <div>
                    <h3 className="font-black uppercase text-[10px] md:text-xs tracking-widest leading-none">ÖN DEĞERLENDİRME TESTİ (ZORUNLU)</h3>
                    <p className="text-[9px] text-gray-400 font-bold mt-2 uppercase tracking-tighter">* Öğrenciler bu testi tamamlamadan haftalık derslere erişemezler.</p>
                  </div>
                </div>
                <button type="button" onClick={() => setPreTestQuestions([...preTestQuestions, { question_text: "", options: [{option_text: "", is_correct: true}, {option_text: "", is_correct: false}, {option_text: "", is_correct: false}, {option_text: "", is_correct: false}, {option_text: "", is_correct: false}] }])} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black hover:bg-blue-700 transition-all shadow-lg active:scale-95">+ YENİ SORU EKLE</button>
              </div>
              <div className="space-y-8">
                {preTestQuestions.map((q, qIndex) => (
                  <div key={qIndex} className="p-5 md:p-7 bg-white rounded-[2rem] border border-blue-100 shadow-sm space-y-5 relative group">
                    <button type="button" onClick={() => setPreTestQuestions(preTestQuestions.filter((_, i) => i !== qIndex))} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                    <div className="flex gap-4 items-start pr-10">
                      <span className="bg-blue-600 text-white w-9 h-9 rounded-xl flex items-center justify-center font-black shrink-0 shadow-lg text-sm">{qIndex + 1}</span>
                      <div className="w-full">
                        <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 tracking-widest">Soru Metni</label>
                        <input type="text" placeholder="Soru metni..." className="w-full p-2 border-b-2 border-gray-50 focus:border-blue-500 outline-none font-bold text-sm bg-transparent" value={q.question_text} onChange={(e) => { const newQs = [...preTestQuestions]; newQs[qIndex].question_text = e.target.value; setPreTestQuestions(newQs); }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-12">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${opt.is_correct ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-100'}`}>
                          <button type="button" onClick={() => { const newQs = [...preTestQuestions]; newQs[qIndex].options.forEach((o, i) => o.is_correct = i === oIndex); setPreTestQuestions(newQs); }} className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${opt.is_correct ? 'bg-green-500 text-white shadow-lg' : 'bg-white text-gray-300 border'}`}><Check size={14} /></button>
                          <input type="text" placeholder={`${oIndex + 1}. Seçenek`} className="bg-transparent outline-none text-[11px] font-bold w-full text-secondary" value={opt.option_text} onChange={(e) => { const newQs = [...preTestQuestions]; newQs[qIndex].options[oIndex].option_text = e.target.value; setPreTestQuestions(newQs); }} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6 text-left leading-normal mt-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-4 leading-none">
            <h3 className="font-black text-secondary uppercase text-[10px] md:text-xs tracking-widest flex items-center gap-2"><ListChecks size={18} className="text-[#ce1212]" /> Materyaller ve Puanlama</h3>
            <button type="button" onClick={addMaterialRow} className="w-full sm:w-auto bg-red-50 text-[#ce1212] flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black hover:bg-[#ce1212] hover:text-white transition-all shadow-sm"><Plus size={16} /> MATERYAL EKLE</button>
          </div>
          <div className="grid gap-6">
            {materials.map((mat, mIndex) => (
              <div key={mIndex} className="p-4 md:p-6 bg-gray-50 rounded-2xl md:rounded-[2.5rem] border border-gray-200 space-y-4 hover:border-red-200 transition-all group leading-normal">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                  <div className="w-full lg:w-32 shrink-0">
                    <select value={mat.content_type} onChange={(e) => updateMaterial(mIndex, 'content_type', e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 text-black text-[9px] font-black bg-white outline-none shadow-sm cursor-pointer leading-none">
                      <option value="video">🎥 Video</option>
                      <option value="podcast">🎙️ Podcast</option>
                      <option value="form">📝 Test</option>
                      <option value="pdf">📄 PDF</option>
                      <option value="assignment">📂 Ödev (MS Form)</option>
                    </select>
                  </div>
                  <div className="w-full flex-1">
                    <input type="text" placeholder="Materyal Başlığı" className="w-full p-3 rounded-xl border border-gray-200 text-black text-xs font-bold outline-none bg-white shadow-sm leading-none" value={mat.title} onChange={(e) => updateMaterial(mIndex, 'title', e.target.value)} />
                  </div>
                  {mat.content_type !== 'pdf' && (
                    <div className="w-full lg:w-28 shrink-0 flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                      <Award size={14} className="text-amber-500 ml-1" />
                      <input type="number" placeholder="Puan" className="w-full p-2 text-xs font-black text-secondary outline-none bg-transparent leading-none" value={mat.point_value} onChange={(e) => updateMaterial(mIndex, 'point_value', e.target.value)} />
                    </div>
                  )}
                  {(mat.content_type === 'video' || mat.content_type === 'podcast') && (
                    <div className="w-full lg:w-36 shrink-0 flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm" title="Tamamlandı sayılması için gereken izleme/dinleme süresi (saniye)">
                      <Clock size={14} className="text-blue-500 ml-1 shrink-0" />
                      <input type="number" placeholder="Süre (sn)" className="w-full p-2 text-xs font-black text-secondary outline-none bg-transparent leading-none" value={mat.min_duration_seconds ?? 300} onChange={(e) => updateMaterial(mIndex, 'min_duration_seconds', e.target.value)} />
                      <span className="text-[9px] text-gray-400 font-bold pr-1">sn</span>
                    </div>
                  )}
                  {mat.content_type !== 'form' && (
                    <div className="w-full flex-[1.5]">
                      <input type="url" placeholder={mat.content_type === 'pdf' ? "OneDrive İndirme Linki" : "Embed URL Adresi"} className="w-full p-3 rounded-xl border border-gray-200 text-black text-[10px] font-mono outline-none bg-white shadow-sm leading-none" value={mat.embed_url} onChange={(e) => updateMaterial(mIndex, 'embed_url', e.target.value)} />
                    </div>
                  )}
                  <button type="button" onClick={() => removeMaterialRow(mIndex)} className="w-full lg:w-auto p-3 text-red-400 hover:text-red-600 transition-colors active:scale-90"><Trash2 size={20} /></button>
                </div>

                {mat.content_type === 'form' && mat.quiz && (
                  <div className="mt-4 bg-white p-5 rounded-2xl border-2 border-dashed border-red-100 space-y-6 text-left">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                      <div className="flex items-center gap-2 text-[#ce1212] font-black text-[10px] uppercase tracking-widest"><ListChecks size={18} /> Sınav Düzenleyici</div>
                      <button type="button" onClick={() => addQuestion(mIndex)} className="text-[#ce1212] font-black text-[9px] uppercase hover:underline">+ Yeni Soru Ekle</button>
                    </div>
                    <div className="space-y-8">
                      {mat.quiz.questions.map((q, qIndex) => (
                        <div key={qIndex} className="p-4 bg-gray-50/50 rounded-xl space-y-4 border border-gray-100">
                          <div className="flex gap-4 items-start">
                            <span className="bg-[#ce1212] text-white w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-md">{qIndex + 1}</span>
                            <input type="text" placeholder="Soru metni..." className="w-full p-2.5 rounded-lg border text-xs font-bold focus:border-red-500 outline-none" value={q.question_text} onChange={(e) => updateQuestionText(mIndex, qIndex, e.target.value)} />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:pl-11">
                            {q.options.map((opt, oIndex) => (
                              <div key={oIndex} className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${opt.is_correct ? 'bg-green-50 border-green-500' : 'bg-white border-gray-100'}`}>
                                <button type="button" onClick={() => setCorrectOption(mIndex, qIndex, oIndex)} className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${opt.is_correct ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-300'}`}><Check size={12} /></button>
                                <input type="text" placeholder="Şık içeriği..." className="flex-1 bg-transparent text-[10px] font-bold outline-none" value={opt.option_text} onChange={(e) => updateOption(mIndex, qIndex, oIndex, e.target.value)} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 space-y-6 text-left leading-normal">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-4 leading-none">
            <div className="flex items-center gap-2 text-secondary font-black text-[10px] md:text-xs uppercase tracking-widest leading-none"><BookOpen size={18} className="text-blue-600" /> Haftalık Flashcardlar</div>
            <button type="button" onClick={() => setFlashcards([...flashcards, { question: '', answer: '' }])} className="w-full sm:w-auto bg-blue-50 text-blue-600 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all shadow-sm leading-none"><Plus size={16} /> KART EKLE</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {flashcards.map((card, idx) => (
              <div key={idx} className="p-5 md:p-6 bg-blue-50/30 rounded-2xl border-2 border-blue-100 space-y-4 relative group hover:border-blue-300 transition-all shadow-sm">
                <button type="button" onClick={() => setFlashcards(flashcards.filter((_, i) => i !== idx))} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black text-blue-600 uppercase mb-1.5 tracking-widest"><Type size={10} className="inline mr-1" /> Kaynak / Döküman Adı</label>
                    <input type="text" placeholder="Kaynak adı..." className="w-full p-3 rounded-xl border border-blue-100 text-xs font-bold outline-none focus:border-blue-500 bg-white" value={card.question} onChange={(e) => updateFlashcard(idx, 'question', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-blue-600 uppercase mb-1.5 tracking-widest"><Download size={10} className="inline mr-1" /> OneDrive / Word / PDF Linki</label>
                    <input type="url" placeholder="Link..." className="w-full p-3 rounded-xl border border-blue-100 text-[10px] font-mono outline-none focus:border-blue-500 bg-white" value={card.answer} onChange={(e) => updateFlashcard(idx, 'answer', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 p-6 md:p-8 bg-amber-50/30 rounded-3xl border-2 border-amber-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-amber-600 border-b border-amber-100 pb-4 leading-none">
            <Calendar size={24} />
            <div className="text-left leading-none">
              <h3 className="font-black uppercase text-[10px] md:text-xs tracking-widest leading-none">HAFTALIK DERS NOTLARI VE ÖZET</h3>
              <p className="text-[9px] text-gray-400 font-bold mt-2 uppercase tracking-tighter">* Öğrencilerin panelinde görüntülenecek içerik.</p>
            </div>
          </div>
          <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-5 md:p-8 rounded-2xl border-2 border-gray-100 bg-white text-black outline-none focus:border-amber-500 transition-all font-bold text-sm shadow-inner leading-relaxed" placeholder="Ders notlarını buraya yazabilirsiniz..." />
        </div>

        {/* --- HAFTALIK HAZIRLIK (GİRİŞ) TESTİ DÜZENLEYİCİ --- */}
        {weekNumber > 1 && (
          <div className="mt-12 p-6 md:p-10 bg-gradient-to-br from-[#1a1a1a] to-black rounded-[2.5rem] border-2 border-[#ce1212]/30 shadow-2xl space-y-8 text-left leading-normal relative overflow-hidden">
            <div className="absolute top-[-20px] right-[-20px] opacity-5 text-white rotate-12">
              <ShieldCheck size={200} />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-8 gap-4 relative z-10">
              <div className="flex items-center gap-4 text-white leading-none">
                <div className="bg-[#ce1212] p-3 rounded-2xl shadow-lg shadow-red-900/20">
                  <RefreshCcw size={24} className="text-white" />
                </div>
                <div className="text-left leading-none">
                  <h3 className="font-black uppercase text-xs md:text-sm tracking-[0.2em] leading-none mb-2">Haftalık Giriş (Hatırlatıcı) Testi</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                    Öğrencilerin {weekNumber}. haftaya başlamadan önce çözmesi gereken 5 şıklı hazırlık soruları.
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={addEntryQuestion} 
                className="w-full sm:w-auto bg-[#ce1212] text-white flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black hover:bg-red-700 transition-all shadow-xl active:scale-95 leading-none shrink-0"
              >
                <Plus size={16} /> SORU EKLE
              </button>
            </div>

            <div className="space-y-6 relative z-10">
              {entryQuestions.map((q, qIndex) => (
                <div key={qIndex} className="p-6 md:p-8 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 space-y-6 relative group hover:border-[#ce1212]/50 transition-all">
                  <button 
                    type="button" 
                    onClick={() => setEntryQuestions(entryQuestions.filter((_, i) => i !== qIndex))} 
                    className="absolute top-6 right-6 text-gray-500 hover:text-red-500 transition-colors p-2"
                  >
                    <Trash2 size={20} />
                  </button>

                  <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center pr-12">
                    <span className="bg-[#ce1212] text-white w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-lg">
                      {qIndex + 1}
                    </span>
                    
                    <div className="flex-1 w-full space-y-2">
                      <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest">Hatırlatıcı Soru Metni</label>
                      <input 
                        type="text" 
                        placeholder="Örn: Geçen haftaki hücre bölünmesi konusunda..." 
                        className="w-full p-3 rounded-xl border border-white/10 bg-white/10 text-white outline-none focus:border-[#ce1212] font-bold text-xs shadow-inner" 
                        value={q.question_text} 
                        onChange={(e) => updateEntryQuestion(qIndex, 'question_text', e.target.value)} 
                      />
                    </div>

                    <div className="w-full lg:w-48 shrink-0 space-y-2">
                      <label className="block text-[8px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1">
                        <Lock size={10} /> Yanlışsa Açılacak Hafta
                      </label>
                      <select 
                        value={q.target_week} 
                        onChange={(e) => updateEntryQuestion(qIndex, 'target_week', Number(e.target.value))} 
                        className="w-full p-3 rounded-xl border border-red-500/30 bg-red-950/40 text-red-200 font-black text-xs outline-none focus:border-[#ce1212] cursor-pointer shadow-inner"
                      >
                        {Array.from({ length: weekNumber - 1 }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n} className="bg-black text-white">{n}. Hafta (Tekrar Etmeli)</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pl-0 lg:pl-15">
                    {q.options.map((opt, oIndex) => (
                      <div 
                        key={oIndex} 
                        className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                          opt.is_correct 
                            ? 'bg-green-500/20 border-green-500/50 text-green-300' 
                            : 'bg-white/5 border-white/10 text-gray-300'
                        }`}
                      >
                        <button 
                          type="button" 
                          onClick={() => setCorrectEntryOption(qIndex, oIndex)} 
                          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            opt.is_correct 
                              ? 'bg-green-500 text-black font-black shadow-lg' 
                              : 'bg-white/10 text-gray-500 border border-white/20'
                          }`}
                        >
                          <Check size={12} />
                        </button>
                        <input 
                          type="text" 
                          placeholder={`${oIndex + 1}. Şık`} 
                          className="bg-transparent outline-none text-[10px] font-bold w-full text-white placeholder-gray-500" 
                          value={opt.option_text} 
                          onChange={(e) => updateEntryOption(qIndex, oIndex, e.target.value)} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {entryQuestions.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                  <HelpCircle size={40} className="mx-auto text-gray-600 mb-3 opacity-50" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Henüz bir hatırlatıcı soru eklenmedi.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- DİNAMİK HAFTALIK ANKET (LIKERT 1-5) KİLİT VE EDİTÖR --- */}
        <div className="mt-12 p-8 md:p-12 bg-gradient-to-br from-purple-50 to-indigo-50/40 rounded-[2.5rem] border-2 border-purple-200 shadow-xl space-y-8 text-left leading-normal relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-purple-200/60 pb-6 gap-4">
            <div className="flex items-center gap-4 text-purple-950 leading-none">
              <div className="bg-purple-600 p-3 rounded-2xl shadow-lg shadow-purple-900/20 text-white">
                <Lock size={24} />
              </div>
              <div className="text-left leading-none">
                <h3 className="font-black uppercase text-xs md:text-sm tracking-[0.2em] leading-none mb-2">Haftalık Zorunlu Bilimsel Anket (Kilit)</h3>
                <p className="text-[10px] text-purple-800/60 font-bold uppercase tracking-widest leading-none">
                  Öğrencilerin {weekNumber}. haftanın ders içeriklerini açabilmeleri için yanıtlaması gereken anket.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-purple-200 shadow-sm self-stretch sm:self-auto justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-950">Bu Hafta Anket Kilitlensin Mi?</span>
              <button 
                type="button"
                onClick={() => setIsSurveyActive(!isSurveyActive)}
                className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${isSurveyActive ? 'bg-purple-600 justify-end' : 'bg-gray-300 justify-start'}`}
              >
                <div className="bg-white w-6 h-6 rounded-full shadow-md transform transition-transform" />
              </button>
            </div>
          </div>

          {isSurveyActive ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
              
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 bg-white p-6 rounded-3xl border border-purple-100 shadow-md">
                <div className="flex-1 space-y-2">
                  <label className="block text-[9px] font-black text-purple-900 uppercase tracking-widest flex items-center gap-2">
                    <Type size={12} className="text-purple-600" /> Şablon Anket Seçimi (Analizler İçin Veri Tabanı Eşleşmesi)
                  </label>
                  <div className="flex items-center gap-3 bg-purple-50/50 p-2 rounded-2xl border border-purple-100">
                    <ListChecks size={18} className="text-purple-600 ml-2" />
                    <select 
                      value={selectedSurveyId} 
                      onChange={(e) => setSelectedSurveyId(e.target.value)}
                      className="w-full p-2.5 bg-transparent font-black text-xs text-purple-950 uppercase outline-none cursor-pointer"
                    >
                      <option value="4">4. HAFTA UYUM ÖLÇEĞİ (VARSIYALAN)</option>
                      <option value="5">5. HAFTA DEĞERLENDİRME ANKETİ</option>
                      <option value="6">6. HAFTA ÖĞRENME ANKETİ</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={addSurveyQuestion}
                  className="w-full md:w-auto bg-purple-600 text-white flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black hover:bg-purple-900 transition-all shadow-xl active:scale-95 group"
                >
                  <Plus size={18} className="group-hover:rotate-90 transition-transform" /> YENİ ANKET SORUSU EKLE
                </button>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-purple-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <ListChecks size={16} /> Anket Soru Maddeleri ve Derecelendirme
                </h4>
                
                {surveyQuestions.map((q, qIndex) => (
                  <div key={qIndex} className="p-8 bg-white rounded-[2.5rem] border-2 border-purple-100 shadow-sm space-y-6 relative group hover:border-purple-300 transition-all">
                    
                    <button 
                      type="button"
                      onClick={() => setSurveyQuestions(surveyQuestions.filter((_, i) => i !== qIndex))}
                      className="absolute top-8 right-8 text-gray-300 hover:text-red-500 transition-colors p-2"
                    >
                      <Trash2 size={22} />
                    </button>

                    <div className="flex gap-6 items-start pr-12">
                      <span className="bg-purple-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-lg">
                        {qIndex + 1}
                      </span>
                      
                      <div className="flex-1 w-full space-y-4">
                        <div className="space-y-1">
                          <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Soru Metni</label>
                          <input 
                            type="text"
                            placeholder="Anket sorusunu buraya yazınız..."
                            className="w-full p-2 border-b-2 border-gray-100 focus:border-purple-500 outline-none font-bold text-base bg-transparent text-secondary"
                            value={q.text}
                            onChange={(e) => updateSurveyQuestion(qIndex, 'text', e.target.value)}
                          />
                        </div>
                        
                        <div className="flex items-center gap-3 bg-purple-50/50 p-2 rounded-lg w-fit">
                          <Type size={12} className="text-purple-400" />
                          <input 
                            type="text"
                            placeholder="Kategori (Örn: Algılanan Fayda)"
                            className="text-[9px] font-black text-purple-600 uppercase tracking-widest bg-transparent outline-none min-w-[200px]"
                            value={q.category}
                            onChange={(e) => updateSurveyQuestion(qIndex, 'category', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 pl-16">
                      {q.options?.map((opt, oIndex) => (
                        <div key={oIndex} className="space-y-2">
                          <label className="text-[8px] font-black text-gray-400 uppercase ml-1 flex items-center gap-1">
                            <CheckCircle size={10} className="text-purple-300" /> Derece {opt.value}
                          </label>
                          <input 
                            type="text"
                            placeholder={`Şık ${opt.value} metni...`}
                            className="w-full p-3 bg-purple-50/30 border border-purple-100 rounded-xl text-[10px] font-bold text-purple-900 outline-none focus:border-purple-400 transition-colors"
                            value={opt.option_text}
                            onChange={(e) => updateSurveyOption(qIndex, oIndex, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {surveyQuestions.length === 0 && (
                  <div className="text-center py-16 border-4 border-dashed border-purple-100 rounded-[3rem] bg-white/50">
                    <HelpCircle size={48} className="mx-auto text-purple-200 mb-4 opacity-40" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Henüz bir anket sorusu eklenmedi.</p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-purple-100/40 rounded-3xl border border-purple-200 flex items-start gap-4 shadow-inner">
                <AlertCircle className="text-purple-600 shrink-0" size={24} />
                <div className="text-left leading-tight">
                  <p className="text-[10px] font-black text-purple-900 uppercase tracking-widest mb-1">Önemli Kilit Bildirimi</p>
                  <p className="text-[10px] font-bold text-purple-800 leading-relaxed uppercase italic">
                    Bu anket 5&apos;li Likert yapısındadır. Öğrenci {weekNumber}. haftanın içeriğini görmeden önce tüm şıkları doldurulmuş bu anketi yanıtlamak zorundadır.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center border-4 border-dashed border-purple-100 rounded-[3rem] bg-white/50 shadow-inner">
               <ShieldCheck size={56} className="mx-auto text-purple-200 mb-4 opacity-40" />
               <p className="text-gray-400 italic text-[11px] font-black uppercase tracking-[0.4em]">Anket kilidi bu hafta için aktif değil.</p>
            </div>
          )}
        </div>
              
        <button type="submit" disabled={loading} className="w-full mt-10 bg-[#1a1a1a] text-white py-6 rounded-[2rem] font-black tracking-[0.2em] hover:bg-black transition-all flex justify-center items-center gap-3 shadow-2xl active:scale-95 text-xs md:text-sm uppercase leading-none">
          <Save size={20} className="text-[#ce1212]" /> {loading ? "KAYDEDİLİYOR..." : "HAFTAYI KAYDET VE YAYINLA"}
        </button>
      </div>
    </form>
  );
};
