'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDB, generateId } from '../lib/db';
import { format, subDays, startOfDay, isSameDay, differenceInCalendarDays } from 'date-fns';

interface HabitLog {
  id: string;
  habitId: string;
  date: string; // yyyy-MM-dd
  completedAt: string;
}

interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
}

const PALETTE = ['#6c63ff', '#22d3a5', '#fbbf24', '#f472b6', '#fb923c', '#60a5fa', '#a78bfa', '#34d399'];
const EMOJIS = ['💪', '🏃', '📚', '💧', '🧘', '🥗', '😴', '✍️', '🎯', '🌿', '🏋️', '🚴'];

async function getHabitsDB(): Promise<Habit[]> {
  const db = await getDB();
  if (!db.objectStoreNames.contains('habits')) return [];
  return db.getAll('habits');
}

async function saveHabitDB(habit: Habit): Promise<void> {
  const db = await getDB();
  await db.put('habits', habit);
}

async function deleteHabitDB(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('habits', id);
}

async function getHabitLogsDB(): Promise<HabitLog[]> {
  const db = await getDB();
  if (!db.objectStoreNames.contains('habit_logs')) return [];
  return db.getAll('habit_logs');
}

async function toggleHabitLogDB(habitId: string, date: string): Promise<boolean> {
  const db = await getDB();
  const all: HabitLog[] = db.objectStoreNames.contains('habit_logs') ? await db.getAll('habit_logs') : [];
  const existing = all.find(l => l.habitId === habitId && l.date === date);
  if (existing) {
    await db.delete('habit_logs', existing.id);
    return false;
  } else {
    const log: HabitLog = { id: generateId(), habitId, date, completedAt: new Date().toISOString() };
    await db.put('habit_logs', log);
    return true;
  }
}

// Compute current streak for a habit
function computeStreak(logs: HabitLog[], habitId: string): number {
  const dates = logs
    .filter(l => l.habitId === habitId)
    .map(l => l.date)
    .sort()
    .reverse();
  if (!dates.length) return 0;
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = differenceInCalendarDays(new Date(dates[i - 1]), new Date(dates[i]));
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function computeLongestStreak(logs: HabitLog[], habitId: string): number {
  const dates = [...new Set(logs.filter(l => l.habitId === habitId).map(l => l.date))].sort();
  if (!dates.length) return 0;
  let max = 1, cur = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = differenceInCalendarDays(new Date(dates[i]), new Date(dates[i - 1]));
    if (diff === 1) { cur++; max = Math.max(max, cur); }
    else cur = 1;
  }
  return max;
}

export default function ProgressTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('💪');
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [dbReady, setDbReady] = useState(false);
  const [view, setView] = useState<'tracker' | 'stats'>('tracker');

  const today = format(new Date(), 'yyyy-MM-dd');
  // Last 7 days for the grid
  const last7 = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));

  // Ensure object stores exist (DB version upgrade)
  const initDB = useCallback(async () => {
    // We need to ensure habit stores exist; if not, recreate DB with upgrade
    const currentVersion = await new Promise<number>((res) => {
      const req = indexedDB.open('zenflow-db');
      req.onsuccess = () => { res(req.result.version); req.result.close(); };
      req.onerror = () => res(1);
    });

    const db = await new Promise<IDBDatabase>((res, rej) => {
      const req = indexedDB.open('zenflow-db', currentVersion + 1);
      req.onupgradeneeded = (e) => {
        const d = (e.target as IDBOpenDBRequest).result;
        if (!d.objectStoreNames.contains('habits')) {
          d.createObjectStore('habits', { keyPath: 'id' });
        }
        if (!d.objectStoreNames.contains('habit_logs')) {
          const s = d.createObjectStore('habit_logs', { keyPath: 'id' });
          s.createIndex('habitId', 'habitId');
          s.createIndex('date', 'date');
        }
      };
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
    db.close();
    setDbReady(true);
  }, []);

  const loadData = useCallback(async () => {
    if (!dbReady) return;
    try {
      const [h, l] = await Promise.all([getHabitsDB(), getHabitLogsDB()]);
      setHabits(h);
      setLogs(l);
    } catch { /* ignore */ }
  }, [dbReady]);

  useEffect(() => { initDB(); }, [initDB]);
  useEffect(() => { loadData(); }, [loadData]);

  async function addHabit() {
    if (!newName.trim()) return;
    const habit: Habit = {
      id: generateId(),
      name: newName.trim(),
      emoji: newEmoji,
      color: newColor,
      createdAt: new Date().toISOString(),
    };
    await saveHabitDB(habit);
    setNewName(''); setNewEmoji('💪'); setNewColor(PALETTE[0]);
    setShowForm(false);
    loadData();
  }

  async function toggleLog(habitId: string, date: string) {
    await toggleHabitLogDB(habitId, date);
    loadData();
  }

  async function deleteHabit(id: string) {
    if (!confirm('Delete this habit and all its history?')) return;
    await deleteHabitDB(id);
    loadData();
  }

  const isLogged = (habitId: string, date: string) => logs.some(l => l.habitId === habitId && l.date === date);
  const todayTotal = habits.filter(h => isLogged(h.id, today)).length;
  const overallStreak = habits.length > 0
    ? Math.max(...habits.map(h => computeStreak(logs, h.id)), 0)
    : 0;

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Progress & Streak</h2>
          <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 2 }}>
            {todayTotal}/{habits.length} habits done today
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ padding: '10px 14px' }}>
          + Habit
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, margin: '16px 16px 0' }}>
        {[
          { label: 'Today', value: `${todayTotal}/${habits.length}`, icon: '✅' },
          { label: 'Best Streak', value: `${overallStreak}🔥`, icon: '🔥' },
          { label: 'Total Habits', value: habits.length, icon: '📋' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', margin: '14px 16px 0', background: 'var(--surface)', borderRadius: 10, padding: 4, gap: 2 }}>
        {(['tracker', 'stats'] as const).map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: view === v ? 'var(--accent)' : 'transparent',
            color: view === v ? 'white' : 'var(--text3)',
          }}>
            {v === 'tracker' ? '📅 7-Day Tracker' : '📊 Stats'}
          </button>
        ))}
      </div>

      {/* Tracker view */}
      {view === 'tracker' && (
        <div style={{ padding: '14px 16px 0' }}>
          {habits.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No habits yet</div>
              <div style={{ fontSize: 12 }}>Tap "+ Habit" to start building your streak</div>
            </div>
          )}

          {/* Day labels header */}
          {habits.length > 0 && (
            <div style={{ display: 'flex', marginBottom: 6 }}>
              <div style={{ width: 120, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {last7.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 9, color: d === today ? 'var(--accent)' : 'var(--text3)', fontWeight: d === today ? 700 : 400 }}>
                    {format(new Date(d + 'T12:00'), 'EEE')}<br />
                    {format(new Date(d + 'T12:00'), 'd')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Habit rows */}
          {habits.map(habit => {
            const streak = computeStreak(logs, habit.id);
            return (
              <div key={habit.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 10, gap: 4 }}>
                <div style={{ width: 120, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 18 }}>{habit.emoji}</span>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{habit.name}</div>
                    {streak > 0 && (
                      <div style={{ fontSize: 10, color: '#fbbf24' }}>🔥 {streak}d</div>
                    )}
                  </div>
                </div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {last7.map(d => {
                    const done = isLogged(habit.id, d);
                    const isToday = d === today;
                    return (
                      <button
                        key={d}
                        onClick={() => toggleLog(habit.id, d)}
                        style={{
                          height: 32, borderRadius: 6,
                          background: done ? habit.color : 'var(--surface2)',
                          border: isToday ? `2px solid ${habit.color}` : '2px solid transparent',
                          opacity: done ? 1 : 0.4,
                          fontSize: 14,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                          cursor: 'pointer',
                        }}
                      >
                        {done ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => deleteHabit(habit.id)} style={{ padding: '4px 6px', fontSize: 12, color: 'var(--text3)', marginLeft: 4 }}>🗑</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats view */}
      {view === 'stats' && (
        <div style={{ padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {habits.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              <div>Add habits to see stats</div>
            </div>
          )}
          {habits.map(habit => {
            const streak = computeStreak(logs, habit.id);
            const longest = computeLongestStreak(logs, habit.id);
            const total = logs.filter(l => l.habitId === habit.id).length;
            const last30 = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'));
            const last30Done = last30.filter(d => isLogged(habit.id, d)).length;
            const rate = Math.round((last30Done / 30) * 100);

            return (
              <div key={habit.id} className="card" style={{ padding: '14px', borderLeft: `4px solid ${habit.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 22 }}>{habit.emoji}</span>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{habit.name}</span>
                  </div>
                  {streak > 0 && (
                    <div style={{ fontSize: 13, color: '#fbbf24', fontWeight: 700 }}>🔥 {streak} day streak</div>
                  )}
                </div>

                {/* Progress bar - 30 day rate */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>
                    <span>30-day completion</span>
                    <span>{rate}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${rate}%`, background: habit.color, borderRadius: 3, transition: 'width 0.5s' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Current', value: `${streak}🔥` },
                    { label: 'Longest', value: `${longest}🏆` },
                    { label: 'Total', value: `${total}✓` },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--surface)', borderRadius: 8 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: habit.color }}>{s.value}</div>
                      <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Mini 30-day heatmap */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Last 30 days</div>
                  <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {last30.map(d => (
                      <div key={d} style={{
                        width: 10, height: 10, borderRadius: 2,
                        background: isLogged(habit.id, d) ? habit.color : 'var(--surface2)',
                        opacity: isLogged(habit.id, d) ? 1 : 0.4,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Habit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ background: 'var(--bg2)', borderRadius: '20px 20px 0 0', width: '100%', padding: '20px 16px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 18 }}>New Habit</h3>
              <button onClick={() => setShowForm(false)} style={{ fontSize: 20, color: 'var(--text3)' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                placeholder="Habit name (e.g. Morning Run)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addHabit()}
              />

              <div>
                <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 8 }}>Pick an emoji</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {EMOJIS.map(em => (
                    <button key={em} onClick={() => setNewEmoji(em)} style={{
                      width: 40, height: 40, borderRadius: 10, fontSize: 20,
                      background: newEmoji === em ? 'var(--accent)' : 'var(--surface2)',
                      border: newEmoji === em ? '2px solid var(--accent)' : '2px solid transparent',
                    }}>{em}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 8 }}>Pick a color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PALETTE.map(c => (
                    <button key={c} onClick={() => setNewColor(c)} style={{
                      width: 32, height: 32, borderRadius: '50%', background: c,
                      border: newColor === c ? '3px solid white' : '3px solid transparent',
                      boxShadow: newColor === c ? `0 0 0 2px ${c}` : 'none',
                    }} />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={addHabit}>Add Habit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
