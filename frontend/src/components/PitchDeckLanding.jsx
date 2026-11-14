import React, { useState } from 'react';
import { 
  Presentation, 
  Mic, 
  QrCode, 
  Banknote, 
  ArrowRight, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  Cpu, 
  Database, 
  Radio, 
  Layers, 
  Store, 
  Calendar,
  Smartphone,
  BarChart3,
  SlidersHorizontal
} from 'lucide-react';

export default function PitchDeckLanding({ 
  onNavigateTab, 
  onTriggerVoice 
}) {
  const [viewMode, setViewMode] = useState('slides'); // Default to executive presentation desk
  const [activeSlide, setActiveSlide] = useState(0);

  // Live interactive calculation values
  const [demoCash, setDemoCash] = useState(2500);
  const [demoExpense, setDemoExpense] = useState(500);
  const qrDemo = 1000;
  const totalSalesDemo = qrDemo + demoCash;
  const balanceDemo = totalSalesDemo - demoExpense;

  const slides = [
    {
      id: '01',
      tabLabel: '01 Summary',
      tag: '[ 01 // EXECUTIVE PROPOSITION ]',
      title: 'Bridging the physical and digital divide in kirana retail',
      subtitle: 'Why 30 million soundbox merchants still close their stores in the dark',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#002970]">
              <span className="font-mono text-xs text-[#002970] font-bold uppercase tracking-wider block mb-2">
                01 / Status quo
              </span>
              <h4 className="font-heading font-bold text-base text-[#002970]">
                Soundbox handles UPI
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-sans">
                Paytm Soundbox established real-time audio confirmation across 30 million counters, transforming digital payment verification.
              </p>
            </div>

            <div className="p-6 bg-[#002970] text-white border-2 border-slate-900 shadow-[3px_3px_0px_#00BAF2]">
              <span className="font-mono text-xs text-[#00BAF2] font-bold uppercase tracking-wider block mb-2">
                02 / The blind spot
              </span>
              <h4 className="font-heading font-bold text-base text-white">
                Cash and expenses stay invisible
              </h4>
              <p className="text-xs text-blue-100 mt-2 leading-relaxed font-sans">
                Over 60% of grocery transactions occur in physical cash. Daily store expenses remain scattered across paper slips and memory.
              </p>
            </div>

            <div className="p-6 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#002970]">
              <span className="font-mono text-xs text-[#002970] font-bold uppercase tracking-wider block mb-2">
                03 / The solution
              </span>
              <h4 className="font-heading font-bold text-base text-[#002970]">
                Paytm Saathi voice AI
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-sans">
                A 30-second evening voice routine in Telugu, Hindi, or English. Reconciles Soundbox QR data, captures cash sales, and outputs verified records.
              </p>
            </div>
          </div>

          <div className="p-5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#002970] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-heading font-bold text-sm text-[#002970]">
                Zero added hardware cost · Zero manual forms · Instant Indic speech
              </p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Runs on Sarvam Saaras speech recognition and Bulbul neural text-to-speech.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab?.('mobile')}
              className="px-5 py-2.5 bg-[#00BAF2] hover:bg-[#00a6d9] text-slate-950 font-heading font-bold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_#002970] active:translate-x-0.5 active:translate-y-0.5 transition-transform flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>Launch mobile prototype</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )
    },
    {
      id: '02',
      tabLabel: '02 Kirana reality',
      tag: '[ 02 // PROBLEM STATEMENT ]',
      title: 'Why standard accounting software fails at the counter',
      subtitle: 'The 10:00 PM closing friction and the fintech underwriting data gap',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#002970] space-y-2">
              <span className="font-mono text-xs font-bold text-red-800 uppercase tracking-wider block">
                Friction / Evening exhaustion
              </span>
              <h4 className="font-heading font-bold text-sm text-[#002970]">
                Shopkeepers will not fill 20 form fields at closing time
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                After a 14-hour workday, keyboard entry and nested catalog software are discarded. Merchants abandon complex apps within days and return to paper diaries.
              </p>
            </div>

            <div className="p-5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#002970] space-y-2">
              <span className="font-mono text-xs font-bold text-amber-800 uppercase tracking-wider block">
                Underwriting / Data deficit
              </span>
              <h4 className="font-heading font-bold text-sm text-[#002970]">
                Financial institutions only see digital payments
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                A store generating ₹1,000 on Soundbox and ₹2,500 in physical cash appears under-banked. Lacking verified ledger history, merchants cannot qualify for fair credit lines.
              </p>
            </div>
          </div>

          <div className="p-6 bg-[#002970] text-white border-2 border-slate-900 shadow-[3px_3px_0px_#00BAF2] flex flex-col justify-between">
            <div className="space-y-4">
              <span className="font-mono text-xs text-[#00BAF2] uppercase tracking-wider font-bold block">
                The Saathi approach
              </span>
              <h3 className="font-heading font-black text-xl text-white leading-snug">
                Replace manual data entry with a 30-second voice conversation
              </h3>
              <p className="text-xs text-blue-100 leading-relaxed font-sans">
                Instead of demanding data entry, Saathi speaks as an evening business assistant. It pre-populates existing QR numbers and asks only for unrecorded physical cash and expenses.
              </p>
              <div className="pt-3 border-t border-blue-800/80 space-y-2 font-mono text-xs text-blue-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00BAF2] shrink-0" />
                  <span>Automatic Soundbox collection retrieval</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00BAF2] shrink-0" />
                  <span>Conversational Telugu, Hindi, and Indian English</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00BAF2] shrink-0" />
                  <span>Explicit review state before saving</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-blue-800/80 flex items-center justify-between font-mono text-[11px] text-blue-300">
              <span>TARGET: 34 MILLION COUNTERS</span>
              <span className="text-[#00BAF2] font-bold">ZERO TYPING REQUIRED</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: '03',
      tabLabel: '03 Two-step engine',
      tag: '[ 03 // CONVERSATION ARCHITECTURE ]',
      title: 'Streamlined two-step closing conversation',
      subtitle: 'Zero cognitive load: Tap mic → State cash → State expenses → Confirmed',
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#002970] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 bg-[#002970] text-white font-mono font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <span className="font-mono text-[10px] text-blue-900 bg-blue-50 px-2 py-0.5 border border-blue-200 font-bold uppercase">
                    Auto-fetch
                  </span>
                </div>
                <h4 className="font-heading font-bold text-xs text-[#002970] uppercase">
                  Reconcile QR & ask cash
                </h4>
                <p className="text-xs text-slate-700 mt-2 font-mono bg-slate-50 p-2.5 border border-slate-200">
                  "Hi! Today's Paytm QR collection is ₹1,000. How much cash did you collect today?"
                </p>
              </div>
              <span className="font-mono text-[10px] text-slate-400 mt-2 block">
                User responds: "2,500 rupees"
              </span>
            </div>

            <div className="p-4 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#002970] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 bg-[#002970] text-white font-mono font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <span className="font-mono text-[10px] text-sky-900 bg-sky-50 px-2 py-0.5 border border-sky-200 font-bold uppercase">
                    Capture
                  </span>
                </div>
                <h4 className="font-heading font-bold text-xs text-[#002970] uppercase">
                  Confirm cash & ask expenses
                </h4>
                <p className="text-xs text-slate-700 mt-2 font-mono bg-slate-50 p-2.5 border border-slate-200">
                  "Got it, recorded ₹2,500 cash collections. Did you have any expenses today?"
                </p>
              </div>
              <span className="font-mono text-[10px] text-slate-400 mt-2 block">
                User responds: "500 electricity"
              </span>
            </div>

            <div className="p-4 bg-[#f0fdf4] border-2 border-emerald-800 shadow-[3px_3px_0px_#047857] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 bg-emerald-800 text-white font-mono font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <span className="font-mono text-[10px] text-emerald-900 bg-white px-2 py-0.5 border border-emerald-300 font-bold uppercase">
                    Summary
                  </span>
                </div>
                <h4 className="font-heading font-bold text-xs text-emerald-900 uppercase">
                  Verified summary card
                </h4>
                <p className="text-xs text-emerald-950 mt-2 font-mono bg-white p-2.5 border border-emerald-200">
                  Total sales: ₹3,500.<br />
                  Expenses: ₹500.<br />
                  Result before COGS: ₹3,000.
                </p>
              </div>
              <span className="font-mono text-[10px] text-emerald-800 font-bold mt-2 block">
                Action: Single-click Confirm & Save
              </span>
            </div>
          </div>

          {/* Embedded Interactive Financial Simulator */}
          <div className="p-4 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#002970]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <span className="font-heading font-bold text-xs text-[#002970] uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#00BAF2]" />
                Live financial simulator
              </span>
              <span className="font-mono text-[10px] text-slate-500">Edit values to test calculations</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 text-center">
              <div className="p-2.5 bg-slate-50 border border-slate-200">
                <span className="font-mono text-[9px] text-slate-600 uppercase block">QR Soundbox</span>
                <span className="font-heading font-bold text-base text-[#002970]">₹{qrDemo}</span>
                <span className="font-mono text-[8.5px] text-slate-400 block">From database</span>
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200">
                <span className="font-mono text-[9px] text-emerald-800 uppercase block font-bold">Cash sales</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className="font-heading font-bold text-sm text-emerald-800">₹</span>
                  <input
                    type="number"
                    value={demoCash}
                    onChange={(e) => setDemoCash(Number(e.target.value) || 0)}
                    className="w-16 text-center font-heading font-bold text-sm text-emerald-800 bg-white border border-emerald-300 px-1 py-0.5"
                  />
                </div>
                <span className="font-mono text-[8.5px] text-emerald-600 block">Spoken by user</span>
              </div>

              <div className="p-2.5 bg-[#002970] text-white border border-slate-900">
                <span className="font-mono text-[9px] text-blue-200 uppercase block font-bold">Total sales</span>
                <span className="font-heading font-bold text-base text-white">₹{totalSalesDemo.toLocaleString('en-IN')}</span>
                <span className="font-mono text-[8.5px] text-cyan-300 block">QR + Cash</span>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200">
                <span className="font-mono text-[9px] text-amber-900 uppercase block font-bold">Expenses</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className="font-heading font-bold text-sm text-amber-900">₹</span>
                  <input
                    type="number"
                    value={demoExpense}
                    onChange={(e) => setDemoExpense(Number(e.target.value) || 0)}
                    className="w-14 text-center font-heading font-bold text-sm text-amber-900 bg-white border border-amber-300 px-1 py-0.5"
                  />
                </div>
                <span className="font-mono text-[8.5px] text-amber-700 block">Recorded today</span>
              </div>

              <div className="p-2.5 bg-emerald-100/90 border border-emerald-600 col-span-2 md:col-span-1">
                <span className="font-mono text-[9px] text-emerald-950 uppercase block font-bold">Result before COGS</span>
                <span className="font-heading font-bold text-base text-emerald-950">₹{balanceDemo.toLocaleString('en-IN')}</span>
                <span className="font-mono text-[8.5px] text-emerald-800 block">Sales − Expenses</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: '04',
      tabLabel: '04 Records audit',
      tag: '[ 04 // VERIFIABLE LEDGER ]',
      title: 'Day-wise business records and audit trail',
      subtitle: 'Replacing messy transaction logs with structured daily business reports',
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#002970] space-y-3">
              <span className="font-mono text-xs text-[#002970] font-bold uppercase tracking-wider block">
                Chronological day cards
              </span>
              <h4 className="font-heading font-bold text-sm text-[#002970]">
                Every business day at a single glance
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Rather than forcing merchants through endless micro-transaction lines, records are grouped into structured day cards with verified metrics:
              </p>
              <div className="space-y-1.5 font-mono text-xs text-slate-700 pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#002970]"></span>
                  <span>Four-metric split: QR sales, cash sales, total sales, expenses</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#002970]"></span>
                  <span>Day-over-day growth rate: e.g. +25% compared with yesterday</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#002970]"></span>
                  <span>Status verification: Marked closed after confirmation</span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#002970] space-y-3">
              <span className="font-mono text-xs text-[#002970] font-bold uppercase tracking-wider block">
                Detailed day report
              </span>
              <h4 className="font-heading font-bold text-sm text-[#002970]">
                Dedicated report drilldown on date selection
              </h4>
              <div className="p-3 bg-[#002970] text-white border border-slate-900 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-blue-200">14 Nov 2026</span>
                  <span className="bg-[#00BAF2] text-slate-950 font-bold px-2 py-0.5 text-[10px]">TOTAL: ₹3,500</span>
                </div>
                <div className="w-full h-2.5 bg-slate-900 flex overflow-hidden border border-white/20">
                  <div className="bg-[#00BAF2] h-full" style={{ width: '29%' }} title="QR 29%"></div>
                  <div className="bg-emerald-500 h-full" style={{ width: '71%' }} title="Cash 71%"></div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-blue-200">
                  <span>QR: ₹1,000 (29%)</span>
                  <span>Cash: ₹2,500 (71%)</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Includes full expenses breakdown (e.g. ₹500 Electricity bill) and transaction receipts linked to SQLite.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => onNavigateTab?.('records')}
              className="px-5 py-2.5 bg-[#002970] hover:bg-[#001c4d] text-white font-heading font-bold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_#00BAF2] active:translate-x-0.5 active:translate-y-0.5 transition-transform flex items-center gap-2 cursor-pointer"
            >
              <span>Inspect day-wise records</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#00BAF2]" />
            </button>
          </div>
        </div>
      )
    },
    {
      id: '05',
      tabLabel: '05 Tech & moat',
      tag: '[ 05 // SYSTEM MOAT ]',
      title: 'Underwriting advantage and merchant stickiness',
      subtitle: 'Why Paytm Saathi creates an enduring moat for merchant fintech',
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#002970] space-y-2">
              <span className="font-mono text-xs text-[#002970] font-bold uppercase block">Sarvam AI pipeline</span>
              <h4 className="font-heading font-bold text-sm text-[#002970]">Saaras STT & Bulbul TTS</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Optimized for Indic acoustic environments, bazaar ambient noise, and colloquial phrasing across Telugu, Hindi, and Indian English.
              </p>
            </div>

            <div className="p-5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#002970] space-y-2">
              <span className="font-mono text-xs text-[#002970] font-bold uppercase block">Credit scoring</span>
              <h4 className="font-heading font-bold text-sm text-[#002970]">Unlocking the lending TAM</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                By capturing reconciled cash receipts alongside Soundbox UPI, Paytm constructs the complete operating ledger required for accurate loan underwriting.
              </p>
            </div>

            <div className="p-5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#002970] space-y-2">
              <span className="font-mono text-xs text-[#002970] font-bold uppercase block">Retention moat</span>
              <h4 className="font-heading font-bold text-sm text-[#002970]">Zero soundbox churn</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Merchants managing their daily closing and cash records on Paytm Saathi have high switching costs against rival soundbox vendors.
              </p>
            </div>
          </div>

          <div className="p-5 bg-[#002970] text-white border-2 border-slate-900 shadow-[3px_3px_0px_#00BAF2]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <span className="font-heading font-black text-2xl md:text-3xl text-[#00BAF2]">34M+</span>
                <span className="font-mono text-xs text-blue-200 block mt-1 uppercase">Indian Kirana TAM</span>
              </div>
              <div>
                <span className="font-heading font-black text-2xl md:text-3xl text-emerald-400">30s</span>
                <span className="font-mono text-xs text-blue-200 block mt-1 uppercase">Daily closing routine</span>
              </div>
              <div>
                <span className="font-heading font-black text-2xl md:text-3xl text-white">3</span>
                <span className="font-mono text-xs text-blue-200 block mt-1 uppercase">Indic languages</span>
              </div>
              <div>
                <span className="font-heading font-black text-2xl md:text-3xl text-amber-300">100%</span>
                <span className="font-mono text-xs text-blue-200 block mt-1 uppercase">Atomic persistence</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900 font-sans pb-16">
      
      {/* Executive Pitch Control Bar */}
      <header className="sticky top-0 z-30 bg-white border-b-2 border-slate-900 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#002970] border-2 border-slate-900 flex items-center justify-center text-white font-mono font-bold text-xs shadow-[2px_2px_0px_#00BAF2]">
            PS
          </div>
          <div>
            <span className="font-heading font-black text-sm tracking-tight text-[#002970] block leading-none">
              PAYTM SAATHI
            </span>
            <span className="font-mono text-[9.5px] text-slate-500 uppercase tracking-wider block">
              Executive presentation and pitch desk
            </span>
          </div>
        </div>

        {/* View Switcher: Slide Deck vs Full Editorial */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-0.5 bg-slate-100 border border-slate-300">
            <button
              onClick={() => setViewMode('slides')}
              className={`px-3 py-1 text-xs font-mono font-bold uppercase transition-all ${
                viewMode === 'slides'
                  ? 'bg-[#002970] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Slide deck
            </button>
            <button
              onClick={() => setViewMode('landing')}
              className={`px-3 py-1 text-xs font-mono font-bold uppercase transition-all ${
                viewMode === 'landing'
                  ? 'bg-[#002970] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Long-scroll review
            </button>
          </div>

          <button
            onClick={() => onNavigateTab?.('mobile')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#00BAF2] hover:bg-[#009fd0] text-slate-950 font-heading font-bold text-xs uppercase border-2 border-slate-900 shadow-[2px_2px_0px_#002970] active:translate-x-0.5 active:translate-y-0.5 transition-transform"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Open mobile prototype</span>
          </button>
        </div>
      </header>

      {/* VIEW MODE 1: EXECUTIVE SLIDE DECK (THE DESK) */}
      {viewMode === 'slides' ? (
        <div className="max-w-5xl mx-auto px-4 pt-8">
          
          {/* Deck Controls & Direct Slide Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSlide(idx)}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase border-2 transition-all cursor-pointer ${
                    activeSlide === idx
                      ? 'bg-[#002970] text-[#00BAF2] border-slate-900 shadow-[2px_2px_0px_#00BAF2]'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-slate-800'
                  }`}
                >
                  {s.tabLabel}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={activeSlide === 0}
                onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
                className="p-1.5 bg-white border-2 border-slate-900 disabled:opacity-30 hover:bg-slate-100 shadow-[2px_2px_0px_#002970] active:translate-x-0.5 active:translate-y-0.5 transition-transform cursor-pointer"
                title="Previous slide"
              >
                <ChevronLeft className="w-4 h-4 text-[#002970]" />
              </button>
              <span className="font-mono text-xs font-bold text-slate-600 px-2">
                {activeSlide + 1} / {slides.length}
              </span>
              <button
                disabled={activeSlide === slides.length - 1}
                onClick={() => setActiveSlide(prev => Math.min(slides.length - 1, prev + 1))}
                className="p-1.5 bg-white border-2 border-slate-900 disabled:opacity-30 hover:bg-slate-100 shadow-[2px_2px_0px_#002970] active:translate-x-0.5 active:translate-y-0.5 transition-transform cursor-pointer"
                title="Next slide"
              >
                <ChevronRight className="w-4 h-4 text-[#002970]" />
              </button>
            </div>
          </div>

          {/* Active Slide Canvas */}
          <div className="bg-white border-2 border-slate-900 p-8 md:p-10 shadow-[4px_4px_0px_#002970] min-h-[520px] flex flex-col justify-between">
            <div>
              <div className="border-b-2 border-slate-900 pb-4 mb-6">
                <span className="font-mono text-xs font-bold text-[#002970] uppercase tracking-wider block mb-1">
                  {slides[activeSlide].tag}
                </span>
                <h2 className="font-heading font-black text-2xl md:text-3xl text-[#002970] leading-tight">
                  {slides[activeSlide].title}
                </h2>
                <p className="font-mono text-xs text-slate-500 mt-1">
                  {slides[activeSlide].subtitle}
                </p>
              </div>

              {slides[activeSlide].content}
            </div>

            {/* Slide Footer */}
            <div className="pt-5 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-400 mt-8">
              <span>Paytm Saathi · Hackathon Submission</span>
              <div className="flex gap-1.5">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-1.5 transition-all ${
                      activeSlide === idx ? 'bg-[#002970] w-8' : 'bg-slate-200 w-4'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: EDITORIAL LONG-SCROLL REVIEW */
        <div className="max-w-5xl mx-auto px-4 pt-10 space-y-12">
          
          {/* Hero Section */}
          <section className="bg-white border-2 border-slate-900 p-8 md:p-12 shadow-[4px_4px_0px_#002970]">
            <div className="max-w-3xl space-y-5">
              <span className="font-mono text-xs font-bold text-[#002970] bg-blue-50 border border-blue-200 px-3 py-1 inline-block uppercase tracking-wider">
                Soundbox + Indic Voice AI
              </span>

              <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-[#002970] leading-[1.05] tracking-tight">
                Your business. Your language. Your AI partner.
              </h1>

              <p className="text-sm md:text-base text-slate-700 leading-relaxed font-normal">
                Over 30 million Indian merchants collect UPI payments through Paytm Soundbox every day, yet close their stores estimating cash in drawer and unrecorded khata slips. <strong>Paytm Saathi bridges this gap</strong> through an evening voice conversation in Telugu, Hindi, or English.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onNavigateTab?.('mobile')}
                  className="px-5 py-3 bg-[#002970] hover:bg-[#001c4f] text-white font-heading font-bold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_#00BAF2] active:translate-x-0.5 active:translate-y-0.5 transition-transform flex items-center gap-2 cursor-pointer"
                >
                  <Mic className="w-4 h-4 text-[#00BAF2]" />
                  <span>Try voice closing in mobile</span>
                </button>

                <button
                  onClick={() => onNavigateTab?.('records')}
                  className="px-5 py-3 bg-white hover:bg-slate-50 text-[#002970] font-heading font-bold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_#002970] active:translate-x-0.5 active:translate-y-0.5 transition-transform flex items-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-[#002970]" />
                  <span>Inspect day-wise records</span>
                </button>
              </div>
            </div>

            {/* Stats Ribbon */}
            <div className="mt-8 pt-6 border-t-2 border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="font-heading font-black text-2xl text-[#002970]">₹0</span>
                <span className="font-mono text-xs text-slate-500 block mt-0.5">Added hardware cost</span>
              </div>
              <div>
                <span className="font-heading font-black text-2xl text-[#00BAF2]">30 sec</span>
                <span className="font-mono text-xs text-slate-500 block mt-0.5">Daily closing time</span>
              </div>
              <div>
                <span className="font-heading font-black text-2xl text-emerald-700">3</span>
                <span className="font-mono text-xs text-slate-500 block mt-0.5">Indic languages</span>
              </div>
              <div>
                <span className="font-heading font-black text-2xl text-[#002970]">100%</span>
                <span className="font-mono text-xs text-slate-500 block mt-0.5">Atomic persistence</span>
              </div>
            </div>
          </section>

          {/* Problem Overview */}
          <section className="space-y-4">
            <div className="border-b-2 border-slate-900 pb-2">
              <span className="font-mono text-xs font-bold text-[#002970] uppercase tracking-wider block">
                [ 01 // PROBLEM ANALYSIS ]
              </span>
              <h2 className="font-heading font-black text-2xl text-[#002970] mt-0.5">
                The unrecorded cash gap in grocery retail
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#002970] space-y-2">
                <span className="font-mono text-xs font-bold text-[#002970] block">01 / The QR disconnect</span>
                <h3 className="font-heading font-bold text-sm text-[#002970]">
                  Digital data without cash visibility
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Soundbox reports UPI accurately, but has zero visibility into the physical drawer where 60%+ of grocery volume resides.
                </p>
              </div>

              <div className="p-5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#002970] space-y-2">
                <span className="font-mono text-xs font-bold text-[#002970] block">02 / Unrecorded payouts</span>
                <h3 className="font-heading font-bold text-sm text-[#002970]">
                  Daily operational expense leaks
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Store costs such as milk transport, utility bills, and packaging are paid in cash and never reconciled against sales.
                </p>
              </div>

              <div className="p-5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#002970] space-y-2">
                <span className="font-mono text-xs font-bold text-[#002970] block">03 / Software resistance</span>
                <h3 className="font-heading font-bold text-sm text-[#002970]">
                  Form fatigue and app abandonment
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Kirana operators reject multi-step inventory tables. They want voice-first interaction in their native regional language.
                </p>
              </div>
            </div>
          </section>

          {/* Two-Step Solution Flow */}
          <section className="bg-white border-2 border-slate-900 p-6 md:p-8 shadow-[4px_4px_0px_#002970] space-y-6">
            <div className="border-b-2 border-slate-900 pb-2">
              <span className="font-mono text-xs font-bold text-[#002970] uppercase tracking-wider block">
                [ 02 // CONVERSATION FLOW ]
              </span>
              <h2 className="font-heading font-black text-2xl text-[#002970] mt-0.5">
                Two questions to close the business day
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-300 space-y-2">
                <span className="font-mono text-[11px] font-bold text-[#002970] block">STEP 1 · AUTO-GREETING</span>
                <h4 className="font-heading font-bold text-xs text-[#002970]">Soundbox auto-reconciliation</h4>
                <div className="p-2.5 bg-white border border-slate-200 text-xs text-slate-700 font-mono">
                  "Hi! Today's Paytm QR collection is ₹1,000. How much cash did you collect today?"
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-300 space-y-2">
                <span className="font-mono text-[11px] font-bold text-[#002970] block">STEP 2 · SPOKEN CASH</span>
                <h4 className="font-heading font-bold text-xs text-[#002970]">Cash capture & expense inquiry</h4>
                <div className="p-2.5 bg-white border border-slate-200 text-xs text-slate-700 font-mono">
                  "Got it, recorded ₹2,500 cash collections. Did you have any expenses today?"
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-300 space-y-2">
                <span className="font-mono text-[11px] font-bold text-emerald-900 block">STEP 3 · SUMMARY</span>
                <h4 className="font-heading font-bold text-xs text-emerald-900">Instant calculated summary</h4>
                <div className="p-2.5 bg-white border border-emerald-200 text-xs text-slate-800 font-mono">
                  QR: ₹1,000 + Cash: ₹2,500 = ₹3,500.<br />
                  Expenses: ₹500.<br />
                  Result before COGS: ₹3,000.
                </div>
              </div>
            </div>
          </section>

          {/* Technical Architecture */}
          <section className="space-y-4">
            <div className="border-b-2 border-slate-900 pb-2">
              <span className="font-mono text-xs font-bold text-[#002970] uppercase tracking-wider block">
                [ 03 // TECHNICAL ARCHITECTURE ]
              </span>
              <h2 className="font-heading font-black text-2xl text-[#002970] mt-0.5">
                Sarvam AI speech integration
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#002970] space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#00BAF2]" />
                  <h3 className="font-heading font-bold text-sm text-[#002970]">
                    Sarvam Saaras (Speech-to-Text)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Custom-tuned for Indic accents, bazaar background noise, and code-mixed number phrases across Telugu, Hindi, and English.
                </p>
                <div className="p-2.5 bg-slate-50 border border-slate-200 font-mono text-[10.5px] text-slate-600">
                  Endpoint: /api/voice/stt · Format: audio/webm (Opus)
                </div>
              </div>

              <div className="p-5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#002970] space-y-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-700" />
                  <h3 className="font-heading font-bold text-sm text-[#002970]">
                    Sarvam Bulbul (Voice Synthesis)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Natural Indic speech synthesis with human cadence. Supports immediate hardware-level stop on interrupt.
                </p>
                <div className="p-2.5 bg-slate-50 border border-slate-200 font-mono text-[10.5px] text-slate-600">
                  Endpoint: /api/voice/tts · 24kHz audio stream
                </div>
              </div>
            </div>
          </section>

          {/* Action Callout */}
          <section className="bg-[#002970] text-white border-2 border-slate-900 p-8 shadow-[4px_4px_0px_#00BAF2] text-center space-y-4">
            <span className="font-mono text-xs text-[#00BAF2] uppercase tracking-widest block font-bold">
              Prototype Verification
            </span>
            <h2 className="font-heading font-black text-2xl md:text-3xl text-white max-w-xl mx-auto leading-tight">
              Test the end-to-end voice flow
            </h2>
            <p className="text-xs md:text-sm text-blue-100 max-w-lg mx-auto leading-relaxed font-sans">
              Tap the microphone in the mobile simulator, confirm ₹2,500 cash and ₹500 expenses, and verify the resulting records entry in SQLite.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onNavigateTab?.('mobile')}
                className="px-5 py-2.5 bg-[#00BAF2] hover:bg-[#00a6d9] text-slate-950 font-heading font-bold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_#ffffff] active:translate-x-0.5 active:translate-y-0.5 transition-transform flex items-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Open mobile prototype</span>
              </button>
              <button
                onClick={() => onNavigateTab?.('records')}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-[#002970] font-heading font-bold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_#00BAF2] active:translate-x-0.5 active:translate-y-0.5 transition-transform flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-[#002970]" />
                <span>View records section</span>
              </button>
            </div>
          </section>

        </div>
      )}

    </div>
  );
}