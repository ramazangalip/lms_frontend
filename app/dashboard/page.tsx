"use client";
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import {
  PlayCircle,
  RefreshCcw,
  User,
  Trophy
} from 'lucide-react';
import Link from 'next/link';
import {
  Material,
  WeeklyContent,
  Question,
  ChatMessage
} from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PreTestGatekeeper } from './components/PreTestGatekeeper';
import { SurveyGatekeeper } from './components/SurveyGatekeeper';
import { EntryTestGatekeeper } from './components/EntryTestGatekeeper';
import { MaterialViewer } from './components/MaterialViewer';
import { FlashcardsSection } from './components/FlashcardsSection';
import { ChatbotDrawer } from './components/ChatbotDrawer';
import { AIAnalysisModal } from './components/AIAnalysisModal';

export default function StudentDashboard() {
  const [contents, setContents] = useState<WeeklyContent[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeeklyContent | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);
  const [isIntroView, setIsIntroView] = useState(true);
  const [loading, setLoading] = useState(true);
  const [completedMaterials, setCompletedMaterials] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pointsEarned, setPointsEarned] = useState<{ show: boolean; amount: number }>({ show: false, amount: 0 });
  const [userTotalPoints, setUserTotalPoints] = useState(0);
  const trackingInterval = useRef<NodeJS.Timeout | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; correct: number; wrong: number; predicted_score?: number; calibration_gap?: number } | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [aiAnalysisFeedback, setAiAnalysisFeedback] = useState<string | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', content: 'Merhaba! Ben BÜ-LMS Yapay Zeka asistanıyım. Sana nasıl yardımcı olabilirim?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [entryAnswers, setEntryAnswers] = useState<Record<number, number>>({});
  const [entrySubmitting, setEntrySubmitting] = useState(false);

  const materialWatchThreshold = 300;
  const introWatchThreshold = 240;
  const [watchTime, setWatchTime] = useState(0);
  const [introWatchTime, setIntroWatchTime] = useState(0);
  const activeMaterialRef = useRef<Material | null>(null);
  const watchTimeInternalRef = useRef(0);
  const introWatchTimeInternalRef = useRef(0);
  const watchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const introTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  const [preTestQuestions, setPreTestQuestions] = useState<Question[]>([]);
  const [preTestAnswers, setPreTestAnswers] = useState<Record<number, number>>({});
  const [surveyAnswers, setSurveyAnswers] = useState<Record<number, number>>({});
  const [surveySubmitting, setSurveySubmitting] = useState(false);

  const [preTestResult, setPreTestResult] = useState<{
    score: number;
    correct?: number;
    wrong?: number;
    is_completed: boolean;
  } | null>(null);
  const [preTestSubmitting, setPreTestSubmitting] = useState(false);
  const [entryResult, setEntryResult] = useState<{
    unlockedWeeks: number[];
    isSuccess: boolean;
    correctCount: number;
    wrongCount: number;
  }>({
    unlockedWeeks: [],
    isSuccess: false,
    correctCount: 0,
    wrongCount: 0,
  });

  useEffect(() => {
    activeMaterialRef.current = activeMaterial;
  }, [activeMaterial]);

  const getSortedMaterials = (mats: Material[]) => {
    const orderMap = { pdf: 1, video: 2, podcast: 3, form: 4, assignment: 5 };
    return [...mats].sort((a, b) => (orderMap[a.content_type] || 6) - (orderMap[b.content_type] || 6));
  };

  const isQuizLocked = () => {
    if (!selectedWeek) return false;
    const requiredMaterials = selectedWeek.materials.filter((m) => m.content_type !== 'form');
    return requiredMaterials.some((m) => !completedMaterials.includes(String(m.id)));
  };

  const getIntroData = () => {
    const weekOne = contents.find((c) => c.week_number === 1);
    return {
      url: weekOne?.intro_video_url || "",
      title: weekOne?.intro_title || "Genel Oryantasyon",
      isWatched: weekOne?.is_intro_watched || false,
      description: weekOne?.intro_description || "",
    };
  };

  const fetchQuizLastAttempt = async (quizId: number | string | undefined | null) => {
    // GUARD CLAUSE: Quiz ID null, undefined, 0 veya "undefined" ise ISTEK ATMA!
    if (!quizId || String(quizId) === 'undefined' || String(quizId).trim() === '' || String(quizId) === 'null') {
      return;
    }

    try {
      const res = await api.get(`/contents/quiz/${quizId}/last-attempt/`);
      if (res.data && res.data.id) {
        setQuizResult({
          score: res.data.score,
          correct: res.data.correct,
          wrong: res.data.wrong,
          predicted_score: res.data.predicted_score,
          calibration_gap: res.data.calibration_gap,
        });
        setCurrentAttemptId(String(res.data.id));
      }
    } catch (qErr) {
      console.log("Sınav son deneme verisi çekilemedi.");
    }
  };

  const handleSurveySubmit = async () => {
    if (!selectedWeek?.survey_data) return;

    if (Object.keys(surveyAnswers).length < selectedWeek.survey_data.questions.length) {
      alert("Lütfen tüm anket sorularını cevaplayın.");
      return;
    }

    setSurveySubmitting(true);
    try {
      const payload = Object.entries(surveyAnswers).map(([qId, val]) => ({
        question_id: Number(qId),
        answer_value: Number(val),
      }));

      await api.post(`/contents/surveys/week/${selectedWeek.week_number}/`, payload);

      if (typeof fetchContents === 'function') {
        await fetchContents(true);
      }

      setSurveyAnswers({});
      alert("Anket tamamlandı, materyaller erişime açıldı!");
    } catch (err: any) {
      console.error("Anket Gönderim Hatası:", err.response?.data);
      const errorMsg = err.response?.data?.detail || "Anket gönderilirken bir hata oluştu.";
      alert(errorMsg);
    } finally {
      setSurveySubmitting(false);
    }
  };

  const fetchContents = async (isUpdate = false) => {
    try {
      const [contentRes, bootstrapRes] = await Promise.all([
        api.get('/contents/list/'),
        api.get('/contents/bootstrap/')
      ]);

      if (bootstrapRes.data?.pre_test) {
        setPreTestQuestions(bootstrapRes.data.pre_test.questions || []);
        if (bootstrapRes.data.pre_test.result) {
          const { is_completed, score, correct, wrong } = bootstrapRes.data.pre_test.result;
          setPreTestResult({ is_completed, score, correct, wrong });
        }
      }

      setUserTotalPoints(bootstrapRes.data?.user_info?.total_points || 0);

      const stringifiedCompleted = (bootstrapRes.data?.completed_material_ids || []).map((id: any) => String(id));
      setCompletedMaterials(stringifiedCompleted);

      const rawContents = contentRes.data;
      const mergedData = rawContents.map((week: WeeklyContent) => {
        return {
          ...week,
          progress: Math.round(week.progress || 0),
          is_completed: !!week.is_completed,
          is_entry_test_required: !!week.is_entry_test_required,
          is_survey_required: !!week.is_survey_required,
          survey_data: week.survey_data
        };
      });
      setContents(mergedData);

      if (selectedWeek) {
        const freshWeekData = mergedData.find((w: WeeklyContent) => String(w.id) === String(selectedWeek.id));
        if (freshWeekData) {
          setSelectedWeek(freshWeekData);
        }
      }

      const currentWeek = selectedWeek || mergedData.sort((a: WeeklyContent, b: WeeklyContent) => a.week_number - b.week_number)[0];
      if (currentWeek) {
        const quizMat = currentWeek.materials?.find((m: Material) => m.content_type === 'form');
        const qId = quizMat?.quiz?.id;
        if (qId && String(qId) !== 'undefined' && String(qId) !== 'null') {
          await fetchQuizLastAttempt(qId);
        }
      }

      if (isInitialMount.current && mergedData.length > 0 && !selectedWeek) {
        const firstWeek = mergedData.sort((a: WeeklyContent, b: WeeklyContent) => a.week_number - b.week_number)[0];
        setSelectedWeek(firstWeek);
        setIsIntroView(true);
        isInitialMount.current = false;
      }
    } catch (err) {
      console.error("İçerik yükleme hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  const handleCompleteMaterial = async (materialId: number | string) => {
    if (!materialId) return;
    const strMatId = String(materialId);

    setCompletedMaterials((prev) => (prev.includes(strMatId) ? prev : [...prev, strMatId]));

    try {
      const res = await api.post('contents/complete-material/', { material_id: strMatId });

      if (res.data.status === "success") {
        if (res.data.total_points !== undefined) {
          setUserTotalPoints(res.data.total_points);
        }

        if (res.data.new_points_earned > 0) {
          setPointsEarned({ show: true, amount: res.data.new_points_earned });
          setTimeout(() => setPointsEarned({ show: false, amount: 0 }), 5000);
        }

        if (res.data.current_percentage !== undefined && selectedWeek) {
          const newPercentage = Math.round(res.data.current_percentage);
          const isFinished = newPercentage >= 100;

          setSelectedWeek((prev) =>
            prev
              ? {
                  ...prev,
                  progress: newPercentage,
                  is_completed: isFinished,
                  total_score: res.data.total_points !== undefined ? res.data.total_points : prev.total_score,
                }
              : null
          );

          setContents((prevContents) =>
            prevContents.map((w) => {
              if (w.id === selectedWeek.id) {
                return {
                  ...w,
                  progress: newPercentage,
                  is_completed: isFinished,
                  total_score: res.data.total_points !== undefined ? res.data.total_points : w.total_score,
                };
              }
              return w;
            })
          );
        }
      }

      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
      watchTimeInternalRef.current = 0;
      setWatchTime(0);

      await fetchContents(true);
    } catch (err) {
      console.error("Tamamlama hatası.");
    }
  };

  useEffect(() => {
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
      trackingInterval.current = null;
    }
    if (selectedWeek) {
      const sendPing = async () => {
        try {
          await api.post('/contents/track-activity/', {
            weekly_content_id: selectedWeek.id,
            material_id: activeMaterial?.id || null,
            seconds: 30,
          });
        } catch (err) {
          console.error("Ping hatası");
        }
      };
      trackingInterval.current = setInterval(sendPing, 30000);
    }
    return () => {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
        trackingInterval.current = null;
      }
    };
  }, [selectedWeek?.id, activeMaterial?.id]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const handlePreTestSubmit = async () => {
    if (Object.keys(preTestAnswers).length < preTestQuestions.length) {
      alert("Lütfen tüm ön değerlendirme sorularını cevaplayın.");
      return;
    }

    setPreTestSubmitting(true);
    try {
      const answers = Object.entries(preTestAnswers).map(([qId, oId]) => ({
        question_id: Number(qId),
        option_id: Number(oId),
      }));

      const res = await api.post('/contents/pre-test/submit/', { answers });

      setPreTestResult({
        score: res.data.score,
        correct: res.data.correct,
        wrong: res.data.wrong,
        is_completed: true,
      });

      setSurveyAnswers({});
      await fetchContents(true);

      alert("Ön değerlendirme başarıyla tamamlandı! Bir sonraki aşamaya geçebilirsiniz.");
    } catch (err) {
      console.error("Ön test gönderilirken hata oluştu:", err);
      alert("Ön test gönderilirken bir hata oluştu.");
    } finally {
      setPreTestSubmitting(false);
    }
  };

  const handleEntryTestSubmit = async () => {
    if (!selectedWeek || !selectedWeek.entry_questions) return;

    if (Object.keys(entryAnswers).length < selectedWeek.entry_questions.length) {
      alert("Lütfen tüm hazırlık sorularını cevaplayın.");
      return;
    }

    setEntrySubmitting(true);
    try {
      const answers = Object.entries(entryAnswers).map(([qId, oId]) => ({
        question_id: Number(qId),
        option_id: Number(oId),
      }));

      const res = await api.post(`/contents/week/${selectedWeek.week_number}/submit-entry-test/`, { answers });

      if (res.data.wrong_target_weeks && res.data.wrong_target_weeks.length > 0) {
        alert(
          `Bazı soruları yanlış cevapladınız. Hatırlamanız için şu haftaların kilidi 2 günlüğüne açıldı: ${res.data.wrong_target_weeks.join(', ')}. hafta`
        );
      }

      setSurveyAnswers({});
      await fetchContents(true);
      setEntryAnswers({});
    } catch (err) {
      alert("Test gönderilirken bir hata oluştu.");
    } finally {
      setEntrySubmitting(false);
    }
  };

  const handleQuizSubmit = async (predictedScore?: number) => {
    const quizId = activeMaterial?.quiz?.id;
    if (!quizId || String(quizId) === 'undefined' || String(quizId) === 'null') {
      alert("Sınav verisi bulunamadı.");
      return;
    }
    const totalQs = activeMaterial.quiz?.questions?.length || 0;
    if (totalQs > 0 && Object.keys(selectedAnswers).length < totalQs) {
      alert("Lütfen tüm soruları cevaplayın.");
      return;
    }
    setQuizSubmitting(true);
    try {
      const answers = Object.entries(selectedAnswers).map(([qId, oId]) => ({
        question_id: String(qId),
        option_id: String(oId),
      }));

      const res = await api.post(`/contents/quiz/${String(quizId)}/submit/`, {
        answers,
        predicted_score: predictedScore !== undefined ? predictedScore : 80
      });

      setQuizResult({
        score: res.data.score,
        correct: res.data.correct,
        wrong: res.data.wrong,
        predicted_score: res.data.predicted_score,
        calibration_gap: res.data.calibration_gap,
      });
      setCurrentAttemptId(String(res.data.attempt_id));

      const quizMatId = res.data.material_id || (activeMaterial ? String(activeMaterial.id) : null);
      if (quizMatId) {
        setCompletedMaterials((prev) => (prev.includes(String(quizMatId)) ? prev : [...prev, String(quizMatId)]));
      }

      if (res.data.completion_percentage !== undefined && selectedWeek) {
        const newPercentage = Math.round(res.data.completion_percentage);
        const isFinished = !!res.data.is_completed || newPercentage >= 100;

        setSelectedWeek((prev) =>
          prev
            ? {
                ...prev,
                progress: newPercentage,
                is_completed: isFinished,
              }
            : null
        );

        setContents((prevContents) =>
          prevContents.map((w) => {
            if (String(w.id) === String(selectedWeek.id)) {
              return {
                ...w,
                progress: newPercentage,
                is_completed: isFinished,
              };
            }
            return w;
          })
        );
      }

      if (res.data.next_round_activated) {
        alert(
          "Yanlış cevaplarınız olduğu için Yapay Zeka analizinden sonra 2. Tur başlayacaktır. Materyalleri tekrar gözden geçirebilirsiniz."
        );
      }

      const earned = res.data.points_earned || 0;
      if (earned > 0) {
        setPointsEarned({ show: true, amount: earned });
        setUserTotalPoints((prev) => prev + earned);
        setTimeout(() => setPointsEarned({ show: false, amount: 0 }), 5000);
      }

      await fetchContents(true);
    } catch (err) {
      alert("Test gönderim hatası.");
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleFetchAIAnalysis = async () => {
    if (!currentAttemptId || String(currentAttemptId) === 'undefined' || String(currentAttemptId) === 'null') {
      return;
    }
    setIsAnalysisLoading(true);
    setIsAnalysisModalOpen(true);
    setAiAnalysisFeedback("");

    try {
      const res = await api.get(`/contents/quiz-analysis/${currentAttemptId}/`);

      if (res.data && res.data.ai_feedback) {
        setAiAnalysisFeedback(res.data.ai_feedback);
      } else {
        setAiAnalysisFeedback("Analiz verisi bulunamadı.");
      }
    } catch (err) {
      console.error("Analiz Hatası:", err);
      setAiAnalysisFeedback("Analiz yüklenirken bir hata oluştu.");
    } finally {
      setIsAnalysisLoading(false);
    }
  };



  const fetchChatHistory = async () => {
    try {
      const res = await api.get('/contents/ai-chat/history/', {
        params: { weekly_content_id: selectedWeek?.id }
      });
      const loadedMsgs: ChatMessage[] = [
        { role: 'bot', content: selectedWeek ? `Merhaba! Ben BÜ-LMS Yapay Zeka asistanıyım. ${selectedWeek.week_number}. Hafta konusundaki sorularınızı sorabilirsiniz.` : 'Merhaba! Ben BÜ-LMS Yapay Zeka asistanıyım. Sana nasıl yardımcı olabilirim?' }
      ];
      if (res.data && Array.isArray(res.data.history) && res.data.history.length > 0) {
        res.data.history.forEach((item: any) => {
          if (item.question_text) {
            loadedMsgs.push({ role: 'user', content: item.question_text });
          }
          if (item.ai_response_text) {
            loadedMsgs.push({ role: 'bot', content: item.ai_response_text });
          }
        });
      }
      setMessages(loadedMsgs);
    } catch (err) {
      console.error("Sohbet geçmişi yüklenemedi:", err);
    }
  };

  useEffect(() => {
    if (isChatOpen) {
      fetchChatHistory();
    }
  }, [isChatOpen, selectedWeek?.id]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatInput("");
    setIsTyping(true);
    try {
      const res = await api.post('/contents/ai-chat/', { message: userMsg, weekly_content_id: selectedWeek?.id });
      setMessages((prev) => [...prev, { role: 'bot', content: res.data.response }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'bot', content: 'Hata oluştu.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const introStatus = getIntroData();

  useEffect(() => {
    if (introTimerRef.current) clearInterval(introTimerRef.current);

    if (isIntroView && !introStatus.isWatched) {
      introWatchTimeInternalRef.current = 0;
      setIntroWatchTime(0);

      introTimerRef.current = setInterval(() => {
        introWatchTimeInternalRef.current += 1;
        setIntroWatchTime(introWatchTimeInternalRef.current);

        if (introWatchTimeInternalRef.current >= introWatchThreshold) {
          if (introTimerRef.current) clearInterval(introTimerRef.current);

          api.post('/contents/weeks/complete-intro/')
            .then(() => {
              fetchContents(true);
            })
            .catch((err) => {
              console.error("Tanıtım tamamlama isteği gönderilemedi:", err);
            });
        }
      }, 1000);
    }

    return () => {
      if (introTimerRef.current) clearInterval(introTimerRef.current);
    };
  }, [isIntroView, introStatus.isWatched]);

  useEffect(() => {
    if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    if (
      !isIntroView &&
      activeMaterial &&
      (activeMaterial.content_type === 'video' || activeMaterial.content_type === 'podcast') &&
      !completedMaterials.includes(String(activeMaterial.id)) &&
      introStatus.isWatched
    ) {
      watchTimeInternalRef.current = 0;
      const targetThreshold =
        activeMaterial.min_duration_seconds && activeMaterial.min_duration_seconds > 0
          ? activeMaterial.min_duration_seconds
          : 300;
      watchTimerRef.current = setInterval(() => {
        watchTimeInternalRef.current += 1;
        setWatchTime(watchTimeInternalRef.current);
        if (watchTimeInternalRef.current >= targetThreshold) {
          if (activeMaterialRef.current) handleCompleteMaterial(activeMaterialRef.current.id);
        }
      }, 1000);
    }
    return () => {
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    };
  }, [activeMaterial?.id, activeMaterial?.min_duration_seconds, isIntroView, completedMaterials.length, introStatus.isWatched]);

  // Aktif materyal bir Quiz (form) ise quiz.id nesnesi hazır olduğunda last-attempt çağrısı yap
  useEffect(() => {
    if (activeMaterial && activeMaterial.content_type === 'form') {
      const qId = activeMaterial.quiz?.id;
      if (qId && String(qId) !== 'undefined' && String(qId) !== 'null') {
        fetchQuizLastAttempt(qId);
      }
    }
  }, [activeMaterial?.id, activeMaterial?.quiz?.id]);

  const handleWeekSelection = (weekData: WeeklyContent) => {
    if (weekData.is_locked) return;
    setSelectedWeek(weekData);
    setQuizResult(null);
    setSelectedAnswers({});
    setCurrentAttemptId(null);
    setIsIntroView(false);

    const quizMat = weekData.materials?.find((m) => m.content_type === 'form');
    const qId = quizMat?.quiz?.id;
    if (qId && String(qId) !== 'undefined' && String(qId) !== 'null') {
      fetchQuizLastAttempt(qId);
    }

    if (weekData.materials && weekData.materials.length > 0) {
      setActiveMaterial(getSortedMaterials(weekData.materials)[0]);
    } else {
      setActiveMaterial(null);
    }
    setIsSidebarOpen(false);
  };

  const handleCloseModalAndRefresh = async () => {
    setIsAnalysisModalOpen(false);
    setSelectedAnswers({});
    setCurrentAttemptId(null);

    // Refresh contents and bootstrap to reload completed materials for active attempt_round
    await fetchContents(true);

    if (selectedWeek) {
      const quizMat = selectedWeek.materials?.find((m: Material) => m.content_type === 'form');
      const qId = quizMat?.quiz?.id;
      if (qId && String(qId) !== 'undefined' && String(qId) !== 'null') {
        await fetchQuizLastAttempt(qId);
      } else {
        setQuizResult(null);
      }
    } else {
      setQuizResult(null);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-white flex-col gap-4 text-left text-secondary">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-primary text-[10px] font-black uppercase tracking-widest animate-pulse">
          YÜKLENİYOR...
        </p>
      </div>
    );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-roboto relative text-secondary text-left">
      <Header
        selectedWeek={selectedWeek}
        userTotalPoints={userTotalPoints}
        pointsEarned={pointsEarned}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <Sidebar
        contents={contents}
        selectedWeek={selectedWeek}
        isIntroView={isIntroView}
        isSidebarOpen={isSidebarOpen}
        introStatus={introStatus}
        preTestResult={preTestResult}
        setIsSidebarOpen={setIsSidebarOpen}
        setIsIntroView={setIsIntroView}
        setActiveMaterial={setActiveMaterial}
        handleWeekSelection={handleWeekSelection}
        handleLogout={handleLogout}
      />

      <main className="flex-1 overflow-y-auto bg-white custom-scrollbar pt-14 lg:pt-0">
        {selectedWeek ? (
          <div className="animate-in fade-in duration-500">
            {/* 1. KADEME: SİSTEME İLK GİRİŞ (TANITIM VEYA GENEL ÖN TEST EKSİKSE) */}
            {isIntroView || !introStatus.isWatched || !preTestResult?.is_completed ? (
              <PreTestGatekeeper
                introStatus={introStatus}
                preTestResult={preTestResult}
                preTestQuestions={preTestQuestions}
                preTestAnswers={preTestAnswers}
                preTestSubmitting={preTestSubmitting}
                setPreTestAnswers={setPreTestAnswers}
                handlePreTestSubmit={handlePreTestSubmit}
              />
            ) : selectedWeek.is_survey_required ? (
              /* --- 1. ÖNCELİK: ANKET (SURVEY) KONTROLÜ --- */
              <SurveyGatekeeper
                selectedWeek={selectedWeek}
                surveyAnswers={surveyAnswers}
                surveySubmitting={surveySubmitting}
                setSurveyAnswers={setSurveyAnswers}
                handleSurveySubmit={handleSurveySubmit}
              />
            ) : selectedWeek.is_entry_test_required ? (
              /* --- 2. ÖNCELİK: HAFTALIK GİRİŞ (HAZIRLIK) TESTİ --- */
              <EntryTestGatekeeper
                selectedWeek={selectedWeek}
                entryResult={entryResult}
                entryAnswers={entryAnswers}
                entrySubmitting={entrySubmitting}
                setEntryAnswers={setEntryAnswers}
                handleEntryTestSubmit={handleEntryTestSubmit}
              />
            ) : (
              /* --- 3. KADEME: MATERYALLER VE HAFTA İÇERİĞİ --- */
              <div className="max-w-screen-2xl mx-auto p-4 md:p-10">
                {/* Üst Bilgi Başlığı */}
                <div className="mb-10 border-b pb-8 border-gray-100 flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <span className="bg-secondary text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                      HAFTA {selectedWeek.week_number}
                    </span>
                    {selectedWeek.current_attempt_round > 1 && (
                      <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-amber-200 animate-pulse">
                        <RefreshCcw size={8} className="inline mr-1" /> 2. TUR (GELİŞİM)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                    {/* SOL: BAŞLIK VE PROGRESS */}
                    <div className="flex-1">
                      <h1 className="text-xl md:text-3xl font-black text-secondary uppercase tracking-tighter leading-tight max-w-2xl">
                        {selectedWeek.title}
                      </h1>
                      <div className="flex items-center gap-3 mt-4">
                        <div className="flex-1 max-w-xs bg-gray-100 h-1.5 rounded-full overflow-hidden border shadow-inner">
                          <div
                            className={`h-full transition-all duration-1000 ${
                              selectedWeek.progress === 100 ? 'bg-green-500' : 'bg-primary'
                            }`}
                            style={{ width: `${selectedWeek.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          %{selectedWeek.progress || 0} TAMAMLANDI
                        </span>
                      </div>
                    </div>

                    {/* SAĞ: PROFİL VE PUAN */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Link
                        href="/profile"
                        className="bg-white border-2 border-gray-50 rounded-2xl p-3 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group flex items-center justify-center cursor-pointer"
                      >
                        <div className="bg-blue-500/10 p-2 rounded-xl group-hover:bg-blue-500 transition-colors">
                          <User className="text-blue-600 group-hover:text-white" size={20} />
                        </div>
                      </Link>

                      <div className="bg-white border-2 border-gray-50 rounded-2xl p-3 shadow-sm flex items-center gap-3">
                        <div className="bg-amber-400/10 p-2 rounded-xl">
                          <Trophy className="text-amber-500" size={20} />
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-1">
                            Toplam Puan
                          </p>
                          <p className="text-xl font-black text-secondary leading-none">
                            {userTotalPoints || selectedWeek.total_score || 0}{' '}
                            <span className="text-[10px] text-gray-400 font-bold">Puan</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ANA İÇERİK GRID: SOLDA LİSTE, SAĞDA İÇERİK */}
                <MaterialViewer
                  activeMaterial={activeMaterial}
                  selectedWeek={selectedWeek}
                  completedMaterials={completedMaterials}
                  isQuizLocked={isQuizLocked()}
                  getSortedMaterials={getSortedMaterials}
                  setActiveMaterial={setActiveMaterial}
                  handleCompleteMaterial={handleCompleteMaterial}
                  quizResult={quizResult}
                  selectedAnswers={selectedAnswers}
                  quizSubmitting={quizSubmitting}
                  setSelectedAnswers={setSelectedAnswers}
                  handleQuizSubmit={handleQuizSubmit}
                  handleFetchAIAnalysis={handleFetchAIAnalysis}
                />

                <FlashcardsSection selectedWeek={selectedWeek} />
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-200 p-8 gap-6">
            <PlayCircle size={120} strokeWidth={0.5} className="animate-pulse opacity-10" />
            <p className="text-xl font-black uppercase tracking-[0.5em] opacity-20 text-secondary">
              Hafta Seçiniz
            </p>
          </div>
        )}
      </main>

      <ChatbotDrawer
        isChatOpen={isChatOpen}
        chatInput={chatInput}
        messages={messages}
        isTyping={isTyping}
        chatEndRef={chatEndRef}
        setIsChatOpen={setIsChatOpen}
        setChatInput={setChatInput}
        handleSendChatMessage={handleSendChatMessage}
      />

      <AIAnalysisModal
        isAnalysisModalOpen={isAnalysisModalOpen}
        isAnalysisLoading={isAnalysisLoading}
        aiAnalysisFeedback={aiAnalysisFeedback}
        setIsAnalysisModalOpen={setIsAnalysisModalOpen}
        handleCloseModalAndRefresh={handleCloseModalAndRefresh}
      />
    </div>
  );
}