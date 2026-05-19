'use client';

import { useState, useMemo } from 'react';
import { Note, generateId, saveNote, deleteNote } from '../lib/db';
import { format } from 'date-fns';

interface NotesProps {
  notes: Note[];
  onUpdate: () => void;
}

const FOLDERS = ['All Notes', 'Work', 'Personal', 'Ideas', 'Journal', 'Research'];

export default function Notes({ notes, onUpdate }: NotesProps) {
  const [showForm, setShowForm] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [form, setForm] = useState({ title: '', content: '', folder: 'All Notes', tags: [] as string[], reminderDate: null as string | null, reminderTime: null as string | null });
  const [tagInput, setTagInput] = useState('');
  const [search, setSearch] = useState('');
  const [folderFilter, setFolderFilter] = useState('all');
  const [viewNote, setViewNote] = useState<Note | null>(null);

  const filtered = useMemo(() => {
    let list = notes;
    if (search) list = list.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()));
    if (folderFilter !== 'all') list = list.filter(n => n.folder === folderFilter);
    return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [notes, search, folderFilter]);

  function openNew() {
    setEditNote(null);
    setForm({ title: '', content: '', folder: 'All Notes', tags: [], reminderDate: null, reminderTime: null });
    setTagInput('');
    setShowForm(true);
  }

  function openEdit(note: Note) {
    setEditNote(note);
    setForm({ title: note.title, content: note.content, folder: note.folder, tags: note.tags, reminderDate: note.reminderDate, reminderTime: note.reminderTime });
    setTagInput('');
    setViewNote(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim() && !form.content.trim()) return;
    const now = new Date().toISOString();
    const note: Note = {
      ...form,
      title: form.title || 'Untitled',
      id: editNote?.id || generateId(),
      createdAt: editNote?.createdAt || now,
      updatedAt: now,
      notified: editNote?.notified || false,
    };
    await saveNote(note);
    onUpdate();
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this note?')) return;
    await deleteNote(id);
    onUpdate();
    setViewNote(null);
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput('');
  }

  const colors = ['#6c63ff', '#22d3a5', '#fbbf24', '#f472b6', '#fb923c', '#60a5fa'];
  const getColor = (id: string) => colors[parseInt(id.slice(-3), 16) % colors.length];

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '20px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Notes</h2>
          <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 2 }}>{notes.length} notes</p>
        </div>
        <button className="btn btn-primary" onClick={openNew} style={{ padding: '10px 16px' }}>+ Note</button>
      </div>

      <div style={{ padding: '12px 16px 0' }}>
        <input placeholder="🔍 Search notes..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 16px 0', overflowX: 'auto' }}>
        <button onClick={() => setFolderFilter('all')} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', background: folderFilter === 'all' ? 'var(--accent)' : 'var(--surface2)', color: folderFilter === 'all' ? 'white' : 'var(--text2)' }}>All</button>
        {FOLDERS.filter(f => f !== 'All Notes').map(f => (
          <button key={f} onClick={() => setFolderFilter(f)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', background: folderFilter === f ? 'var(--accent)' : 'var(--surface2)', color: folderFilter === f ? 'white' : 'var(--text2)' }}>{f}</button>
        ))}
      </div>

      <div style={{ padding: '12px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
            <div>No notes yet</div>
          </div>
        )}
        {filtered.map(note => (
          <div key={note.id} className="card" style={{ borderTop: `3px solid ${getColor(note.id)}`, cursor: 'pointer', padding: '12px' }} onClick={() => setViewNote(note)}>
            <h4 style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title}</h4>
            <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{note.content}</p>
            <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text3)' }}>
              {format(new Date(note.updatedAt), 'MMM d')}
              {note.reminderDate && <span style={{ color: 'var(--accent2)', marginLeft: 6 }}>⏰</span>}
            </div>
          </div>
        ))}
      </div>

      {/* View Note Modal */}
      {viewNote && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={e => { if (e.target === e.currentTarget) setViewNote(null); }}>
          <div style={{ background: 'var(--bg2)', borderRadius: '20px 20px 0 0', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '20px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 700, fontSize: 18 }}>{viewNote.title}</h3>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{format(new Date(viewNote.updatedAt), 'PPpp')}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(viewNote)} style={{ fontSize: 13, color: 'var(--accent)', padding: '6px 12px', background: 'var(--surface)', borderRadius: 8 }}>Edit</button>
                <button onClick={() => handleDelete(viewNote.id)} style={{ fontSize: 13, color: 'var(--red)', padding: '6px 12px', background: 'var(--surface)', borderRadius: 8 }}>Delete</button>
                <button onClick={() => setViewNote(null)} style={{ fontSize: 20, color: 'var(--text3)' }}>✕</button>
              </div>
            </div>
            {viewNote.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {viewNote.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
              </div>
            )}
            {viewNote.reminderDate && (
              <div style={{ padding: '8px 12px', background: 'rgba(108,99,255,0.1)', borderRadius: 8, fontSize: 12, color: 'var(--accent2)', marginBottom: 12 }}>
                ⏰ Reminder: {viewNote.reminderDate} {viewNote.reminderTime}
              </div>
            )}
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{viewNote.content}</p>
          </div>
        </div>
      )}

      {/* Edit/New Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ background: 'var(--bg2)', borderRadius: '20px 20px 0 0', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '20px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 18 }}>{editNote ? 'Edit Note' : 'New Note'}</h3>
              <button onClick={() => setShowForm(false)} style={{ fontSize: 20, color: 'var(--text3)' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Note title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <textarea placeholder="Write your note here..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8} style={{ resize: 'none' }} />
              <select value={form.folder} onChange={e => setForm(f => ({ ...f, folder: e.target.value }))}>
                {FOLDERS.map(f => <option key={f}>{f}</option>)}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Reminder Date</label>
                  <input type="date" value={form.reminderDate || ''} onChange={e => setForm(f => ({ ...f, reminderDate: e.target.value || null }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Reminder Time</label>
                  <input type="time" value={form.reminderTime || ''} onChange={e => setForm(f => ({ ...f, reminderTime: e.target.value || null }))} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder="Add tag..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} style={{ flex: 1 }} />
                  <button className="btn btn-ghost" onClick={addTag}>Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {form.tags.map(tag => <span key={tag} className="tag" style={{ cursor: 'pointer' }} onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))}>{ tag} ✕</span>)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>{editNote ? 'Update' : 'Save Note'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
