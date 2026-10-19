import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlarmClockOff, ShieldAlert } from 'lucide-react';
import { AlarmItem } from '../types';
import { SunflowerLogo } from './SunflowerLogo';

interface AlarmRingingScreenProps {
  alarm: AlarmItem;
  onStop: () => void;
  onSnooze: (minutes: number) => void;
}

export const AlarmRingingScreen: React.FC<AlarmRingingScreenProps> = ({
  alarm,
  onStop,
  onSnooze,
}) => {
  const [doubleTapNotice, setDoubleTapNotice] = useState(false);
  const lastTapRef = useRef<number>(0);
  const noticeTimerRef = useRef<number | null>(null);

  // Double-click on screen stops alarm
  const handleScreenClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const delta = now - lastTapRef.current;

    if (delta > 0 && delta < 450) {
      // Confirmed double click!
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      onStop();
    } else {
      // First click: prompt double tap
      lastTapRef.current = now;
      setDoubleTapNotice(true);
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = window.setTimeout(() => {
        setDoubleTapNotice(false);
        lastTapRef.current = 0;
      }, 700);
    }
  };

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  return (
    <div
      onClick={handleScreenClick}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-stone-950/95 text-white p-6 md:p-12 select-none overflow-hidden touch-double-tap-guard cursor-pointer"
    >
      {/* Radiant ambient yellow glow pulsing */}
      <div
        className="absolute w-[500px] h-[500px] md:w-[800px] md:h-[800px] rounded-full blur-3xl pointer-events-none animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, rgba(234, 179, 8, 0.15) 50%, transparent 75%)',
        }}
      />

      {/* Floating double tap alert banner */}
      {doubleTapNotice && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-amber-500 text-stone-950 px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wider animate-bounce shadow-xl flex items-center gap-2 z-30">
          <ShieldAlert className="w-4 h-4" />
          <span>Double-click to stop alarm! (1/2)</span>
        </div>
      )}

      {/* Top Header */}
      <div className="text-center relative z-10 pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono-sport uppercase tracking-widest">
          <Bell className="w-3.5 h-3.5 animate-bounce" />
          <span>Sunflower Alarm Ringing</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-extrabold text-white mt-3">
          {alarm.title}
        </h2>
      </div>

      {/* Center Sunflower Animated Bloom */}
      <div className="relative z-10 flex flex-col items-center justify-center my-6">
        <div className="animate-sunflower-pulse">
          <SunflowerLogo size={140} glow={true} spin={true} />
        </div>

        <div className="mt-8 font-mono-sport text-5xl md:text-7xl font-black text-amber-400 drop-shadow-[0_0_25px_rgba(250,204,21,0.5)]">
          {String(alarm.hour).padStart(2, '0')}:{String(alarm.minute).padStart(2, '0')}{' '}
          <span className="text-2xl md:text-3xl text-amber-200">{alarm.ampm}</span>
        </div>

        <div className="mt-3 text-xs md:text-sm text-stone-400 font-mono-sport">
          Double-click anywhere on screen or press STOP below
        </div>
      </div>

      {/* Action Buttons: STOP and SNOOZE */}
      <div className="relative z-10 w-full max-w-md grid grid-cols-2 gap-4 pb-6">
        {/* Snooze Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSnooze(alarm.snoozeMinutes || 5);
          }}
          className="h-16 rounded-2xl bg-stone-900 border border-stone-700 hover:bg-stone-800 text-stone-200 font-mono-sport font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-lg"
        >
          <AlarmClockOff className="w-5 h-5 text-amber-400" />
          <span>SNOOZE ({alarm.snoozeMinutes}m)</span>
        </button>

        {/* Stop Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStop();
          }}
          className="h-16 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-mono-sport font-black text-base tracking-wider flex items-center justify-center shadow-xl shadow-red-600/30 transition-transform active:scale-95 cursor-pointer"
        >
          <span>STOP ALARM</span>
        </button>
      </div>
    </div>
  );
};
