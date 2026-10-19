import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Bookmark, ShieldAlert, Award, Copy, Check } from 'lucide-react';
import { AppSettings, LapTime } from '../types';
import { soundEngine } from '../utils/audio';

interface StopwatchViewProps {
  settings: AppSettings;
}

export const StopwatchView: React.FC<StopwatchViewProps> = ({ settings }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTimeMs, setElapsedTimeMs] = useState(0);
  const [laps, setLaps] = useState<LapTime[]>([]);
  
  // Double-tap stop security state
  const [doubleTapWarning, setDoubleTapWarning] = useState(false);
  const lastTapTimeRef = useRef<number>(0);
  const warningTimeoutRef = useRef<number | null>(null);

  // Timekeeping refs
  const startTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Copy feedback
  const [copied, setCopied] = useState(false);

  // Format split breakdown
  const formatTimeComponents = useCallback((totalMs: number) => {
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const milliseconds = Math.floor(totalMs % 1000);
    // Microseconds simulation (first 3 digits = ms, next 3 digits = pseudo micro precision based on fractional ms)
    const microPart = String(milliseconds).padStart(3, '0') + String(Math.floor((totalMs % 1) * 1000)).padStart(3, '0').slice(0, 3);

    return {
      hoursStr: String(hours).padStart(2, '0'),
      minutesStr: String(minutes).padStart(2, '0'),
      secondsStr: String(seconds).padStart(2, '0'),
      msStr: String(milliseconds).padStart(3, '0'),
      microStr: microPart,
    };
  }, []);

  // Update timer loop
  const updateTimer = useCallback(() => {
    const now = performance.now();
    const currentElapsed = accumulatedTimeRef.current + (now - startTimeRef.current);
    setElapsedTimeMs(currentElapsed);
    animationFrameRef.current = requestAnimationFrame(updateTimer);
  }, []);

  const handleStart = () => {
    if (isRunning) return;
    startTimeRef.current = performance.now();
    setIsRunning(true);
    soundEngine.playClickTone('start');
    animationFrameRef.current = requestAnimationFrame(updateTimer);
  };

  const executeStop = () => {
    if (!isRunning) return;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    const finalElapsed = accumulatedTimeRef.current + (performance.now() - startTimeRef.current);
    accumulatedTimeRef.current = finalElapsed;
    setElapsedTimeMs(finalElapsed);
    setIsRunning(false);
    setDoubleTapWarning(false);
    soundEngine.playClickTone('stop');

    // Trigger phone vibration if available
    if (settings.hapticsEnabled && 'vibrate' in navigator) {
      navigator.vibrate([80, 50, 80]);
    }
  };

  // Double-tap handler for stopping the stopwatch safely
  const handleStopAttempt = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!isRunning) return;

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    // Double tap threshold: within 450ms
    if (timeSinceLastTap > 0 && timeSinceLastTap < 450) {
      // Confirmed double-tap!
      lastTapTimeRef.current = 0;
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
      executeStop();
    } else {
      // First tap registered: prompt user to tap once more
      lastTapTimeRef.current = now;
      soundEngine.playClickTone('tap');
      setDoubleTapWarning(true);

      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      warningTimeoutRef.current = window.setTimeout(() => {
        setDoubleTapWarning(false);
        lastTapTimeRef.current = 0;
      }, 700);
    }
  };

  const handleReset = () => {
    if (isRunning) {
      executeStop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    accumulatedTimeRef.current = 0;
    setElapsedTimeMs(0);
    setLaps([]);
    setDoubleTapWarning(false);
    soundEngine.playClickTone('stop');
  };

  // Mark / Point Time without stopping
  const handlePointTime = () => {
    if (!isRunning && elapsedTimeMs === 0) return;

    soundEngine.playClickTone('mark');
    if (settings.hapticsEnabled && 'vibrate' in navigator) {
      navigator.vibrate(40);
    }

    const currentTotal = elapsedTimeMs;
    const lastLapTotal = laps.length > 0 ? laps[0].totalTimeMs : 0;
    const splitTime = currentTotal - lastLapTotal;

    const formattedTot = formatTimeComponents(currentTotal);
    const formattedSpl = formatTimeComponents(splitTime);

    const newLap: LapTime = {
      id: `lap-${Date.now()}-${Math.random()}`,
      lapNumber: laps.length + 1,
      totalTimeMs: currentTotal,
      splitTimeMs: splitTime,
      formattedTotal: `${formattedTot.hoursStr}:${formattedTot.minutesStr}:${formattedTot.secondsStr}.${formattedTot.msStr}`,
      formattedSplit: `+${formattedSpl.minutesStr}:${formattedSpl.secondsStr}.${formattedSpl.msStr}`,
      timestamp: new Date().toLocaleTimeString(),
    };

    const updatedLaps = [newLap, ...laps];

    // Determine fastest and slowest
    if (updatedLaps.length > 1) {
      let minMs = Infinity;
      let maxMs = -Infinity;

      updatedLaps.forEach((l) => {
        if (l.splitTimeMs < minMs) minMs = l.splitTimeMs;
        if (l.splitTimeMs > maxMs) maxMs = l.splitTimeMs;
      });

      updatedLaps.forEach((l) => {
        l.isFastest = l.splitTimeMs === minMs;
        l.isSlowest = l.splitTimeMs === maxMs && updatedLaps.length > 2;
      });
    }

    setLaps(updatedLaps);
  };

  const handleCopyLaps = () => {
    if (laps.length === 0) return;
    const text = laps
      .map(
        (l) =>
          `Point #${l.lapNumber.toString().padStart(2, '0')} | Split: ${l.formattedSplit} | Total: ${l.formattedTotal} [${l.timestamp}]`
      )
      .join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, []);

  const time = formatTimeComponents(elapsedTimeMs);

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Athletic Telemetry Board - Modeled directly on the user's reference image */}
      <div
        onClick={isRunning ? handleStopAttempt : undefined}
        className={`w-full max-w-4xl relative overflow-hidden rounded-2xl bg-black border ${
          isRunning
            ? 'border-amber-500/60 shadow-[0_0_35px_rgba(245,158,11,0.25)]'
            : 'border-stone-800 shadow-xl'
        } p-6 md:p-10 transition-all duration-300 touch-double-tap-guard cursor-pointer`}
      >
        {/* Subtle sunflower background watermark */}
        <div className="absolute -right-16 -bottom-16 opacity-5 pointer-events-none">
          <svg width="340" height="340" viewBox="0 0 200 200" fill="#F59E0B">
            <circle cx="100" cy="100" r="70" />
          </svg>
        </div>

        {/* Double-tap floating security indicator */}
        {doubleTapWarning && (
          <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center animate-pulse p-4 text-center">
            <ShieldAlert className="w-12 h-12 text-red-400 mb-2 animate-bounce" />
            <div className="text-xl md:text-2xl font-bold tracking-tight text-white uppercase font-mono-sport">
              Tap Once More to STOP! (1/2)
            </div>
            <div className="text-xs text-red-200 mt-1 tracking-wider uppercase">
              Athletic Security Lock &bull; Accidental Stop Protection Active
            </div>
          </div>
        )}

        {/* Security badge top left */}
        <div className="flex items-center justify-between pb-6 border-b border-stone-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping inline-block" />
            <span className="text-stone-400 tracking-wider font-mono-sport uppercase">
              Professional Athletic Chrono
            </span>
          </div>
          <div className="flex items-center gap-2 text-stone-400 font-mono-sport">
            <span className="text-amber-400/90 font-medium">Double-Tap Screen to Stop</span>
          </div>
        </div>

        {/* Precision Numeric Readout: Matching the color-coded columns */}
        <div className="my-8 py-6 px-2 md:px-6 rounded-xl bg-stone-950/80 border border-stone-900 flex items-center justify-center font-mono-sport tabular-nums font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight overflow-x-auto">
          {/* Hours */}
          <span className="text-slate-100 min-w-[1.2em] text-center drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]">
            {time.hoursStr}
          </span>
          <span className="text-stone-600 px-1 md:px-2 select-none">:</span>

          {/* Minutes */}
          <span className="text-red-500 min-w-[1.2em] text-center drop-shadow-[0_0_15px_rgba(239,68,68,0.35)]">
            {time.minutesStr}
          </span>
          <span className="text-stone-600 px-1 md:px-2 select-none">:</span>

          {/* Seconds */}
          <span className="text-sky-300 min-w-[1.2em] text-center drop-shadow-[0_0_15px_rgba(56,189,248,0.35)]">
            {time.secondsStr}
          </span>
          <span className="text-stone-600 px-1 md:px-2 select-none">:</span>

          {/* Milliseconds (3 Digits) */}
          <span className="text-yellow-400 min-w-[2.2em] text-center drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]">
            {time.msStr}
          </span>
        </div>
      </div>

      {/* Control Buttons Zone */}
      <div className="w-full max-w-4xl mt-6 grid grid-cols-3 gap-3 md:gap-4">
        {/* Reset Button */}
        <button
          onClick={handleReset}
          disabled={elapsedTimeMs === 0 && !isRunning}
          className="h-14 md:h-16 rounded-xl bg-stone-200 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-800 disabled:opacity-40 disabled:hover:bg-stone-200 dark:disabled:hover:bg-stone-900 font-mono-sport text-xs md:text-sm font-semibold tracking-wider flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
          <span>RESET</span>
        </button>

        {/* Start / Double-Tap Stop Button */}
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="h-14 md:h-16 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-mono-sport text-sm md:text-base font-extrabold tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all active:scale-98 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>START</span>
          </button>
        ) : (
          <button
            onClick={handleStopAttempt}
            className="h-14 md:h-16 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono-sport text-xs md:text-sm font-extrabold tracking-wider flex flex-col items-center justify-center shadow-lg shadow-red-600/30 transition-all active:scale-98 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span>DOUBLE-TAP STOP</span>
            </div>
            <span className="text-[10px] text-red-200 font-normal">2x Click Required</span>
          </button>
        )}

        {/* Point / Mark Time Button: "to point the time so user can mark the time not stope just for mark the time" */}
        <button
          onClick={handlePointTime}
          disabled={!isRunning && elapsedTimeMs === 0}
          className="h-14 md:h-16 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 disabled:opacity-40 font-mono-sport text-xs md:text-sm font-bold tracking-wider flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
        >
          <Bookmark className="w-4 h-4 md:w-5 md:h-5 fill-current" />
          <span>POINT TIME</span>
        </button>
      </div>

      {/* Marked Times / Lap Tracking Board */}
      <div className="w-full max-w-4xl mt-8">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold tracking-wider font-mono-sport text-stone-900 dark:text-stone-100 uppercase">
              Marked Checkpoints &amp; Laps ({laps.length})
            </h3>
          </div>

          {laps.length > 0 && (
            <button
              onClick={handleCopyLaps}
              className="flex items-center gap-1.5 text-xs font-mono-sport font-medium text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>EXPORT</span>
                </>
              )}
            </button>
          )}
        </div>

        {laps.length === 0 ? (
          <div className="py-12 text-center text-xs tracking-wider text-stone-400 font-mono-sport">
            NO TIME POINTS MARKED YET &bull; USE &ldquo;POINT TIME&rdquo; DURING TRAINING TO LOG SPLITS
          </div>
        ) : (
          <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
            {laps.map((lap) => (
              <div
                key={lap.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border font-mono-sport text-xs md:text-sm ${
                  lap.isFastest
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                    : lap.isSlowest
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
                    : 'bg-white dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-stone-400">
                    #{String(lap.lapNumber).padStart(2, '0')}
                  </span>
                  {lap.isFastest && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-stone-950 uppercase">
                      Fastest
                    </span>
                  )}
                  {lap.isSlowest && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-stone-950 uppercase">
                      Slowest
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-[10px] text-stone-400 block">SPLIT</span>
                    <span className="font-bold">{lap.formattedSplit}</span>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <span className="text-[10px] text-stone-400 block">TOTAL</span>
                    <span className="font-semibold">{lap.formattedTotal}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
