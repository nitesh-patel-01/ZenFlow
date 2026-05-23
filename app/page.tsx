'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTasks, getNotes, getFocusSessions, saveTask, saveNote, Task, Note, FocusSession } from './lib/db';
import { requestNotificationPermission, checkAndNotify, syncRemindersToSW } from './lib/notifications';
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import Notes from './components/Notes';
import Calendar from './components/Calendar';
import FocusTimer from './components/FocusTimer';
import FrequencyTherapy from './components/FrequencyTherapy';
import Settings from './components/Settings';
import ProgressTracker from './components/ProgressTracker';

type Tab = 'dashboard' | 'tasks' | 'notes' | 'calendar' | 'focus' | 'progress' | 'therapy' | 'settings';

const NAV = [
  { id: 'dashboard', icon: '⊞', label: 'Home' },
  { id: 'tasks',     icon: '✓',  label: 'Tasks' },
  { id: 'notes',     icon: '✎',  label: 'Notes' },
  { id: 'focus',     icon: '◎',  label: 'Focus' },
  { id: 'progress',  icon: '🔥', label: 'Streak' },
  { id: 'calendar',  icon: '◫',  label: 'Cal' },
  { id: 'therapy',   icon: '♫',  label: 'Sound' },
  { id: 'settings',  icon: '⚙',  label: 'More' },
] as const;

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadData = useCallback(async () => {
    const [t, n, s] = await Promise.all([getTasks(), getNotes(), getFocusSessions()]);
    setTasks(t);
    setNotes(n);
    setSessions(s);
    // Every time data loads, push upcoming reminders into the Service Worker
    // so it can fire notifications even when this tab is closed
    syncRemindersToSW(t, n);
  }, []);

  useEffect(() => {
    loadData().then(() => setLoaded(true));
    requestNotificationPermission();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as Tab | null;
    if (tabParam && NAV.find(n => n.id === tabParam)) setTab(tabParam);
  }, [loadData]);

  // In-app foreground polling every 30s
  useEffect(() => {
    const poll = async () => {
      const [t, n] = await Promise.all([getTasks(), getNotes()]);
      const items = [
        ...t.map(task => ({ ...task, type: 'task' as const })),
        ...n.map(note => ({
          ...note,
          dueDate: note.reminderDate,
          dueTime: note.reminderTime,
          reminderMinutes: 0,
          completed: false,
          type: 'note' as const,
        })),
      ];
      checkAndNotify(items, async (id) => {
        const task = t.find(task => task.id === id);
        const note = n.find(note => note.id === id);
        if (task) await saveTask({ ...task, notified: true });
        if (note) await saveNote({ ...note, notified: true });
        loadData();
      });
    };

    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (!loaded) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: 48, animation: 'float 2s ease-in-out infinite' }}>🌊</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>ZenFlow</div>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <main style={{ minHeight: 'calc(100vh - 70px)', overflowY: 'auto' }}>
        {tab === 'dashboard' && <Dashboard tasks={tasks} notes={notes} sessions={sessions} onNavigate={(t) => setTab(t as Tab)} />}
        {tab === 'tasks'     && <TaskManager tasks={tasks} onUpdate={loadData} />}
        {tab === 'notes'     && <Notes notes={notes} onUpdate={loadData} />}
        {tab === 'calendar'  && <Calendar tasks={tasks} notes={notes} />}
        {tab === 'focus'     && <FocusTimer sessions={sessions} onUpdate={loadData} />}
        {tab === 'progress'  && <ProgressTracker />}
        {tab === 'therapy'   && <FrequencyTherapy />}
        {tab === 'settings'  && <Settings />}
      </main>

      <nav style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'rgba(18, 18, 26, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 50,
      }}>
        {NAV.map(item => {
          const isActive = tab === item.id;
          return (
            <button key={item.id} onClick={() => setTab(item.id as Tab)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '10px 2px 8px', gap: 3,
              color: isActive ? 'var(--accent)' : 'var(--text3)',
              transition: 'color 0.2s',
            }}>
              <div style={{
                fontSize: 18, lineHeight: 1,
                transform: isActive ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.2s',
              }}>
                {item.icon}
              </div>
              <span style={{ fontSize: 8, fontWeight: isActive ? 700 : 400, letterSpacing: 0.3 }}>
                {item.label}
              </span>
              {isActive && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', marginTop: 1 }} />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
