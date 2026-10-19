import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { AppSettings } from '../types';
import { soundEngine } from '../utils/audio';

interface TimerViewProps {
  settings: AppSettings;
  onTimerComplete: (presetLabel?: string) => void;
}

export const TimerView: React.FC<TimerViewProps> = ({ settings, onTimerComplete }) => {
  // Input configuration (in seconds)
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(300); // 5 min default
  const [remainingSeconds, setRemainingSeconds] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('5m Warmup');

  // Input states for manual setup
  const [inputHours, setInputHours] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(5);
  const [inputSeconds, setInputSeconds] = useState(0);

  const timerRef = useRef<number | null>(null);

  const presets = [
    { label: '30s HIIT', duration: 30 },
    { label: '1m Rest', duration: 60 },
    { label: '3m Round', duration: 180 },
    { label: '5m Warmup', duration: 300 },
    { label: '15m Cardio', duration: 900 },
    { label: '25m Focus', duration: 1500 },
    { label: '45m Workout', duration: 2700 },
  ];

  const handleStart = () => {
    if (remainingSeconds <= 0) return;
    setIsRunning(true);
    soundEngine.playClickTone('start');
  };

  const handlePause = () => {
    setIsRunning(false);
    soundEngine.playClickTone('stop');
  };

  const handleReset = () => {
    setIsRunning(false);
    setRemainingSeconds(totalDurationSeconds);
    soundEngine.playClickTone('stop');
  };

  const selectPreset = (label: string, duration: number) => {
    setIsRunning(false);
    setActivePreset(label);
    setTotalDurationSeconds(duration);
    setRemainingSeconds(duration);
    setInputHours(Math.floor(duration / 3600));
    setInputMinutes(Math.floor((duration % 3600) / 60));
    setInputSeconds(duration % 60);
    soundEngine.playClickTone('tap');
  };

  const applyCustomTime = (h: number, m: number, s: number) => {
    const total = h * 3600 + m * 60 + s;
    if (total <= 0) return;
    setIsRunning(false);
    setActivePreset('Custom');
    setTotalDurationSeconds(total);
    setRemainingSeconds(total);
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            // Trigger completion celebration & audio
            onTimerComplete(activePreset);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, onTimerComplete, activePreset]);

  // Breakdown remaining
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(minutes).padStart(2, '0');
  const secondsStr = String(seconds).padStart(2, '0');

  // Progress ratio
  const progressPercent = totalDurationSeconds > 0
    ? (remainingSeconds / totalDurationSeconds) * 100
    : 0;

  // SVG circle calculations
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none space-y-8">
      {/* Athletic Presets Strip */}
      <div className="w-full flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-mono-sport font-semibold text-stone-400 shrink-0 uppercase flex items-center gap-1 mr-1">
          <Zap className="w-3.5 h-3.5 text-amber-500" /> Presets:
        </span>
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => selectPreset(p.label, p.duration)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono-sport whitespace-nowrap transition-all cursor-pointer ${
              activePreset === p.label
                ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:border-amber-400'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main Timer Dial */}
      <div className="w-full relative overflow-hidden rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 md:p-12 shadow-sm flex flex-col items-center">
        {/* Circular Countdown Progress Gauge */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center my-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 280 280">
            {/* Background ring */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-stone-100 dark:text-stone-800"
            />
            {/* Animated sunflower progress ring */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              stroke="url(#timerAmberGradient)"
              strokeWidth="14"
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
            <defs>
              <linearGradient id="timerAmberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="50%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#EAB308" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Digital Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-mono-sport font-semibold tracking-wider text-stone-400 uppercase mb-1">
              {activePreset}
            </span>

            <div className="font-mono-sport tabular-nums font-black text-4xl sm:text-5xl md:text-6xl text-stone-900 dark:text-stone-50">
              {hours > 0 && <span>{hoursStr}:</span>}
              <span>{minutesStr}</span>
              <span className="text-amber-500">:{secondsStr}</span>
            </div>

            <span className="text-[11px] font-mono-sport text-stone-400 mt-2">
              {Math.round(progressPercent)}% Remaining
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4 mt-6">
          <button
            type="button"
            onClick={handleReset}
            className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {!isRunning ? (
            <button
              type="button"
              onClick={handleStart}
              className="h-14 px-8 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-mono-sport font-extrabold text-base tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-transform active:scale-95 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>START TIMER</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="h-14 px-8 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-mono-sport font-extrabold text-base tracking-wider flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>PAUSE</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Duration Selector */}
      <div className="w-full bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6">
        <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400 font-mono-sport uppercase tracking-wider mb-4">
          Custom Duration
        </h4>

        <div className="grid grid-cols-3 gap-3 max-w-md">
          <div>
            <span className="text-[10px] font-mono text-stone-400 uppercase block mb-1">Hours</span>
            <input
              type="number"
              min="0"
              max="23"
              value={inputHours}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value) || 0);
                setInputHours(val);
                applyCustomTime(val, inputMinutes, inputSeconds);
              }}
              className="w-full h-11 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-center font-mono-sport font-bold text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <span className="text-[10px] font-mono text-stone-400 uppercase block mb-1">Minutes</span>
            <input
              type="number"
              min="0"
              max="59"
              value={inputMinutes}
              onChange={(e) => {
                const val = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                setInputMinutes(val);
                applyCustomTime(inputHours, val, inputSeconds);
              }}
              className="w-full h-11 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-center font-mono-sport font-bold text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <span className="text-[10px] font-mono text-stone-400 uppercase block mb-1">Seconds</span>
            <input
              type="number"
              min="0"
              max="59"
              value={inputSeconds}
              onChange={(e) => {
                const val = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                setInputSeconds(val);
                applyCustomTime(inputHours, inputMinutes, val);
              }}
              className="w-full h-11 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-center font-mono-sport font-bold text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
