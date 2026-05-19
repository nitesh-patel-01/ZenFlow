'use client';

import { Task, Note, FocusSession } from '../lib/db';
import { format } from 'date-fns';

interface DashboardProps {
  tasks: Task[];
  notes: Note[];
  sessions: FocusSession[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ tasks, notes, sessions, onNavigate }: DashboardProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const completedToday = tasks.filter(t => t.completedAt?.startsWith(today)).length;
  const pendingTasks = tasks.filter(t => !t.completed);
  const overdue = pendingTasks.filter(t => t.dueDate && t.dueDate < today);
  const dueToday = pendingTasks.filter(t => t.dueDate === today);
  const totalFocusMin = sessions.reduce((acc, s) => acc + Math.floor(s.duration / 60), 0);
  const focusToday = sessions.filter(s => s.completedAt.startsWith(today)).length;
  const urgentTasks = pendingTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').slice(0, 3);

  const stats = [
    { label: 'Pending', value: pendingTasks.length, color: '#6c63ff', icon: '📋' },
    { label: 'Done Today', value: completedToday, color: '#22d3a5', icon: '✅' },
    { label: 'Overdue', value: overdue.length, color: '#f87171', icon: '⚠️' },
    { label: 'Focus Min', value: totalFocusMin, color: '#fbbf24', icon: '⏱️' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ padding: '0 0 80px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a30 0%, #0f0f1f 100%)',
        padding: '28px 20px 32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 4 }}>
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{greeting} 👋</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>
          {dueToday.length > 0 ? `${dueToday.length} task${dueToday.length > 1 ? 's' : ''} due today` : 'No tasks due today — you\'re clear!'}
        </p>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {stats.map(stat => (
            <div key={stat.label} className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{stat.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Today's Focus */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontWeight: 600, fontSize: 16 }}>⏱ Today's Focus</h3>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => onNavigate('focus')}>
              Start →
            </button>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: `conic-gradient(var(--accent) ${Math.min((focusToday / 8) * 100, 100)}%, var(--surface2) 0)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'var(--accent)',
              }}>
                {focusToday}/8
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{totalFocusMin} minutes total</div>
              <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 2 }}>
                {focusToday} sessions today
              </div>
            </div>
          </div>
        </div>

        {/* Urgent Tasks */}
        {urgentTasks.length > 0 && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontWeight: 600, fontSize: 16 }}>🔥 Priority Tasks</h3>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => onNavigate('tasks')}>
                All tasks →
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {urgentTasks.map(task => (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', background: 'var(--bg3)', borderRadius: 10,
                  borderLeft: `3px solid ${task.priority === 'urgent' ? 'var(--red)' : 'var(--orange)'}`,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{task.title}</div>
                    {task.dueDate && (
                      <div style={{ fontSize: 11, color: task.dueDate < today ? 'var(--red)' : 'var(--text3)', marginTop: 2 }}>
                        {task.dueDate < today ? '⚠ Overdue: ' : '📅 '}{task.dueDate}
                        {task.dueTime ? ` ${task.dueTime}` : ''}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: task.priority === 'urgent' ? 'rgba(248,113,113,0.15)' : 'rgba(251,146,60,0.15)', color: task.priority === 'urgent' ? 'var(--red)' : 'var(--orange)' }}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 14 }}>⚡ Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: '+ New Task', tab: 'tasks', color: 'var(--accent)', icon: '✅' },
              { label: '+ New Note', tab: 'notes', color: '#22d3a5', icon: '📝' },
              { label: 'Start Focus', tab: 'focus', color: '#fbbf24', icon: '🎯' },
              { label: 'Therapy', tab: 'therapy', color: '#f472b6', icon: '🎵' },
            ].map(action => (
              <button key={action.tab} onClick={() => onNavigate(action.tab)} style={{
                padding: '14px',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                color: 'var(--text)',
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{action.icon}</div>
                <div style={{ color: action.color }}>{action.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Notes */}
        {notes.length > 0 && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontWeight: 600, fontSize: 16 }}>📝 Recent Notes</h3>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => onNavigate('notes')}>
                All →
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {notes.slice(0, 3).map(note => (
                <div key={note.id} style={{
                  padding: '10px 12px', background: 'var(--bg3)', borderRadius: 10,
                }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{note.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {note.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
