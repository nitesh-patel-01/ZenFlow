'use client';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

export function sendNotification(title: string, body: string, tag?: string) {
  if (Notification.permission !== 'granted') return;
  const n = new Notification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: tag || title,
    requireInteraction: true,
  });
  n.onclick = () => { window.focus(); n.close(); };
}

export function playAlertTone(type: 'task' | 'note' | 'timer' = 'task') {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const frequencies: Record<string, number[]> = {
      task: [523, 659, 784],
      note: [440, 554, 659],
      timer: [784, 988, 1175],
    };
    const freqs = frequencies[type];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.2;
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.4);
    });
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
      sendNotification(
        item.type === 'task' ? '⏰ Task Reminder' : '📝 Note Reminder',
        item.title
      );
      playAlertTone(item.type);
      onNotify(item.id);
    }
  });
}
