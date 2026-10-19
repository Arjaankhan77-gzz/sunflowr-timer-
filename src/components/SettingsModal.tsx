import React, { useState } from 'react';
import { X, Moon, Sun, Type, Clock, Volume2, Sparkles, Smartphone, Eye, Download, Check } from 'lucide-react';
import { AppSettings, FontFamilyType } from '../types';
import { soundEngine } from '../utils/audio';
import { downloadProjectZip } from '../utils/downloadProject';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onReplayIntro: () => void;
  onTriggerTestCelebration: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onReplayIntro,
  onTriggerTestCelebration,
}) => {
  if (!isOpen) return null;

  const fontOptions: { id: FontFamilyType; label: string; sample: string; desc: string }[] = [
    {
      id: 'sport',
      label: 'Athletic Telemetry',
      sample: '12:45:09.840',
      desc: 'High-contrast monospace for precision training',
    },
    {
      id: 'digital',
      label: 'Digital LED Segment',
      sample: '12:45:09',
      desc: 'Futuristic stadium stopwatch font',
    },
    {
      id: 'modern',
      label: 'Clean Modern Sans',
      sample: '12:45:09',
      desc: 'Minimalist balanced typography',
    },
    {
      id: 'serif',
      label: 'Luxury Editorial Serif',
      sample: '12:45:09',
      desc: 'Elegant bespoke timepiece style',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Clock &amp; Timer Settings
              </h3>
              <p className="text-[11px] text-stone-400">
                Custom fonts, 12/24h format, and theme controls
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Theme Selector (Yellowish theme with Night Dark Mode) */}
          <div>
            <label className="block text-xs font-bold font-mono-sport uppercase tracking-wider text-stone-400 mb-3">
              Theme Mode (Warm Yellow &bull; Night Mode)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                  settings.theme === 'light'
                    ? 'bg-amber-100/70 border-amber-400 text-stone-950 font-bold shadow-sm'
                    : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-amber-300'
                }`}
              >
                <Sun className="w-5 h-5 text-amber-500" />
                <div className="text-left">
                  <div className="text-xs font-bold">Warm Sunflower</div>
                  <div className="text-[10px] text-stone-500">Daylight golden theme</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                  settings.theme === 'dark'
                    ? 'bg-amber-500/15 border-amber-400 text-stone-100 font-bold shadow-sm'
                    : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-amber-300'
                }`}
              >
                <Moon className="w-5 h-5 text-amber-400" />
                <div className="text-left">
                  <div className="text-xs font-bold">Deep Night Dark</div>
                  <div className="text-[10px] text-stone-400">Low glare athletic dark</div>
                </div>
              </button>
            </div>
          </div>

          {/* Font Family Customization */}
          <div>
            <label className="block text-xs font-bold font-mono-sport uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-2">
              <Type className="w-4 h-4 text-amber-500" />
              <span>Customize Clock Font</span>
            </label>

            <div className="space-y-2">
              {fontOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => onUpdateSettings({ fontStyle: opt.id })}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    settings.fontStyle === opt.id
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 shadow-sm'
                      : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      {opt.label}
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{opt.desc}</div>
                  </div>

                  <div
                    className={`text-lg font-bold text-amber-600 dark:text-amber-400 ${
                      opt.id === 'sport'
                        ? 'font-mono-sport'
                        : opt.id === 'digital'
                        ? 'font-digital'
                        : opt.id === 'serif'
                        ? 'font-serif-luxury'
                        : 'font-modern'
                    }`}
                  >
                    {opt.sample}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time Format: 12-Hour vs 24-Hour */}
          <div>
            <label className="block text-xs font-bold font-mono-sport uppercase tracking-wider text-stone-400 mb-3">
              Time Format
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onUpdateSettings({ timeFormat: '12h' })}
                className={`py-2.5 px-4 rounded-xl border text-xs font-mono-sport font-semibold transition-all cursor-pointer ${
                  settings.timeFormat === '12h'
                    ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-sm'
                    : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                12-Hour (05:00 PM)
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ timeFormat: '24h' })}
                className={`py-2.5 px-4 rounded-xl border text-xs font-mono-sport font-semibold transition-all cursor-pointer ${
                  settings.timeFormat === '24h'
                    ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-sm'
                    : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                24-Hour (17:00)
              </button>
            </div>
          </div>

          {/* Precision and Display Toggles */}
          <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800">
            {/* Show Seconds */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                  Show Seconds in Clock
                </span>
                <span className="text-[10px] text-stone-400">
                  Display live seconds in digital and world clock views
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.showSeconds}
                onChange={(e) => onUpdateSettings({ showSeconds: e.target.checked })}
                className="w-5 h-5 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Millisecond Precision */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                  Millisecond Precision
                </span>
                <span className="text-[10px] text-stone-400">
                  Track athletic elapsed time with 3-digit millisecond accuracy
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.showMicroseconds}
                onChange={(e) => onUpdateSettings({ showMicroseconds: e.target.checked })}
                className="w-5 h-5 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Haptics */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                  Tactile Haptics / Vibration
                </span>
                <span className="text-[10px] text-stone-400">
                  Vibrate on start, point lap mark, and double-tap stop
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.hapticsEnabled}
                onChange={(e) => onUpdateSettings({ hapticsEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Master Volume */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-amber-500" />
                <span>Audio Alert Volume ({Math.round(settings.soundVolume * 100)}%)</span>
              </span>
              <button
                type="button"
                onClick={() => soundEngine.playClickTone('start')}
                className="text-[10px] font-mono-sport text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Test Beep
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundVolume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                onUpdateSettings({ soundVolume: vol });
                soundEngine.setVolume(vol);
              }}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Download Project Source Code ZIP */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={async () => {
                try {
                  await downloadProjectZip();
                } catch (err) {
                  console.error('Download failed', err);
                }
              }}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-bold text-xs font-mono-sport tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>DOWNLOAD PROJECT FILES (.ZIP)</span>
            </button>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 text-center mt-1.5">
              Exports all HTML, CSS, React, TypeScript and audio code directly to your device
            </p>
          </div>

          {/* Special App Demos / Shortcuts */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onReplayIntro();
              }}
              className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Replay &ldquo;Arjaan&rdquo; Splash</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onTriggerTestCelebration();
              }}
              className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/40 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Preview 5s Celebration</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
