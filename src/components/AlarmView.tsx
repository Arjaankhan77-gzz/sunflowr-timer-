import React, { useState, useRef } from 'react';
import { Bell, Plus, Trash2, Volume2, Music, Upload, Play, Square, X, Pencil } from 'lucide-react';
import { AlarmItem, BuiltInRingtone } from '../types';
import { soundEngine } from '../utils/audio';

interface AlarmViewProps {
  alarms: AlarmItem[];
  onAddAlarm: (alarm: AlarmItem) => void;
  onUpdateAlarm?: (alarm: AlarmItem) => void;
  onToggleAlarm: (id: string) => void;
  onDeleteAlarm: (id: string) => void;
  onTriggerAlarmRing: (alarm: AlarmItem) => void;
}

export const AlarmView: React.FC<AlarmViewProps> = ({
  alarms,
  onAddAlarm,
  onUpdateAlarm,
  onToggleAlarm,
  onDeleteAlarm,
  onTriggerAlarmRing,
}) => {
  // Toggle form visibility & edit tracking
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);

  // Form state
  const [hour, setHour] = useState<number>(5);
  const [minute, setMinute] = useState<number>(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('PM');
  const [title, setTitle] = useState<string>('Training Session');
  const [snoozeMinutes, setSnoozeMinutes] = useState<number>(5);
  const [selectedRingtone, setSelectedRingtone] = useState<BuiltInRingtone | 'custom'>('sunflower_dawn');
  const [customSoundName, setCustomSoundName] = useState<string>('');
  const [customSoundDataUrl, setCustomSoundDataUrl] = useState<string>('');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const ringtones: { id: BuiltInRingtone; label: string }[] = [
    { id: 'sunflower_dawn', label: 'Sunflower Dawn (Uplifting)' },
    { id: 'athletic_siren', label: 'Athletic Siren (Sprint/HIIT)' },
    { id: 'stadium_bell', label: 'Stadium Chime (Harmonic)' },
    { id: 'digital_beep', label: 'Digital Chrono Beep' },
    { id: 'gentle_marimba', label: 'Acoustic Marimba' },
  ];

  // Open empty form for creating new alarm
  const handleOpenNewForm = () => {
    setEditingAlarmId(null);
    setHour(5);
    setMinute(0);
    setAmpm('PM');
    setTitle('Training Session');
    setSnoozeMinutes(5);
    setSelectedRingtone('sunflower_dawn');
    setCustomSoundName('');
    setCustomSoundDataUrl('');
    setIsFormOpen(true);
  };

  // Open form pre-filled with existing alarm details for editing
  const handleStartEdit = (alarm: AlarmItem) => {
    setEditingAlarmId(alarm.id);
    setHour(alarm.hour);
    setMinute(alarm.minute);
    setAmpm(alarm.ampm);
    setTitle(alarm.title);
    setSnoozeMinutes(alarm.snoozeMinutes);
    setSelectedRingtone(alarm.ringtone);
    setCustomSoundName(alarm.customSoundName || '');
    setCustomSoundDataUrl(alarm.customSoundDataUrl || '');
    setIsFormOpen(true);
  };

  // Handle device music upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomSoundName(file.name);
    setSelectedRingtone('custom');

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCustomSoundDataUrl(result);
      // Play brief test preview
      soundEngine.previewSound('custom', result);
      setIsPlayingPreview(true);
      setTimeout(() => setIsPlayingPreview(false), 3500);
    };
    reader.readAsDataURL(file);
  };

  const toggleSoundPreview = () => {
    if (isPlayingPreview) {
      soundEngine.stopAlarmLoop();
      setIsPlayingPreview(false);
    } else {
      soundEngine.previewSound(selectedRingtone, customSoundDataUrl);
      setIsPlayingPreview(true);
      setTimeout(() => setIsPlayingPreview(false), 3500);
    }
  };

  const handleSaveAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.stopAlarmLoop();

    if (editingAlarmId) {
      const existing = alarms.find((a) => a.id === editingAlarmId);
      const updatedAlarm: AlarmItem = {
        id: editingAlarmId,
        title: title.trim() || 'Sunflower Alarm',
        hour,
        minute,
        ampm,
        is24h: false,
        snoozeMinutes,
        ringtone: selectedRingtone,
        customSoundName: selectedRingtone === 'custom' ? customSoundName : undefined,
        customSoundDataUrl: selectedRingtone === 'custom' ? customSoundDataUrl : undefined,
        enabled: existing ? existing.enabled : true,
        createdAt: existing ? existing.createdAt : Date.now(),
      };
      if (onUpdateAlarm) {
        onUpdateAlarm(updatedAlarm);
      }
      setEditingAlarmId(null);
      setIsFormOpen(false);
    } else {
      const newAlarm: AlarmItem = {
        id: `alarm-${Date.now()}`,
        title: title.trim() || 'Sunflower Alarm',
        hour,
        minute,
        ampm,
        is24h: false,
        snoozeMinutes,
        ringtone: selectedRingtone,
        customSoundName: selectedRingtone === 'custom' ? customSoundName : undefined,
        customSoundDataUrl: selectedRingtone === 'custom' ? customSoundDataUrl : undefined,
        enabled: true,
        createdAt: Date.now(),
      };

      onAddAlarm(newAlarm);
      setIsFormOpen(false);
    }

    // Reset to defaults
    setTitle('Training Session');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 select-none">
      {/* Alarms Top Bar with "+ Add Alarm" Action */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 font-mono-sport uppercase tracking-wider">
              Sunflower Alarms
            </h2>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Training duration, custom device music, and snooze
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isFormOpen) {
              setIsFormOpen(false);
              setEditingAlarmId(null);
            } else {
              handleOpenNewForm();
            }
          }}
          className="h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-bold font-mono-sport text-xs tracking-wider flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
        >
          {isFormOpen ? (
            <>
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>CLOSE</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ ADD ALARM</span>
            </>
          )}
        </button>
      </div>

      {/* Set / Edit Alarm Form: Visible only when user clicks "+ ADD ALARM" or "EDIT" */}
      {isFormOpen && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-amber-400/50 p-6 md:p-8 shadow-md transition-all">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800 mb-6">
            <div className="flex items-center gap-2">
              {editingAlarmId ? (
                <Pencil className="w-5 h-5 text-amber-500" />
              ) : (
                <Bell className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  {editingAlarmId ? 'Edit Alarm & Training Duration' : 'Configure New Alarm'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {editingAlarmId
                    ? 'Update time, snooze timer, and device music'
                    : 'Set time, snooze, and select built-in ringtones or device songs'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingAlarmId(null);
              }}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        <form onSubmit={handleSaveAlarm} className="space-y-6">
          {/* 3 Things: Hour, Min, and AM/PM */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
              Alarm Time (Hour &bull; Minute &bull; AM/PM)
            </label>

            <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-lg">
              {/* Hour */}
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-stone-400 uppercase mb-1">Hour</span>
                <select
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="h-14 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 font-mono-sport text-xl font-bold px-4 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minute */}
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-stone-400 uppercase mb-1">Minute</span>
                <select
                  value={minute}
                  onChange={(e) => setMinute(Number(e.target.value))}
                  className="h-14 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 font-mono-sport text-xl font-bold px-4 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              {/* AM / PM */}
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-stone-400 uppercase mb-1">Period</span>
                <div className="grid grid-cols-2 h-14 bg-stone-100 dark:bg-stone-950 p-1 rounded-xl border border-stone-200 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setAmpm('AM')}
                    className={`rounded-lg font-mono-sport text-xs font-bold transition-colors cursor-pointer ${
                      ampm === 'AM'
                        ? 'bg-amber-400 text-stone-950 shadow-sm'
                        : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmpm('PM')}
                    className={`rounded-lg font-mono-sport text-xs font-bold transition-colors cursor-pointer ${
                      ampm === 'PM'
                        ? 'bg-amber-400 text-stone-950 shadow-sm'
                        : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Alarm Label / Training Purpose */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
              Alarm Label
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 5:00 PM Sprint Training"
              className="w-full max-w-lg h-12 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 px-4 text-sm text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-400 focus:outline-none font-medium"
            />
          </div>

          {/* Snooze Timer Option: "iss ke neeeche akk aur opion hoga jo soonz timer ka like ktne min ka soonz krna he" */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80">
            <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
              Snooze Duration (How long to snooze)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[3, 5, 10, 15].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setSnoozeMinutes(mins)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono-sport font-semibold transition-all cursor-pointer ${
                    snoozeMinutes === mins
                      ? 'bg-amber-400 text-stone-950 shadow-sm ring-2 ring-amber-400/50'
                      : 'bg-stone-100 dark:bg-stone-950 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                >
                  {mins} min snooze
                </button>
              ))}
            </div>
          </div>

          {/* Audio selection: Default options + Add Music from Device */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Alarm Sound &bull; Default Ringtones &amp; Custom Device Music
              </label>

              <button
                type="button"
                onClick={toggleSoundPreview}
                className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
              >
                {isPlayingPreview ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Preview</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Test Sound</span>
                  </>
                )}
              </button>
            </div>

            {/* Built-in Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {ringtones.map((rt) => (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => {
                    setSelectedRingtone(rt.id);
                    soundEngine.previewSound(rt.id);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                    selectedRingtone === rt.id
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 text-stone-900 dark:text-stone-100 font-bold shadow-sm'
                      : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-500" />
                    <span>{rt.label}</span>
                  </div>
                  {selectedRingtone === rt.id && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  )}
                </button>
              ))}

              {/* Add Music from Device Button */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-xl border border-dashed text-left flex items-center justify-between text-xs cursor-pointer transition-all ${
                  selectedRingtone === 'custom'
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 text-stone-900 dark:text-stone-100 font-bold'
                    : 'bg-stone-50 dark:bg-stone-950 border-amber-400/50 text-stone-700 dark:text-stone-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Music className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate">
                    {customSoundName ? `Custom: ${customSoundName}` : 'Add Music from Device'}
                  </span>
                </div>
                <Upload className="w-3.5 h-3.5 text-stone-400 shrink-0 ml-1" />
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Save Alarm & Cancel Buttons */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="submit"
              className="h-12 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-bold text-sm tracking-wide flex items-center gap-2 shadow-md shadow-amber-500/20 transition-transform active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{editingAlarmId ? 'UPDATE ALARM' : 'SAVE ALARM'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingAlarmId(null);
              }}
              className="h-12 px-5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      )}

      {/* Saved Alarms List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
          <h3 className="text-sm font-bold tracking-wider font-mono-sport uppercase text-stone-900 dark:text-stone-100">
            Active Alarms ({alarms.length})
          </h3>
          <span className="text-xs text-stone-400">
            Triggers at scheduled minute with full sunflower alert
          </span>
        </div>

        {alarms.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div className="text-xs text-stone-400 font-mono-sport tracking-wider uppercase">
              No alarms scheduled currently
            </div>
            {!isFormOpen && (
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="mt-1 px-4 py-2 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs font-mono-sport tracking-wider transition-transform active:scale-95 cursor-pointer shadow-sm hover:bg-amber-300 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ ADD ALARM</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alarms.map((alarm) => (
              <div
                key={alarm.id}
                className={`p-5 rounded-2xl border transition-all ${
                  alarm.enabled
                    ? 'bg-white dark:bg-stone-900 border-amber-400/40 shadow-sm'
                    : 'bg-stone-100 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-baseline gap-1 font-mono-sport font-black text-3xl md:text-4xl text-stone-900 dark:text-stone-100">
                      <span>{String(alarm.hour).padStart(2, '0')}:{String(alarm.minute).padStart(2, '0')}</span>
                      <span className="text-sm font-bold text-amber-500 ml-1">{alarm.ampm}</span>
                    </div>
                    <div className="text-sm font-semibold text-stone-700 dark:text-stone-300 mt-1">
                      {alarm.title}
                    </div>
                    <div className="text-xs text-stone-400 flex items-center gap-2 mt-1">
                      <span>{alarm.snoozeMinutes}m snooze</span>
                      <span>&bull;</span>
                      <span className="truncate max-w-[140px]">
                        {alarm.ringtone === 'custom' ? alarm.customSoundName || 'Custom Song' : alarm.ringtone.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Toggle & Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <button
                      type="button"
                      onClick={() => onToggleAlarm(alarm.id)}
                      className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
                        alarm.enabled ? 'bg-amber-400' : 'bg-stone-300 dark:bg-stone-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-stone-950 transition-transform ${
                          alarm.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Edit Alarm / Timer Button */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(alarm)}
                        title="Edit Timer / Alarm Settings"
                        className="px-2 py-1 rounded bg-amber-500/10 dark:bg-amber-500/20 text-[10px] font-mono-sport font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>EDIT</span>
                      </button>

                      {/* Test Alarm Trigger */}
                      <button
                        type="button"
                        onClick={() => onTriggerAlarmRing(alarm)}
                        title="Simulate / Test Alarm Ring Now"
                        className="px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 text-[10px] font-mono-sport font-semibold text-stone-600 dark:text-stone-300 hover:text-amber-500 cursor-pointer"
                      >
                        TEST
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteAlarm(alarm.id)}
                        title="Delete alarm"
                        className="p-1 rounded text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
