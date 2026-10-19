import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { SunflowerLogo } from './SunflowerLogo';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  durationSeconds?: number;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  title = 'TRAINING COMPLETE',
  durationSeconds = 5,
}) => {
  const [phase, setPhase] = useState<'logo-glow' | 'full-yellow' | 'task-complete'>('logo-glow');
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  useEffect(() => {
    if (!isOpen) {
      setPhase('logo-glow');
      setTimeLeft(durationSeconds);
      return;
    }

    // Trigger golden sunflower confetti burst
    try {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#F59E0B', '#FBBF24', '#FEF08A', '#D97706', '#FFFFFF'],
      });
    } catch {
      // Confetti fallback
    }

    // Step 1: Logo with yellowish light effect (instant)
    setPhase('logo-glow');

    // Step 2: Full screen becomes yellow light with sunflower after 600ms
    const step2Timer = setTimeout(() => {
      setPhase('full-yellow');
    }, 600);

    // Step 3: Task complete appears clearly below sunflower logo after 1200ms
    const step3Timer = setTimeout(() => {
      setPhase('task-complete');
    }, 1200);

    // 5-second countdown timer
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      clearInterval(interval);
    };
  }, [isOpen, durationSeconds, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-1000 select-none overflow-hidden cursor-pointer ${
        phase === 'logo-glow'
          ? 'bg-stone-950/95'
          : 'bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-400 text-stone-950 shadow-[inset_0_0_120px_rgba(245,158,11,0.7)]'
      }`}
    >
      {/* Background yellow light aura / rays */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none flex items-center justify-center ${
          phase === 'logo-glow' ? 'opacity-80' : 'opacity-100'
        }`}
      >
        <div
          className="w-[600px] h-[600px] md:w-[900px] md:h-[900px] rounded-full blur-3xl animate-pulse"
          style={{
            background:
              phase === 'logo-glow'
                ? 'radial-gradient(circle, rgba(245, 158, 11, 0.8) 0%, rgba(234, 179, 8, 0.4) 40%, transparent 70%)'
                : 'radial-gradient(circle, rgba(254, 240, 138, 0.95) 0%, rgba(251, 191, 36, 0.7) 50%, rgba(217, 119, 6, 0.3) 100%)',
          }}
        />
        {/* Revolving radiant sunbeams */}
        <div className="absolute w-[800px] h-[800px] opacity-30 animate-golden-rays pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {Array.from({ length: 16 }).map((_, i) => (
              <line
                key={i}
                x1="100"
                y1="100"
                x2="100"
                y2="0"
                stroke="#FFF"
                strokeWidth="1.5"
                strokeDasharray="4 8"
                transform={`rotate(${i * 22.5} 100 100)`}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Center Sunflower Logo with Blooming Animation */}
      <div
        className={`relative z-10 transform transition-all duration-1000 ${
          phase === 'logo-glow'
            ? 'scale-100 animate-sunflower-pulse'
            : 'scale-125 md:scale-150 filter drop-shadow-[0_10px_35px_rgba(180,83,9,0.5)]'
        }`}
      >
        <SunflowerLogo size={160} glow={true} spin={false} />
      </div>

      {/* TASK COMPLETE text below sunflower logo */}
      <div
        className={`relative z-10 mt-10 text-center px-4 transition-all duration-700 transform ${
          phase === 'task-complete'
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-6 scale-95'
        }`}
      >
        <div className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase font-modern text-stone-900 drop-shadow-[0_2px_12px_rgba(255,255,255,0.7)]">
          TASK COMPLETE
        </div>

        {title && (
          <div className="mt-2 text-sm md:text-base font-semibold tracking-wider text-stone-800 uppercase">
            {title}
          </div>
        )}

        {/* 5-second countdown indicator */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="text-xs font-mono font-bold tracking-widest text-stone-800/80 bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full border border-stone-800/10">
            Closing in {timeLeft}s
          </span>
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="relative z-10 mt-8 px-6 py-2.5 rounded-full bg-stone-900 text-amber-300 hover:bg-stone-800 font-semibold text-xs tracking-wider uppercase shadow-lg transition-transform active:scale-95"
      >
        Dismiss
      </button>
    </div>
  );
};
