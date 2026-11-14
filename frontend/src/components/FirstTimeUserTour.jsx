import React, { useState } from 'react';
import { 
  Mic, 
  Radio, 
  QrCode, 
  Banknote, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  ArrowRight,
  HelpCircle,
  TrendingUp
} from 'lucide-react';

export default function FirstTimeUserTour({ 
  isOpen, 
  onClose, 
  onStartVoiceClosing, 
  onOpenRecords 
}) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      id: 0,
      badge: 'Step 1 of 4 · Welcome',
      title: 'Meet Paytm Saathi',
      subtitle: 'Your multilingual voice partner for evening closing',
      icon: Radio,
      iconColor: 'text-[#00BAF2]',
      iconBg: 'bg-[#002970]',
      description: 'Closing your kirana store at 10 PM usually takes 45 minutes of manual notebook entries. Paytm Saathi automates your entire evening closing in 30 seconds using natural voice conversations in Telugu, Hindi, or English.',
      points: [
        '30-second conversational voice routine',
        'Zero manual forms, typing, or bookkeeping apps',
        'Speaks fluent Telugu, Hindi, and Indian English'
      ],
      pointerTarget: 'none',
      primaryActionText: 'Next: Voice Button',
    },
    {
      id: 1,
      badge: 'Step 2 of 4 · Voice-First Interaction',
      title: 'Tap to Speak Anytime',
      subtitle: 'Center elevated microphone on bottom dock',
      icon: Mic,
      iconColor: 'text-[#00BAF2]',
      iconBg: 'bg-[#002970]',
      description: 'Tap the blue microphone button at the center of the bottom navigation dock. Saathi greets you immediately with today\'s live Soundbox QR collections fetched from the database, so you never repeat numbers Paytm already knows.',
      points: [
        'Automatic Soundbox collection retrieval',
        'Hands-free operation behind the counter',
        'High accuracy under ambient bazaar noise'
      ],
      pointerTarget: 'mic',
      primaryActionText: 'Next: 2-Step Closing',
    },
    {
      id: 2,
      badge: 'Step 3 of 4 · Two-Question Flow',
      title: 'State Cash & Store Expenses',
      subtitle: 'Two quick questions to reconcile the whole day',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-[#002970]',
      description: 'Saathi asks for today\'s cash earnings followed by store expenses (electricity, milk crates, chai). It understands spoken numbers and colloquial amounts, calculates your total revenue instantly, and displays a verified summary card.',
      points: [
        'Automatic formula: QR + Cash = Total Sales',
        'Deducts daily expenses before product costs',
        'Explicit review state before committing to database'
      ],
      pointerTarget: 'none',
      primaryActionText: 'Next: Business Records',
    },
    {
      id: 3,
      badge: 'Step 4 of 4 · Verifiable Ledger',
      title: 'Day-Wise Business Reports',
      subtitle: 'Inspect store growth and verified audit trail',
      icon: FileText,
      iconColor: 'text-[#00BAF2]',
      iconBg: 'bg-[#002970]',
      description: 'Once you click "Confirm & Save", transactions are recorded atomically in SQLite. Tap the Records tab anytime to inspect day-over-day growth (+25%), collections breakdown (QR vs Cash), and itemized expense reports.',
      points: [
        'Chronological timeline of business days',
        'Visual collections breakdown bar (QR vs Cash)',
        'Audit-ready SQLite financial persistence'
      ],
      pointerTarget: 'records',
      primaryActionText: 'Try Voice Closing Now',
    }
  ];

  const step = steps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = (triggerVoice = false) => {
    try {
      localStorage.setItem('paytm_saathi_tour_completed', 'true');
    } catch (e) {
      console.warn('Unable to write to localStorage', e);
    }
    onClose();
    if (triggerVoice && onStartVoiceClosing) {
      onStartVoiceClosing();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-4 bg-slate-950/80 backdrop-blur-[2px] animate-fadeIn select-none">
      
      {/* Top Header Controls: Step Pill & Skip Button */}
      <div className="flex items-center justify-between pt-3 pb-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white font-mono text-[11px] font-bold">
          <span className="w-2 h-2 rounded-full bg-[#00BAF2] animate-pulse"></span>
          <span>{step.badge}</span>
        </div>

        <button
          onClick={() => handleComplete(false)}
          className="text-xs font-bold text-blue-200 hover:text-white px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
        >
          Skip Tour
        </button>
      </div>

      {/* Main Coachmark Card */}
      <div className="my-auto">
        <div className="bg-white rounded-3xl border-2 border-slate-900 shadow-2xl p-5 space-y-4 relative overflow-hidden animate-scaleUp">
          
          {/* Subtle Top Accent Ribbon */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#002970] via-[#00BAF2] to-[#002970]"></div>

          {/* Title Area with Icon */}
          <div className="flex items-start gap-3 pt-1">
            <div className={`w-11 h-11 rounded-2xl ${step.iconBg} flex items-center justify-center flex-shrink-0 shadow-md border border-slate-800`}>
              <StepIcon className={`w-5 h-5 ${step.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-black text-base text-[#002970] leading-tight">
                {step.title}
              </h3>
              <p className="font-sans text-xs text-slate-500 font-medium mt-0.5 leading-snug">
                {step.subtitle}
              </p>
            </div>
          </div>

          {/* Detailed Description */}
          <p className="font-sans text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200">
            {step.description}
          </p>

          {/* Key Feature Points */}
          <div className="space-y-2 pt-0.5">
            {step.points.map((pt, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[11.5px] text-slate-800 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#007e33] flex-shrink-0" />
                <span>{pt}</span>
              </div>
            ))}
          </div>

          {/* Progress Indicators & Navigation Controls */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentStep === idx 
                      ? 'w-7 bg-[#002970]' 
                      : 'w-2 bg-slate-200 hover:bg-slate-300'
                  }`}
                  title={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Back / Next Buttons */}
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-[#002970] transition-colors cursor-pointer"
                  title="Previous step"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-4 py-2 bg-[#002970] hover:bg-[#001c4d] text-white rounded-xl font-heading font-bold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{step.primaryActionText}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#00BAF2]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Visual Spotlight Pointer Pointers */}
      <div className="pb-2">
        {step.pointerTarget === 'mic' && (
          <div className="flex flex-col items-center animate-bounce">
            <span className="font-mono text-[11px] font-bold text-[#00BAF2] bg-slate-900/90 px-3 py-1 rounded-full border border-sky-400 mb-1.5 shadow-lg">
              ↓ Tap Saathi mic button to start
            </span>
            <div className="w-14 h-14 rounded-full border-3 border-[#00BAF2] bg-[#00BAF2]/20 animate-ping pointer-events-none" />
          </div>
        )}

        {step.pointerTarget === 'records' && (
          <div className="flex flex-col items-end pr-14 animate-bounce">
            <span className="font-mono text-[11px] font-bold text-[#00BAF2] bg-slate-900/90 px-3 py-1 rounded-full border border-sky-400 mb-1.5 shadow-lg">
              ↓ Records tab with day-wise reports
            </span>
          </div>
        )}

        {step.pointerTarget === 'none' && (
          <div className="text-center font-mono text-[10px] text-blue-200/80">
            Paytm Saathi • Feature Tour
          </div>
        )}
      </div>

    </div>
  );
}
