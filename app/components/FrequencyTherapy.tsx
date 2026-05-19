'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FrequencyEngine, FREQUENCY_PRESETS, FrequencyPreset } from '../lib/audio';
import { getSetting, setSetting } from '../lib/db';

const engine = typeof window !== 'undefined' ? new FrequencyEngine() : null;

const CATEGORIES = ['All', 'Sleep', 'Relaxation', 'Meditation', 'Chakra', 'Energy', 'Focus', 'Healing'];

export default function FrequencyTherapy() {
  const [playing, setPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.6);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [timer, setTimer] = useState(0); // 0 = infinite
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loop] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getSetting<string[]>('freq_favorites', []).then(f => setFavorites(f));
    getSetting<string[]>('freq_recent', []).then(r => setRecent(r));
    getSetting<number>('freq_volume', 0.6).then(v => setVolume(v));
  }, []);

  const drawVisualizer = useCallback(() => {
    if (!canvasRef.current || !engine) return;
    const analyser = engine.getAnalyser();
    if (!analyser) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLen = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLen);

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(data);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLen) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLen; i++) {
        const barHeight = (data[i] / 255) * canvas.height;
        const hue = (i / bufferLen) * 280 + 220;
        ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.85)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  }, []);

  function stopVisualizer() {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }

  function startTimer(minutes: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    if (minutes === 0) { setTimeLeft(null); return; }
    setTimeLeft(minutes * 60);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          handleStop();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handlePlay(preset: FrequencyPreset) {
    if (!engine) return;
    if (playing === preset.id) { handleStop(); return; }
    engine.play(preset, volume);
    setPlaying(preset.id);
    const newRecent = [preset.id, ...recent.filter(r => r !== preset.id)].slice(0, 10);
    setRecent(newRecent);
    setSetting('freq_recent', newRecent);
    if (timer > 0) startTimer(timer);
    setTimeout(drawVisualizer, 100);
  }

  function handleStop() {
    engine?.stop();
    setPlaying(null);
    setTimeLeft(null);
    if (timerRef.current) clearInterval(timerRef.current);
    stopVisualizer();
  }

  function handleVolume(v: number) {
    setVolume(v);
    engine?.setVolume(v);
    setSetting('freq_volume', v);
  }

  async function toggleFavorite(id: string) {
    const newFavs = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(newFavs);
    await setSetting('freq_favorites', newFavs);
  }

  const filtered = FREQUENCY_PRESETS.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || p.category === category;
    return matchSearch && matchCat;
  });

  const recentPresets = recent.map(id => FREQUENCY_PRESETS.find(p => p.id === id)).filter(Boolean) as FrequencyPreset[];
  const favoritePresets = FREQUENCY_PRESETS.filter(p => favorites.includes(p.id));

  const playingPreset = playing ? FREQUENCY_PRESETS.find(p => p.id === playing) : null;

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: '20px 16px 0' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>🎵 Frequency Therapy</h2>
        <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 2 }}>Healing sounds generated via Web Audio API</p>
      </div>

      {/* Now Playing */}
      {playingPreset && (
        <div style={{
          margin: '16px', padding: '14px 16px',
          background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(167,139,250,0.1))',
          border: '1px solid rgba(108,99,255,0.3)',
          borderRadius: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 20, marginBottom: 2 }}>{playingPreset.emoji}</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{playingPreset.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{playingPreset.description}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {timeLeft !== null && <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent2)' }}>{formatTime(timeLeft)}</div>}
              <button onClick={handleStop} style={{ padding: '8px 16px', background: 'rgba(248,113,113,0.2)', borderRadius: 8, color: 'var(--red)', fontSize: 13, fontWeight: 600, marginTop: 4 }}>Stop</button>
            </div>
          </div>
          <canvas ref={canvasRef} width={340} height={48} style={{ width: '100%', height: 48, borderRadius: 8, background: 'rgba(0,0,0,0.2)' }} />
        </div>
      )}

      {/* Controls */}
      <div className="card" style={{ margin: '0 16px 16px', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>🔊</span>
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => handleVolume(Number(e.target.value))}
            style={{ flex: 1, height: 4, background: 'var(--surface2)', borderRadius: 2, outline: 'none', border: 'none', padding: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text3)', minWidth: 32 }}>{Math.round(volume * 100)}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>⏱ Auto-stop:</span>
          <select value={timer} onChange={e => setTimer(Number(e.target.value))} style={{ flex: 1, padding: '5px 10px', fontSize: 12 }}>
            <option value={0}>Off (loop)</option>
            <option value={5}>5 min</option>
            <option value={10}>10 min</option>
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={45}>45 min</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
          </select>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px 10px' }}>
        <input placeholder="🔍 Search frequencies..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 14px', overflowX: 'auto' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
            background: category === cat ? 'var(--accent)' : 'var(--surface2)',
            color: category === cat ? 'white' : 'var(--text2)',
          }}>{cat}</button>
        ))}
      </div>

      {/* Favorites */}
      {favoritePresets.length > 0 && category === 'All' && !search && (
        <div style={{ padding: '0 16px 16px' }}>
          <h4 style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600, marginBottom: 10 }}>❤️ FAVORITES</h4>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {favoritePresets.map(p => (
              <div key={p.id} style={{
                minWidth: 120, padding: '12px', borderRadius: 12,
                background: playing === p.id ? 'var(--accent)' : 'var(--surface)',
                border: `1px solid ${playing === p.id ? 'var(--accent)' : 'var(--border)'}`,
                cursor: 'pointer', textAlign: 'center',
              }} onClick={() => handlePlay(p)}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{p.emoji}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: playing === p.id ? 'white' : 'var(--text2)' }}>{p.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      {recentPresets.length > 0 && category === 'All' && !search && (
        <div style={{ padding: '0 16px 16px' }}>
          <h4 style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600, marginBottom: 10 }}>🕐 RECENTLY PLAYED</h4>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {recentPresets.slice(0, 6).map(p => (
              <div key={p.id} style={{ minWidth: 80, textAlign: 'center', cursor: 'pointer' }} onClick={() => handlePlay(p)}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', margin: '0 auto 6px',
                  background: playing === p.id ? 'var(--accent)' : 'var(--surface)',
                  border: `2px solid ${playing === p.id ? 'var(--accent)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                  {p.emoji}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>{p.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preset grid */}
      <div style={{ padding: '0 16px' }}>
        {category !== 'All' && <h4 style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600, marginBottom: 10 }}>{category.toUpperCase()}</h4>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(preset => {
            const isActive = playing === preset.id;
            const isFav = favorites.includes(preset.id);
            return (
              <div key={preset.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px', borderRadius: 14,
                background: isActive ? 'linear-gradient(135deg, rgba(108,99,255,0.25), rgba(167,139,250,0.1))' : 'var(--surface)',
                border: `1px solid ${isActive ? 'rgba(108,99,255,0.5)' : 'var(--border)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
                <div onClick={() => handlePlay(preset)} style={{
                  width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
                  background: isActive ? 'var(--accent)' : 'var(--surface2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  boxShadow: isActive ? '0 0 16px rgba(108,99,255,0.5)' : 'none',
                }}>
                  {isActive ? '⏸' : preset.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }} onClick={() => handlePlay(preset)}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: isActive ? 'var(--accent2)' : 'var(--text)' }}>{preset.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preset.description}</div>
                  <div style={{ fontSize: 10, color: isActive ? 'var(--accent)' : 'var(--text3)', marginTop: 3, fontWeight: 500 }}>
                    {preset.frequencies.map(f => `${f.freq}Hz`).join(' · ')}
                    {preset.binauralBeat ? ` · Binaural ${preset.binauralBeat.beat}Hz` : ''}
                    {preset.noiseType ? ` · ${preset.noiseType} noise` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                  <button onClick={e => { e.stopPropagation(); toggleFavorite(preset.id); }} style={{
                    fontSize: 18, color: isFav ? '#f472b6' : 'var(--text3)',
                    background: 'none', padding: '4px',
                  }}>
                    {isFav ? '❤️' : '🤍'}
                  </button>
                  <span style={{
                    fontSize: 9, padding: '2px 6px', borderRadius: 10,
                    background: 'var(--bg3)', color: 'var(--text3)', fontWeight: 500,
                  }}>
                    {preset.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}
