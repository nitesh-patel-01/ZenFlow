'use client';

import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../lib/db';
import { requestNotificationPermission } from '../lib/notifications';

export default function Settings() {
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifPerm, setNotifPerm] = useState('default');
  const [userName, setUserName] = useState('');
  const [theme, setTheme] = useState('dark');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNotifPerm(Notification.permission);
      setNotifEnabled(Notification.permission === 'granted');
    }
    getSetting('user_name', '').then(v => setUserName(v as string));
    getSetting('theme', 'dark').then(v => setTheme(v as string));
  }, []);

  async function enableNotifications() {
    const granted = await requestNotificationPermission();
    setNotifEnabled(granted);
    setNotifPerm(granted ? 'granted' : 'denied');
  }

  async function handleSave() {
    await setSetting('user_name', userName);
    await setSetting('theme', theme);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function exportData() {
    const allData = {
      tasks: JSON.parse(localStorage.getItem('zenflow_tasks') || '[]'),
      notes: JSON.parse(localStorage.getItem('zenflow_notes') || '[]'),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'zenflow-backup.json'; a.click();
    URL.revokeObjectURL(url);
  }

  const sections = [
    {
      title: 'Profile',
      icon: '👤',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 12, color: 'var(--text3)' }}>Your Name</label>
          <input placeholder="Enter your name" value={userName} onChange={e => setUserName(e.target.value)} />
        </div>
      )
    },
    {
      title: 'Notifications',
      icon: '🔔',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Browser Notifications</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                Status: <span style={{ color: notifPerm === 'granted' ? 'var(--green)' : notifPerm === 'denied' ? 'var(--red)' : 'var(--yellow)' }}>{notifPerm}</span>
              </div>
            </div>
            {notifPerm !== 'granted' && (
              <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 12 }} onClick={enableNotifications}>
                Enable
              </button>
            )}
            {notifPerm === 'granted' && <span style={{ color: 'var(--green)', fontSize: 18 }}>✅</span>}
          </div>
          {notifPerm === 'denied' && (
            <div style={{ padding: '10px', background: 'rgba(248,113,113,0.1)', borderRadius: 8, fontSize: 12, color: 'var(--red)' }}>
              Notifications blocked. Please enable in browser/device settings.
            </div>
          )}
          <div style={{ padding: '10px', background: 'rgba(108,99,255,0.08)', borderRadius: 8, fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
            💡 For alarms to ring when the app is in the background, install ZenFlow as a PWA and keep it open in a tab.
          </div>
        </div>
      )
    },
    {
      title: 'PWA Install',
      icon: '📱',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            Install ZenFlow on your device for the best experience and reliable alarms:
          </p>
          <div style={{ padding: '12px', background: 'var(--bg3)', borderRadius: 10, fontSize: 12, color: 'var(--text2)', lineHeight: 1.8 }}>
            <strong style={{ color: 'var(--accent2)' }}>iOS Safari:</strong> Tap Share → Add to Home Screen<br />
            <strong style={{ color: 'var(--accent2)' }}>Android Chrome:</strong> Menu → Add to Home screen<br />
            <strong style={{ color: 'var(--accent2)' }}>Desktop Chrome:</strong> Click install icon in address bar
          </div>
        </div>
      )
    },
    {
      title: 'Data',
      icon: '💾',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>All data is stored locally on your device</p>
          <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={exportData}>
            📥 Export Data as JSON
          </button>
          <button className="btn btn-danger" style={{ justifyContent: 'center' }} onClick={() => {
            if (confirm('Clear ALL data? This cannot be undone!')) {
              indexedDB.deleteDatabase('zenflow-db');
              window.location.reload();
            }
          }}>
            🗑 Clear All Data
          </button>
        </div>
      )
    },
    {
      title: 'About',
      icon: '💫',
      content: (
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)', marginBottom: 6 }}>ZenFlow v1.0</div>
          <p>All-in-one productivity & wellness app. Built with Next.js, Tailwind CSS, IndexedDB, Web Audio API, and Web Notifications.</p>
          <div style={{ marginTop: 10, padding: '10px', background: 'var(--bg3)', borderRadius: 8, fontSize: 11 }}>
            <div>✅ 100% offline capable</div>
            <div>✅ No backend required</div>
            <div>✅ PWA installable</div>
            <div>✅ Local data storage</div>
          </div>

          {/* Developer Contact */}
          <div style={{ marginTop: 16, padding: '14px', background: 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(34,211,165,0.08))', borderRadius: 12, border: '1px solid rgba(108,99,255,0.2)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent2)', marginBottom: 10 }}>🧑‍💻 Developer</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>👤</span>
                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>Nitesh Patel</span>
              </div>
              <a
                href="tel:7974823298"
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', textDecoration: 'none', fontSize: 13 }}
              >
                <span style={{ fontSize: 15 }}>📞</span>
                <span>7974823298</span>
              </a>
              <a
                href="mailto:niteshpatel7479@gmail.com"
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', textDecoration: 'none', fontSize: 13 }}
              >
                <span style={{ fontSize: 15 }}>✉️</span>
                <span>niteshpatel7479@gmail.com</span>
              </a>
            </div>
          </div>

          <div style={{ marginTop: 10, textAlign: 'center', fontSize: 11, color: 'var(--text3)' }}>
            Made with ❤️ by Nitesh
          </div>
        </div>
      )
    }
  ];

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '20px 16px 16px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Settings</h2>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sections.map(section => (
          <div key={section.title} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>{section.icon}</span>
              <h3 style={{ fontWeight: 600, fontSize: 16 }}>{section.title}</h3>
            </div>
            {section.content}
          </div>
        ))}

        <button className="btn btn-primary" style={{ justifyContent: 'center', padding: '14px' }} onClick={handleSave}>
          {saved ? '✅ Saved!' : '💾 Save Settings'}
        </button>
      </div>
    </div>
  );
}
