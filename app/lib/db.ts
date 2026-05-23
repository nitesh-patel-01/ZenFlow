'use client';

import { openDB, IDBPDatabase } from 'idb';

export interface Task {
  id: string;
  title: string;
  description: string;
  folder: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string | null;
  dueTime: string | null;
  recurring: 'none' | 'daily' | 'weekly' | 'monthly';
  reminderMinutes: number;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  notified: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folder: string;
  reminderDate: string | null;
  reminderTime: string | null;
  createdAt: string;
  updatedAt: string;
  notified: boolean;
}

export interface FocusSession {
  id: string;
  type: 'focus' | 'short_break' | 'long_break';
  duration: number;
  completedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // yyyy-MM-dd
  completedAt: string;
}

export interface Settings {
  key: string;
  value: unknown;
}

let db: IDBPDatabase | null = null;

export async function getDB() {
  if (db) return db;
  db = await openDB('zenflow-db', 2, {
    upgrade(database, oldVersion) {
      if (oldVersion < 1) {
        if (!database.objectStoreNames.contains('tasks')) {
          const taskStore = database.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('folder', 'folder');
          taskStore.createIndex('priority', 'priority');
          taskStore.createIndex('completed', 'completed');
          taskStore.createIndex('dueDate', 'dueDate');
        }
        if (!database.objectStoreNames.contains('notes')) {
          const noteStore = database.createObjectStore('notes', { keyPath: 'id' });
          noteStore.createIndex('folder', 'folder');
        }
        if (!database.objectStoreNames.contains('focus_sessions')) {
          database.createObjectStore('focus_sessions', { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains('settings')) {
          database.createObjectStore('settings', { keyPath: 'key' });
        }
      }
      if (oldVersion < 2) {
        if (!database.objectStoreNames.contains('habits')) {
          database.createObjectStore('habits', { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains('habit_logs')) {
          const logStore = database.createObjectStore('habit_logs', { keyPath: 'id' });
          logStore.createIndex('habitId', 'habitId');
          logStore.createIndex('date', 'date');
        }
      }
    },
  });
  return db;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ── Tasks ────────────────────────────────────────────────────────────────────
export async function getTasks(): Promise<Task[]> {
  const database = await getDB();
  return database.getAll('tasks');
}
export async function saveTask(task: Task): Promise<void> {
  const database = await getDB();
  await database.put('tasks', task);
}
export async function deleteTask(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('tasks', id);
}

// ── Notes ────────────────────────────────────────────────────────────────────
export async function getNotes(): Promise<Note[]> {
  const database = await getDB();
  return database.getAll('notes');
}
export async function saveNote(note: Note): Promise<void> {
  const database = await getDB();
  await database.put('notes', note);
}
export async function deleteNote(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('notes', id);
}

// ── Focus Sessions ───────────────────────────────────────────────────────────
export async function getFocusSessions(): Promise<FocusSession[]> {
  const database = await getDB();
  return database.getAll('focus_sessions');
}
export async function saveFocusSession(session: FocusSession): Promise<void> {
  const database = await getDB();
  await database.put('focus_sessions', session);
}

// ── Habits ───────────────────────────────────────────────────────────────────
export async function getHabits(): Promise<Habit[]> {
  const database = await getDB();
  return database.getAll('habits');
}
export async function saveHabit(habit: Habit): Promise<void> {
  const database = await getDB();
  await database.put('habits', habit);
}
export async function deleteHabit(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('habits', id);
}

// ── Habit Logs ───────────────────────────────────────────────────────────────
export async function getHabitLogs(): Promise<HabitLog[]> {
  const database = await getDB();
  return database.getAll('habit_logs');
}
export async function saveHabitLog(log: HabitLog): Promise<void> {
  const database = await getDB();
  await database.put('habit_logs', log);
}
export async function deleteHabitLog(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('habit_logs', id);
}

// ── Settings ─────────────────────────────────────────────────────────────────
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const database = await getDB();
    const result = await database.get('settings', key);
    return result ? (result.value as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}
export async function setSetting(key: string, value: unknown): Promise<void> {
  const database = await getDB();
  await database.put('settings', { key, value });
}
