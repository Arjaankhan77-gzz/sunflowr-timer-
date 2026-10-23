import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  Clock,
  Timer,
  Play,
  Bell,
  Globe,
  Moon,
  Sun,
  Settings as SettingsIcon,
  Sparkles,
  Download,
} from 'lucide-react';
import { TabType, AppSettings, AlarmItem } from './types';
import { soundEngine } from './utils/audio';
import { downloadProjectZip } from './utils/downloadProject';
import { SunflowerLogo } from './components/SunflowerLogo';
import { SplashScreen } from './components/SplashScreen';
import { ClockView } from './components/ClockView';
import { StopwatchView } from './components/StopwatchView';
import { AlarmView } from './components/AlarmView';
import { TimerView } from './components/TimerView';
import { WorldClockView } from './components/WorldClockView';
import { SettingsModal } from './components/SettingsModal';
import { AlarmRingingScreen } from './components/AlarmRingingScreen';
import { CelebrationModal } from './components/CelebrationModal';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  fontStyle: 'sport',
  timeFormat: '12h',
  showSeconds: true,
  showMicroseconds: true,
  soundVolume: 0.8,
  hapticsEnabled: true,
};

const DEFAULT_ALARMS: AlarmItem[] = [
  {
    id: 'default-1',
    title: 'Training Session',
    hour: 5,
    minute: 0,
    ampm: 'PM',
    is24h: false,
    snoozeMinutes: 5,
    ringtone: 'sunflower_dawn',
    enabled: true,
    createdAt: Date.now(),
  },
];

export default function App() {
  // Splash Screen State: Start with printing "Arjaan"
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<TabType>('clock');

  // Application Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = window.localStorage.getItem('sunflower_clock_settings');
      return saved
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
        : DEFAULT_SETTINGS;
    } catch (error) {
      console.warn('Could not restore saved clock settings; using defaults.', error);
      try { window.localStorage.removeItem('sunflower_clock_settings'); } catch {}
      return DEFAULT_SETTINGS;
    }
  });

  // Alarms List
  const [alarms, setAlarms] = useState<AlarmItem[]>(() => {
    try {
      const saved = window.localStorage.getItem('sunflower_clock_alarms');
      const parsed = saved ? JSON.parse(saved) : DEFAULT_ALARMS;
      return Array.isArray(parsed) ? parsed : DEFAULT_ALARMS;
    } catch (error) {
      console.warn('Could not restore saved alarms; using defaults.', error);
      try { window.localStorage.removeItem('sunflower_clock_alarms'); } catch {}
      return DEFAULT_ALARMS;
    }
  });

  // Active Ringing Alarm
  const [ringingAlarm, setRingingAlarm] = useState<AlarmItem | null>(null);

  // Celebration Modal ("TASK COMPLETE" 5s animation)
  const [celebrationState, setCelebrationState] = useState<{
    isOpen: boolean;
    title: string;
  }>({
    isOpen: false,
    title: 'TASK COMPLETE',
  });

  // Settings Modal Open/Close
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Last triggered alarm signature to prevent repeated triggers in the same minute
  const lastTriggeredMinuteRef = useRef<string>('');

  // Synchronize Dark / Light Mode with HTML document element
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('sunflower_clock_settings', JSON.stringify(settings));
    soundEngine.setVolume(settings.soundVolume);
  }, [settings]);

  // Persist Alarms
  useEffect(() => {
    localStorage.setItem('sunflower_clock_alarms', JSON.stringify(alarms));
  }, [alarms]);

  // Native Android notifications keep alarms scheduled when the WebView is closed.
  // The browser-only interval below is only a foreground fallback.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    const syncNativeAlarms = async () => {
      try {
        const permission = await LocalNotifications.checkPermissions();
        if (permission.display !== 'granted') {
          const requested = await LocalNotifications.requestPermissions();
          if (requested.display !== 'granted') return;
        }

        // Rebuild this app's scheduled alarm list whenever alarms are edited.
        const pending = await LocalNotifications.getPending();
        const existingIds = pending.notifications.map((n) => ({ id: n.id }));
        if (existingIds.length) {
          await LocalNotifications.cancel({ notifications: existingIds });
        }
        if (cancelled) return;

        const enabled = alarms.filter((alarm) => alarm.enabled);
        if (!enabled.length) return;

        await LocalNotifications.schedule({
          notifications: enabled.map((alarm) => {
            const hour24 = alarm.is24h
              ? alarm.hour
              : (alarm.hour % 12) + (alarm.ampm === 'PM' ? 12 : 0);
            const stableId = Array.from(alarm.id).reduce(
              (hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0,
              7
            ) % 2000000000;

            return {
              id: stableId || 1,
              title: alarm.title || 'Sunflower Clock Alarm',
              body: 'Your alarm is ringing. Open Sunflower Clock to stop it.',
              schedule: {
                on: { hour: hour24, minute: alarm.minute },
                repeats: true,
                allowWhileIdle: true,
              },
              channelId: 'sunflower-clock-alarms',
              ongoing: true,
              autoCancel: false,
              smallIcon: 'ic_launcher',
              extra: { alarmId: alarm.id },
            };
          }),
        });
      } catch (error) {
        console.error('Could not schedule Android alarms:', error);
      }
    };

    void syncNativeAlarms();
    return () => { cancelled = true; };
  }, [alarms]);

  // Alarm Check Interval Loop
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentHours24 = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();

      // Only check during the first 2 seconds of each minute
      if (currentSeconds > 2) return;

      const currentPeriod = currentHours24 >= 12 ? 'PM' : 'AM';
      const currentHour12 = currentHours24 % 12 === 0 ? 12 : currentHours24 % 12;

      const minuteSignature = `${currentHour12}:${currentMinutes}:${currentPeriod}`;
      if (lastTriggeredMinuteRef.current === minuteSignature) {
        return; // already fired this minute
      }

      alarms.forEach((alarm) => {
        if (!alarm.enabled) return;

        let matches = false;
        if (!alarm.is24h) {
          matches =
            alarm.hour === currentHour12 &&
            alarm.minute === currentMinutes &&
            alarm.ampm === currentPeriod;
        } else {
          matches = alarm.hour === currentHours24 && alarm.minute === currentMinutes;
        }

        if (matches && !ringingAlarm) {
          lastTriggeredMinuteRef.current = minuteSignature;
          triggerAlarm(alarm);
        }
      });
    };

    const interval = setInterval(checkAlarms, 1000);
    return () => clearInterval(interval);
  }, [alarms, ringingAlarm]);

  // Trigger Alarm Ringing
  const triggerAlarm = (alarm: AlarmItem) => {
    setRingingAlarm(alarm);
    soundEngine.startAlarmLoop(alarm.ringtone, alarm.customSoundDataUrl);

    if (settings.hapticsEnabled && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 500]);
    }
  };

  // Stop Ringing Alarm & Launch 5-Second Sunflower Celebration
  const handleStopAlarm = () => {
    soundEngine.stopAlarmLoop();
    const alarmTitle = ringingAlarm?.title || 'TRAINING COMPLETE';
    setRingingAlarm(null);

    // Launch requested grand sunflower animation!
    setCelebrationState({
      isOpen: true,
      title: alarmTitle,
    });
  };

  // Snooze Ringing Alarm
  const handleSnoozeAlarm = (minutes: number) => {
    soundEngine.stopAlarmLoop();
    if (!ringingAlarm) return;

    const now = new Date();
    const futureTime = new Date(now.getTime() + minutes * 60000);
    const newHours24 = futureTime.getHours();
    const newMinutes = futureTime.getMinutes();
    const newAmpm = newHours24 >= 12 ? 'PM' : 'AM';
    const newHour12 = newHours24 % 12 === 0 ? 12 : newHours24 % 12;

    const snoozedAlarm: AlarmItem = {
      ...ringingAlarm,
      id: `snooze-${Date.now()}`,
      title: `${ringingAlarm.title} (Snoozed)`,
      hour: newHour12,
      minute: newMinutes,
      ampm: newAmpm,
      enabled: true,
    };

    setAlarms((prev) => [snoozedAlarm, ...prev]);
    setRingingAlarm(null);
  };

  // Add / Update / Toggle / Delete Alarm Handlers
  const handleAddAlarm = (newAlarm: AlarmItem) => {
    setAlarms((prev) => [newAlarm, ...prev]);
  };

  const handleUpdateAlarm = (updatedAlarm: AlarmItem) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === updatedAlarm.id ? updatedAlarm : a))
    );
  };

  const handleToggleAlarm = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const handleDeleteAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Quick theme toggle
  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  // Timer complete celebration
  const handleTimerComplete = (label = 'TRAINING INTERVAL') => {
    soundEngine.startAlarmLoop('sunflower_dawn');
    setRingingAlarm({
      id: `timer-${Date.now()}`,
      title: `${label} Finished`,
      hour: 0,
      minute: 0,
      ampm: 'AM',
      is24h: false,
      snoozeMinutes: 5,
      ringtone: 'sunflower_dawn',
      enabled: false,
      createdAt: Date.now(),
    });
  };

  return (
    <div className="min-h-screen bg-amber-50/60 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-modern transition-colors duration-300">
      {/* 1. Splash Screen: Prints "Arjaan" on startup */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* 2. Ringing Alarm Screen with Stop & Snooze & Double-tap */}
      {ringingAlarm && (
        <AlarmRingingScreen
          alarm={ringingAlarm}
          onStop={handleStopAlarm}
          onSnooze={handleSnoozeAlarm}
        />
      )}

      {/* 3. Grand Sunflower Celebration Modal ("TASK COMPLETE" for 5 sec) */}
      <CelebrationModal
        isOpen={celebrationState.isOpen}
        onClose={() => setCelebrationState({ isOpen: false, title: '' })}
        title={celebrationState.title}
        durationSeconds={5}
      />

      {/* 4. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onReplayIntro={() => setShowSplash(true)}
        onTriggerTestCelebration={() =>
          setCelebrationState({ isOpen: true, title: 'SESSION FINISHED' })
        }
      />

      {/* Top Bar Contract (Zone 1: Single Brand wordmark, Zone 2: 4-5 nav links, Zone 3: Primary Action / Controls) */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-stone-950/85 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4 md:gap-8 transition-colors">
        {/* Zone 1: Brand Wordmark with Sunflower */}
        <div
          onClick={() => setActiveTab('clock')}
          className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group select-none"
        >
          <SunflowerLogo size={32} glow={false} />
          <span className="text-base md:text-lg font-extrabold tracking-tight bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 bg-clip-text text-transparent group-hover:opacity-90">
            Sunflower Timer
          </span>
        </div>

        {/* Zone 2: 4-5 Navigation Links (Single-line whitespace-nowrap) */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          <button
            onClick={() => setActiveTab('clock')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'clock'
                ? 'bg-amber-400 text-stone-950 shadow-sm'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Clock</span>
          </button>

          <button
            onClick={() => setActiveTab('stopwatch')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stopwatch'
                ? 'bg-amber-400 text-stone-950 shadow-sm'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Stopwatch</span>
          </button>

          <button
            onClick={() => setActiveTab('alarm')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'alarm'
                ? 'bg-amber-400 text-stone-950 shadow-sm'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Sunflower Alarm</span>
          </button>

          <button
            onClick={() => setActiveTab('timer')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'timer'
                ? 'bg-amber-400 text-stone-950 shadow-sm'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Timer</span>
          </button>

          <button
            onClick={() => setActiveTab('world')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'world'
                ? 'bg-amber-400 text-stone-950 shadow-sm'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>World Clock</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action & Utilities */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Dark / Night Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-amber-400 hover:bg-stone-200 dark:hover:bg-stone-800 flex items-center justify-center transition-colors cursor-pointer border border-stone-200 dark:border-stone-800"
            title={settings.theme === 'dark' ? 'Switch to Warm Daylight' : 'Switch to Dark Night Mode'}
            aria-label="Toggle Night Dark Mode"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-700" />
            )}
          </button>

          {/* Download Project ZIP Button */}
          <button
            onClick={() => downloadProjectZip()}
            className="px-3 h-9 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 flex items-center gap-1.5 text-xs font-bold transition-transform active:scale-95 cursor-pointer shadow-sm"
            title="Download Full Project Source Code (.ZIP)"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Download</span>
          </button>

          {/* Settings Menu Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 h-9 rounded-xl bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer border border-stone-200 dark:border-stone-800"
            title="Settings & Font Customization"
          >
            <SettingsIcon className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 pb-24 md:pb-12 flex flex-col justify-center">
        {activeTab === 'clock' && (
          <ClockView
            settings={settings}
            alarms={alarms}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'stopwatch' && <StopwatchView settings={settings} />}

        {activeTab === 'alarm' && (
          <AlarmView
            alarms={alarms}
            onAddAlarm={handleAddAlarm}
            onUpdateAlarm={handleUpdateAlarm}
            onToggleAlarm={handleToggleAlarm}
            onDeleteAlarm={handleDeleteAlarm}
            onTriggerAlarmRing={triggerAlarm}
          />
        )}

        {activeTab === 'timer' && (
          <TimerView settings={settings} onTimerComplete={handleTimerComplete} />
        )}

        {activeTab === 'world' && <WorldClockView settings={settings} />}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Adheres to 15% Mobile Sticky Cap & 44px+ Hitboxes) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-stone-950/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 pb-safe">
        <div className="grid grid-cols-5 h-16 items-center px-1">
          <button
            onClick={() => setActiveTab('clock')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
              activeTab === 'clock'
                ? 'text-amber-500 font-bold'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-[10px] mt-1 tracking-tight">Clock</span>
          </button>

          <button
            onClick={() => setActiveTab('stopwatch')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
              activeTab === 'stopwatch'
                ? 'text-amber-500 font-bold'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span className="text-[10px] mt-1 tracking-tight">Stopwatch</span>
          </button>

          <button
            onClick={() => setActiveTab('alarm')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
              activeTab === 'alarm'
                ? 'text-amber-500 font-bold'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="text-[10px] mt-1 tracking-tight">Alarm</span>
          </button>

          <button
            onClick={() => setActiveTab('timer')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
              activeTab === 'timer'
                ? 'text-amber-500 font-bold'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <Timer className="w-4 h-4" />
            <span className="text-[10px] mt-1 tracking-tight">Timer</span>
          </button>

          <button
            onClick={() => setActiveTab('world')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
              activeTab === 'world'
                ? 'text-amber-500 font-bold'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span className="text-[10px] mt-1 tracking-tight">World</span>
          </button>
        </div>
      </div>

      {/* Subtle, clean footer */}
      <footer className="hidden md:flex items-center justify-between px-8 py-3 text-xs text-stone-500 dark:text-stone-500 border-t border-stone-200/60 dark:border-stone-900">
        <div className="flex items-center gap-2">
          <SunflowerLogo size={16} glow={false} />
          <span>Sunflower Clock &amp; Athletic Suite &bull; Designed for Arjaan</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSplash(true)}
            className="hover:text-amber-500 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Arjaan Intro</span>
          </button>
          <span>&bull;</span>
          <span>Double-tap Security Stopwatch</span>
        </div>
      </footer>
    </div>
  );
}
