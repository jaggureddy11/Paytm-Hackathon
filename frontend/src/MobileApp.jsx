import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  ChevronRight, 
  ShieldCheck, 
  QrCode, 
  Banknote,
  Radio, 
  CreditCard, 
  BookOpen, 
  HelpCircle, 
  Mic, 
  MicOff, 
  Volume2, 
  Square, 
  CheckCircle2, 
  X, 
  Send,
  Building,
  Coins,
  MapPin,
  Check,
  RotateCcw,
  FileText,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  ShoppingBag,
  Calendar,
  Clock,
  ArrowDownRight,
  Package,
  Smartphone,
  Zap,
  Store
} from 'lucide-react';
import { tokens } from './tokens';
import FullScreenVoiceExperience from './components/FullScreenVoiceExperience';
import FirstTimeUserTour from './components/FirstTimeUserTour';

export default function MobileApp() {
  const [dashboardData, setDashboardData] = useState(null);
  const [currentLang, setCurrentLang] = useState('en-IN');
  const [merchant, setMerchant] = useState({
    shop_name: 'Sri Krishna Kirana & General Store',
    category: 'Kirana / Grocery',
    preferred_language: 'en-IN'
  });

  const [showTour, setShowTour] = useState(() => {
    try {
      return localStorage.getItem('paytm_saathi_tour_completed') !== 'true';
    } catch {
      return true;
    }
  });
  const [showVoiceSheet, setShowVoiceSheet] = useState(false);
  const [showRecordsSheet, setShowRecordsSheet] = useState(false);
  const [mobileDays, setMobileDays] = useState([]);
  const [selectedMobileDate, setSelectedMobileDate] = useState(null);
  const [mobileDayReport, setMobileDayReport] = useState(null);
  const [mobileDateFilter, setMobileDateFilter] = useState('all');
  const [loadingMobileReport, setLoadingMobileReport] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [flowState, setFlowState] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // ChatGPT-style full-screen voice experience states for mobile
  const [isFullScreenVoice, setIsFullScreenVoice] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState(false);
  const [lastUserTranscript, setLastUserTranscript] = useState('');
  const [lastAssistantReply, setLastAssistantReply] = useState('');
  const [summaryReady, setSummaryReady] = useState(false);
  const [pendingClosing, setPendingClosing] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const activeAudioRef = useRef(null);
  const chatBottomRef = useRef(null);
  const timerRef = useRef(null);
  const autoMicTimerRef = useRef(null);
  const isRealMicActiveRef = useRef(false);

  const getSimulatedVoiceAnswer = () => {
    const step = flowState?.next_step;
    if (step === 'AWAITING_CASH') {
      if (currentLang === 'te-IN') return 'నేను ఈరోజు 2500 నగదు కలెక్ట్ చేశాను';
      if (currentLang === 'hi-IN') return 'मैंने आज ₹2,500 नकद एकत्र किया';
      return 'I collected ₹2,500 cash today.';
    }
    if (step === 'AWAITING_EXPENSE') {
      if (currentLang === 'te-IN') return 'కరెంట్ బిల్లు ₹500 ఖర్చు చేశాను';
      if (currentLang === 'hi-IN') return 'बिजली बिल के लिए ₹500 खर्च किए';
      return 'Spent ₹500 on electricity bill.';
    }
    if (step === 'AWAITING_STOCK') {
      if (currentLang === 'te-IN') return '₹600 కు 20 పాల ప్యాకెట్లు కొన్నాను';
      if (currentLang === 'hi-IN') return '₹600 में 20 दूध के पैकेट खरीदे';
      return 'Bought 20 milk packets for ₹600.';
    }
    if (flowState?.is_single_confirm || flowState?.is_closing_flow) {
      if (currentLang === 'te-IN') return 'అవును, సేవ్ చేయి';
      if (currentLang === 'hi-IN') return 'हाँ, सेव कर दो';
      return 'Yes, confirm and save.';
    }
    if (currentLang === 'te-IN') return 'ఈరోజు కలెక్షన్స్ ఎంత?';
    if (currentLang === 'hi-IN') return 'आज का कुल कलेक्शन कितना है?';
    return 'How much did I collect today?';
  };

  const fetchData = async () => {
    try {
      const [dashRes, merchRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/merchant')
      ]);
      if (dashRes.ok) setDashboardData(await dashRes.json());
      if (merchRes.ok) {
        const m = await merchRes.json();
        setMerchant(m);
        if (m.preferred_language) setCurrentLang(m.preferred_language);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const fetchMobileDays = async (filter = mobileDateFilter) => {
    try {
      const res = await fetch(`/api/records/days?filter=${filter}`);
      if (res.ok) {
        setMobileDays(await res.json());
      }
    } catch (err) {
      console.error('Mobile days fetch error:', err);
    }
  };

  const handleOpenRecords = async () => {
    setShowVoiceSheet(false);
    setShowRecordsSheet(true);
    setSelectedMobileDate(null);
    setMobileDayReport(null);
    await fetchMobileDays();
  };

  const handleSelectMobileDate = async (dateStr) => {
    setSelectedMobileDate(dateStr);
    setLoadingMobileReport(true);
    try {
      const res = await fetch(`/api/records/day/${dateStr}`);
      if (res.ok) {
        setMobileDayReport(await res.json());
      }
    } catch (err) {
      console.error('Day report error:', err);
    } finally {
      setLoadingMobileReport(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showVoiceSheet && voiceMessages.length === 0) {
      setVoiceMessages([
        {
          id: 'welcome',
          role: 'assistant',
          text: 'Hello! I am Paytm Saathi. Tap the microphone to record cash, expenses, stock, or ask any business question.',
          audio: null,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [showVoiceSheet]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [voiceMessages, isProcessing]);

  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const playAudioBase64 = (base64Audio, onEnded) => {
    if (!base64Audio) {
      if (onEnded) onEnded();
      return;
    }
    try {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      setIsPlayingAudio(true);
      const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
      activeAudioRef.current = audio;
      audio.onended = () => {
        setIsPlayingAudio(false);
        activeAudioRef.current = null;
        if (onEnded) onEnded();
      };
      audio.onerror = () => {
        setIsPlayingAudio(false);
        activeAudioRef.current = null;
        if (onEnded) onEnded();
      };
      audio.play().catch(e => {
        console.warn('Audio play prevented:', e);
        setIsPlayingAudio(false);
        if (onEnded) onEnded();
      });
    } catch (e) {
      console.error('Audio play error:', e);
      setIsPlayingAudio(false);
      if (onEnded) onEnded();
    }
  };

  const handleOpenVoiceMode = async (forceReset = false) => {
    setIsFullScreenVoice(true);
    // Unlock AudioContext on user gesture
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        ctx.resume();
      }
    } catch (e) {}

    // When merchant taps mic, Saathi greets them first and starts a natural conversation
    const needsStart = forceReset || !flowState || !flowState.is_closing_flow || flowState.step === 'COMPLETED' || (!summaryReady && voiceMessages.length === 0);

    if (needsStart) {
      try {
        setIsProcessing(true);
        const res = await fetch(`/api/closing/trigger?lang=${currentLang}`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setFlowState(data);
          setLastAssistantReply(data.reply);
          setVoiceMessages([{
            id: 'welcome-' + Date.now(),
            role: 'assistant',
            text: data.reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
          if (data.audio_base64) {
            playAudioBase64(data.audio_base64, () => {
              startRecording();
            });
          } else {
            startRecording();
          }
        }
      } catch (err) {
        console.error('Closing trigger error:', err);
      } finally {
        setIsProcessing(false);
      }
    } else {
      if (!isRecording && !isPlayingAudio && !summaryReady) {
        startRecording();
      }
    }
  };

  const stopActiveAudio = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
      setIsPlayingAudio(false);
    }
  };

  const startRecording = async () => {
    stopActiveAudio();
    setIsRecording(true);
    setMicPermissionError(false);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };
        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          stream.getTracks().forEach(t => t.stop());
          if (audioChunksRef.current.length > 0) {
            await processVoiceAudio(audioBlob);
          }
        };
        recorder.start(250);
        isRealMicActiveRef.current = true;
        return;
      }
    } catch (err) {
      console.info('Microphone access notice:', err.message);
      isRealMicActiveRef.current = false;
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (isRealMicActiveRef.current && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      isRealMicActiveRef.current = false;
    }
  };

  const processVoiceAudio = async (audioBlob) => {
    if (!audioBlob || audioBlob.size < 500) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language_code', currentLang);

      const sttRes = await fetch('/api/voice/stt', {
        method: 'POST',
        body: formData
      });
      const sttData = await sttRes.json();

      if (sttData.success && sttData.transcript) {
        setLastUserTranscript(sttData.transcript);
        await handleSendMessage(sttData.transcript);
      } else {
        const fallbackMsg = sttData.error || 'Could not understand speech clearly. Please try again or tap one of the options below.';
        setLastAssistantReply(fallbackMsg);
      }
    } catch (err) {
      console.error('STT failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    setInputMessage('');
    stopActiveAudio();
    setLastUserTranscript(text);

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setVoiceMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language_code: currentLang,
          flow_state: flowState
        })
      });
      const data = await res.json();

      setLastAssistantReply(data.reply);
      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.reply,
        audio: data.audio_base64,
        isClosingSummary: data.summary_ready,
        closingData: data.flow_state?.flow_data,
        isSingleConfirm: data.is_single_confirm,
        pendingEntry: data.pending_entry,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setVoiceMessages(prev => [...prev, botMsg]);

      if (data.flow_state) setFlowState(data.flow_state);

      if (data.summary_ready && data.flow_state?.flow_data) {
        setSummaryReady(true);
        setPendingClosing(data.flow_state.flow_data);
      }

      if (data.saved) {
        setSummaryReady(false);
        setPendingClosing(null);
        setFlowState(null);
        await fetchData();
        await fetchMobileDays();
        if (showRecordsSheet) handleOpenRecords();
      }
      if (data.audio_base64) {
        playAudioBase64(data.audio_base64, () => {
          if (isFullScreenVoice && !data.saved && !data.summary_ready) {
            startRecording();
          }
        });
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDirectConfirmClosing = async (customPayload) => {
    const payload = customPayload || pendingClosing;
    if (!payload) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/closing/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_collections: payload.qr_collections ?? pendingClosing?.qr_collections ?? 1000.0,
          cash_collections: payload.cash_collections ?? 2500.0,
          expenses: payload.expenses ?? 500.0,
          expense_description: payload.expense_description || 'Electricity bill',
          stock_purchases: payload.stock_purchases ?? 600.0,
          stock_item: payload.stock_item || 'Milk Packets',
          stock_quantity_purchased: payload.stock_qty_purchased || payload.stock_quantity_purchased || 20,
          stock_quantity_sold: payload.stock_qty_sold || payload.stock_quantity_sold || 15
        })
      });
      const data = await res.json();
      if (data.success) {
        setSummaryReady(false);
        setPendingClosing(null);
        setFlowState(null);
        await fetchData();
        await fetchMobileDays();
        setTimeout(() => {
          setIsFullScreenVoice(false);
        }, 2200);

        const successText = currentLang === 'te-IN'
          ? "మీ రోజువారీ రికార్డులు విజయవంతంగా సేవ్ చేయబడ్డాయి! డాష్‌బోర్డ్ మరియు రికార్డులు అప్‌డేట్ అయ్యాయి."
          : currentLang === 'hi-IN'
          ? "आपके दैनिक रिकॉर्ड सफलतापूर्वक सहेज लिए गए हैं! डैशबोर्ड और रिकॉर्ड्स अपडेट हो गए हैं।"
          : "Your daily closing records have been confirmed and saved! Dashboard and Records are now updated.";

        setVoiceMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            text: successText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setLastAssistantReply(successText);

        try {
          const ttsRes = await fetch('/api/voice/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: successText, language_code: currentLang })
          });
          const ttsData = await ttsRes.json();
          if (ttsData.audio_base64) playAudioBase64(ttsData.audio_base64);
        } catch (e) {
          console.warn('TTS confirm error:', e);
        }
      }
    } catch (err) {
      console.error('Direct confirm error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePendingField = (updatedFields) => {
    setPendingClosing(prev => {
      const merged = { ...prev, ...updatedFields };
      const totSales = (merged.qr_collections || 0) + (merged.cash_collections || 0);
      const estBal = totSales - (merged.expenses || 0) - (merged.stock_purchases || 0);
      merged.total_collections = totSales;
      merged.estimated_balance = estBal;
      return merged;
    });
  };

  const handleTriggerClosing = () => {
    setShowVoiceSheet(true);
    handleSendMessage('Start daily closing reminder');
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset demo transactions to initial state (QR: ₹1,000)?')) return;
    try {
      await fetch('/api/reset-demo', { method: 'POST' });
      fetchData();
      setFlowState(null);
      setVoiceMessages([]);
      setShowVoiceSheet(false);
    } catch (e) {
      console.error(e);
    }
  };

  const fin = dashboardData?.financials || {
    qr_collections: 1000.0,
    cash_collections: 0.0,
    total_collections: 1000.0,
    expenses: 0.0,
    stock_purchases: 0.0,
    estimated_balance: 1000.0,
    has_closed_today: false
  };

  return (
    <div className="min-h-screen bg-surface-subtle flex flex-col items-center justify-start sm:py-6 text-ink-primary font-sans antialiased">
      
      {/* Top Demo Helper Toolbar (Desktop View Only) */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-sm mb-3 px-3 py-2 bg-white rounded-xl border border-surface-border shadow-subtle text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-bold text-brand">Paytm for Business (Mobile)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDemo}
            className="flex items-center gap-1 text-ink-tertiary hover:text-status-critical transition-colors"
            title="Reset to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Pure Mobile Simulator Frame (LIGHT THEME) */}
      <div className="w-full sm:max-w-sm bg-white sm:rounded-3xl shadow-card border border-surface-border overflow-hidden flex flex-col h-screen sm:h-mobile relative">
        
        {/* Status Bar */}
        <div className="pt-2.5 px-5 pb-1.5 flex items-center justify-between text-xs font-semibold text-slate-800 select-none bg-white">
          <span className="font-bold text-[13px] tracking-tight">10:03</span>
          <div className="flex items-center gap-1.5 text-xs">
            {/* VoWiFi / WiFi waves icon */}
            <svg className="w-3.5 h-3.5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
              <path d="M1.42 9a16 16 0 0 1 21.16 0" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" />
            </svg>
            <span className="font-extrabold text-[11px] text-slate-800">5G</span>
            {/* 4 Cell signal strength bars */}
            <div className="flex items-end gap-[1.5px] h-3">
              <span className="w-[2.5px] h-1.5 bg-slate-800 rounded-sm"></span>
              <span className="w-[2.5px] h-2 bg-slate-800 rounded-sm"></span>
              <span className="w-[2.5px] h-2.5 bg-slate-800 rounded-sm"></span>
              <span className="w-[2.5px] h-3 bg-slate-800 rounded-sm"></span>
            </div>
            {/* Battery with 49% and green charging bolt */}
            <div className="flex items-center border border-slate-700 rounded-md px-1 py-[1px] text-[10px] font-bold text-slate-800 bg-slate-50 gap-0.5">
              <span>49</span>
              <Zap className="w-2.5 h-2.5 text-emerald-600 fill-emerald-600" />
            </div>
          </div>
        </div>

        {/* Top Header */}
        <div className="px-4 py-2.5 bg-white border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="text-[#002970] hover:text-brand transition-colors">
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>
            <div>
              <div className="flex items-center gap-1 cursor-pointer">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  R Srinivas Reddy
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-44 mt-0.5">
                <MapPin className="w-3 h-3 text-[#00baf2] flex-shrink-0 fill-[#00baf2]" />
                <span className="truncate">Shop: Government Higher Primary Sch…</span>
              </div>
              <div className="mt-1">
                <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded tracking-wide uppercase">
                  Business Owner
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowTour(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-[#002970] border border-blue-200 text-[10px] font-bold hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer"
              title="Feature walkthrough tour"
            >
              <HelpCircle className="w-3 h-3 text-[#00baf2]" />
              <span>Tour</span>
            </button>
            <button className="text-[#002970] hover:text-brand transition-colors p-1">
              <Search className="w-4 h-4 stroke-[2.2]" />
            </button>
            <div className="relative cursor-pointer p-1">
              <Bell className="w-4 h-4 text-[#002970] stroke-[2.2]" />
              <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-amber-500 border border-white flex items-center justify-center text-[8px] font-black text-white">
                !
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Mobile App Body */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 bg-[#f5f7fa] pb-24">
          
          {/* 1. KYC Completed & Verified Banner */}
          <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#e6f9fc] border border-[#b2ebf2] flex items-center justify-center text-[#00baf2] flex-shrink-0 relative">
              <CreditCard className="w-4 h-4 text-[#00baf2]" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#00baf2] text-white flex items-center justify-center text-[8px] font-bold">
                ✓
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-900 leading-snug">KYC completed & verified!</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">We don't send 3rd party KYC agents</p>
            </div>
          </div>

          {/* 2. Promo Grid (2 Columns: Paytm Gold & Restart Soundbox) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Left Card: Paytm Gold */}
            <div className="rounded-2xl p-3 border border-[#d2f0be] bg-gradient-to-br from-[#f2fcd8] via-[#eaf8d4] to-[#dcf4c6] relative overflow-hidden flex flex-col justify-between min-h-[160px] shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-[#002e6e] tracking-tight">paytm</span>
                    <span className="text-xs font-black text-[#b45309]">Gold</span>
                  </div>
                  {/* Gold coin top graphic */}
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 border border-amber-200 shadow-sm flex items-center justify-center text-[9px]">
                    <Coins className="w-3.5 h-3.5 text-amber-900" />
                  </div>
                </div>
                <p className="text-xs font-bold text-[#143b18] mt-1.5 leading-snug">
                  Save gold to reach your goals
                </p>
                <p className="text-[10px] text-[#2c5e32] mt-0.5 leading-tight">
                  Small daily savings secure a brighter tomorrow
                </p>
              </div>

              <div className="mt-2 flex items-end justify-between relative">
                <span className="text-xs font-extrabold text-[#0f2042] flex items-center gap-0.5 hover:underline cursor-pointer">
                  Start Now &gt;
                </span>
                
                {/* Prominent Circular Green Badge from Screenshot */}
                <div className="w-14 h-14 rounded-full bg-[#00a86b] text-white flex flex-col items-center justify-center shadow-md -mr-1 -mb-1 ring-2 ring-white/70 flex-shrink-0">
                  <span className="text-[8px] font-semibold tracking-wider text-white/90 leading-none">Daily</span>
                  <span className="text-[13px] font-black text-white leading-none mt-0.5">₹51</span>
                  <span className="text-[7px] font-bold text-white/90 leading-none mt-0.5">Save Gold</span>
                </div>
              </div>
            </div>

            {/* Right Card: Restart using your Soundbox */}
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[160px]">
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight text-center">
                  Restart using your Soundbox
                </h4>
                <div className="flex items-center justify-center gap-2 mt-1.5">
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[7px] font-bold">✓</span>
                    ₹0 rental
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[7px] font-bold">✓</span>
                    No past dues
                  </span>
                </div>

                {/* Soundbox + QR Graphic Container */}
                <div className="my-2 bg-[#f0f9ff] rounded-2xl border border-[#d6effd] p-2 flex items-center justify-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#00baf2] flex items-center justify-center shadow-sm">
                    <QrCode className="w-4 h-4 text-[#002e6e]" />
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-[#002e6e] flex items-center justify-center text-white shadow-sm">
                    <Radio className="w-3.5 h-3.5 text-[#00baf2]" />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <span 
                  onClick={() => setShowVoiceSheet(true)}
                  className="text-xs font-bold text-[#00baf2] block hover:underline cursor-pointer"
                >
                  Activate for Free &gt;
                </span>
                <span className="text-[8px] text-slate-400 block mt-0.5">
                  Zero rent for first 3 months | T&C apply
                </span>
              </div>
            </div>
          </div>

          {/* 3. Quick Action Pills Row */}
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setShowVoiceSheet(true)}
              className="bg-white py-2.5 px-3 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer text-left"
            >
              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-[#002970] flex-shrink-0">
                <Smartphone className="w-3.5 h-3.5 text-[#002970]" />
              </div>
              <span className="text-xs font-semibold text-slate-900 truncate">Paytm Karo: Get ₹25</span>
            </button>
            <button 
              onClick={handleOpenRecords}
              className="bg-white py-2.5 px-3 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer text-left"
            >
              <div className="w-6 h-6 rounded-lg bg-cyan-50 flex items-center justify-center text-[#00baf2] flex-shrink-0">
                <BookOpen className="w-3.5 h-3.5 text-[#00baf2]" />
              </div>
              <span className="text-xs font-semibold text-slate-900 truncate">Balance & History</span>
            </button>
          </div>

          {/* 4. Main Hero Payments Card (Acrylic Standee + Soundbox) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              {/* Standee & Soundbox Vector Graphic */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-[#f8fafc] to-[#eef2f6] border border-slate-200/70 p-1.5 flex items-center justify-center flex-shrink-0 relative">
                {/* Acrylic QR Standee */}
                <div className="w-10 h-14 bg-white rounded-md border border-slate-300 shadow-sm flex flex-col items-center justify-between p-1 z-10">
                  <div className="w-full bg-[#002e6e] text-[5px] text-white font-extrabold text-center rounded-[2px] py-[1px]">
                    paytm
                  </div>
                  <QrCode className="w-6 h-6 text-slate-800" />
                  <div className="w-full h-1 bg-[#00baf2] rounded-full"></div>
                </div>
                {/* Paytm Soundbox Device Beside Standee */}
                <div className="w-8 h-10 bg-[#002970] rounded-lg shadow-md -ml-2 -mb-2 border border-blue-900 flex flex-col items-center justify-around p-0.5 z-20">
                  <div className="w-2 h-0.5 bg-emerald-400 rounded-full animate-pulse"></div>
                  <Radio className="w-4 h-4 text-[#00baf2]" />
                  <span className="text-[4px] font-black text-white">paytm</span>
                </div>
              </div>

              {/* Status Text & CTA */}
              <div className="flex-1">
                {fin.has_closed_today ? (
                  <div>
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled & Saved Today
                    </span>
                    <p className="text-xs text-slate-800 leading-snug mt-1">
                      <span className="font-bold">₹{fin.total_collections.toLocaleString('en-IN')}</span> Total sales recorded <span className="font-bold">Today, 14 Nov</span>.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-800 leading-snug">
                    {fin.qr_collections > 0 ? (
                      <>
                        <span className="font-bold text-[#002970]">₹{fin.qr_collections.toLocaleString('en-IN')}</span> QR payments received <span className="font-bold">Today, 14 Nov</span> and <span className="font-bold">Yesterday, 13 Nov.</span>
                      </>
                    ) : (
                      <>
                        No payments received <span className="font-bold">Today, 14 Nov</span> and <span className="font-bold">Yesterday, 13 Nov.</span>
                      </>
                    )}
                  </p>
                )}

                {/* View Past Payments Navy Pill Button */}
                <button
                  onClick={handleOpenRecords}
                  className="mt-3 bg-[#002970] hover:bg-[#001e4d] text-white px-4 py-2 rounded-full text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>View Past Payments</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 5. Lower Service Cards (Buy Gold Now & Bank Settlement) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2.5 hover:bg-slate-50 cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 flex-shrink-0">
                <Coins className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">Buy Gold Now</h4>
                <span className="text-[11px] font-bold text-amber-600 block mt-0.5">₹7,500 OFF!*</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2.5 hover:bg-slate-50 cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#002970] flex-shrink-0">
                <Building className="w-4 h-4 text-[#002970]" />
              </div>
              <div className="truncate">
                <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">Bank Settlement</h4>
                <span className="text-[11px] font-medium text-slate-500 block mt-0.5 truncate">INDIAN OVE… - 2346</span>
              </div>
            </div>
          </div>

          {/* 6. Peeking Bottom Yellow Promo Banner */}
          <div className="bg-[#fdd835] rounded-2xl p-3.5 border border-amber-300 shadow-sm text-slate-900 flex items-center justify-between overflow-hidden relative">
            <div className="relative z-10 max-w-[210px]">
              <h4 className="text-xs font-black text-slate-950 leading-snug">
                Accept payments effortlessly with Paytm All-in-One QR
              </h4>
              <p className="text-[10px] text-slate-800 mt-1">
                Zero charges on UPI transactions
              </p>
            </div>
            {/* Merchant counter graphic */}
            <div className="w-12 h-12 rounded-full bg-amber-400/80 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Store className="w-6 h-6 text-amber-950" />
            </div>
          </div>

        </div>

        {/* Floating Bottom Navigation Bar with Centered Elevated Voice Saathi Button (Paytm Original Theme) */}
        <div className="absolute bottom-2.5 left-2 right-2 z-30">
          <div className="bg-white rounded-full py-1.5 px-1 shadow-modal border border-slate-200/90 flex items-center justify-around">
            {/* Tab 1: UPI */}
            <button className="flex flex-col items-center justify-center flex-1 min-w-0 py-0.5 text-slate-600 hover:text-[#002970] transition-colors">
              <div className="w-5 h-5 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13H5.5L12 6.5z" />
                </svg>
              </div>
              <span className="text-[9.5px] font-semibold text-slate-700 tracking-tight text-center">UPI</span>
            </button>

            {/* Tab 2: Soundbox */}
            <button 
              onClick={() => setShowVoiceSheet(true)}
              className="flex flex-col items-center justify-center flex-1 min-w-0 py-0.5 text-slate-600 hover:text-[#002970] transition-colors"
            >
              <div className="w-5 h-5 flex items-center justify-center relative">
                <Radio className="w-3.5 h-3.5 text-slate-800" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <span className="text-[9.5px] font-semibold text-slate-700 tracking-tight text-center">Soundbox</span>
            </button>

            {/* CENTER ELEVATED VOICE SAATHI BUTTON (Paytm Original Theme) */}
            <div className="flex flex-col items-center -mt-6 flex-shrink-0 px-2 relative z-10">
              <button
                onClick={handleOpenVoiceMode}
                className="w-12 h-12 rounded-full bg-gradient-to-b from-[#002e6e] to-[#001845] hover:from-[#002456] hover:to-[#001438] text-white shadow-xl ring-4 ring-white flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 group relative"
                title="Tap to speak with Paytm Saathi"
              >
                {/* Subtle Cyan Ping Ring */}
                <span className="absolute inset-0 rounded-full border border-[#00baf2] opacity-60 animate-ping"></span>
                <Mic className="w-5 h-5 text-[#00baf2] transition-transform group-hover:scale-110" />
              </button>
              <span className="text-[10px] font-extrabold text-[#002970] mt-0.5 tracking-tight">Saathi</span>
            </div>

            {/* Tab 3: Records (Replaces Loans as requested, opens Day-wise Business Reports) */}
            <button 
              onClick={handleOpenRecords}
              className={`flex flex-col items-center justify-center flex-1 min-w-0 py-0.5 transition-colors ${showRecordsSheet ? 'text-[#002970] font-bold' : 'text-slate-600 hover:text-[#002970]'}`}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full border border-slate-800 flex items-center justify-center text-[9px] font-black leading-none">
                  ₹
                </div>
              </div>
              <span className="text-[9.5px] font-semibold text-slate-700 tracking-tight text-center">Records</span>
            </button>

            {/* Tab 4: Support */}
            <button className="flex flex-col items-center justify-center flex-1 min-w-0 py-0.5 text-slate-600 hover:text-[#002970] transition-colors">
              <div className="w-5 h-5 flex items-center justify-center">
                <HelpCircle className="w-3.5 h-3.5 text-slate-800" />
              </div>
              <span className="text-[9.5px] font-semibold text-slate-700 tracking-tight text-center">Support</span>
            </button>
          </div>
        </div>

        {/* Bottom Home Indicator Bar */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-900/60 rounded-full z-30"></div>

        {/* BUSINESS RECORDS MOBILE SHEET MODAL (Day-wise Business Reporting System - Senior Paytm UI/UX) */}
        {showRecordsSheet && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-40 flex flex-col justify-end animate-fadeIn">
            <div className="bg-[#f8fafc] rounded-t-3xl max-h-[94%] flex flex-col shadow-2xl border-t border-slate-200 overflow-hidden">
              
              {/* TOP HEADER: SENIOR PAYTM STYLE */}
              <div className="pt-3.5 px-4 pb-3 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {selectedMobileDate ? (
                    <button
                      onClick={() => setSelectedMobileDate(null)}
                      className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#002970] flex items-center justify-center transition-colors"
                      title="Back to dates"
                    >
                      <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#002970] to-[#001845] flex items-center justify-center text-white shadow-sm">
                      <FileText className="w-4 h-4 text-[#00baf2]" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-slate-900 tracking-tight">
                        {selectedMobileDate ? 'Daily Business Report' : 'Business Records'}
                      </h4>
                      {/* Live Sync with Voice AI badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#ebf8fe] text-[#0082c8] border border-sky-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00baf2] animate-pulse" />
                        <span>Synced with Voice</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {selectedMobileDate ? (mobileDayReport?.formatted_date || selectedMobileDate) : 'Your business, day by day.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowRecordsSheet(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <X className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>

              {/* SHEET CONTENT AREA */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#f8fafc]">
                
                {/* 1. DATE LIST VIEW */}
                {!selectedMobileDate ? (
                  <div className="space-y-3">
                    
                    {/* Paytm Segmented Filter Control */}
                    <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'today', label: 'Today' },
                        { id: 'week', label: 'This Week' },
                        { id: 'month', label: 'This Month' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => {
                            setMobileDateFilter(f.id);
                            fetchMobileDays(f.id);
                          }}
                          className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all text-center ${
                            mobileDateFilter === f.id
                              ? 'bg-white text-[#002970] shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Day Cards List */}
                    {mobileDays.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 text-xs text-slate-400">
                        Loading day-wise business records…
                      </div>
                    ) : (
                      mobileDays.map(day => {
                        const comp = day.comparison;
                        const isToday = day.date === new Date().toISOString().split('T')[0];
                        const isClosed = day.cash_sales > 0 || day.expenses > 0;

                        return (
                          <div
                            key={day.date}
                            onClick={() => handleSelectMobileDate(day.date)}
                            className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-[#00baf2] cursor-pointer transition-all space-y-2.5 active:scale-[0.99] group"
                          >
                            {/* Card Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#002970] flex items-center justify-center font-bold">
                                  <Calendar className="w-3.5 h-3.5 text-[#0082c8]" />
                                </span>
                                <div>
                                  <span className="text-xs font-black text-slate-900 block leading-tight">
                                    {day.label}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {day.formatted_date || day.date}
                                  </span>
                                </div>
                              </div>

                              {/* Status Badge */}
                              {isToday ? (
                                isClosed ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-[#e8f8f0] text-[#007e33] border border-emerald-100">
                                    <CheckCircle2 className="w-3 h-3" /> Closed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    In Progress
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-slate-100 text-slate-600">
                                  Closed
                                </span>
                              )}
                            </div>

                            {/* 4 Metrics Grid with Paytm Badges */}
                            <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                              {/* QR Sales */}
                              <div className="bg-[#ebf8fe] p-1.5 rounded-xl border border-sky-100">
                                <span className="text-[#0082c8] font-bold block text-[9.5px]">QR</span>
                                <span className="font-black text-[#002970] tabular-nums text-[11px]">
                                  ₹{day.qr_sales.toLocaleString('en-IN')}
                                </span>
                              </div>

                              {/* Cash Sales */}
                              <div className="bg-[#e8f8f0] p-1.5 rounded-xl border border-emerald-100">
                                <span className="text-[#007e33] font-bold block text-[9.5px]">Cash</span>
                                <span className="font-black text-[#007e33] tabular-nums text-[11px]">
                                  ₹{day.cash_sales.toLocaleString('en-IN')}
                                </span>
                              </div>

                              {/* Total Sales (Navy Highlight) */}
                              <div className="bg-[#002970] text-white p-1.5 rounded-xl shadow-xs">
                                <span className="text-blue-200 font-bold block text-[9.5px]">Total</span>
                                <span className="font-black text-white tabular-nums text-[11px]">
                                  ₹{day.total_sales.toLocaleString('en-IN')}
                                </span>
                              </div>

                              {/* Expenses */}
                              <div className="bg-[#fef3c7] p-1.5 rounded-xl border border-amber-200/80">
                                <span className="text-[#b45309] font-bold block text-[9.5px]">Exp</span>
                                <span className="font-black text-[#b45309] tabular-nums text-[11px]">
                                  ₹{day.expenses.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>

                            {/* Operating Result & Growth */}
                            <div className="bg-slate-50 p-2 rounded-xl flex items-center justify-between text-[10px]">
                              <div>
                                <span className="font-bold text-slate-700 block">
                                  {day.operating_result_label || `Sales after recorded expenses: ₹${(day.total_sales - day.expenses).toLocaleString('en-IN')}`}
                                </span>
                                <span className="text-[9px] text-slate-400">Before cost of goods sold</span>
                              </div>

                              {comp?.has_prev && (
                                <span className={`font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 text-[9.5px] ${
                                  comp.trend === 'up'
                                    ? 'bg-[#e8f8f0] text-[#007e33]'
                                    : comp.trend === 'down'
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {comp.trend === 'up' && <TrendingUp className="w-3 h-3 stroke-[2.5]" />}
                                  {comp.trend === 'down' && <TrendingDown className="w-3 h-3 stroke-[2.5]" />}
                                  <span>{comp.text}</span>
                                </span>
                              )}
                            </div>

                            {/* Bottom Link */}
                            <div className="flex items-center justify-end text-[10px] text-[#002970] font-black group-hover:text-[#00baf2] transition-colors pt-0.5">
                              <span>View Daily Report</span>
                              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5] ml-0.5" />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : loadingMobileReport || !mobileDayReport ? (
                  <div className="text-center py-16 text-xs text-slate-400">
                    <div className="w-5 h-5 border-2 border-[#002970] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading report for {selectedMobileDate}…</span>
                  </div>
                ) : (
                  /* 2. DETAILED DAILY REPORT VIEW ON MOBILE (Senior Paytm Theme) */
                  <div className="space-y-3 animate-fadeIn">
                    
                    {/* Total Sales Hero Card (Deep Paytm Navy) */}
                    <div className="bg-gradient-to-br from-[#002970] to-[#001845] text-white p-4 rounded-2xl shadow-md space-y-1.5">
                      <div className="flex items-center justify-between text-blue-200 text-xs font-bold">
                        <span className="flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#00baf2]" />
                          <span>Total Sales • {mobileDayReport.formatted_date}</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-white/15 rounded-full text-white font-bold">
                          {mobileDayReport.day_name}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-2xl font-black text-white tabular-nums tracking-tight">
                          ₹{mobileDayReport.summary.total_sales.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-blue-200 font-medium">
                          (QR ₹{mobileDayReport.summary.qr_sales} + Cash ₹{mobileDayReport.summary.cash_sales})
                        </span>
                      </div>

                      <p className="text-[10px] text-blue-300">
                        Reconciled from {mobileDayReport.sales_breakdown.total_sales_count} collections
                      </p>
                    </div>

                    {/* Summary 6-Grid (Paytm Badges) */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* QR Sales */}
                      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
                        <span className="text-[#0082c8] font-bold block text-[10px] flex items-center gap-1">
                          <QrCode className="w-3 h-3" /> QR Sales
                        </span>
                        <span className="text-sm font-black text-[#002970] tabular-nums mt-0.5 block">
                          ₹{mobileDayReport.summary.qr_sales.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[9.5px] text-slate-400 block mt-0.5">
                          {mobileDayReport.sales_breakdown.qr_count} Soundbox payments
                        </span>
                      </div>

                      {/* Cash Sales */}
                      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
                        <span className="text-[#007e33] font-bold block text-[10px] flex items-center gap-1">
                          <Banknote className="w-3 h-3" /> Cash Sales
                        </span>
                        <span className="text-sm font-black text-[#007e33] tabular-nums mt-0.5 block">
                          ₹{mobileDayReport.summary.cash_sales.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[9.5px] text-slate-400 block mt-0.5">
                          {mobileDayReport.sales_breakdown.cash_count} Register entries
                        </span>
                      </div>

                      {/* Expenses */}
                      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
                        <span className="text-[#b45309] font-bold block text-[10px] flex items-center gap-1">
                          <ArrowDownRight className="w-3 h-3" /> Expenses
                        </span>
                        <span className="text-sm font-black text-[#b45309] tabular-nums mt-0.5 block">
                          ₹{mobileDayReport.summary.expenses.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[9.5px] text-slate-400 block mt-0.5 truncate">
                          {mobileDayReport.expenses_list.length} entries
                        </span>
                      </div>

                      {/* Stock Purchases */}
                      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
                        <span className="text-purple-700 font-bold block text-[10px] flex items-center gap-1">
                          <Package className="w-3 h-3" /> Stock Purchases
                        </span>
                        <span className="text-sm font-black text-purple-700 tabular-nums mt-0.5 block">
                          ₹{mobileDayReport.summary.stock_purchases.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[9.5px] text-slate-400 block mt-0.5 truncate">
                          {mobileDayReport.stock_purchases_list.length} items purchased
                        </span>
                      </div>

                      {/* Sales After Expenses */}
                      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs col-span-2 flex items-center justify-between">
                        <div>
                          <span className="text-slate-700 font-bold block text-[10px]">
                            Sales After Recorded Expenses
                          </span>
                          <span className="text-[9px] text-slate-400 block">
                            *Estimated operating result before product costs
                          </span>
                        </div>
                        <span className="text-base font-black text-[#002970] tabular-nums">
                          ₹{mobileDayReport.summary.sales_after_expenses.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Sales Breakdown Visualizer Bar */}
                    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-900 text-[11px]">Collections Breakdown</span>
                        <span className="text-[10px] font-bold text-slate-500">
                          Total: ₹{mobileDayReport.summary.total_sales}
                        </span>
                      </div>

                      {/* Stacked Proportional Bar */}
                      {mobileDayReport.summary.total_sales > 0 && (
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                          <div 
                            style={{ width: `${(mobileDayReport.summary.qr_sales / mobileDayReport.summary.total_sales) * 100}%` }}
                            className="bg-[#00baf2] h-full"
                            title={`QR: ₹${mobileDayReport.summary.qr_sales}`}
                          />
                          <div 
                            style={{ width: `${(mobileDayReport.summary.cash_sales / mobileDayReport.summary.total_sales) * 100}%` }}
                            className="bg-[#059669] h-full"
                            title={`Cash: ₹${mobileDayReport.summary.cash_sales}`}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1 font-bold text-[#0082c8]">
                          <span className="w-2 h-2 rounded-full bg-[#00baf2]" />
                          QR: ₹{mobileDayReport.summary.qr_sales} ({mobileDayReport.summary.total_sales > 0 ? Math.round((mobileDayReport.summary.qr_sales / mobileDayReport.summary.total_sales) * 100) : 0}%)
                        </span>
                        <span className="flex items-center gap-1 font-bold text-[#007e33]">
                          <span className="w-2 h-2 rounded-full bg-[#059669]" />
                          Cash: ₹{mobileDayReport.summary.cash_sales} ({mobileDayReport.summary.total_sales > 0 ? Math.round((mobileDayReport.summary.cash_sales / mobileDayReport.summary.total_sales) * 100) : 0}%)
                        </span>
                      </div>
                    </div>

                    {/* Compared with Yesterday Card */}
                    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="font-extrabold text-slate-900 text-[11px]">Compared with Yesterday</span>
                        {mobileDayReport.yesterday_comparison.has_yesterday && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                            mobileDayReport.yesterday_comparison.trend === 'up'
                              ? 'bg-[#e8f8f0] text-[#007e33]'
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {mobileDayReport.yesterday_comparison.trend === 'up' && <TrendingUp className="w-3 h-3 stroke-[2.5]" />}
                            {mobileDayReport.yesterday_comparison.trend === 'down' && <TrendingDown className="w-3 h-3 stroke-[2.5]" />}
                            <span>{mobileDayReport.yesterday_comparison.message}</span>
                          </span>
                        )}
                      </div>

                      {mobileDayReport.yesterday_comparison.has_yesterday ? (
                        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-1">
                          <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="text-slate-400 block text-[9.5px]">Yesterday</span>
                            <span className="font-extrabold text-slate-700 tabular-nums">
                              ₹{mobileDayReport.yesterday_comparison.yesterday_total_sales}
                            </span>
                          </div>
                          <div className="bg-blue-50 p-2 rounded-xl">
                            <span className="text-[#0082c8] font-bold block text-[9.5px]">Today</span>
                            <span className="font-black text-[#002970] tabular-nums">
                              ₹{mobileDayReport.yesterday_comparison.today_total_sales}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="text-slate-400 block text-[9.5px]">Difference</span>
                            <span className={`font-black tabular-nums ${
                              mobileDayReport.yesterday_comparison.diff_amount >= 0 ? 'text-[#007e33]' : 'text-red-700'
                            }`}>
                              {mobileDayReport.yesterday_comparison.diff_amount >= 0 ? '+' : ''}₹{mobileDayReport.yesterday_comparison.diff_amount}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400">
                          {mobileDayReport.yesterday_comparison.message}
                        </p>
                      )}
                    </div>

                    {/* Expenses Section */}
                    {mobileDayReport.expenses_list.length > 0 && (
                      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs text-xs space-y-2">
                        <span className="font-extrabold text-slate-900 block text-[11px]">
                          Recorded Expenses ({mobileDayReport.expenses_list.length})
                        </span>
                        <div className="space-y-1.5">
                          {mobileDayReport.expenses_list.map(exp => (
                            <div key={exp.id} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <div>
                                <span className="font-bold text-slate-800 block text-[11px]">{exp.description}</span>
                                <span className="text-[9.5px] text-slate-400">{exp.time}</span>
                              </div>
                              <span className="font-black text-[#b45309] tabular-nums text-xs">-₹{exp.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stock Purchases Section */}
                    {mobileDayReport.stock_purchases_list.length > 0 && (
                      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs text-xs space-y-2">
                        <span className="font-extrabold text-slate-900 block text-[11px]">
                          Stock Purchases ({mobileDayReport.stock_purchases_list.length})
                        </span>
                        <div className="space-y-1.5">
                          {mobileDayReport.stock_purchases_list.map(stk => (
                            <div key={stk.id} className="flex justify-between items-center text-xs bg-purple-50/50 p-2 rounded-xl border border-purple-100">
                              <div>
                                <span className="font-bold text-purple-950 block text-[11px]">
                                  {stk.product_name}
                                </span>
                                <span className="text-[9.5px] text-purple-700/80">
                                  {stk.quantity} units purchased • {stk.time}
                                </span>
                              </div>
                              <span className="font-black text-purple-800 tabular-nums text-xs">
                                ₹{stk.amount}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Transactions Chronological Ledger */}
                    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs text-xs space-y-2">
                      <span className="font-extrabold text-slate-900 block text-[11px]">
                        All Transactions ({mobileDayReport.transactions.length})
                      </span>
                      <div className="space-y-1.5 max-h-56 overflow-y-auto">
                        {mobileDayReport.transactions.map(tx => (
                          <div
                            key={tx.id}
                            className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-[11px]"
                          >
                            <div className="overflow-hidden pr-2">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                                  tx.type === 'qr_collection'
                                    ? 'bg-[#ebf8fe] text-[#0082c8]'
                                    : tx.type === 'cash_collection'
                                    ? 'bg-[#e8f8f0] text-[#007e33]'
                                    : tx.type === 'expense'
                                    ? 'bg-[#fef3c7] text-[#b45309]'
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {tx.type.replace('_', ' ')}
                                </span>
                                <span className="text-[9.5px] text-slate-400 font-medium">{tx.time}</span>
                              </div>
                              <p className="font-semibold text-slate-800 truncate max-w-44 text-[10.5px]">
                                {tx.description}
                              </p>
                            </div>
                            <span className={`font-black tabular-nums text-xs ${
                              tx.is_credit ? 'text-[#007e33]' : 'text-red-700'
                            }`}>
                              {tx.is_credit ? '+' : '-'}₹{tx.amount?.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* VOICE SAATHI SYNC BANNER (Sync well with Voice Mode) */}
                    <div className="bg-[#ebf8fe] border border-sky-200/80 p-3 rounded-2xl flex items-center justify-between shadow-xs">
                      <div>
                        <span className="font-black text-[#002970] block text-[11px] flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-[#00baf2]" /> Ask Saathi About This Day
                        </span>
                        <span className="text-[9.5px] text-[#0082c8] font-medium block">
                          Speak naturally to adjust or verify records
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setShowRecordsSheet(false);
                          handleOpenVoiceMode();
                        }}
                        className="px-3 py-1.5 bg-[#002970] hover:bg-[#001e50] text-white rounded-xl text-[10.5px] font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Mic className="w-3 h-3 text-[#00baf2]" />
                        <span>Speak</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>

              {/* SHEET FOOTER */}
              <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
                {selectedMobileDate ? (
                  <button
                    onClick={() => setSelectedMobileDate(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Back to Dates
                  </button>
                ) : (
                  <button
                    onClick={() => setShowRecordsSheet(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Close Records
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
{/* VOICE SAATHI MOBILE SHEET MODAL (Clean Light Theme) */}
        {showVoiceSheet && (
          <div className="absolute inset-0 bg-slate-900/40 z-40 flex flex-col justify-end">
            <div className="bg-white rounded-t-2xl max-h-full flex flex-col shadow-modal border-t border-surface-border overflow-hidden">
              {/* Header */}
              <div className="pt-2 px-4 pb-3 bg-surface-subtle border-b border-surface-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-white">
                    <Mic className="w-4 h-4 text-brand-light" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink-primary">Voice Saathi</h4>
                    <p className="text-xs text-ink-tertiary">Sarvam Saaras & Bulbul AI</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFullScreenVoice(true)}
                    className="px-2.5 py-1 bg-[#002970] text-white hover:bg-[#001e4d] rounded-md text-[11px] font-bold flex items-center gap-1 shadow-sm"
                    title="Launch Full-Screen Voice Mode"
                  >
                    <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                    <span>Voice Mode</span>
                  </button>
                  {isPlayingAudio && (
                    <button
                      onClick={stopActiveAudio}
                      className="p-1 px-2 bg-status-criticalBg text-status-critical rounded text-xs font-bold flex items-center gap-1"
                    >
                      <Square className="w-2.5 h-2.5 fill-status-critical" /> Stop
                    </button>
                  )}
                  <button
                    onClick={() => setShowVoiceSheet(false)}
                    className="p-1 text-ink-tertiary hover:text-ink-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Scroll */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50 min-h-64 max-h-96">
                {voiceMessages.map(msg => {
                  const isBot = msg.role === 'assistant';
                  return (
                    <div key={msg.id} className={`flex gap-2 text-xs ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
                      <div className={`p-3 rounded-xl max-w-xs leading-relaxed ${
                        isBot ? 'bg-white border border-surface-border text-ink-primary shadow-subtle' : 'bg-brand text-white font-medium'
                      }`}>
                        <div className="whitespace-pre-line">{msg.text}</div>

                        {/* Single Transaction Voice Confirmation Box */}
                        {msg.isSingleConfirm && msg.pendingEntry && (
                          <div className="mt-2.5 p-2.5 bg-brand-muted border border-blue-200 rounded-lg text-xs space-y-2">
                            <span className="font-bold text-brand block">Confirm Transaction:</span>
                            <div className="grid grid-cols-2 gap-1.5 text-xs bg-white p-2 rounded border border-blue-100">
                              <div>Type: <strong>{msg.pendingEntry.type.replace('_', ' ').toUpperCase()}</strong></div>
                              <div>Amount: <strong>₹{msg.pendingEntry.amount}</strong></div>
                              <div>Method: <strong>{msg.pendingEntry.payment_method}</strong></div>
                              <div>Date: <strong>{msg.pendingEntry.date}</strong></div>
                            </div>
                            <div className="flex gap-1.5 pt-1">
                              <button
                                onClick={() => handleSendMessage('Yes')}
                                className="flex-1 py-1.5 bg-brand text-white text-xs font-bold rounded-md hover:bg-brand-dark transition-colors"
                              >
                                Confirm & Save
                              </button>
                              <button
                                onClick={() => handleSendMessage('Cancel')}
                                className="py-1.5 px-3 bg-surface-subtle text-ink-secondary text-xs font-medium rounded-md hover:bg-slate-200 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        {msg.isClosingSummary && msg.closingData && (
                          <div className="mt-2.5 p-2.5 bg-brand-muted border border-blue-200 rounded-lg text-xs space-y-2">
                            <span className="font-bold text-brand block">Reconciliation Summary:</span>
                            <div className="grid grid-cols-2 gap-1.5 text-xs">
                              <div>QR: <strong>₹{msg.closingData.qr_collections}</strong></div>
                              <div>Cash: <strong>₹{msg.closingData.cash_collections}</strong></div>
                              <div>Expense: <strong>₹{msg.closingData.expenses}</strong></div>
                              <div>Stock: <strong>₹{msg.closingData.stock_purchases}</strong></div>
                            </div>
                            <div className="flex gap-1.5 pt-1">
                              <button
                                onClick={() => handleSendMessage('Yes')}
                                className="flex-1 py-1.5 bg-brand text-white text-xs font-bold rounded-md"
                              >
                                Confirm & Save
                              </button>
                              <button
                                onClick={() => handleSendMessage('Cancel')}
                                className="py-1.5 px-3 bg-surface-subtle text-ink-secondary text-xs font-medium rounded-md"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {msg.audio && (
                          <div className="mt-1 flex justify-end">
                            <button
                              onClick={() => playAudioBase64(msg.audio)}
                              className="text-xs text-brand font-bold flex items-center gap-0.5 hover:underline"
                            >
                              <Volume2 className="w-3 h-3 text-brand-light" /> Speak
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isProcessing && (
                  <div className="text-xs text-ink-tertiary flex items-center gap-1.5 p-2 bg-white rounded-lg border border-surface-border w-max">
                    <div className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    <span>{isRecording ? 'Listening…' : 'Processing with Sarvam AI…'}</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Prompts */}
              <div className="p-2 bg-surface-subtle border-t border-surface-border flex gap-1.5 overflow-x-auto">
                {['Today collections?', 'Milk stock?', 'Expenses?', 'Low stock items?'].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="flex-shrink-0 px-2 py-1 bg-white border border-surface-border rounded-md text-xs font-medium text-ink-secondary hover:text-brand"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Bottom Voice Input Controls */}
              <div className="p-3 bg-white border-t border-surface-border flex items-center gap-2">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-3 rounded-full flex items-center justify-center transition-transform ${
                    isRecording ? 'bg-red-600 text-white animate-pulse-mic' : 'bg-brand text-white hover:bg-brand-dark'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-brand-light" />}
                </button>

                <form
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="flex-1 flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={isRecording ? 'Listening…' : 'Ask question or type cash…'}
                    className="flex-1 px-3 py-1.5 bg-surface-subtle border border-surface-border rounded-lg text-xs"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isProcessing}
                    className="p-2 bg-brand text-white rounded-lg disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5 text-brand-light" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ChatGPT-Style Full-Screen Voice Mode Overlay for Mobile */}
        <FullScreenVoiceExperience
          isOpen={isFullScreenVoice}
          onMinimize={() => {
            setIsFullScreenVoice(false);
            setShowVoiceSheet(true);
          }}
          onClose={() => {
            setIsFullScreenVoice(false);
          }}
          voiceState={isRecording ? 'listening' : isProcessing ? 'thinking' : isPlayingAudio ? 'speaking' : 'idle'}
          currentLang={currentLang}
          setLanguage={setCurrentLang}
          recordingSeconds={recordingSeconds}
          isRecording={isRecording}
          startRecording={startRecording}
          stopRecording={stopRecording}
          stopActiveAudio={stopActiveAudio}
          isPlayingAudio={isPlayingAudio}
          lastUserTranscript={lastUserTranscript}
          lastAssistantReply={lastAssistantReply}
          summaryReady={summaryReady}
          pendingClosing={pendingClosing}
          onConfirmSummary={handleDirectConfirmClosing}
          onCancelSummary={() => {
            setSummaryReady(false);
            setPendingClosing(null);
            handleSendMessage('Cancel');
          }}
          onUpdatePendingField={handleUpdatePendingField}
          onSendText={handleSendMessage}
          flowStep={flowState?.next_step || (summaryReady ? 'AWAITING_CONFIRMATION' : 'IDLE')}
        />

        {/* FIRST-TIME USER FEATURE TOUR */}
        <FirstTimeUserTour
          isOpen={showTour}
          onClose={() => setShowTour(false)}
          onStartVoiceClosing={() => {
            setShowTour(false);
            handleOpenVoiceMode();
          }}
          onOpenRecords={() => {
            setShowTour(false);
            handleOpenRecords();
          }}
        />

      </div>
    </div>
  );
}
