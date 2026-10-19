export type TabType = 'clock' | 'stopwatch' | 'alarm' | 'timer' | 'world';

export type FontFamilyType = 'sport' | 'digital' | 'modern' | 'serif';

export type ThemeType = 'dark' | 'light';

export interface AppSettings {
  theme: ThemeType;
  fontStyle: FontFamilyType;
  timeFormat: '12h' | '24h';
  showSeconds: boolean;
  showMicroseconds: boolean;
  soundVolume: number;
  hapticsEnabled: boolean;
}

export interface LapTime {
  id: string;
  lapNumber: number;
  totalTimeMs: number;
  splitTimeMs: number;
  formattedTotal: string;
  formattedSplit: string;
  timestamp: string;
  isFastest?: boolean;
  isSlowest?: boolean;
}

export type BuiltInRingtone = 
  | 'sunflower_dawn'
  | 'athletic_siren'
  | 'stadium_bell'
  | 'digital_beep'
  | 'gentle_marimba';

export interface AlarmItem {
  id: string;
  title: string;
  hour: number; // 1-12 or 0-23
  minute: number; // 0-59
  ampm: 'AM' | 'PM';
  is24h: boolean;
  snoozeMinutes: number; // e.g. 5
  ringtone: BuiltInRingtone | 'custom';
  customSoundName?: string;
  customSoundDataUrl?: string;
  enabled: boolean;
  createdAt: number;
}

export interface WorldCity {
  id: string;
  city: string;
  country: string;
  timezone: string;
  flag: string;
}
