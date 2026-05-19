'use client';

import { useState, useMemo } from 'react';
import { Task, generateId, saveTask, deleteTask } from '../lib/db';
import { format } from 'date-fns';

interface TaskManagerProps {
  tasks: Task[];
  onUpdate: () => void;
}

const FOLDERS = ['Inbox', 'Work', 'Personal', 'Health', 'Learning', 'Projects'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const PRIORITY_COLORS: Record<string, string> = {
  low: '#22d3a5', medium: '#fbbf24', high: '#fb923c', urgent: '#f87171'
};
const RECURRINGS = ['none', 'daily', 'weekly', 'monthly'] as const;

type FilterTab = 'all' | 'today' | 'upcoming' | 'completed';

const emptyTask = (): Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'notified'> => ({
  title: '', description: '', folder: 'Inbox', tags: [], priority: 'medium',
  dueDate: null, dueTime: null, recurring: 'none', reminderMinutes: 15,
  completed: false, completedAt: null,
});

export default function TaskManager({ tasks, onUpdate }: TaskManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyTask());
  const [tagInput, setTagInput] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [folderFilter, setFolderFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  const filtered = useMemo(() => {
    let list = tasks;
    if (search) list = list.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())));
    if (folderFilter !== 'all') list = list.filter(t => t.folder === folderFilter);
    if (priorityFilter !== 'all') list = list.filter(t => t.priority === priorityFilter);
    if (filter === 'today') list = list.filter(t => !t.completed && t.dueDate === today);
    else if (filter === 'upcoming') list = list.filter(t => !t.completed && t.dueDate && t.dueDate > today);
    else if (filter === 'completed') list = list.filter(t => t.completed);
    else list = list.filter(t => !t.completed);
    return list.sort((a, b) => {
      const po = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (po[a.priority] - po[b.priority]) || (a.dueDate || '').localeCompare(b.dueDate || '');
    });
  }, [tasks, search, folderFilter, priorityFilter, filter, today]);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  function openNew() {
    setEditTask(null);
    setForm(emptyTask());
    setTagInput('');
    setShowForm(true);
  }

  function openEdit(t: Task) {
    setEditTask(t);
    setForm({ title: t.title, description: t.description, folder: t.folder, tags: t.tags, priority: t.priority, dueDate: t.dueDate, dueTime: t.dueTime, recurring: t.recurring, reminderMinutes: t.reminderMinutes, completed: t.completed, completedAt: t.completedAt });
    setTagInput('');
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    const now = new Date().toISOString();
    const task: Task = {
      ...form,
      id: editTask?.id || generateId(),
      createdAt: editTask?.createdAt || now,
      updatedAt: now,
      notified: editTask?.notified || false,
    };
    await saveTask(task);
    onUpdate();
    setShowForm(false);
  }

  async function handleToggle(task: Task) {
    await saveTask({
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    });
    onUpdate();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this task?')) return;
    await deleteTask(id);
    onUpdate();
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm(f => ({ ...f, tags: [...f.tags, t] }));
    }
    setTagInput('');
  }

  const isOverdue = (task: Task) => !task.completed && task.dueDate && task.dueDate < today;

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Tasks</h2>
          <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 2 }}>{completedCount}/{totalCount} completed</p>
        </div>
        <button className="btn btn-primary" onClick={openNew} style={{ padding: '10px 16px' }}>+ Add Task</button>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 2 }}>
          <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 2, width: `${totalCount ? (completedCount / totalCount) * 100 : 0}%`, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px 0' }}>
        <input placeholder="🔍 Search tasks, tags..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 16px 0', overflowX: 'auto' }}>
        {(['all', 'today', 'upcoming', 'completed'] as FilterTab[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
            background: filter === f ? 'var(--accent)' : 'var(--surface2)',
            color: filter === f ? 'white' : 'var(--text2)',
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Sub-filters */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 16px 0', overflowX: 'auto' }}>
        <select value={folderFilter} onChange={e => setFolderFilter(e.target.value)} style={{ width: 'auto', padding: '4px 10px', fontSize: 12 }}>
          <option value="all">All Folders</option>
          {FOLDERS.map(f => <option key={f}>{f}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ width: 'auto', padding: '4px 10px', fontSize: 12 }}>
          <option value="all">All Priorities</option>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Task List */}
      <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div>No tasks found</div>
          </div>
        )}
        {filtered.map(task => (
          <div key={task.id} className="card" style={{
            borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
            opacity: task.completed ? 0.6 : 1,
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <button onClick={() => handleToggle(task)} style={{
                width: 22, height: 22, borderRadius: '50%', marginTop: 1, flexShrink: 0,
                border: `2px solid ${task.completed ? 'var(--accent)' : 'var(--border)'}`,
                background: task.completed ? 'var(--accent)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white',
              }}>
                {task.completed && '✓'}
              </button>
              <div style={{ flex: 1, minWidth: 0 }} onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}>
                <div style={{ fontWeight: 500, fontSize: 14, textDecoration: task.completed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.title}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{task.folder}</span>
                  {task.dueDate && (
                    <span style={{ fontSize: 11, color: isOverdue(task) ? 'var(--red)' : 'var(--text3)' }}>
                      {isOverdue(task) ? '⚠' : '📅'} {task.dueDate}{task.dueTime ? ` ${task.dueTime}` : ''}
                    </span>
                  )}
                  {task.recurring !== 'none' && <span style={{ fontSize: 10, color: 'var(--accent2)' }}>🔄 {task.recurring}</span>}
                  {task.tags.map(tag => <span key={tag} className="tag" style={{ fontSize: 10 }}>{tag}</span>)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => openEdit(task)} style={{ padding: '4px 8px', fontSize: 13, color: 'var(--text3)' }}>✏️</button>
                <button onClick={() => handleDelete(task.id)} style={{ padding: '4px 8px', fontSize: 13, color: 'var(--text3)' }}>🗑</button>
              </div>
            </div>

            {expandedId === task.id && task.description && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                {task.description}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'flex-end', zIndex: 100,
        }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{
            background: 'var(--bg2)', borderRadius: '20px 20px 0 0', width: '100%',
            maxHeight: '90vh', overflowY: 'auto', padding: '20px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 18 }}>{editTask ? 'Edit Task' : 'New Task'}</h3>
              <button onClick={() => setShowForm(false)} style={{ fontSize: 20, color: 'var(--text3)' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Task title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ resize: 'none' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Folder</label>
                  <select value={form.folder} onChange={e => setForm(f => ({ ...f, folder: e.target.value }))}>
                    {FOLDERS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as typeof form.priority }))}>
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Due Date</label>
                  <input type="date" value={form.dueDate || ''} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value || null }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Time</label>
                  <input type="time" value={form.dueTime || ''} onChange={e => setForm(f => ({ ...f, dueTime: e.target.value || null }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Recurring</label>
                  <select value={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.value as typeof form.recurring }))}>
                    {RECURRINGS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Remind (min before)</label>
                  <select value={form.reminderMinutes} onChange={e => setForm(f => ({ ...f, reminderMinutes: Number(e.target.value) }))}>
                    {[0, 5, 10, 15, 30, 60, 120].map(m => <option key={m} value={m}>{m === 0 ? 'At time' : `${m} min`}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Tags</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder="Add tag..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} style={{ flex: 1 }} />
                  <button className="btn btn-ghost" onClick={addTag} style={{ whiteSpace: 'nowrap' }}>Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {form.tags.map(tag => (
                    <span key={tag} className="tag" style={{ cursor: 'pointer' }} onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))}>
                      {tag} ✕
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>
                  {editTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
