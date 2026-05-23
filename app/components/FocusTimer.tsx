'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FocusSession, generateId, saveFocusSession } from '../lib/db';
import { sendNotification, playAlertTone } from '../lib/notifications';

interface FocusTimerProps {
  sessions: FocusSession[];
  onUpdate: () => void;
}

type TimerMode = 'focus' | 'short_break' | 'long_break';

const DEFAULTS = { focus: 25, short_break: 5, long_break: 15 };
const LABELS: Record<TimerMode, string> = { focus: '🎯 Focus', short_break: '☕ Short Break', long_break: '🌿 Long Break' };
const COLORS: Record<TimerMode, string> = { focus: '#6c63ff', short_break: '#22d3a5', long_break: '#fbbf24' };

export default function FocusTimer({ sessions, onUpdate }: FocusTimerProps) {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [customMins, setCustomMins] = useState(DEFAULTS);
  const [timeLeft, setTimeLeft] = useState(DEFAULTS.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  // Track raw text input for each mode to allow free typing
  const [inputValues, setInputValues] = useState<Record<TimerMode, string>>({
    focus: String(DEFAULTS.focus),
    short_break: String(DEFAULTS.short_break),
    long_break: String(DEFAULTS.long_break),
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef<number>(0);

  const totalTime = customMins[mode] * 60;
  const progress = (1 - timeLeft / totalTime) * 100;

  const completeSession = useCallback(async () => {
    setIsRunning(false);
    const elapsed = startedRef.current ? Math.floor((Date.now() - startedRef.current) / 1000) : totalTime;
    const session: FocusSession = {
      id: generateId(),
      type: mode,
      duration: elapsed,
      completedAt: new Date().toISOString(),
    };
    await saveFocusSession(session);
    onUpdate();
    sendNotification(
      mode === 'focus' ? '🎯 Focus Complete!' : '✅ Break Over!',
      mode === 'focus' ? `Great work! Take a ${sessionCount % 4 === 3 ? 'long' : 'short'} break.` : 'Ready for another focus session?'
    );
    playAlertTone('timer');
    if (mode === 'focus') setSessionCount(s => s + 1);
  }, [mode, totalTime, sessionCount, onUpdate]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, completeSession]);

  function handleStart() {
    startedRef.current = Date.now();
    setStartTime(Date.now());
    setIsRunning(true);
  }

  function handlePause() { setIsRunning(false); }

  function handleReset() {
    setIsRunning(false);
    setTimeLeft(customMins[mode] * 60);
    setStartTime(null);
  }

  function switchMode(m: TimerMode) {
    setMode(m);
    setIsRunning(false);
    setTimeLeft(customMins[m] * 60);
    setStartTime(null);
  }

  // Called when user types in the input field
  function handleInputChange(m: TimerMode, raw: string) {
    setInputValues(v => ({ ...v, [m]: raw }));
    const val = parseInt(raw, 10);
    if (!isNaN(val) && val >= 1 && val <= 180) {
      const updated = { ...customMins, [m]: val };
      setCustomMins(updated);
      if (m === mode && !isRunning) setTimeLeft(val * 60);
    }
  }

  // Clamp + sync on blur
  function handleInputBlur(m: TimerMode) {
    const val = parseInt(inputValues[m], 10);
    const clamped = isNaN(val) ? DEFAULTS[m] : Math.min(180, Math.max(1, val));
    setInputValues(v => ({ ...v, [m]: String(clamped) }));
    const updated = { ...customMins, [m]: clamped };
    setCustomMins(updated);
    if (m === mode && !isRunning) setTimeLeft(clamped * 60);
  }

  function adjustMin(m: TimerMode, delta: number) {
    const next = Math.min(180, Math.max(1, customMins[m] + delta));
    setInputValues(v => ({ ...v, [m]: String(next) }));
    const updated = { ...customMins, [m]: next };
    setCustomMins(updated);
    if (m === mode && !isRunning) setTimeLeft(next * 60);
  }

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  const todaySessions = sessions.filter(s => s.completedAt.startsWith(new Date().toISOString().slice(0, 10)));
  const totalFocusToday = todaySessions.filter(s => s.type === 'focus').reduce((a, s) => a + s.duration, 0);

  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference - (progress / 100) * circumference;

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '20px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Focus Timer</h2>
        <button onClick={() => setShowSettings(!showSettings)} style={{ padding: '8px 14px', background: 'var(--surface2)', borderRadius: 8, fontSize: 13, color: 'var(--text2)' }}>
          ⚙️ Settings
        </button>
      </div>

      {showSettings && (
        <div className="card" style={{ margin: '16px', padding: '16px' }}>
          <h4 style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Custom Durations (minutes)</h4>
          {(['focus', 'short_break', 'long_break'] as TimerMode[]).map(m => (
            <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--text2)', minWidth: 90 }}>{LABELS[m]}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => adjustMin(m, -1)}
                  disabled={isRunning && m === mode}
                  style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface2)', color: 'var(--text)', fontSize: 18, fontWeight: 700, flexShrink: 0 }}
                >−</button>
                {/* Direct input: user can type the value */}
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={inputValues[m]}
                  disabled={isRunning && m === mode}
                  onChange={e => handleInputChange(m, e.target.value)}
                  onBlur={() => handleInputBlur(m)}
                  style={{
                    width: 56, textAlign: 'center', fontSize: 16, fontWeight: 700,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '4px 6px', color: COLORS[m],
                    MozAppearance: 'textfield',
                  }}
                />
                <button
                  onClick={() => adjustMin(m, 1)}
                  disabled={isRunning && m === mode}
                  style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface2)', color: 'var(--text)', fontSize: 18, fontWeight: 700, flexShrink: 0 }}
                >+</button>
              </div>
            </div>
          ))}
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Range: 1–180 min. Type directly or use +/− buttons.</p>
        </div>
      )}

      {/* Mode tabs */}
      <div style={{ display: 'flex', margin: '16px', background: 'var(--surface)', borderRadius: 12, padding: 4, gap: 2 }}>
        {(['focus', 'short_break', 'long_break'] as TimerMode[]).map(m => (
          <button key={m} onClick={() => switchMode(m)} style={{
            flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 12, fontWeight: 500,
            background: mode === m ? COLORS[m] : 'transparent',
            color: mode === m ? 'white' : 'var(--text3)',
            transition: 'all 0.2s',
          }}>
            {m === 'focus' ? '🎯 Focus' : m === 'short_break' ? '☕ Short' : '🌿 Long'}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 24px' }}>
        <div style={{ position: 'relative', width: 260, height: 260 }}>
          <svg width="260" height="260" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="130" cy="130" r={radius} fill="none" stroke="var(--surface2)" strokeWidth="8" />
            <circle cx="130" cy="130" r={radius} fill="none"
              stroke={COLORS[mode]} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDash}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            {isRunning && (
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: COLORS[mode],
                marginBottom: 8,
                animation: 'pulse-ring 1.5s ease infinite',
              }} />
            )}
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-2px', color: COLORS[mode] }}>
              {mins}:{secs}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text3)', marginTop: 4 }}>
              {LABELS[mode]}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              Session #{sessionCount + 1}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 8 }}>
          <button onClick={handleReset} style={{
            width: 48, height: 48, borderRadius: '50%', background: 'var(--surface2)', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>⟳</button>
          <button onClick={isRunning ? handlePause : handleStart} style={{
            width: 72, height: 72, borderRadius: '50%',
            background: COLORS[mode],
            fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 24px ${COLORS[mode]}60`,
          }}>
            {isRunning ? '⏸' : '▶'}
          </button>
          <button onClick={() => switchMode(mode === 'focus' ? 'short_break' : 'focus')} style={{
            width: 48, height: 48, borderRadius: '50%', background: 'var(--surface2)', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>⇥</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, margin: '0 16px' }}>
        {[
          { label: 'Today', value: todaySessions.filter(s => s.type === 'focus').length, suffix: 'sessions' },
          { label: 'Focus Time', value: Math.floor(totalFocusToday / 60), suffix: 'min' },
          { label: 'All Time', value: sessions.filter(s => s.type === 'focus').length, suffix: 'sessions' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{stat.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{stat.label}</div>
            <div style={{ fontSize: 9, color: 'var(--text3)' }}>{stat.suffix}</div>
          </div>
        ))}
      </div>

      {/* Session history */}
      {todaySessions.length > 0 && (
        <div className="card" style={{ margin: '14px 16px', padding: '14px' }}>
          <h4 style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Today's Sessions</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {todaySessions.map(s => (
              <div key={s.id} style={{
                padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                background: s.type === 'focus' ? 'rgba(108,99,255,0.15)' : s.type === 'short_break' ? 'rgba(34,211,165,0.15)' : 'rgba(251,191,36,0.15)',
                color: COLORS[s.type],
              }}>
                {s.type === 'focus' ? '🎯' : s.type === 'short_break' ? '☕' : '🌿'} {Math.floor(s.duration / 60)}m
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
