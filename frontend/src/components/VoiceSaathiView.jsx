import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  Trash2, 
  Bot, 
  User, 
  CheckCircle2, 
  Square,
  Maximize2,
  AlertCircle,
  Radio,
  Clock,
  Edit3,
  Save,
  X
} from 'lucide-react';
import FullScreenVoiceExperience from './FullScreenVoiceExperience';

export default function VoiceSaathiView({ 
  currentLang, 
  setLanguage, 
  t, 
  merchant, 
  onDataUpdated,
  initialPrompt
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am Paytm Saathi. Tap the microphone to record sales, expenses, stock, or ask any business question.',
      audio: null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [flowState, setFlowState] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // ChatGPT-style full-screen voice experience states
  const [isFullScreenVoice, setIsFullScreenVoice] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState(false);
  const [lastUserTranscript, setLastUserTranscript] = useState('');
  const [lastAssistantReply, setLastAssistantReply] = useState('');
  const [summaryReady, setSummaryReady] = useState(false);
  const [pendingClosing, setPendingClosing] = useState(null);

  // Inline editing for closing summary
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editCash, setEditCash] = useState(2500);
  const [editExpense, setEditExpense] = useState(500);
  const [editExpenseDesc, setEditExpenseDesc] = useState('Electricity bill');
  const [editStock, setEditStock] = useState(600);
  const [editStockQty, setEditStockQty] = useState(20);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const activeAudioRef = useRef(null);
  const chatBottomRef = useRef(null);
  const timerRef = useRef(null);

  // Robust Voice Lifecycle & Cancellation Management
  const voiceSessionIdRef = useRef(0);
  const isVoiceActiveRef = useRef(false);
  const isRecordingCancelledRef = useRef(false);
  const activeAbortControllerRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  useEffect(() => {
    if (initialPrompt) {
      handleUserSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const stopActiveAudio = () => {
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
        activeAudioRef.current.src = '';
        activeAudioRef.current.onended = null;
        activeAudioRef.current.onerror = null;
      } catch (e) {
        console.warn('Audio silence error:', e);
      }
      activeAudioRef.current = null;
    }
    // Cancel browser speech synthesis if active
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    // Silence any stray audio elements in DOM
    try {
      const allAudio = document.querySelectorAll('audio');
      allAudio.forEach(el => {
        try {
          el.pause();
          el.currentTime = 0;
          el.src = '';
        } catch (e) {}
      });
    } catch (e) {}
    setIsPlayingAudio(false);
  };

  const handleCloseVoiceMode = () => {
    // 1. Invalidate session token so no late callbacks or in-flight responses can speak
    voiceSessionIdRef.current += 1;
    isVoiceActiveRef.current = false;
    isRecordingCancelledRef.current = true;

    // 2. Abort all in-flight network requests immediately
    if (activeAbortControllerRef.current) {
      try {
        activeAbortControllerRef.current.abort();
      } catch (e) {}
      activeAbortControllerRef.current = null;
    }

    // 3. Stop audio immediately and definitively
    stopActiveAudio();

    // 4. Stop recording without processing buffered audio
    stopRecording(true);

    // 5. Clear recording timers and processing flags
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setIsProcessing(false);

    // 6. Dismiss full screen voice overlay
    setIsFullScreenVoice(false);
  };

  const playAudioBase64 = (base64Audio, onEnded, sessionId) => {
    const currentSession = sessionId !== undefined ? sessionId : voiceSessionIdRef.current;
    if (!isVoiceActiveRef.current || voiceSessionIdRef.current !== currentSession) {
      return;
    }
    if (!base64Audio) {
      if (onEnded && isVoiceActiveRef.current && voiceSessionIdRef.current === currentSession) {
        onEnded();
      }
      return;
    }
    try {
      stopActiveAudio();
      if (!isVoiceActiveRef.current || voiceSessionIdRef.current !== currentSession) {
        return;
      }

      setIsPlayingAudio(true);
      const audioUrl = `data:audio/wav;base64,${base64Audio}`;
      const audio = new Audio(audioUrl);
      activeAudioRef.current = audio;

      audio.onended = () => {
        if (activeAudioRef.current === audio) {
          activeAudioRef.current = null;
          setIsPlayingAudio(false);
        }
        if (isVoiceActiveRef.current && voiceSessionIdRef.current === currentSession && onEnded) {
          onEnded();
        }
      };

      audio.onerror = () => {
        if (activeAudioRef.current === audio) {
          activeAudioRef.current = null;
          setIsPlayingAudio(false);
        }
        if (isVoiceActiveRef.current && voiceSessionIdRef.current === currentSession && onEnded) {
          onEnded();
        }
      };

      audio.play().catch(e => {
        console.warn('Audio auto-play prevented or failed:', e);
        if (activeAudioRef.current === audio) {
          activeAudioRef.current = null;
          setIsPlayingAudio(false);
        }
        if (isVoiceActiveRef.current && voiceSessionIdRef.current === currentSession && onEnded) {
          onEnded();
        }
      });
    } catch (e) {
      console.error('Audio playback error:', e);
      setIsPlayingAudio(false);
      activeAudioRef.current = null;
      if (isVoiceActiveRef.current && voiceSessionIdRef.current === currentSession && onEnded) {
        onEnded();
      }
    }
  };

  const handleOpenVoiceMode = async (forceReset = false) => {
    voiceSessionIdRef.current += 1;
    const currentSessionId = voiceSessionIdRef.current;
    isVoiceActiveRef.current = true;
    isRecordingCancelledRef.current = false;

    stopActiveAudio();
    setIsFullScreenVoice(true);

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        ctx.resume();
      }
    } catch (e) {}

    const needsStart = forceReset || !flowState || !flowState.is_closing_flow || flowState.step === 'COMPLETED' || (!summaryReady && messages.length <= 1);

    if (needsStart) {
      try {
        setIsProcessing(true);
        if (activeAbortControllerRef.current) {
          try { activeAbortControllerRef.current.abort(); } catch (e) {}
        }
        activeAbortControllerRef.current = new AbortController();
        const signal = activeAbortControllerRef.current.signal;

        const res = await fetch(`/api/closing/trigger?lang=${currentLang}`, { method: 'POST', signal });

        if (voiceSessionIdRef.current !== currentSessionId || !isVoiceActiveRef.current) {
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (voiceSessionIdRef.current !== currentSessionId || !isVoiceActiveRef.current) {
            return;
          }

          setFlowState(data);
          setLastAssistantReply(data.reply);
          setMessages(prev => [
            ...prev,
            {
              id: 'closing-' + Date.now(),
              role: 'assistant',
              text: data.reply,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          if (data.audio_base64 && isVoiceActiveRef.current && voiceSessionIdRef.current === currentSessionId) {
            playAudioBase64(data.audio_base64, () => {
              if (isVoiceActiveRef.current && voiceSessionIdRef.current === currentSessionId) {
                startRecording();
              }
            }, currentSessionId);
          } else if (isVoiceActiveRef.current && voiceSessionIdRef.current === currentSessionId) {
            startRecording();
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Closing trigger error:', err);
      } finally {
        if (voiceSessionIdRef.current === currentSessionId) {
          setIsProcessing(false);
        }
      }
    } else {
      if (!isRecording && !isPlayingAudio && !summaryReady && isVoiceActiveRef.current) {
        startRecording();
      }
    }
  };

  const startRecording = async () => {
    if (!isVoiceActiveRef.current) return;
    const currentSession = voiceSessionIdRef.current;
    stopActiveAudio();
    setMicPermissionError(false);
    isRecordingCancelledRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!isVoiceActiveRef.current || voiceSessionIdRef.current !== currentSession) {
        stream.getTracks().forEach(t => {
          try { t.stop(); } catch (e) {}
        });
        setIsRecording(false);
        return;
      }

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
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (isRecordingCancelledRef.current || !isVoiceActiveRef.current || voiceSessionIdRef.current !== currentSession) {
          audioChunksRef.current = [];
          return;
        }
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          await processVoiceAudio(audioBlob, currentSession);
        }
      };

      recorder.start(200);
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      setMicPermissionError(true);
      setIsRecording(false);
    }
  };

  const stopRecording = (shouldCancel = false) => {
    if (shouldCancel) {
      isRecordingCancelledRef.current = true;
    }
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
      setIsRecording(false);
    }
  };

  const processVoiceAudio = async (audioBlob, sessionId) => {
    const currentSession = sessionId !== undefined ? sessionId : voiceSessionIdRef.current;
    if (voiceSessionIdRef.current !== currentSession || !isVoiceActiveRef.current) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language_code', currentLang);

      if (activeAbortControllerRef.current) {
        try { activeAbortControllerRef.current.abort(); } catch (e) {}
      }
      activeAbortControllerRef.current = new AbortController();
      const signal = activeAbortControllerRef.current.signal;

      const sttRes = await fetch('/api/voice/stt', {
        method: 'POST',
        body: formData,
        signal
      });
      if (voiceSessionIdRef.current !== currentSession || !isVoiceActiveRef.current) return;

      const sttData = await sttRes.json();
      if (voiceSessionIdRef.current !== currentSession || !isVoiceActiveRef.current) return;

      if (sttData.success && sttData.transcript) {
        setLastUserTranscript(sttData.transcript);
        await handleUserSendMessage(sttData.transcript, currentSession);
      } else {
        const fallbackMsg = sttData.error || 'Could not understand voice. Please try again or type.';
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            text: fallbackMsg,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setLastAssistantReply(fallbackMsg);
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('STT API failed:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          text: 'Speech recognition service error. You can continue by typing in the chat.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      if (voiceSessionIdRef.current === currentSession) {
        setIsProcessing(false);
      }
    }
  };

  const handleUserSendMessage = async (textToSend, sessionId) => {
    const currentSession = sessionId !== undefined ? sessionId : voiceSessionIdRef.current;
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    setInputMessage('');
    stopActiveAudio();
    setLastUserTranscript(text);

    const userMsgId = Date.now().toString();
    const newMessages = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(newMessages);
    setIsProcessing(true);

    try {
      if (activeAbortControllerRef.current) {
        try { activeAbortControllerRef.current.abort(); } catch (e) {}
      }
      activeAbortControllerRef.current = new AbortController();
      const signal = activeAbortControllerRef.current.signal;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language_code: currentLang,
          flow_state: flowState
        }),
        signal
      });

      if (voiceSessionIdRef.current !== currentSession || !isVoiceActiveRef.current) {
        return;
      }

      const data = await res.json();
      if (voiceSessionIdRef.current !== currentSession || !isVoiceActiveRef.current) {
        return;
      }

      setLastAssistantReply(data.reply);
      const botMsgId = (Date.now() + 1).toString();
      setMessages(prev => [
        ...prev,
        {
          id: botMsgId,
          role: 'assistant',
          text: data.reply,
          audio: data.audio_base64,
          isClosingSummary: data.summary_ready,
          closingData: data.flow_state?.flow_data,
          isSingleConfirm: data.is_single_confirm,
          pendingEntry: data.pending_entry,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      if (data.flow_state) {
        setFlowState(data.flow_state);
      }

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

      if (data.audio_base64 && isVoiceActiveRef.current && voiceSessionIdRef.current === currentSession) {
        playAudioBase64(data.audio_base64, () => {
          if (isFullScreenVoice && !data.saved && !data.summary_ready && voiceSessionIdRef.current === currentSession) {
            startRecording();
          }
        }, currentSession);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Chat API error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: 'Error processing response. Please check backend connection.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      if (voiceSessionIdRef.current === currentSession) {
        setIsProcessing(false);
      }
    }
  };

  const handleDirectConfirmClosing = async (customPayload) => {
    const payload = customPayload || pendingClosing;
    if (!payload) return;
    setIsProcessing(true);
    const currentSession = voiceSessionIdRef.current;
    try {
      const res = await fetch('/api/closing/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_collections: payload.qr_collections ?? pendingClosing?.qr_collections ?? 1000.0,
          cash_collections: payload.cash_collections ?? 2500.0,
          expenses: payload.expenses ?? 500.0,
          expense_description: payload.expense_description || 'Electricity bill',
          stock_purchases: payload.stock_purchases ?? 0.0,
          stock_item: payload.stock_item || 'None',
          stock_quantity_purchased: payload.stock_qty_purchased || payload.stock_quantity_purchased || 0,
          stock_quantity_sold: payload.stock_qty_sold || payload.stock_quantity_sold || 0
        })
      });
      const data = await res.json();
      if (data.success) {
        setSummaryReady(false);
        setPendingClosing(null);
        setFlowState(null);
        setIsEditingSummary(false);
        if (onDataUpdated) onDataUpdated();
        setTimeout(() => handleCloseVoiceMode(), 2200);

        const successText = currentLang === 'te-IN'
          ? "మీ రోజువారీ రికార్డులు విజయవంతంగా సేవ్ చేయబడ్డాయి! డాష్‌బోర్డ్, వ్యాపార రికార్డులు మరియు ఇన్వెంటరీ అప్‌డేట్ అయ్యాయి."
          : currentLang === 'hi-IN'
          ? "आपके दैनिक रिकॉर्ड सफलतापूर्वक सहेज लिए गए हैं! डैशबोर्ड, व्यापार रिकॉर्ड और इन्वेंट्री अपडेट हो गए हैं।"
          : "Your daily closing records have been confirmed and saved! Dashboard, Records, and Inventory are now updated.";

        setMessages(prev => [
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
          if (activeAbortControllerRef.current) {
            try { activeAbortControllerRef.current.abort(); } catch (e) {}
          }
          activeAbortControllerRef.current = new AbortController();
          const signal = activeAbortControllerRef.current.signal;

          const ttsRes = await fetch('/api/voice/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: successText, language_code: currentLang }),
            signal
          });
          const ttsData = await ttsRes.json();
          if (ttsData.audio_base64 && isVoiceActiveRef.current && voiceSessionIdRef.current === currentSession) {
            playAudioBase64(ttsData.audio_base64, null, currentSession);
          }
        } catch (e) {
          if (e.name !== 'AbortError') {
            console.warn('TTS confirm error:', e);
          }
        }
      }
    } catch (err) {
      console.error('Direct confirm error:', err);
    } finally {
      if (voiceSessionIdRef.current === currentSession) {
        setIsProcessing(false);
      }
    }
  };

  const handleConfirmSummary = async (confirmed) => {
    if (confirmed) {
      await handleDirectConfirmClosing();
    } else {
      setSummaryReady(false);
      setPendingClosing(null);
      await handleUserSendMessage('Cancel');
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
    handleUserSendMessage('Start daily closing reminder');
  };

  const clearChat = () => {
    stopActiveAudio();
    setFlowState(null);
    setSummaryReady(false);
    setPendingClosing(null);
    setMessages([
      {
        id: 'welcome_reset',
        role: 'assistant',
        text: 'Conversation cleared. You can ask a new question.',
        audio: null,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const quickPrompts = [
    'How much did I collect today?',
    'What were my expenses?',
    'How much milk stock is remaining?',
    'Which products are running low?'
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-white rounded-xl border border-surface-border shadow-card overflow-hidden">
      {/* Top Assistant Header */}
      <div className="p-4 px-6 bg-surface-subtle border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center text-white">
            <Mic className="w-4 h-4 text-brand-light" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink-primary flex items-center gap-2">
              <span>{t.voice.title}</span>
              <span className="text-xs font-semibold bg-brand-muted text-brand px-2 py-0.5 rounded-md border border-blue-200">
                Bulbul v4 & Saaras v4
              </span>
            </h2>
            <p className="text-xs text-ink-tertiary">
              {t.voice.subtitle}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* ChatGPT-style Full-screen Voice Mode button */}
          <button
            onClick={() => handleOpenVoiceMode()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#002970] text-white hover:bg-[#001e4d] text-xs font-bold rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Open ChatGPT-style Full-Screen Voice Mode"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Full-Screen Voice</span>
          </button>

          {isPlayingAudio && (
            <button
              onClick={stopActiveAudio}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-status-criticalBg text-status-critical hover:bg-red-100 text-xs font-semibold rounded-lg border border-status-criticalBorder transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-status-critical" />
              <span>{t.voice.stopAudio}</span>
            </button>
          )}

          <button
            onClick={clearChat}
            className="p-2 text-ink-tertiary hover:text-ink-primary hover:bg-slate-200 rounded-lg transition-colors"
            title={t.voice.clearChat}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mic Permission Banner */}
      {micPermissionError && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 text-xs text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>Microphone access was denied or not supported. You can still type below or grant permissions in browser settings.</span>
          </div>
          <button onClick={() => setMicPermissionError(false)} className="text-red-600 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Voice Mode Quick Launch Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-emerald-50 border-b border-blue-100 px-6 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[#002970]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold">Voice Saathi is ready in English, Telugu & Hindi.</span>
        </div>
        <button
          onClick={() => handleOpenVoiceMode()}
          className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
        >
          <span>Launch Full-Screen Voice Mode</span>
          <span>→</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        {messages.map((msg) => {
          const isBot = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-2xl ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                isBot ? 'bg-brand' : 'bg-brand-light'
              }`}>
                {isBot ? <Bot className="w-3.5 h-3.5 text-brand-light" /> : <User className="w-3.5 h-3.5 text-brand" />}
              </div>

              {/* Message Bubble */}
              <div className={`rounded-xl p-4 text-xs leading-relaxed shadow-subtle ${
                isBot 
                  ? 'bg-white border border-surface-border text-ink-primary' 
                  : 'bg-brand text-white font-medium'
              }`}>
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Closing Summary Confirmation Card */}
                {msg.isClosingSummary && (msg.closingData || pendingClosing) && (
                  <div className="mt-4 p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-ink-primary space-y-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-[#002970]">
                          Daily Closing Summary
                        </span>
                      </div>
                      <button
                        onClick={() => setIsEditingSummary(!isEditingSummary)}
                        className="text-[11px] font-semibold text-brand hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isEditingSummary ? 'Done' : 'Edit Values'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* QR Collections */}
                      <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                        <span className="text-slate-500 block text-[11px]">QR Collections:</span>
                        <p className="font-bold text-brand text-sm tabular-nums">
                          ₹{(pendingClosing?.qr_collections || msg.closingData?.qr_collections || 1000)?.toLocaleString('en-IN')}
                        </p>
                        <span className="text-[10px] text-slate-400">Paytm QR source</span>
                      </div>

                      {/* Cash Collections */}
                      <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                        <span className="text-slate-500 block text-[11px]">Cash Collections:</span>
                        {isEditingSummary ? (
                          <input
                            type="number"
                            value={editCash}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setEditCash(val);
                              handleUpdatePendingField({ cash_collections: val });
                            }}
                            className="w-full mt-1 bg-slate-50 border border-blue-300 rounded px-2 py-0.5 text-xs font-bold text-slate-900"
                          />
                        ) : (
                          <p className="font-bold text-emerald-700 text-sm tabular-nums">
                            ₹{(pendingClosing?.cash_collections || msg.closingData?.cash_collections || 2500)?.toLocaleString('en-IN')}
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400">Physical collections</span>
                      </div>

                      {/* Expenses */}
                      <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                        <span className="text-slate-500 block text-[11px]">Expenses:</span>
                        {isEditingSummary ? (
                          <input
                            type="number"
                            value={editExpense}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setEditExpense(val);
                              handleUpdatePendingField({ expenses: val });
                            }}
                            className="w-full mt-1 bg-slate-50 border border-blue-300 rounded px-2 py-0.5 text-xs font-bold text-slate-900"
                          />
                        ) : (
                          <p className="font-bold text-rose-600 text-sm tabular-nums">
                            ₹{(pendingClosing?.expenses || msg.closingData?.expenses || 500)?.toLocaleString('en-IN')}
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400 truncate block">
                          {pendingClosing?.expense_description || msg.closingData?.expense_description || 'Electricity bill'}
                        </span>
                      </div>

                      {/* Stock Purchases */}
                      <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                        <span className="text-slate-500 block text-[11px]">Stock Purchases:</span>
                        {isEditingSummary ? (
                          <input
                            type="number"
                            value={editStock}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setEditStock(val);
                              handleUpdatePendingField({ stock_purchases: val });
                            }}
                            className="w-full mt-1 bg-slate-50 border border-blue-300 rounded px-2 py-0.5 text-xs font-bold text-slate-900"
                          />
                        ) : (
                          <p className="font-bold text-slate-800 text-sm tabular-nums">
                            ₹{(pendingClosing?.stock_purchases || msg.closingData?.stock_purchases || 600)?.toLocaleString('en-IN')}
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400 truncate block">
                          20 Milk Packets
                        </span>
                      </div>
                    </div>

                    {/* Calculated Balance row */}
                    <div className="bg-white p-2.5 rounded-lg border border-blue-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Total Sales:</span>
                        <span className="font-bold text-slate-900">
                          ₹{((pendingClosing?.qr_collections || msg.closingData?.qr_collections || 1000) + 
                              (pendingClosing?.cash_collections || msg.closingData?.cash_collections || 2500)).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[11px]">Estimated Balance:</span>
                        <span className="font-bold text-emerald-700">
                          ₹{((pendingClosing?.qr_collections || msg.closingData?.qr_collections || 1000) + 
                              (pendingClosing?.cash_collections || msg.closingData?.cash_collections || 2500) - 
                              (pendingClosing?.expenses || msg.closingData?.expenses || 500) - 
                              (pendingClosing?.stock_purchases || msg.closingData?.stock_purchases || 600)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-brand font-medium">
                      {t.voice.confirmPrompt || 'Would you like to Confirm & Save these records?'}
                    </p>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleConfirmSummary(true)}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-subtle transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>Confirm & Save</span>
                      </button>
                      <button
                        onClick={() => handleConfirmSummary(false)}
                        className="py-2 px-4 bg-surface-subtle hover:bg-slate-200 text-ink-secondary rounded-lg text-xs font-semibold transition-colors"
                      >
                        {t.voice.cancelBtn || 'Cancel'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Single Transaction Voice Confirmation Card */}
                {msg.isSingleConfirm && msg.pendingEntry && (
                  <div className="mt-4 p-4 rounded-lg bg-blue-50/70 border border-blue-200 text-ink-primary space-y-3">
                    <div className="flex items-center gap-2 border-b border-blue-200 pb-2">
                      <CheckCircle2 className="w-4 h-4 text-brand" />
                      <span className="text-xs font-bold text-brand">
                        Confirm Transaction Record
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-white rounded-md border border-blue-100">
                        <span className="text-ink-tertiary">Category:</span>
                        <p className="font-bold text-brand text-xs uppercase tracking-wider">
                          {msg.pendingEntry.type.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="p-2 bg-white rounded-md border border-blue-100">
                        <span className="text-ink-tertiary">Amount:</span>
                        <p className="font-bold text-ink-primary text-sm tabular-nums">
                          ₹{msg.pendingEntry.amount?.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="p-2 bg-white rounded-md border border-blue-100">
                        <span className="text-ink-tertiary">Method:</span>
                        <p className="font-bold text-ink-primary text-xs">
                          {msg.pendingEntry.payment_method}
                        </p>
                      </div>
                      <div className="p-2 bg-white rounded-md border border-blue-100">
                        <span className="text-ink-tertiary">Date:</span>
                        <p className="font-bold text-ink-primary text-xs">
                          {msg.pendingEntry.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleConfirmSummary(true)}
                        className="flex-1 py-2 px-3 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-bold shadow-subtle transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-light" />
                        <span>Confirm & Save</span>
                      </button>
                      <button
                        onClick={() => handleConfirmSummary(false)}
                        className="py-2 px-4 bg-surface-subtle hover:bg-slate-200 text-ink-secondary rounded-lg text-xs font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Footer Audio Re-play */}
                <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
                  <span>{msg.time}</span>
                  {msg.audio && (
                    <button
                      onClick={() => playAudioBase64(msg.audio)}
                      className="flex items-center gap-1 text-brand hover:underline font-semibold transition-colors"
                      title="Play spoken response"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-brand-light" />
                      <span>Speak</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex gap-3 mr-auto items-center text-xs text-ink-tertiary bg-white p-3 rounded-lg border border-surface-border shadow-subtle">
            <Bot className="w-4 h-4 text-brand-light animate-spin" />
            <span>{isRecording ? t.voice.recording : t.voice.processing}</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-6 py-2 bg-surface-subtle border-t border-surface-border flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-ink-tertiary flex-shrink-0 flex items-center gap-1">
          <Mic className="w-3 h-3 text-brand" /> Ask:
        </span>
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleUserSendMessage(q)}
            className="flex-shrink-0 px-3 py-1 bg-white hover:bg-blue-50 text-ink-secondary hover:text-brand border border-surface-border rounded-md text-xs font-medium transition-colors shadow-subtle"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Bottom Voice Control & Text Input Bar */}
      <div className="p-4 px-6 bg-white border-t border-surface-border flex flex-col sm:flex-row items-center gap-4">
        {/* Microphone Button with clean state animation */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3.5 rounded-full flex items-center justify-center transition-transform shadow-card ${
              isRecording
                ? 'bg-red-600 text-white animate-pulse-mic'
                : 'bg-brand hover:bg-brand-dark text-white'
            }`}
            title={isRecording ? 'Click to stop recording' : t.voice.pressToSpeak}
          >
            {isRecording ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5 text-brand-light" />
            )}
          </button>

          {isRecording && (
            <div className="flex flex-col text-xs font-bold text-status-critical">
              <span>Recording… ({recordingSeconds}s)</span>
              <span className="text-xs text-ink-tertiary font-normal">Tap mic again to finish</span>
            </div>
          )}
        </div>

        {/* Text Fallback Input Form (#53 with focus ring) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUserSendMessage();
          }}
          className="flex-1 flex items-center gap-2 w-full"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={t.voice.typePlaceholder}
            disabled={isProcessing || isRecording}
            className="flex-1 px-4 py-2 bg-surface-subtle border border-surface-border rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-brand focus:border-brand transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isProcessing}
            className="p-2.5 bg-brand hover:bg-brand-dark text-white rounded-lg disabled:opacity-40 transition-colors shadow-subtle"
          >
            <Send className="w-3.5 h-3.5 text-brand-light" />
          </button>
        </form>
      </div>

      {/* ChatGPT-Style Full-Screen Voice Mode Overlay */}
      <FullScreenVoiceExperience
        isOpen={isFullScreenVoice}
        onMinimize={() => {
          stopActiveAudio();
          setIsFullScreenVoice(false);
        }}
        onClose={handleCloseVoiceMode}
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
          handleUserSendMessage('Cancel');
        }}
        onUpdatePendingField={handleUpdatePendingField}
        onSendText={handleUserSendMessage}
        flowStep={flowState?.next_step || (summaryReady ? 'AWAITING_CONFIRMATION' : 'IDLE')}
        micPermissionError={micPermissionError}
      />
    </div>
  );
}
