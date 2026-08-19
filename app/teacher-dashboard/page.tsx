"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '@/lib/api';
import { AxiosError } from 'axios';

import {
  Option,
  Question,
  Quiz,
  Flashcard,
  Material,
  EntryOption,
  EntryQuestion,
  QuizDetailAnalysis,
  ChatbotReportData,
  WeeklyProgress,
  BulkStudentData,
  StudentAnalytics,
  SurveyOption,
  SurveyQuestion,
  Survey,
  SurveyAnalysisResult
} from './types';

import { Header, TabType } from './components/Header';
import { BulkReportPdf } from './components/BulkReportPdf';
import { ChatbotReportPdf } from './components/ChatbotReportPdf';
import { ContentManagementTab } from './components/ContentManagementTab';
import { StudentAnalyticsTab } from './components/StudentAnalyticsTab';
import { ChatbotAnalyticsTab } from './components/ChatbotAnalyticsTab';
import { SurveyResultsTab } from './components/SurveyResultsTab';
import { SystemTimeAnalyticsTab } from './components/SystemTimeAnalyticsTab';
import { StudentReportModal } from './components/StudentReportModal';

export default function TeacherDashboard() {
  // --- STATE YÖNETİMİ ---
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [loading, setLoading] = useState(false);
  const [fetchingWeek, setFetchingWeek] = useState(false);
  const [analytics, setAnalytics] = useState<StudentAnalytics[]>([]);
  const [bulkData, setBulkData] = useState<BulkStudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentAnalytics | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('cocukgelisimi');

  const [weekNumber, setWeekNumber] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [scheduleDept, setScheduleDept] = useState<string>('cocukgelisimi');
  const [weekSchedules, setWeekSchedules] = useState<Record<string, { release_date: string | null; due_date: string | null }>>({});

  const [introTitle, setIntroTitle] = useState('Genel Tanıtım ve Oryantasyon');
  const [introVideoUrl, setIntroVideoUrl] = useState('');
  const [introDescription, setIntroDescription] = useState('');

  const [materials, setMaterials] = useState<Material[]>([{ content_type: 'video', embed_url: '', title: '', point_value: 10 }]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [chatbotData, setChatbotData] = useState<ChatbotReportData[]>([]);
  const [entryQuestions, setEntryQuestions] = useState<EntryQuestion[]>([]);

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('4');
  
  const [surveyAnalysis, setSurveyAnalysis] = useState<SurveyAnalysisResult[]>([]);
  
  const [isSurveyActive, setIsSurveyActive] = useState(false);
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [surveyTitle, setSurveyTitle] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [systemTimeData, setSystemTimeData] = useState<any>(null);

  const [preTestQuestions, setPreTestQuestions] = useState<Question[]>([
    {
      question_text: "",
      options: [
        { option_text: "", is_correct: true },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false }
      ]
    }
  ]);

  const [systemTimeLoading, setSystemTimeLoading] = useState<boolean>(true);
  const [selectedWeekTab, setSelectedWeekTab] = useState<string>('all');

  const currentDeptRef = useRef(selectedDepartment);

  // --- 1. ÖĞRENCİ ANALİZLERİNİ ÇEKME ---
  const fetchAnalytics = useCallback(async (dept = selectedDepartment, page = currentPage) => {
    if (!dept || dept === 'all') return;
    currentDeptRef.current = dept;
    setLoading(true);
    setAnalytics([]);
    
    try {
      const res = await api.get(`/contents/analytics/?department=${dept}&page=${page}`);
      
      if (currentDeptRef.current !== dept) return;

      if (res.data && res.data.results) {
        setAnalytics(res.data.results);
        setTotalCount(res.data.count); 
      } else if (Array.isArray(res.data)) {
        setAnalytics(res.data);
        setTotalCount(res.data.length);
      } else {
        setAnalytics([]);
        setTotalCount(0);
      }
    } catch (err) {
      if (currentDeptRef.current === dept) {
        console.error("Analiz verileri yüklenemedi:", err);
        setAnalytics([]); 
        setTotalCount(0);
      }
    } finally {
      if (currentDeptRef.current === dept) {
        setLoading(false);
      }
    }

    try {
      const bulkRes = await api.get(`/contents/bulk-academic-report/?department=${dept}`);
      if (currentDeptRef.current === dept) {
        setBulkData(bulkRes.data);
      }
    } catch (err) {
      console.error("Bulk akademik rapor çekilemedi:", err);
    }
  }, [selectedDepartment, currentPage]);

  // --- 2. CHATBOT ANALİZLERİNİ ÇEKME ---
  const fetchChatbotAnalytics = useCallback(async (dept = selectedDepartment) => {
    if (!dept || dept === 'all') return;
    setChatbotData([]);
    try {
      const res = await api.get(`/contents/chatbot-analytics/?department=${dept}`);
      setChatbotData(res.data);
    } catch (err) {
      console.error("Chatbot verileri yüklenemedi:", err);
      setChatbotData([]);
    }
  }, [selectedDepartment]);

  const [surveyPage, setSurveyPage] = useState(1);
  const [surveyTotalCount, setSurveyTotalCount] = useState(0);

  // --- 3. ANKET ANALİZ SONUÇLARINI ÇEKME (3'er öğrenci bazlı sayfalanmış) ---
  const fetchSurveyAnalytics = useCallback(async (dept = selectedDepartment, page = surveyPage) => {
    if (!dept || dept === 'all') return;
    setLoading(true);
    try {
      const res = await api.get(`/contents/academic/surveys/report/?department=${dept}&survey_id=${selectedSurveyId}&page=${page}`);
      if (res.data && res.data.results) {
        setSurveyAnalysis(res.data.results);
        setSurveyTotalCount(res.data.count);
      } else if (Array.isArray(res.data)) {
        setSurveyAnalysis(res.data);
        setSurveyTotalCount(res.data.length);
      } else {
        setSurveyAnalysis([]);
        setSurveyTotalCount(0);
      }
    } catch (err) {
      console.error("Anket analizleri çekilemedi:", err);
      setSurveyAnalysis([]);
      setSurveyTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment, selectedSurveyId, surveyPage]);

  // Sekme ve bölüm değişiminde veri tetikleme
  useEffect(() => {
    if (!selectedDepartment || selectedDepartment === 'all') return;

    if (activeTab === 'analytics') {
      fetchAnalytics(selectedDepartment, currentPage);
    }
    if (activeTab === 'chatbot') {
      fetchChatbotAnalytics(selectedDepartment);
    }
    if (activeTab === 'survey_results') {
      fetchSurveyAnalytics(selectedDepartment, surveyPage); 
    }
  }, [activeTab, selectedDepartment, currentPage, surveyPage, selectedSurveyId, fetchAnalytics, fetchChatbotAnalytics, fetchSurveyAnalytics]);

  // Anket Soru İşlemleri
  const addSurveyQuestion = () => {
    setSurveyQuestions([
      ...surveyQuestions,
      { 
        text: "", 
        category: "", 
        options: [
          { option_text: "", value: 1 },
          { option_text: "", value: 2 },
          { option_text: "", value: 3 },
          { option_text: "", value: 4 },
          { option_text: "", value: 5 }
        ] 
      }
    ]);
  };

  const updateSurveyOption = (qIdx: number, oIdx: number, text: string) => {
    setSurveyQuestions(prevQuestions => {
      const newQuestions = [...prevQuestions];
      const targetQuestion = { ...newQuestions[qIdx] };
      const newOptions = [...targetQuestion.options];
      newOptions[oIdx] = { ...newOptions[oIdx], option_text: text };
      targetQuestion.options = newOptions;
      newQuestions[qIdx] = targetQuestion;
      return newQuestions;
    });
  };

  const updateSurveyQuestion = (index: number, field: keyof SurveyQuestion, value: string) => {
    setSurveyQuestions(prev => {
      const newQs = [...prev];
      newQs[index] = { ...newQs[index], [field]: value };
      return newQs;
    });
  };

  // Hafta Detayı Çekme
  const fetchWeekDetail = useCallback(async (week: number) => {
    setFetchingWeek(true);
    try {
      const res = await api.get(`/contents/list/?week_number=${week}`);
      const data = res.data;
      
      setIntroDescription(data.intro_description || '');
      setTitle(data.title || '');
      setDescription(data.description || '');

      const rawSchedules = data.schedules || {};
      setWeekSchedules(rawSchedules);

      const activeDeptKey = scheduleDept || 'cocukgelisimi';
      const currentDeptSchedule = rawSchedules[activeDeptKey];

      if (currentDeptSchedule && currentDeptSchedule.release_date) {
        setReleaseDate(currentDeptSchedule.release_date.split('T')[0]);
      } else if (data.release_date) {
        setReleaseDate(data.release_date.split('T')[0]);
      } else {
        setReleaseDate('');
      }

      if (currentDeptSchedule && currentDeptSchedule.due_date) {
        setDueDate(currentDeptSchedule.due_date.split('T')[0]);
      } else if (data.due_date) {
        setDueDate(data.due_date.split('T')[0]);
      } else {
        setDueDate('');
      }

      if (data.intro_video_url !== undefined) {
        setIntroVideoUrl(data.intro_video_url || '');
        setIntroTitle(data.intro_title || 'Genel Tanıtım ve Oryantasyon');
      }

      if (data.materials && data.materials.length > 0) {
        setMaterials(data.materials);
      } else {
        setMaterials([{ content_type: 'video', embed_url: '', title: '', point_value: 10 }]);
      }

      setFlashcards(data.flashcards || []);
      setEntryQuestions(data.entry_questions || []);

      if (data.survey_data) {
        setIsSurveyActive(true); 
        
        if (typeof setSurveyTitle === 'function') {
           setSurveyTitle(data.survey_data.title || '');
        }

        if (data.survey_data.questions && data.survey_data.questions.length > 0) {
          const formattedSurveyQuestions = data.survey_data.questions.map((q: any) => ({
            id: q.id,
            text: q.text,
            category: q.category || '',
            options: q.options && q.options.length > 0 ? q.options : [
              { option_text: "Hiçbir zaman", value: 1 },
              { option_text: "Ender olarak", value: 2 },
              { option_text: "Bazen", value: 3 },
              { option_text: "Sıklıkla", value: 4 },
              { option_text: "Her zaman", value: 5 }
            ]
          }));
          setSurveyQuestions(formattedSurveyQuestions);
        } else {
          setSurveyQuestions([]);
        }
      } else {
        setIsSurveyActive(false);
        setSurveyQuestions([]);
        if (typeof setSurveyTitle === 'function') setSurveyTitle('');
      }

      if (week === 1) {
        if (data.pre_test_questions && data.pre_test_questions.length > 0) {
          setPreTestQuestions(data.pre_test_questions);
        } else {
          setPreTestQuestions([
            {
              question_text: "",
              options: [
                { option_text: "", is_correct: true },
                { option_text: "", is_correct: false },
                { option_text: "", is_correct: false },
                { option_text: "", is_correct: false },
                { option_text: "", is_correct: false }
              ]
            }
          ]);
        }
      } else {
        setPreTestQuestions([]);
      }

    } catch (err) {
      console.error("Haftalık veriler çekilemedi:", err);
      setTitle('');
      setDescription('');
      setReleaseDate('');
      setDueDate('');
      setMaterials([{ content_type: 'video', embed_url: '', title: '', point_value: 10 }]);
      setFlashcards([]);
      setPreTestQuestions([]);
      setIsSurveyActive(false);
      setSurveyQuestions([]);
      if (typeof setSurveyTitle === 'function') setSurveyTitle('');
    } finally {
      setFetchingWeek(false);
    }
  }, [setIsSurveyActive, setSurveyQuestions, scheduleDept]);

  useEffect(() => {
    if (activeTab === 'content') {
      fetchWeekDetail(weekNumber);
    }
  }, [weekNumber, activeTab, fetchWeekDetail]);

  useEffect(() => {
    if (activeTab !== 'time_analytics') return;

    setSystemTimeLoading(true);
    
    let url = '/contents/system-time-analytics/';
    if (selectedDepartment) {
      url += `?department=${selectedDepartment}`;
    }

    api.get(url)
      .then(res => {
        if (!res.data || Object.keys(res.data).length === 0 || !res.data.raw_student_list) {
          setSystemTimeData({
            max_engagement: { student: "Veri Yok", time: "0 Saat" },
            min_engagement: { student: "Veri Yok", time: "0 Saat" },
            activity_distribution: [
              { type: "Video İzleme", hours: 0 },
              { type: "Ders Notu Okuma (PDF)", hours: 0 },
              { type: "Bilgi Testi (Quiz)", hours: 0 },
              { type: "Podcast Dinleme", hours: 0 },
              { type: "Ödev Çözme", hours: 0 }
            ],
            raw_student_list: []
          });
        } else {
          setSystemTimeData(res.data);
        }
        setSystemTimeLoading(false);
      })
      .catch(err => {
        console.error("Zaman analitiği yüklenirken hata:", err);
        setSystemTimeLoading(false);
      });
  }, [selectedDepartment, activeTab]);

  const handlePrintChatbot = () => {
    const academicReport = document.getElementById('bulk-report-pdf');
    const chatbotReport = document.getElementById('chatbot-report-pdf');
    
    if (academicReport) academicReport.style.display = 'none';
    if (chatbotReport) chatbotReport.style.display = 'block';
    
    window.print();
    
    if (chatbotReport) chatbotReport.style.display = 'none';
  };

  const handlePrintAcademic = () => {
    const academicReport = document.getElementById('bulk-report-pdf');
    const chatbotReport = document.getElementById('chatbot-report-pdf');
    
    if (chatbotReport) chatbotReport.style.display = 'none';
    if (academicReport) academicReport.style.display = 'block';
    
    window.print();
    
    if (academicReport) academicReport.style.display = 'none';
  };

  const filteredAnalytics = useMemo(() => {
    return analytics;
  }, [analytics]);

  const filteredBulkData = useMemo(() => {
    return bulkData;
  }, [bulkData]);

  // Materyal Etkileşimleri
  const addMaterialRow = () => {
    setMaterials([...materials, { content_type: 'video', embed_url: '', title: '', point_value: 10, min_duration_seconds: 300 }]);
  };

  const removeMaterialRow = (index: number) => {
    if (materials.length > 1) {
      setMaterials(materials.filter((_, i) => i !== index));
    }
  };

  const updateMaterial = (index: number, field: keyof Material, value: unknown) => {
    const newMaterials = [...materials];

    if (field === 'content_type') {
      newMaterials[index].content_type = value as any;
      if (value === 'form' && !newMaterials[index].quiz) {
        newMaterials[index].quiz = {
          title: newMaterials[index].title || "Haftalık Değerlendirme",
          description: "",
          questions: [{
            question_text: "",
            options: [
              { option_text: "", is_correct: true },
              { option_text: "", is_correct: false },
              { option_text: "", is_correct: false },
              { option_text: "", is_correct: false },
              { option_text: "", is_correct: false }
            ]
          }]
        };
      }
    } else if (field === 'title') {
      newMaterials[index].title = value as string;
    } else if (field === 'embed_url') {
      newMaterials[index].embed_url = value as string;
    } else if (field === 'point_value') {
      newMaterials[index].point_value = Number(value);
    } else if (field === 'min_duration_seconds') {
      newMaterials[index].min_duration_seconds = Number(value);
    }

    setMaterials(newMaterials);
  };

  const addEntryQuestion = () => {
    setEntryQuestions([
      ...entryQuestions,
      {
        question_text: "",
        target_week: 1,
        options: [
          { option_text: "", is_correct: true },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false }
        ]
      }
    ]);
  };

  const updateEntryQuestion = (index: number, field: keyof EntryQuestion, value: any) => {
    const newQs = [...entryQuestions];
    newQs[index] = { ...newQs[index], [field]: value };
    setEntryQuestions(newQs);
  };

  const updateEntryOption = (qIdx: number, oIdx: number, text: string) => {
    const newQs = [...entryQuestions];
    newQs[qIdx].options[oIdx].option_text = text;
    setEntryQuestions(newQs);
  };

  const setCorrectEntryOption = (qIdx: number, oIdx: number) => {
    const newQs = [...entryQuestions];
    newQs[qIdx].options.forEach((opt, i) => {
      opt.is_correct = i === oIdx;
    });
    setEntryQuestions(newQs);
  };

  // Sınav (Quiz) Fonksiyonları
  const addQuestion = (mIndex: number) => {
    const newMats = [...materials];
    if (newMats[mIndex].quiz) {
      newMats[mIndex].quiz!.questions.push({
        question_text: "",
        options: [
          { option_text: "", is_correct: true },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false }
        ]
      });
    }
    setMaterials(newMats);
  };

  const updateQuestionText = (mIndex: number, qIndex: number, text: string) => {
    const newMats = [...materials];
    if (newMats[mIndex].quiz) {
      newMats[mIndex].quiz!.questions[qIndex].question_text = text;
    }
    setMaterials(newMats);
  };

  const updateOption = (mIndex: number, qIndex: number, oIndex: number, text: string) => {
    const newMats = [...materials];
    if (newMats[mIndex].quiz) {
      newMats[mIndex].quiz!.questions[qIndex].options[oIndex].option_text = text;
    }
    setMaterials(newMats);
  };

  const setCorrectOption = (mIndex: number, qIndex: number, oIndex: number) => {
    const newMats = [...materials];
    if (newMats[mIndex].quiz) {
      newMats[mIndex].quiz!.questions[qIndex].options.forEach((opt, i) => {
        opt.is_correct = i === oIndex;
      });
    }
    setMaterials(newMats);
  };

  const updateFlashcard = (index: number, field: keyof Flashcard, value: string) => {
    const newCards = [...flashcards];
    newCards[index] = { ...newCards[index], [field]: value };
    setFlashcards(newCards);
  };

  // Kaydetme ve Yayınlama
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        week_number: Number(weekNumber),
        title: title,
        description: description,
        release_date: releaseDate || null,
        due_date: dueDate || null,
        schedule_department: scheduleDept,
        intro_title: introTitle,
        intro_video_url: introVideoUrl,
        intro_description: introDescription,
        has_survey: isSurveyActive,
        survey_title: selectedSurveyId, 
        
        survey_questions: isSurveyActive 
          ? surveyQuestions
              .filter((q: SurveyQuestion) => q.text && q.text.trim() !== "") 
              .map((q: SurveyQuestion, index: number) => {
                const questionData: any = {
                  text: q.text,
                  category: q.category || "",
                  order: index,
                  options: (q.options && q.options.length > 0) 
                    ? q.options.map((opt: SurveyOption) => {
                        const optionData: any = {
                          option_text: opt.option_text || "",
                          value: opt.value !== undefined ? opt.value : 0
                        };
                        if (opt.id) {
                          optionData.id = opt.id;
                        }
                        return optionData;
                      })
                    : []
                };
                if (q.id) {
                  questionData.id = q.id;
                }
                return questionData;
              })
          : [],

        materials: materials
          .filter(m => m.title.trim() !== "")
          .map((m) => ({
            ...(m.id ? { id: m.id } : {}),
            title: m.title,
            content_type: m.content_type,
            embed_url: m.embed_url,
            point_value: m.point_value,
            min_duration_seconds: m.min_duration_seconds ?? 300,
            ...(m.quiz ? {
              quiz: {
                ...(m.quiz.id ? { id: m.quiz.id } : {}),
                title: m.quiz.title || m.title,
                description: m.quiz.description || "",
                questions: m.quiz.questions.map((q, qIdx) => ({
                  ...(q.id ? { id: q.id } : {}),
                  question_text: q.question_text,
                  order: qIdx,
                  options: q.options.map((opt) => ({
                    ...(opt.id ? { id: opt.id } : {}),
                    option_text: opt.option_text,
                    is_correct: opt.is_correct
                  }))
                }))
              }
            } : {})
          })),

        flashcards: flashcards.filter(f => f.question.trim() !== "").map((f, index) => ({ 
          ...(f.id ? { id: f.id } : {}),
          question: f.question,
          answer: f.answer,
          order: index 
        })),

        pre_test_questions: Number(weekNumber) === 1 
          ? preTestQuestions.filter(q => q.question_text.trim() !== "").map((q, qIdx) => ({
              ...(q.id ? { id: q.id } : {}),
              question_text: q.question_text,
              order: qIdx,
              options: q.options.map(opt => ({
                ...(opt.id ? { id: opt.id } : {}),
                option_text: opt.option_text,
                is_correct: opt.is_correct
              }))
            }))
          : [],

        entry_questions: Number(weekNumber) > 1 
          ? entryQuestions.filter(q => q.question_text.trim() !== "").map((q, index) => ({
              ...(q.id ? { id: q.id } : {}),
              question_text: q.question_text,
              order: index,
              target_week: q.target_week, 
              options: q.options.map(opt => ({
                ...(opt.id ? { id: opt.id } : {}),
                option_text: opt.option_text,
                is_correct: opt.is_correct
              }))
            })) 
          : [],
      };

      await api.post('/contents/list/', payload);
      alert("Haftalık içerik ve anket başarıyla güncellendi.");
      fetchWeekDetail(weekNumber);
    } catch (err) {
      const error = err as AxiosError<{ detail?: string }>;
      alert(error.response?.data?.detail || "Kayıt hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-roboto text-secondary text-left">
      
      {/* 1. PDF ŞABLONLARI (Gizli - Sadece Yazıcıda Görünür) */}
      <BulkReportPdf 
        filteredBulkData={filteredBulkData} 
        selectedDepartment={selectedDepartment} 
      />
      <ChatbotReportPdf 
        chatbotData={chatbotData} 
        selectedDepartment={selectedDepartment} 
      />

      {/* 2. ÜST NAVİGASYON BAŞLIĞI */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {/* 3. ANA İÇERİK (MAIN SEKMELERİ) */}
      <main className="max-w-6xl mx-auto p-4 md:p-12 pt-8 md:pt-12 print:hidden text-left">
        
        {/* SEKME 1: İÇERİK YÖNETİMİ */}
        {activeTab === 'content' && (
          <ContentManagementTab
            handleSubmit={handleSubmit}
            loading={loading}
            fetchingWeek={fetchingWeek}
            weekNumber={weekNumber}
            setWeekNumber={setWeekNumber}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            releaseDate={releaseDate}
            setReleaseDate={setReleaseDate}
            dueDate={dueDate}
            setDueDate={setDueDate}
            scheduleDept={scheduleDept}
            setScheduleDept={setScheduleDept}
            weekSchedules={weekSchedules}
            introTitle={introTitle}
            setIntroTitle={setIntroTitle}
            introVideoUrl={introVideoUrl}
            setIntroVideoUrl={setIntroVideoUrl}
            introDescription={introDescription}
            setIntroDescription={setIntroDescription}
            materials={materials}
            setMaterials={setMaterials}
            addMaterialRow={addMaterialRow}
            removeMaterialRow={removeMaterialRow}
            updateMaterial={updateMaterial}
            addQuestion={addQuestion}
            updateQuestionText={updateQuestionText}
            updateOption={updateOption}
            setCorrectOption={setCorrectOption}
            flashcards={flashcards}
            setFlashcards={setFlashcards}
            updateFlashcard={updateFlashcard}
            preTestQuestions={preTestQuestions}
            setPreTestQuestions={setPreTestQuestions}
            entryQuestions={entryQuestions}
            setEntryQuestions={setEntryQuestions}
            addEntryQuestion={addEntryQuestion}
            updateEntryQuestion={updateEntryQuestion}
            updateEntryOption={updateEntryOption}
            setCorrectEntryOption={setCorrectEntryOption}
            isSurveyActive={isSurveyActive}
            setIsSurveyActive={setIsSurveyActive}
            selectedSurveyId={selectedSurveyId}
            setSelectedSurveyId={setSelectedSurveyId}
            surveyQuestions={surveyQuestions}
            setSurveyQuestions={setSurveyQuestions}
            addSurveyQuestion={addSurveyQuestion}
            updateSurveyQuestion={updateSurveyQuestion}
            updateSurveyOption={updateSurveyOption}
          />
        )}

        {/* SEKME 2: ÖĞRENCİ ANALİZLERİ */}
        {activeTab === 'analytics' && (
          <StudentAnalyticsTab
            totalCount={totalCount}
            analytics={analytics}
            selectedDepartment={selectedDepartment}
            setSelectedDepartment={setSelectedDepartment}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            fetchAnalytics={fetchAnalytics}
            handlePrintAcademic={handlePrintAcademic}
            setSelectedStudent={setSelectedStudent}
            loading={loading}
          />
        )}

        {/* SEKME 3: CHATBOT ANALİZİ */}
        {activeTab === 'chatbot' && (
          <ChatbotAnalyticsTab
            selectedDepartment={selectedDepartment}
            setSelectedDepartment={setSelectedDepartment}
            chatbotData={chatbotData}
            handlePrintChatbot={handlePrintChatbot}
          />
        )}

        {/* SEKME 4: ANKET SONUÇLARI */}
        {activeTab === 'survey_results' && (
          <SurveyResultsTab
            selectedDepartment={selectedDepartment}
            setSelectedDepartment={setSelectedDepartment}
            selectedSurveyId={selectedSurveyId}
            setSelectedSurveyId={setSelectedSurveyId}
            surveyAnalysis={surveyAnalysis}
            loading={loading}
            surveyPage={surveyPage}
            setSurveyPage={setSurveyPage}
            surveyTotalCount={surveyTotalCount}
            fetchSurveyAnalytics={fetchSurveyAnalytics}
          />
        )}

        {/* SEKME 5: SİSTEM ZAMAN ANALİTİĞİ */}
        {activeTab === 'time_analytics' && (
          <SystemTimeAnalyticsTab
            selectedDepartment={selectedDepartment}
            setSelectedDepartment={setSelectedDepartment}
            systemTimeLoading={systemTimeLoading}
            systemTimeData={systemTimeData}
            selectedWeekTab={selectedWeekTab}
            setSelectedWeekTab={setSelectedWeekTab}
          />
        )}
      </main>

      {/* KARNE MODALI */}
      <StudentReportModal
        selectedStudent={selectedStudent}
        setSelectedStudent={setSelectedStudent}
      />
    </div>
  );
}