import { BuiltInRingtone } from '../types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private activeLoopInterval: number | null = null;
  private customAudioElement: HTMLAudioElement | null = null;
  private volume: number = 0.8;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.customAudioElement) {
      this.customAudioElement.volume = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  // Play short tactile click / tap tone
  public playClickTone(type: 'start' | 'stop' | 'mark' | 'tap' = 'tap') {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      let freq = 600;
      let duration = 0.08;

      if (type === 'start') {
        freq = 880;
        duration = 0.12;
        osc.type = 'sine';
      } else if (type === 'stop') {
        freq = 330;
        duration = 0.18;
        osc.type = 'triangle';
      } else if (type === 'mark') {
        freq = 1174.66; // High D6 ping
        duration = 0.1;
        osc.type = 'sine';
      } else {
        freq = 520;
        duration = 0.05;
        osc.type = 'sine';
      }

      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(this.volume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Play a single sequence of a built-in alarm ringtone
  private playRingtoneNotes(ringtone: BuiltInRingtone) {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const playTone = (freq: number, startOffset: number, duration: number, type: OscillatorType = 'sine', gainMultiplier = 1) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + startOffset);

      gain.gain.setValueAtTime(0.0001, now + startOffset);
      gain.gain.linearRampToValueAtTime(this.volume * 0.6 * gainMultiplier, now + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.05);
    };

    switch (ringtone) {
      case 'sunflower_dawn': {
        // Joyful, uplifting harmonic arpeggio (C major / A minor pentatonic: C5, E5, G5, A5, C6)
        const notes = [523.25, 659.25, 783.99, 880.00, 1046.50, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          playTone(freq, idx * 0.22, 0.45, 'sine', 0.85);
        });
        break;
      }
      case 'athletic_siren': {
        // High intensity athletic buzzer / whistle (alternating high frequencies)
        const chirps = [880, 1320, 880, 1320, 1760];
        chirps.forEach((freq, idx) => {
          playTone(freq, idx * 0.16, 0.2, 'sawtooth', 0.6);
        });
        break;
      }
      case 'stadium_bell': {
        // Deep resonating chime bell with harmonics
        [440, 880, 1320].forEach(f => playTone(f, 0, 1.2, 'triangle', 0.7));
        [554.37, 1108.73].forEach(f => playTone(f, 0.4, 1.2, 'triangle', 0.7));
        [659.25, 1318.51].forEach(f => playTone(f, 0.8, 1.5, 'triangle', 0.8));
        break;
      }
      case 'digital_beep': {
        // Classic sports stopwatch / military beep sequence (beep-beep-beep-BEEEP)
        playTone(950, 0, 0.1, 'square', 0.4);
        playTone(950, 0.18, 0.1, 'square', 0.4);
        playTone(950, 0.36, 0.1, 'square', 0.4);
        playTone(1450, 0.60, 0.4, 'square', 0.55);
        break;
      }
      case 'gentle_marimba': {
        // Warm organic wooden mallet notes
        const marimbaNotes = [440, 554.37, 659.25, 830.61, 880];
        marimbaNotes.forEach((freq, idx) => {
          playTone(freq, idx * 0.18, 0.35, 'sine', 0.9);
        });
        break;
      }
    }
  }

  // Start continuous alarm loop
  public startAlarmLoop(
    ringtone: BuiltInRingtone | 'custom',
    customSoundDataUrl?: string,
    onLoop?: () => void
  ) {
    this.stopAlarmLoop();

    if (ringtone === 'custom' && customSoundDataUrl) {
      try {
        const audio = new Audio(customSoundDataUrl);
        audio.loop = true;
        audio.volume = this.volume;
        audio.play().catch(err => {
          console.warn('Custom audio playback failed, falling back to synth alarm', err);
          this.startAlarmLoop('sunflower_dawn');
        });
        this.customAudioElement = audio;
        return;
      } catch (err) {
        console.warn('Error initiating custom audio', err);
      }
    }

    const sound = (ringtone === 'custom' ? 'sunflower_dawn' : ringtone) as BuiltInRingtone;
    
    // Play immediately
    this.playRingtoneNotes(sound);
    if (onLoop) onLoop();

    // Loop interval (every 2.2 seconds)
    this.activeLoopInterval = window.setInterval(() => {
      this.playRingtoneNotes(sound);
      if (onLoop) onLoop();
    }, 2200);
  }

  // Stop any active alarm or preview
  public stopAlarmLoop() {
    if (this.activeLoopInterval !== null) {
      clearInterval(this.activeLoopInterval);
      this.activeLoopInterval = null;
    }
    if (this.customAudioElement) {
      this.customAudioElement.pause();
      this.customAudioElement.currentTime = 0;
      this.customAudioElement = null;
    }
  }

  // Play preview once
  public previewSound(ringtone: BuiltInRingtone | 'custom', customSoundDataUrl?: string) {
    this.stopAlarmLoop();
    if (ringtone === 'custom' && customSoundDataUrl) {
      try {
        const audio = new Audio(customSoundDataUrl);
        audio.volume = this.volume;
        audio.play();
        this.customAudioElement = audio;
        setTimeout(() => {
          this.stopAlarmLoop();
        }, 4000);
        return;
      } catch {
        // fallback
      }
    }

    const sound = (ringtone === 'custom' ? 'sunflower_dawn' : ringtone) as BuiltInRingtone;
    this.playRingtoneNotes(sound);
  }
}

export const soundEngine = new SoundEngine();
