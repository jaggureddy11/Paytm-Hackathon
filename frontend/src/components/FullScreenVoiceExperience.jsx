import React, { useState, useEffect } from 'react';
import { VoiceOrb } from '@/components/ui/voice-orb';
import { 
  ChevronDown, 
  Mic, 
  MicOff, 
  Square, 
  CheckCircle2, 
  X, 
  Edit3, 
  TrendingUp,
  ShoppingBag,
  ArrowDownRight,
  Package,
  QrCode,
  Banknote,
  Send,
  Volume2
} from 'lucide-react';

export default function FullScreenVoiceExperience({
  isOpen,
  onMinimize,
  onClose,
  voiceState = 'idle', // 'idle' | 'listening' | 'thinking' | 'speaking'
  currentLang = 'en-IN',
  setLanguage,
  recordingSeconds = 0,
  isRecording = false,
  isRealMicActive = false,
  startRecording,
  stopRecording,
  stopActiveAudio,
  isPlayingAudio = false,
  lastUserTranscript = '',
  lastAssistantReply = '',
  summaryReady = false,
  pendingClosing = null,
  onConfirmSummary,
  onCancelSummary,
  onUpdatePendingField,
  onSendText,
  flowStep = 'IDLE'
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editCash, setEditCash] = useState(pendingClosing?.cash_collections ?? 2500);
  const [editExpense, setEditExpense] = useState(pendingClosing?.expenses ?? 500);
  const [editExpenseDesc, setEditExpenseDesc] = useState(pendingClosing?.expense_description || 'Electricity bill');
  const [editStock, setEditStock] = useState(pendingClosing?.stock_purchases ?? 600);
  const [editStockQty, setEditStockQty] = useState(pendingClosing?.stock_qty_purchased ?? 20);

  const [orbActivity, setOrbActivity] = useState(0.08);

  // Sync orb fluid movement with voice activity
  useEffect(() => {
    let animId;
    let startTime = Date.now();

    const updateActivity = () => {
      const t = (Date.now() - startTime) / 1000;
      if (voiceState === 'listening') {
        const syllable = Math.sin(t * 8) * 0.25;
        setOrbActivity(Math.max(0.2, 0.65 + syllable));
      } else if (voiceState === 'speaking') {
        const phrase = Math.max(0, Math.sin(t * 1.5));
        const syllable = Math.max(0, Math.sin(t * 9.0 + Math.sin(t * 2.5)));
        setOrbActivity(0.25 + phrase * (0.15 + syllable * 0.6));
      } else if (voiceState === 'thinking') {
        setOrbActivity(0.35 + Math.sin(t * 3) * 0.15);
      } else {
        setOrbActivity(0.06 + Math.sin(t * 1.2) * 0.04);
      }
      animId = requestAnimationFrame(updateActivity);
    };

    animId = requestAnimationFrame(updateActivity);
    return () => cancelAnimationFrame(animId);
  }, [voiceState]);

  // Vibrant Paytm pigments on white canvas: always active and alive
  const orbColors = voiceState === 'listening'
    ? ["#002E6E", "#00BAF2", "#E0F2FE"]
    : voiceState === 'thinking'
    ? ["#1E1B4B", "#6366F1", "#DDD6FE"]
    : voiceState === 'speaking'
    ? ["#005743", "#00BAF2", "#A7F3D0"]
    : ["#002E6E", "#00BAF2", "#BAE6FD"];

  useEffect(() => {
    if (pendingClosing) {
      setEditCash(pendingClosing.cash_collections ?? 2500);
      setEditExpense(pendingClosing.expenses ?? 500);
      setEditExpenseDesc(pendingClosing.expense_description || 'Electricity bill');
      setEditStock(pendingClosing.stock_purchases ?? 600);
      setEditStockQty(pendingClosing.stock_qty_purchased ?? 20);
    }
  }, [pendingClosing]);

  // Teardown cleanly on component unmount or when modal is closed
  useEffect(() => {
    if (!isOpen) {
      stopActiveAudio?.();
      stopRecording?.(true);
    }
    return () => {
      stopActiveAudio?.();
      stopRecording?.(true);
    };
  }, [isOpen]);

  const handleUserClose = () => {
    stopActiveAudio?.();
    stopRecording?.(true);
    if (onClose) {
      onClose();
    } else if (onMinimize) {
      onMinimize();
    }
  };

  if (!isOpen) return null;

  const handleApplyEdits = () => {
    if (onUpdatePendingField) {
      onUpdatePendingField({
        cash_collections: parseFloat(editCash) || 0,
        expenses: parseFloat(editExpense) || 0,
        expense_description: editExpenseDesc,
        stock_purchases: parseFloat(editStock) || 0,
        stock_qty_purchased: parseInt(editStockQty) || 0
      });
    }
    setIsEditing(false);
  };

  // Financial calculations
  const qrAmt = pendingClosing?.qr_collections ?? 1000;
  const cashAmt = isEditing ? (parseFloat(editCash) || 0) : (pendingClosing?.cash_collections ?? 2500);
  const totalSales = qrAmt + cashAmt;
  const expAmt = isEditing ? (parseFloat(editExpense) || 0) : (pendingClosing?.expenses ?? 500);
  const stockAmt = isEditing ? (parseFloat(editStock) || 0) : (pendingClosing?.stock_purchases ?? 600);
  const salesAfterExpenses = totalSales - expAmt;

  // Toggle voice/mic or submit spoken answer in zero-permission prototype mode
  const handleToggleVoiceMic = () => {
    if (isPlayingAudio) {
      stopActiveAudio?.();
      return;
    }

    if (isRealMicActive) {
      // Hardware mic is active: tap mic to finish recording and transcribe
      stopRecording?.();
      return;
    }

    // Zero-permission / prototype mode: tapping the mic acts as speaking the natural response!
    if (flowStep === 'AWAITING_CASH') {
      const cashText = currentLang === 'te-IN'
        ? 'నేను ఈరోజు 2500 రూపాయలు నగదు కలెక్ట్ చేశాను'
        : currentLang === 'hi-IN'
        ? 'मैंने आज 2500 रुपये कैश कलेक्ट किया'
        : 'I collected 2500 rupees cash today';
      onSendText?.(cashText);
    } else if (flowStep === 'AWAITING_EXPENSE') {
      const expText = currentLang === 'te-IN'
        ? 'కరెంట్ బిల్లు కోసం 500 రూపాయలు ఖర్చు చేశాను'
        : currentLang === 'hi-IN'
        ? 'बिजली बिल के लिए 500 रुपये खर्च हुए'
        : '500 rupees for electricity bill';
      onSendText?.(expText);
    } else if (flowStep === 'AWAITING_STOCK') {
      const stockText = currentLang === 'te-IN'
        ? '600 రూపాయలతో 20 పాల ప్యాకెట్లు కొనుగోలు చేశాను'
        : currentLang === 'hi-IN'
        ? '600 रुपये में 20 दूध के पैकेट खरीदे'
        : 'Purchased 20 milk packets for 600 rupees';
      onSendText?.(stockText);
    } else if (flowStep === 'AWAITING_CONFIRMATION' || summaryReady) {
      onConfirmSummary?.();
    } else {
      // In general mode, toggle recording
      if (isRecording) {
        stopRecording?.();
      } else {
        startRecording?.();
      }
    }
  };

  // Multilingual contextual quick chips based on current closing step
  const getContextualChips = () => {
    if (summaryReady) return [];
    
    if (flowStep === 'AWAITING_CASH') {
      if (currentLang === 'te-IN') {
        return [
          { label: '₹2,500 నగదు', text: 'నేను ఈరోజు 2500 రూపాయలు నగదు కలెక్ట్ చేశాను' },
          { label: '₹2,000 నగదు', text: 'ఈరోజు నగదు కలెక్షన్లు 2000 రూపాయలు' },
          { label: 'నగదు లేదు (₹0)', text: 'ఈరోజు నగదు కలెక్షన్లు లేవు, సున్నా' }
        ];
      }
      if (currentLang === 'hi-IN') {
        return [
          { label: '₹2,500 कैश', text: 'मैंने आज 2500 रुपये कैश कलेक्ट किया' },
          { label: '₹2,000 कैश', text: 'आज का कैश कलेक्शन 2000 रुपये है' },
          { label: 'जीरो कैश (₹0)', text: 'आज कोई कैश कलेक्शन नहीं हुआ, जीरो' }
        ];
      }
      return [
        { label: '₹2,500 Cash', text: 'I collected 2500 rupees cash today' },
        { label: '₹2,000 Cash', text: 'Cash collections are 2000 rupees' },
        { label: 'Zero Cash', text: 'No cash collections today, zero cash' }
      ];
    }
    if (flowStep === 'AWAITING_EXPENSE') {
      if (currentLang === 'te-IN') {
        return [
          { label: '₹500 కరెంట్ బిల్లు', text: 'కరెంట్ బిల్లు కోసం 500 రూపాయలు ఖర్చు చేశాను' },
          { label: '₹300 రవాణా', text: 'రవాణా ఖర్చులకు 300 రూపాయలు' },
          { label: 'ఖర్చులు లేవు', text: 'ఈరోజు ఎలాంటి ఖర్చులు లేవు, సున్నా' }
        ];
      }
      if (currentLang === 'hi-IN') {
        return [
          { label: '₹500 बिजली बिल', text: 'बिजली बिल के लिए 500 रुपये खर्च हुए' },
          { label: '₹300 किराया/खर्च', text: 'किराया और ट्रांसपोर्ट के 300 रुपये' },
          { label: 'कोई खर्च नहीं', text: 'आज कोई खर्च नहीं हुआ, जीरो' }
        ];
      }
      return [
        { label: '₹500 Electricity', text: '500 rupees for electricity bill' },
        { label: '₹300 Transport', text: '300 rupees for transport expenses' },
        { label: 'No Expenses', text: 'No expenses today, zero' }
      ];
    }
    if (flowStep === 'AWAITING_STOCK') {
      if (currentLang === 'te-IN') {
        return [
          { label: '20 పాల ప్యాకెట్లు ₹600', text: '600 రూపాయలతో 20 పాల ప్యాకెట్లు కొనుగోలు చేశాను' },
          { label: '₹500 సరుకులు', text: '500 రూపాయల సరుకులు కొన్నాను' },
          { label: 'స్టాక్ కొనలేదు', text: 'ఈరోజు స్టాక్ ఏమీ కొనలేదు' }
        ];
      }
      if (currentLang === 'hi-IN') {
        return [
          { label: '20 दूध पैकेट ₹600', text: '600 रुपये में 20 दूध के पैकेट खरीदे' },
          { label: '₹500 सामान', text: '500 रुपये का दुकान का सामान खरीदा' },
          { label: 'कोई स्टॉक नहीं', text: 'आज कोई स्टॉक नहीं खरीदा' }
        ];
      }
      return [
        { label: '20 Milk Packets ₹600', text: 'Purchased 20 milk packets for 600 rupees' },
        { label: '₹500 Store Goods', text: 'Purchased store goods for 500 rupees' },
        { label: 'No Stock Today', text: 'No stock purchases today' }
      ];
    }
    // Default Q&A chips
    if (currentLang === 'te-IN') {
      return [
        { label: "ఈరోజు కలెక్షన్స్?", text: "ఈరోజు నా మొత్తం కలెక్షన్స్ ఎంత?" },
        { label: "పాల స్టాక్?", text: "పాల స్టాక్ ఎంత మిగిలి ఉంది?" },
        { label: "ఈరోజు ఖర్చులు?", text: "ఈరోజు రికార్డ్ అయిన ఖర్చులు ఎంత?" }
      ];
    }
    if (currentLang === 'hi-IN') {
      return [
        { label: "आज का कलेक्शन?", text: "आज मेरा कुल कलेक्शन कितना है?" },
        { label: "दूध का स्टॉक?", text: "दूध का कितना स्टॉक बचा है?" },
        { label: "आज का खर्च?", text: "आज के रिकॉर्ड किए गए खर्च कितने हैं?" }
      ];
    }
    return [
      { label: "Today's Collections?", text: "What are my total collections today?" },
      { label: "Milk Stock?", text: "How much milk stock is remaining?" },
      { label: "Today's Expenses?", text: "What are my recorded expenses today?" }
    ];
  };

  const chips = getContextualChips();

  return (
    <div className="fixed inset-0 z-50 bg-white text-slate-800 flex flex-col justify-between overflow-hidden select-none animate-fadeIn">
      
      {/* SENIOR PAYTM TOP BAR: CLEAN MINIMIZE + LANGUAGE TOGGLE + CLOSE */}
      <div className="relative z-10 px-5 pt-3.5 pb-2 flex items-center justify-between">
        <button
          onClick={() => {
            stopActiveAudio?.();
            onMinimize?.();
          }}
          className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Minimise to chat"
        >
          <ChevronDown className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Paytm Saathi Title & Language Pill Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-full border border-slate-200/80">
            {[
              { id: 'en-IN', label: 'English' },
              { id: 'te-IN', label: 'తెలుగు' },
              { id: 'hi-IN', label: 'हिन्दी' }
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => setLanguage?.(lang.id)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all ${
                  currentLang === lang.id
                    ? 'bg-[#002970] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleUserClose}
          className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Close voice mode"
        >
          <X className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>

      {/* MAIN CENTER STAGE */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-2 overflow-y-auto">
        
        {/* SUMMARY READY REVIEW CARD (When daily closing conversation is complete) */}
        {summaryReady ? (
          <div className="w-full max-w-sm bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xl space-y-3.5 my-auto animate-scaleUp">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-xs text-[#002970] uppercase tracking-wide">
                    Daily Business Summary
                  </h3>
                  <p className="text-[10px] text-slate-400">Review and Confirm</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-[11px] text-[#002970] hover:underline flex items-center gap-1 font-bold bg-blue-50 px-2 py-1 rounded-lg"
              >
                <Edit3 className="w-3 h-3 text-[#00baf2]" />
                <span>{isEditing ? 'Done' : 'Edit'}</span>
              </button>
            </div>

            {/* Financial Grid */}
            <div className="space-y-2 text-xs">
              
              {/* QR and Cash Split */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-[#ebf8fe] rounded-2xl border border-sky-100">
                  <span className="text-[#0082c8] font-bold block text-[10px] flex items-center gap-1">
                    <QrCode className="w-3 h-3" /> Paytm QR Sales
                  </span>
                  <span className="text-sm font-extrabold text-[#002970] tabular-nums mt-0.5 block">
                    ₹{qrAmt.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9px] text-[#0082c8]/80 block mt-0.5 font-medium">Reconciled from DB</span>
                </div>

                <div className="p-2.5 bg-[#e8f8f0] rounded-2xl border border-emerald-100">
                  <span className="text-[#007e33] font-bold block text-[10px] flex items-center gap-1">
                    <Banknote className="w-3 h-3" /> Cash Sales
                  </span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editCash}
                      onChange={(e) => setEditCash(e.target.value)}
                      className="w-full mt-0.5 px-2 py-0.5 bg-white border border-emerald-300 rounded text-xs font-bold text-slate-900"
                    />
                  ) : (
                    <span className="text-sm font-extrabold text-[#007e33] tabular-nums mt-0.5 block">
                      ₹{cashAmt.toLocaleString('en-IN')}
                    </span>
                  )}
                  <span className="text-[9px] text-emerald-600/80 block mt-0.5 font-medium">Voice Recorded</span>
                </div>
              </div>

              {/* Total Sales Banner */}
              <div className="p-3 bg-[#002970] text-white rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-blue-200 block text-[10px] font-semibold uppercase tracking-wider">
                    Total Daily Sales
                  </span>
                  <span className="text-lg font-black text-white tabular-nums">
                    ₹{totalSales.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[10px] font-bold text-white">
                  QR + Cash
                </span>
              </div>

              {/* Expenses & Stock Purchases */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-[#fef3c7] rounded-2xl border border-amber-200/80">
                  <span className="text-[#b45309] font-bold block text-[10px] flex items-center gap-1">
                    <ArrowDownRight className="w-3 h-3" /> Expenses
                  </span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editExpense}
                      onChange={(e) => setEditExpense(e.target.value)}
                      className="w-full mt-0.5 px-2 py-0.5 bg-white border border-amber-300 rounded text-xs font-bold text-slate-900"
                    />
                  ) : (
                    <span className="text-sm font-extrabold text-[#b45309] tabular-nums mt-0.5 block">
                      ₹{expAmt.toLocaleString('en-IN')}
                    </span>
                  )}
                  <span className="text-[9px] text-[#b45309]/80 block mt-0.5 truncate font-medium">
                    {editExpenseDesc}
                  </span>
                </div>

                <div className="p-2.5 bg-purple-50 rounded-2xl border border-purple-100">
                  <span className="text-purple-700 font-bold block text-[10px] flex items-center gap-1">
                    <Package className="w-3 h-3" /> Stock Purchases
                  </span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      className="w-full mt-0.5 px-2 py-0.5 bg-white border border-purple-300 rounded text-xs font-bold text-slate-900"
                    />
                  ) : (
                    <span className="text-sm font-extrabold text-purple-700 tabular-nums mt-0.5 block">
                      ₹{stockAmt.toLocaleString('en-IN')}
                    </span>
                  )}
                  <span className="text-[9px] text-purple-600/80 block mt-0.5 font-medium truncate">
                    {editStockQty} Milk Packets
                  </span>
                </div>
              </div>

              {/* Sales after recorded expenses (Transparent calculation) */}
              <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-600 block text-[10px] font-bold">
                    Sales after recorded expenses
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    *Before product cost (COGS)
                  </span>
                </div>
                <span className="text-base font-black text-[#002970] tabular-nums">
                  ₹{salesAfterExpenses.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {isEditing && (
              <button
                onClick={handleApplyEdits}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all"
              >
                Apply Changes
              </button>
            )}

            {/* Actions: Confirm & Save vs Cancel */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onConfirmSummary?.({
                  qr_collections: qrAmt,
                  cash_collections: cashAmt,
                  expenses: expAmt,
                  expense_description: editExpenseDesc,
                  stock_purchases: stockAmt,
                  stock_qty_purchased: editStockQty,
                  stock_item: pendingClosing?.stock_item || 'Milk Packets'
                })}
                className="flex-1 py-3 bg-[#002970] hover:bg-[#001e50] text-white rounded-2xl text-xs font-extrabold shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-[#00baf2]" />
                <span>Confirm & Save</span>
              </button>

              <button
                onClick={onCancelSummary}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD CLEAN CHATGPT-STYLE VOICE CANVAS */
          <div className="flex flex-col items-center justify-center my-auto max-w-sm text-center space-y-5">
            
            {/* ANIMATED LIQUID VOICE ORB (Centered on pure white canvas) */}
            <div className="relative flex items-center justify-center">
              <VoiceOrb
                activity={orbActivity}
                colors={orbColors}
                speed={voiceState === 'speaking' ? 1.4 : voiceState === 'thinking' ? 1.6 : voiceState === 'listening' ? 1.0 : 0.5}
                className="w-60 h-60 sm:w-68 sm:h-68"
                aria-label="Paytm Saathi Voice Orb"
              />
            </div>

            {/* Live speech captions & assistant text */}
            <div className="min-h-14 flex flex-col items-center justify-center px-4 max-w-xs space-y-2">
              {voiceState === 'speaking' && lastAssistantReply ? (
                <p className="text-sm font-semibold text-slate-800 leading-snug animate-fadeIn">
                  "{lastAssistantReply}"
                </p>
              ) : voiceState === 'listening' ? (
                lastUserTranscript ? (
                  <div className="px-3.5 py-1.5 bg-blue-50 text-[#002970] border border-blue-100 rounded-full text-xs font-bold max-w-xs truncate animate-fadeIn">
                    "{lastUserTranscript}"
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 animate-fadeIn">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#002970]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00baf2] animate-ping" />
                      <span>
                        {currentLang === 'te-IN'
                          ? 'వినబడుతోంది… మాట్లాడండి లేదా ఎంచుకోండి'
                          : currentLang === 'hi-IN'
                          ? 'सुन रहा हूँ… बोलिए या विकल्प चुनें'
                          : 'Listening… Speak or tap answer'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {currentLang === 'te-IN'
                        ? 'మైక్ నొక్కండి లేదా కింద ఉన్న బటన్ తాకండి'
                        : currentLang === 'hi-IN'
                        ? 'माइक दबाएं या नीचे दिए बटन पर टैप करें'
                        : 'Tap mic or select an answer below'}
                    </span>
                  </div>
                )
              ) : voiceState === 'thinking' ? (
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>Processing with Sarvam AI…</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#002970]">
                  <span className="w-2 h-2 rounded-full bg-[#00baf2]" />
                  <span>Ready • Tap mic to speak</span>
                </div>
              )}
            </div>

            {/* In-view Contextual Quick Voice Chips right below orb */}
            {!summaryReady && chips.length > 0 && voiceState !== 'speaking' && voiceState !== 'thinking' && (
              <div className="flex items-center justify-center gap-2 flex-wrap pt-1 max-w-xs animate-fadeIn">
                {chips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendText?.(chip.text)}
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-[#002970] text-[#002970] hover:text-white border border-blue-200/90 rounded-full text-xs font-bold active:scale-95 transition-all shadow-2xs cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

          </div>
        )}

      </div>

      {/* MINIMAL BOTTOM BAR: CLOSE + ACTIVE PAYTM MIC + AUDIO INTERRUPT */}
      <div className="relative z-10 px-8 pb-7 pt-2 bg-transparent flex items-center justify-center gap-6">
        
        {/* Close Button */}
        <button
          onClick={handleUserClose}
          className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
          title="Close voice mode"
        >
          <X className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Central Active Paytm Voice Mic Button (Never turns off, always responsive) */}
        <button
          onClick={handleToggleVoiceMic}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer relative bg-[#002970] hover:bg-[#001e50] text-white ring-4 ring-blue-100"
          title="Tap to speak or submit answer"
        >
          <span className="absolute inset-0 rounded-full border-2 border-[#00baf2] opacity-60 animate-ping pointer-events-none" />
          <Mic className="w-7 h-7 text-[#00baf2] stroke-[2.2]" />
        </button>

        {/* Stop Assistant Audio Playback Button (if speaking) */}
        {isPlayingAudio ? (
          <button
            onClick={stopActiveAudio}
            className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Silence assistant speech"
          >
            <Square className="w-4 h-4 fill-slate-700 stroke-none" />
          </button>
        ) : (
          <div className="w-12 h-12" />
        )}

      </div>
    </div>
  );
}
