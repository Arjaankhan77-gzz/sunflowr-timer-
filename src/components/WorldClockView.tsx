import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, Sun, Moon, Search } from 'lucide-react';
import { WorldCity, AppSettings } from '../types';
import { SunflowerLogo } from './SunflowerLogo';

interface WorldClockViewProps {
  settings: AppSettings;
}

const DEFAULT_CITIES: WorldCity[] = [
  { id: '1', city: 'London', country: 'United Kingdom', timezone: 'Europe/London', flag: '🇬🇧' },
  { id: '2', city: 'New York', country: 'United States', timezone: 'America/New_York', flag: '🇺🇸' },
  { id: '3', city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo', flag: '🇯🇵' },
  { id: '4', city: 'Dubai', country: 'United Arab Emirates', timezone: 'Asia/Dubai', flag: '🇦🇪' },
  { id: '5', city: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata', flag: '🇮🇳' },
  { id: '6', city: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney', flag: '🇦🇺' },
];

const AVAILABLE_CITIES: WorldCity[] = [
  { id: '7', city: 'Paris', country: 'France', timezone: 'Europe/Paris', flag: '🇫🇷' },
  { id: '8', city: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore', flag: '🇸🇬' },
  { id: '9', city: 'San Francisco', country: 'United States', timezone: 'America/Los_Angeles', flag: '🇺🇸' },
  { id: '10', city: 'Berlin', country: 'Germany', timezone: 'Europe/Berlin', flag: '🇩🇪' },
  { id: '11', city: 'Cairo', country: 'Egypt', timezone: 'Africa/Cairo', flag: '🇪🇬' },
  { id: '12', city: 'Seoul', country: 'South Korea', timezone: 'Asia/Seoul', flag: '🇰🇷' },
  { id: '13', city: 'Sao Paulo', country: 'Brazil', timezone: 'America/Sao_Paulo', flag: '🇧🇷' },
  { id: '14', city: 'Toronto', country: 'Canada', timezone: 'America/Toronto', flag: '🇨🇦' },
];

export const WorldClockView: React.FC<WorldClockViewProps> = ({ settings }) => {
  const [pinnedCities, setPinnedCities] = useState<WorldCity[]>(() => {
    const saved = localStorage.getItem('sunflower_pinned_cities');
    return saved ? JSON.parse(saved) : DEFAULT_CITIES;
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const saveCities = (cities: WorldCity[]) => {
    setPinnedCities(cities);
    localStorage.setItem('sunflower_pinned_cities', JSON.stringify(cities));
  };

  const removeCity = (id: string) => {
    const updated = pinnedCities.filter((c) => c.id !== id);
    saveCities(updated);
  };

  const addCity = (city: WorldCity) => {
    if (pinnedCities.some((c) => c.city === city.city)) return;
    const updated = [...pinnedCities, city];
    saveCities(updated);
    setIsAddingCity(false);
    setSearchQuery('');
  };

  // Helper to calculate time info for timezone
  const getTimeInfo = (timezone: string) => {
    try {
      const now = new Date();
      // Formatter for time
      const timeStr = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: settings.showSeconds ? '2-digit' : undefined,
        hour12: settings.timeFormat === '12h',
      }).format(now);

      // Formatter for hour number (to check day/night)
      const hourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
      }).format(now);
      const hourNum = parseInt(hourStr, 10);
      const isDaytime = hourNum >= 6 && hourNum < 18;

      // Day of week in that timezone
      const dayStr = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(now);

      return { timeStr, isDaytime, dayStr };
    } catch {
      return { timeStr: '--:--', isDaytime: true, dayStr: '' };
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 select-none">
      {/* Header & Add Action */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2.5">
          <Globe className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 font-mono-sport uppercase tracking-wider">
            Sunflower World Clocks
          </h2>
        </div>

        <button
          onClick={() => setIsAddingCity(!isAddingCity)}
          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono-sport text-xs font-bold tracking-wider flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>{isAddingCity ? 'CLOSE' : 'ADD CITY'}</span>
        </button>
      </div>

      {/* Add City Modal / Drawer */}
      {isAddingCity && (
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-amber-400/40 shadow-md space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              placeholder="Search world cities (e.g. Paris, Singapore, Berlin)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-10 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
            {AVAILABLE_CITIES.concat(DEFAULT_CITIES)
              .filter(
                (c) =>
                  !pinnedCities.some((p) => p.city === c.city) &&
                  (c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.country.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => addCity(c)}
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-400 bg-stone-50 dark:bg-stone-950/60 flex items-center justify-between text-left text-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{c.flag}</span>
                    <div>
                      <span className="font-bold text-stone-900 dark:text-stone-100 block">
                        {c.city}
                      </span>
                      <span className="text-[10px] text-stone-400">{c.country}</span>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-amber-500" />
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Grid of Pinned World Clocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pinnedCities.map((item) => {
          const { timeStr, isDaytime, dayStr } = getTimeInfo(item.timezone);

          return (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between relative overflow-hidden group"
            >
              {/* Left Details */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <SunflowerLogo size={28} glow={false} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{item.flag}</span>
                    <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {item.city}
                    </h3>
                  </div>
                  <span className="text-xs text-stone-400 block">{item.country}</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono-sport mt-0.5 block">
                    {dayStr}
                  </span>
                </div>
              </div>

              {/* Right Time Readout & Day/Night Indicator */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5 text-xs text-stone-400">
                    {isDaytime ? (
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span className="text-[10px] uppercase font-mono-sport">
                      {isDaytime ? 'Day' : 'Night'}
                    </span>
                  </div>

                  <div className="text-xl md:text-2xl font-mono-sport font-black tabular-nums text-stone-900 dark:text-stone-100 mt-0.5">
                    {timeStr}
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeCity(item.id)}
                  title="Remove City"
                  className="p-1 rounded text-stone-300 dark:text-stone-700 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
