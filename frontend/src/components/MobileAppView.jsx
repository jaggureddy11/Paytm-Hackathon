import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  ChevronRight, 
  ShieldCheck, 
  QrCode, 
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
  Layers,
  FileText,
  Smartphone,
  Zap,
  Store
} from 'lucide-react';
import FullScreenVoiceExperience from './FullScreenVoiceExperience';

export default function MobileAppView({
  dashboardData,
  merchant,
  currentLang,
  setLanguage,
  t,
  onDataUpdated,
  onOpenDesktopDashboard
}) {
  const fin = dashboardData?.financials || {
    qr_collections: 1000.0,
    cash_collections: 0.0,
    total_collections: 1000.0,
    expenses: 0.0,
    stock_purchases: 0.0,
    estimated_balance: 1000.0,
    has_closed_today: false
  };

  const [showVoiceSheet, setShowVoiceSheet] = useState(false);
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
  const isRealMicActiveRef = useRef(false);

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
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        ctx.resume();
      }
    } catch (e) {}

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
      console.info('Microphone access notice in MobileAppView:', err.message);
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
        if (onDataUpdated) onDataUpdated();
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
        if (onDataUpdated) onDataUpdated();
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

  const handleTriggerClosingFromMobile = () => {
    setShowVoiceSheet(true);
    handleSendMessage('Start daily closing reminder');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-4">
      {/* View Switcher Banner */}
      <div className="w-full max-w-sm mb-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-bold text-ink-primary">Paytm Business Mobile App</span>
        </div>
        <button
          onClick={onOpenDesktopDashboard}
          className="text-xs font-semibold text-brand hover:underline flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-surface-border shadow-subtle"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Switch to Web Dashboard</span>
        </button>
      </div>

      {/* Realistic Mobile Device Frame */}
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl p-3 shadow-modal border-4 border-slate-800 relative">
        {/* Mobile Screen Container */}
        <div className="bg-surface-canvas rounded-2xl overflow-hidden flex flex-col h-mobile relative font-sans text-ink-primary">
          
          {/* Status Bar */}
          <div className="pt-2.5 px-5 pb-1.5 flex items-center justify-between text-xs font-semibold text-slate-800 select-none bg-white">
            <span className="font-bold text-[13px] tracking-tight">10:03</span>
            <div className="flex items-center gap-1.5 text-xs">
              <svg className="w-3.5 h-3.5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" />
              </svg>
              <span className="font-extrabold text-[11px] text-slate-800">5G</span>
              <div className="flex items-end gap-[1.5px] h-3">
                <span className="w-[2.5px] h-1.5 bg-slate-800 rounded-sm"></span>
                <span className="w-[2.5px] h-2 bg-slate-800 rounded-sm"></span>
                <span className="w-[2.5px] h-2.5 bg-slate-800 rounded-sm"></span>
                <span className="w-[2.5px] h-3 bg-slate-800 rounded-sm"></span>
              </div>
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
                <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-40 mt-0.5">
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

            <div className="flex items-center gap-3">
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
                  
                  {/* Prominent Circular Green Badge */}
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
                onClick={() => onOpenDesktopDashboard?.('records')}
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
                  <div className="w-10 h-14 bg-white rounded-md border border-slate-300 shadow-sm flex flex-col items-center justify-between p-1 z-10">
                    <div className="w-full bg-[#002e6e] text-[5px] text-white font-extrabold text-center rounded-[2px] py-[1px]">
                      paytm
                    </div>
                    <QrCode className="w-6 h-6 text-slate-800" />
                    <div className="w-full h-1 bg-[#00baf2] rounded-full"></div>
                  </div>
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
                    onClick={() => onOpenDesktopDashboard?.('records')}
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

              {/* Tab 3: Records */}
              <button 
                onClick={() => onOpenDesktopDashboard?.('records')}
                className="flex flex-col items-center justify-center flex-1 min-w-0 py-0.5 text-slate-600 hover:text-[#002970] transition-colors"
                title="View Business Records"
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

          {/* VOICE SAATHI MOBILE BOTTOM SHEET MODAL */}
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

                {/* Sheet Chat Scroll */}
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

                          {/* Interactive Closing Confirmation Box */}
                          {msg.isClosingSummary && msg.closingData && (
                            <div className="mt-2.5 p-2.5 bg-brand-muted border border-blue-200 rounded-lg text-xs space-y-2">
                              <span className="font-bold text-brand block">Summary Confirmation:</span>
                              <div className="grid grid-cols-2 gap-1.5 text-xs">
                                <div>QR: <strong>₹{msg.closingData.qr_collections}</strong></div>
                                <div>Cash: <strong>₹{msg.closingData.cash_collections}</strong></div>
                                <div>Expense: <strong>₹{msg.closingData.expenses}</strong></div>
                                <div>Stock: <strong>₹{msg.closingData.stock_purchases}</strong></div>
                              </div>
                              <div className="flex gap-1.5 pt-1">
                                <button
                                  onClick={() => handleSendMessage('Yes, save these records')}
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

                {/* Quick Prompts inside Sheet */}
                <div className="p-2 bg-surface-subtle border-t border-surface-border flex gap-1.5 overflow-x-auto">
                  {['Today collections?', 'Milk stock?', 'Expenses?', 'Weekly sales?'].map((q, idx) => (
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

          {/* ChatGPT-Style Full-Screen Voice Mode Overlay for Mobile Preview */}
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
            setLanguage={setLanguage}
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
            micPermissionError={micPermissionError}
          />

        </div>
      </div>
    </div>
  );
}
