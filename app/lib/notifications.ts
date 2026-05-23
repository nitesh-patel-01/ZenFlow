'use client';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

// Use SW showNotification for proper OS-level notification (shows in system tray / home screen)
export async function sendNotification(title: string, body: string, tag?: string) {
  if (Notification.permission !== 'granted') return;
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        tag: tag || title,
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300],
      } as NotificationOptions);
      return;
    } catch { /* fallback */ }
  }
  const n = new Notification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: tag || title,
    requireInteraction: true,
  });
  n.onclick = () => { window.focus(); n.close(); };
}

// 20-second looping alarm using Web Audio API
let alarmStopFn: (() => void) | null = null;

export function stopAlarm() {
  if (alarmStopFn) { alarmStopFn(); alarmStopFn = null; }
}

export function playAlertTone(type: 'task' | 'note' | 'timer' = 'task') {
  // Stop any existing alarm first
  stopAlarm();
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    let stopped = false;

    // Patterns per type: [freq, duration_sec]
    const patterns: Record<string, [number, number][]> = {
      task:  [[880, 0.3], [0, 0.15], [880, 0.3], [0, 0.15], [1100, 0.6], [0, 0.5]],
      note:  [[660, 0.25], [0, 0.1], [880, 0.25], [0, 0.1], [1050, 0.5], [0, 0.5]],
      timer: [[1046, 0.2], [0, 0.1], [1046, 0.2], [0, 0.1], [1319, 0.2], [0, 0.1], [1568, 0.6], [0, 0.6]],
    };

    const pat = patterns[type];
    const patDuration = pat.reduce((s, [, d]) => s + d, 0);
    const totalDuration = 20; // seconds
    const oscillators: OscillatorNode[] = [];

    function scheduleCycle(startTime: number) {
      if (stopped) return;
      let t = startTime;
      pat.forEach(([freq, dur]) => {
        if (freq > 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.5, t + 0.01);
          gain.gain.setValueAtTime(0.5, t + dur - 0.02);
          gain.gain.linearRampToValueAtTime(0, t + dur);
          osc.start(t);
          osc.stop(t + dur);
          oscillators.push(osc);
        }
        t += dur;
      });
    }

    // Schedule repeated cycles for 20 seconds
    const cycles = Math.ceil(totalDuration / patDuration);
    for (let i = 0; i < cycles; i++) {
      scheduleCycle(ctx.currentTime + i * patDuration);
    }

    // Auto stop after 20s
    const autoStop = setTimeout(() => {
      stopped = true;
      oscillators.forEach(o => { try { o.stop(); } catch { /* ignore */ } });
      ctx.close();
      alarmStopFn = null;
    }, totalDuration * 1000);

    alarmStopFn = () => {
      stopped = true;
      clearTimeout(autoStop);
      oscillators.forEach(o => { try { o.stop(); } catch { /* ignore */ } });
      ctx.close();
      alarmStopFn = null;
    };

  } catch { /* ignore */ }
}

// ── Background notification scheduling via Service Worker ──────────────────
// Posts all upcoming reminders to the SW so it can fire them even when the
// page/tab is closed (works as long as the browser process is running).
export async function scheduleRemindersInSW(
  items: Array<{
    id: string;
    title: string;
    fireAt: number; // timestamp ms
    type: 'task' | 'note';
  }>
) {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg.active) {
      reg.active.postMessage({ type: 'SCHEDULE_REMINDERS', reminders: items });
    }
  } catch { /* ignore */ }
}

export function checkAndNotify(
  items: Array<{
    id: string;
    title: string;
    dueDate?: string | null;
    dueTime?: string | null;
    reminderDate?: string | null;
    reminderTime?: string | null;
    reminderMinutes?: number;
    completed?: boolean;
    notified?: boolean;
    type: 'task' | 'note';
  }>,
  onNotify: (id: string) => void
) {
  const now = new Date();
  items.forEach((item) => {
    if (item.notified) return;
    if (item.completed) return;

    let targetDate: Date | null = null;

    if (item.type === 'task' && item.dueDate && item.dueTime) {
      targetDate = new Date(`${item.dueDate}T${item.dueTime}`);
      if (item.reminderMinutes && item.reminderMinutes > 0) {
        targetDate = new Date(targetDate.getTime() - item.reminderMinutes * 60 * 1000);
      }
    } else if (item.type === 'note' && item.reminderDate && item.reminderTime) {
      targetDate = new Date(`${item.reminderDate}T${item.reminderTime}`);
    }

    if (targetDate && now >= targetDate) {
      const label = item.type === 'task' ? '⏰ Task Reminder' : '📝 Note Reminder';
      sendNotification(label, item.title, item.id);
      playAlertTone(item.type);
      onNotify(item.id);
    }
  });
}

// Build the full list of upcoming reminder schedules and push to SW
export async function syncRemindersToSW(
  tasks: Array<{
    id: string; title: string; dueDate?: string | null; dueTime?: string | null;
    reminderMinutes?: number; completed?: boolean; notified?: boolean;
  }>,
  notes: Array<{
    id: string; title: string; reminderDate?: string | null; reminderTime?: string | null;
    notified?: boolean;
  }>
) {
  const now = Date.now();
  const upcoming: Array<{ id: string; title: string; fireAt: number; type: 'task' | 'note' }> = [];

  tasks.forEach(t => {
    if (t.completed || t.notified || !t.dueDate || !t.dueTime) return;
    let fireAt = new Date(`${t.dueDate}T${t.dueTime}`).getTime();
    if (t.reminderMinutes && t.reminderMinutes > 0) fireAt -= t.reminderMinutes * 60 * 1000;
    if (fireAt > now) upcoming.push({ id: t.id, title: t.title, fireAt, type: 'task' });
  });

  notes.forEach(n => {
    if (n.notified || !n.reminderDate || !n.reminderTime) return;
    const fireAt = new Date(`${n.reminderDate}T${n.reminderTime}`).getTime();
    if (fireAt > now) upcoming.push({ id: n.id, title: n.title, fireAt, type: 'note' });
  });

  await scheduleRemindersInSW(upcoming);
}
