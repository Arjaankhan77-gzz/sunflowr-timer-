import React, { useState, useEffect } from 'react';
import { Calendar, Sunrise, Sunset, Bell, Timer, Play } from 'lucide-react';
import { AppSettings, AlarmItem } from '../types';
import { SunflowerLogo } from './SunflowerLogo';

interface ClockViewProps {
  settings: AppSettings;
  alarms: AlarmItem[];
  onNavigateToTab: (tab: 'stopwatch' | 'alarm' | 'timer' | 'world') => void;
}

export const ClockView: React.FC<ClockViewProps> = ({
  settings,
  alarms,
  onNavigateToTab,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Format hours and ampm
  const hoursRaw = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();
  const milliseconds = currentTime.getMilliseconds();

  const isPm = hoursRaw >= 12;
  const displayHours = settings.timeFormat === '12h'
    ? hoursRaw % 12 === 0 ? 12 : hoursRaw % 12
    : hoursRaw;

  const hoursStr = String(displayHours).padStart(2, '0');
  const minutesStr = String(minutes).padStart(2, '0');
  const secondsStr = String(seconds).padStart(2, '0');
  const msStr = String(milliseconds).padStart(3, '0').slice(0, 2);

  // Formatted date
  const dateFormatted = currentTime.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate clock hand angles
  const secondAngle = (seconds + milliseconds / 1000) * 6; // 360 / 60
  const minuteAngle = (minutes + seconds / 60) * 6;
  const hourAngle = ((hoursRaw % 12) + minutes / 60) * 30; // 360 / 12

  // Find next enabled alarm
  const nextAlarm = alarms.find((a) => a.enabled);

  // Font family helper
  const getFontClass = () => {
    switch (settings.fontStyle) {
      case 'sport':
        return 'font-mono-sport';
      case 'digital':
        return 'font-digital';
      case 'serif':
        return 'font-serif-luxury';
      case 'modern':
      default:
        return 'font-modern';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none space-y-8">
      {/* Minimalist Clock Card */}
      <div className="w-full relative overflow-hidden rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-8 md:p-14 shadow-sm text-center flex flex-col items-center">
        {/* Soft yellow ambient background aura */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-40 dark:opacity-20"
          style={{
            background: 'radial-gradient(circle, #F59E0B 0%, #FBBF24 40%, transparent 75%)',
          }}
        />

        {/* Date and Day Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-400/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold tracking-wider uppercase mb-6">
          <Calendar className="w-3.5 h-3.5" />
          <span>{dateFormatted}</span>
        </div>

        {/* Clean Minimalist Digital Time Readout */}
        <div className={`relative z-10 flex items-baseline justify-center tracking-tight ${getFontClass()}`}>
          <span className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-stone-900 dark:text-stone-50 tabular-nums">
            {hoursStr}:{minutesStr}
          </span>

          {settings.showSeconds && (
            <span className="text-2xl sm:text-3xl md:text-5xl font-bold text-amber-500 tabular-nums ml-2 md:ml-3">
              :{secondsStr}
            </span>
          )}

          {settings.timeFormat === '12h' && (
            <span className="text-sm sm:text-lg md:text-2xl font-bold text-stone-400 dark:text-stone-500 ml-3 tracking-widest">
              {isPm ? 'PM' : 'AM'}
            </span>
          )}
        </div>

        {/* Analog Sunflower Clock Dial */}
        <div className="mt-8 relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
          {/* Sunflower base dial */}
          <div className="absolute inset-0 flex items-center justify-center opacity-85">
            <SunflowerLogo size={200} glow={false} />
          </div>

          {/* Clock Hands SVG overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
            {/* Hour hand */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="52"
              stroke="#FEF3C7"
              strokeWidth="4.5"
              strokeLinecap="round"
              transform={`rotate(${hourAngle} 100 100)`}
              className="drop-shadow-md"
            />
            {/* Minute hand */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="34"
              stroke="#FDE047"
              strokeWidth="3.2"
              strokeLinecap="round"
              transform={`rotate(${minuteAngle} 100 100)`}
              className="drop-shadow-md"
            />
            {/* Second hand */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="24"
              stroke="#EF4444"
              strokeWidth="1.8"
              strokeLinecap="round"
              transform={`rotate(${secondAngle} 100 100)`}
            />
            {/* Center pin */}
            <circle cx="100" cy="100" r="4.5" fill="#EF4444" stroke="#FFF" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Quick status bar */}
        <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800/80 w-full flex flex-wrap items-center justify-around gap-4 text-xs font-mono-sport text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <Sunrise className="w-4 h-4 text-amber-500" />
            <span>Dawn: 06:12 AM</span>
          </div>

          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <span>
              Next Alarm:{' '}
              {nextAlarm
                ? `${String(nextAlarm.hour).padStart(2, '0')}:${String(nextAlarm.minute).padStart(2, '0')} ${nextAlarm.ampm}`
                : 'None set'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Sunset className="w-4 h-4 text-amber-500" />
            <span>Dusk: 06:48 PM</span>
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stopwatch Launcher */}
        <div
          onClick={() => onNavigateToTab('stopwatch')}
          className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-400/60 transition-all cursor-pointer group shadow-sm flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Stopwatch
              </h4>
              <p className="text-[11px] text-stone-500">
                Double-tap stop &bull; Mark time
              </p>
            </div>
          </div>
          <span className="text-amber-500 font-bold text-xs group-hover:translate-x-1 transition-transform">
            &rarr;
          </span>
        </div>

        {/* Alarm Launcher */}
        <div
          onClick={() => onNavigateToTab('alarm')}
          className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-400/60 transition-all cursor-pointer group shadow-sm flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Sunflower Alarm
              </h4>
              <p className="text-[11px] text-stone-500">
                Device music &bull; Snooze
              </p>
            </div>
          </div>
          <span className="text-amber-500 font-bold text-xs group-hover:translate-x-1 transition-transform">
            &rarr;
          </span>
        </div>

        {/* Timer Launcher */}
        <div
          onClick={() => onNavigateToTab('timer')}
          className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-400/60 transition-all cursor-pointer group shadow-sm flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Training Timer
              </h4>
              <p className="text-[11px] text-stone-500">
                HIIT &bull; Tabata &bull; Rounds
              </p>
            </div>
          </div>
          <span className="text-amber-500 font-bold text-xs group-hover:translate-x-1 transition-transform">
            &rarr;
          </span>
        </div>
      </div>
    </div>
  );
};
