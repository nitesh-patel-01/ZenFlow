'use client';

export interface FrequencyPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  emoji: string;
  frequencies: Array<{ freq: number; type: OscillatorType; gain: number }>;
  binauralBeat?: { carrier: number; beat: number };
  noiseType?: 'white' | 'pink' | 'brown';
  noiseGain?: number;
}

export const FREQUENCY_PRESETS: FrequencyPreset[] = [
  {
    id: 'deep-sleep',
    name: 'Deep Sleep',
    category: 'Sleep',
    emoji: '🌙',
    description: 'Delta waves (1-4 Hz) for deep restorative sleep',
    frequencies: [{ freq: 174, type: 'sine', gain: 0.3 }],
    binauralBeat: { carrier: 200, beat: 2 },
    noiseType: 'brown',
    noiseGain: 0.05,
  },
  {
    id: 'sleep-onset',
    name: 'Sleep Onset',
    category: 'Sleep',
    emoji: '💤',
    description: 'Theta waves (4-8 Hz) for drifting off to sleep',
    frequencies: [{ freq: 285, type: 'sine', gain: 0.25 }],
    binauralBeat: { carrier: 300, beat: 6 },
    noiseType: 'pink',
    noiseGain: 0.04,
  },
  {
    id: 'relaxation',
    name: 'Deep Relaxation',
    category: 'Relaxation',
    emoji: '🌊',
    description: 'Alpha waves (8-14 Hz) for calm awareness',
    frequencies: [
      { freq: 432, type: 'sine', gain: 0.2 },
      { freq: 528, type: 'sine', gain: 0.1 },
    ],
    binauralBeat: { carrier: 440, beat: 10 },
  },
  {
    id: 'stress-relief',
    name: 'Stress Relief',
    category: 'Relaxation',
    emoji: '🕊️',
    description: '396 Hz for releasing fear and stress',
    frequencies: [
      { freq: 396, type: 'sine', gain: 0.25 },
      { freq: 198, type: 'sine', gain: 0.1 },
    ],
    noiseType: 'pink',
    noiseGain: 0.03,
  },
  {
    id: 'meditation',
    name: 'Meditation',
    category: 'Meditation',
    emoji: '🧘',
    description: 'Theta-alpha border for deep meditation',
    frequencies: [
      { freq: 432, type: 'sine', gain: 0.2 },
      { freq: 864, type: 'sine', gain: 0.08 },
    ],
    binauralBeat: { carrier: 440, beat: 7 },
  },
  {
    id: 'chakra-root',
    name: 'Root Chakra',
    category: 'Chakra',
    emoji: '🔴',
    description: '396 Hz - Grounding and security',
    frequencies: [{ freq: 396, type: 'sine', gain: 0.3 }],
  },
  {
    id: 'chakra-sacral',
    name: 'Sacral Chakra',
    category: 'Chakra',
    emoji: '🟠',
    description: '417 Hz - Creativity and change',
    frequencies: [{ freq: 417, type: 'sine', gain: 0.3 }],
  },
  {
    id: 'chakra-solar',
    name: 'Solar Plexus',
    category: 'Chakra',
    emoji: '🟡',
    description: '528 Hz - Transformation and miracles',
    frequencies: [{ freq: 528, type: 'sine', gain: 0.3 }],
  },
  {
    id: 'chakra-heart',
    name: 'Heart Chakra',
    category: 'Chakra',
    emoji: '💚',
    description: '639 Hz - Harmony and relationships',
    frequencies: [{ freq: 639, type: 'sine', gain: 0.3 }],
  },
  {
    id: 'chakra-throat',
    name: 'Throat Chakra',
    category: 'Chakra',
    emoji: '🔵',
    description: '741 Hz - Expression and clarity',
    frequencies: [{ freq: 741, type: 'sine', gain: 0.3 }],
  },
  {
    id: 'chakra-third-eye',
    name: 'Third Eye',
    category: 'Chakra',
    emoji: '🟣',
    description: '852 Hz - Intuition and awareness',
    frequencies: [{ freq: 852, type: 'sine', gain: 0.3 }],
  },
  {
    id: 'chakra-crown',
    name: 'Crown Chakra',
    category: 'Chakra',
    emoji: '⚪',
    description: '963 Hz - Divine connection',
    frequencies: [{ freq: 963, type: 'sine', gain: 0.3 }],
  },
  {
    id: 'energy-boost',
    name: 'Energy Boost',
    category: 'Energy',
    emoji: '⚡',
    description: 'Beta waves (14-30 Hz) for alertness and energy',
    frequencies: [
      { freq: 528, type: 'sine', gain: 0.2 },
      { freq: 320, type: 'triangle', gain: 0.15 },
    ],
    binauralBeat: { carrier: 440, beat: 20 },
  },
  {
    id: 'morning-vitality',
    name: 'Morning Vitality',
    category: 'Energy',
    emoji: '☀️',
    description: '417 Hz for awakening and motivation',
    frequencies: [
      { freq: 417, type: 'sine', gain: 0.25 },
      { freq: 834, type: 'sine', gain: 0.1 },
    ],
  },
  {
    id: 'focus',
    name: 'Deep Focus',
    category: 'Focus',
    emoji: '🎯',
    description: 'Gamma waves (30-100 Hz) for peak cognitive performance',
    frequencies: [{ freq: 40, type: 'sine', gain: 0.1 }],
    binauralBeat: { carrier: 440, beat: 40 },
    noiseType: 'white',
    noiseGain: 0.02,
  },
  {
    id: 'study',
    name: 'Study Mode',
    category: 'Focus',
    emoji: '📚',
    description: 'Alpha-Beta for learning and retention',
    frequencies: [
      { freq: 528, type: 'sine', gain: 0.15 },
      { freq: 440, type: 'sine', gain: 0.1 },
    ],
    binauralBeat: { carrier: 400, beat: 14 },
  },
  {
    id: 'deep-work',
    name: 'Deep Work',
    category: 'Focus',
    emoji: '💻',
    description: 'Theta-Beta mix for creative deep work',
    frequencies: [{ freq: 432, type: 'sine', gain: 0.2 }],
    binauralBeat: { carrier: 200, beat: 8 },
    noiseType: 'brown',
    noiseGain: 0.04,
  },
  {
    id: 'healing-528',
    name: 'DNA Repair 528',
    category: 'Healing',
    emoji: '🌿',
    description: '528 Hz - The love frequency for healing',
    frequencies: [
      { freq: 528, type: 'sine', gain: 0.3 },
      { freq: 264, type: 'sine', gain: 0.1 },
    ],
  },
  {
    id: 'pain-relief',
    name: 'Pain Relief',
    category: 'Healing',
    emoji: '💫',
    description: '174 Hz for natural pain reduction',
    frequencies: [{ freq: 174, type: 'sine', gain: 0.35 }],
    noiseType: 'pink',
    noiseGain: 0.03,
  },
];

export class FrequencyEngine {
  private ctx: AudioContext | null = null;
  private nodes: AudioNode[] = [];
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isPlaying = false;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  play(preset: FrequencyPreset, volume: number = 0.7): void {
    this.stop();
    const ctx = this.getCtx();
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = volume;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    // Oscillators
    preset.frequencies.forEach(({ freq, type, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gainNode.gain.value = gain;
      osc.connect(gainNode);
      gainNode.connect(this.masterGain!);
      osc.start();
      this.nodes.push(osc, gainNode);
    });

    // Binaural beats (left/right channel panning)
    if (preset.binauralBeat) {
      const { carrier, beat } = preset.binauralBeat;
      const merger = ctx.createChannelMerger(2);
      merger.connect(this.masterGain!);

      const leftOsc = ctx.createOscillator();
      const rightOsc = ctx.createOscillator();
      const leftGain = ctx.createGain();
      const rightGain = ctx.createGain();
      leftGain.gain.value = 0.2;
      rightGain.gain.value = 0.2;
      leftOsc.frequency.value = carrier;
      rightOsc.frequency.value = carrier + beat;
      leftOsc.type = 'sine';
      rightOsc.type = 'sine';
      leftOsc.connect(leftGain);
      rightOsc.connect(rightGain);
      leftGain.connect(merger, 0, 0);
      rightGain.connect(merger, 0, 1);
      leftOsc.start();
      rightOsc.start();
      this.nodes.push(leftOsc, rightOsc, leftGain, rightGain, merger);
    }

    // Noise
    if (preset.noiseType && preset.noiseGain) {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      if (preset.noiseType === 'pink' || preset.noiseType === 'brown') {
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = data[i];
          if (preset.noiseType === 'pink') {
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            data[i] = (b0 + b1 + b2 + white * 0.5362) / 4;
          } else {
            b0 = 0.99 * b0 + white * 0.01;
            data[i] = b0;
          }
        }
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = preset.noiseGain;
      source.connect(noiseGain);
      noiseGain.connect(this.masterGain!);
      source.start();
      this.nodes.push(source, noiseGain);
    }

    this.isPlaying = true;
  }

  stop(): void {
    this.nodes.forEach((node) => {
      try {
        (node as OscillatorNode).stop?.();
        node.disconnect();
      } catch { /* ignore */ }
    });
    this.nodes = [];
    this.isPlaying = false;
  }

  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(volume, this.getCtx().currentTime, 0.01);
    }
  }

  get playing(): boolean {
    return this.isPlaying;
  }
}
