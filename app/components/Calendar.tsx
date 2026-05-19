'use client';

import { useState, useMemo } from 'react';
import { Task, Note } from '../lib/db';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO, addMonths, subMonths } from 'date-fns';

interface CalendarProps {
  tasks: Task[];
  notes: Note[];
}

export default function Calendar({ tasks, notes }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const firstDayOfWeek = startOfMonth(currentMonth).getDay();

  function getTasksForDate(date: Date): Task[] {
    return tasks.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), date));
  }

  function getNotesForDate(date: Date): Note[] {
    return notes.filter(n => n.reminderDate && isSameDay(parseISO(n.reminderDate), date));
  }

  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : [];
  const selectedNotes = selectedDate ? getNotesForDate(selectedDate) : [];

  const PRIORITY_COLORS: Record<string, string> = {
    low: '#22d3a5', medium: '#fbbf24', high: '#fb923c', urgent: '#f87171'
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '20px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Calendar</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ padding: '6px 12px', background: 'var(--surface2)', borderRadius: 8, color: 'var(--text)' }}>‹</button>
          <span style={{ fontSize: 14, fontWeight: 600, minWidth: 100, textAlign: 'center' }}>{format(currentMonth, 'MMM yyyy')}</span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ padding: '6px 12px', background: 'var(--surface2)', borderRadius: 8, color: 'var(--text)' }}>›</button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', padding: '4px 0', fontWeight: 600 }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
          {days.map(day => {
            const dayTasks = getTasksForDate(day);
            const dayNotes = getNotesForDate(day);
            const hasItems = dayTasks.length > 0 || dayNotes.length > 0;
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const todayDay = isToday(day);

            return (
              <button key={day.toISOString()} onClick={() => setSelectedDate(day)} style={{
                aspectRatio: '1',
                borderRadius: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: isSelected ? 'var(--accent)' : todayDay ? 'rgba(108,99,255,0.2)' : 'var(--surface)',
                border: `1px solid ${isSelected ? 'var(--accent)' : todayDay ? 'var(--accent)' : 'var(--border)'}`,
                color: isSelected ? 'white' : todayDay ? 'var(--accent2)' : 'var(--text)',
                fontSize: 13,
                fontWeight: todayDay || isSelected ? 700 : 400,
                position: 'relative',
                padding: '4px',
              }}>
                <span>{format(day, 'd')}</span>
                {hasItems && (
                  <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                    {dayTasks.slice(0, 2).map(t => (
                      <div key={t.id} style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.8)' : PRIORITY_COLORS[t.priority] }} />
                    ))}
                    {dayNotes.slice(0, 1).map(n => (
                      <div key={n.id} style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.8)' : '#60a5fa' }} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day details */}
      {selectedDate && (
        <div style={{ padding: '0 16px' }}>
          <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 12, color: 'var(--accent2)' }}>
            {format(selectedDate, 'EEEE, MMMM d')}
          </h3>

          {selectedTasks.length === 0 && selectedNotes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text3)', fontSize: 14 }}>
              Nothing scheduled — enjoy the free day! ✨
            </div>
          )}

          {selectedTasks.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8, fontWeight: 600 }}>TASKS</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedTasks.map(task => (
                  <div key={task.id} className="card" style={{ padding: '12px 14px', borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`, opacity: task.completed ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14, textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</div>
                        {task.dueTime && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>🕐 {task.dueTime}</div>}
                      </div>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${PRIORITY_COLORS[task.priority]}20`, color: PRIORITY_COLORS[task.priority] }}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedNotes.length > 0 && (
            <div>
              <h4 style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8, fontWeight: 600 }}>NOTE REMINDERS</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedNotes.map(note => (
                  <div key={note.id} className="card" style={{ padding: '12px 14px', borderLeft: '3px solid #60a5fa' }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{note.title}</div>
                    {note.reminderTime && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>🕐 {note.reminderTime}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
