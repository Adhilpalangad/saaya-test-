'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabase } from '../lib/supabase';
import { adminFetch } from '../lib/admin-fetch';
import { SQ, SQN, DAYS } from '../lib/data';

const DEPTS = ['ME', 'AD', 'ECE', 'EEE', 'CE', 'MCA', 'CSE'];
const DEPT_TO_SQUAD = {
  ME: 'Targaryen', AD: 'Targaryen', ECE: 'Targaryen',
  EEE: 'Stark', CE: 'Stark', MCA: 'Stark',
  CSE: 'Lannister',
};

const DEFAULT_WINNERS = [
  { n: '', d: 'CSE', s: 4, q: 'Lannister', place: 1, pts: 5, isTied: false },
  { n: '', d: 'ME', s: 4, q: 'Targaryen', place: 2, pts: 3, isTied: false },
  { n: '', d: 'EEE', s: 4, q: 'Stark', place: 3, pts: 2, isTied: false },
];

export default function CustomEventsStudio() {
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const [toast, setToast] = useState('');

  // Custom Events State
  const [customEvents, setCustomEvents] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingOriginalName, setEditingOriginalName] = useState('');
  const [eventName, setEventName] = useState('');
  const [category, setCategory] = useState('Special Event');
  const [customCategory, setCustomCategory] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [status, setStatus] = useState('done');
  const [day, setDay] = useState(2);
  const [time, setTime] = useState('02:00 PM - 03:00 PM');
  const [venue, setVenue] = useState('Main Stage');
  const [winners, setWinners] = useState(DEFAULT_WINNERS);
  const [saving, setSaving] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  // Verify authentication & super admin role
  useEffect(() => {
    let active = true;
    const db = getSupabase();

    const checkSession = async (session) => {
      if (!session) {
        if (active) {
          setCurrentUser(null);
          setAuthChecked(true);
        }
        return;
      }
      try {
        const res = await fetch('/api/auth', {
          headers: { Authorization: 'Bearer ' + session.access_token },
        });
        const body = await res.json();
        if (active) {
          if (res.ok && body.user) {
            setCurrentUser(body.user);
            setAuthError('');
          } else {
            setCurrentUser(null);
            if (body.error) setAuthError(body.error);
          }
          setAuthChecked(true);
        }
      } catch {
        if (active) {
          setCurrentUser(null);
          setAuthChecked(true);
        }
      }
    };

    db.auth.getSession().then(({ data }) => checkSession(data.session)).catch(() => {
      if (active) setAuthChecked(true);
    });

    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      checkSession(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch custom events list
  const fetchCustomEvents = async () => {
    setLoadingList(true);
    try {
      const res = await adminFetch('/api/super-admin/custom-events');
      if (res.ok) {
        const data = await res.json();
        setCustomEvents(data.customEvents || []);
      }
    } catch (err) {
      console.warn('Failed to load custom events:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (currentUser?.isSuperAdmin) {
      fetchCustomEvents();
    }
  }, [currentUser]);

  // Sign In handler
  const handleSignIn = async (e) => {
    e.preventDefault();
    setSigningIn(true);
    setAuthError('');
    try {
      const db = getSupabase();
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error.message);
        return;
      }
      if (data?.session) {
        const res = await fetch('/api/auth', {
          headers: { Authorization: 'Bearer ' + data.session.access_token },
        });
        const body = await res.json();
        if (res.ok && body.user) {
          setCurrentUser(body.user);
        } else {
          setAuthError(body.error || 'Failed to verify admin status.');
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Sign in failed.');
    } finally {
      setSigningIn(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await getSupabase().auth.signOut();
      setCurrentUser(null);
      showToast('Signed out.');
    } catch (err) {
      showToast(err.message || 'Error signing out.');
    }
  };

  // Switch between Individual and Group programs
  const handleToggleGroup = (isGroupVal) => {
    setIsGroup(isGroupVal);
    setWinners((prev) =>
      prev.map((w) => {
        const place = w.place || 1;
        const defaultPt = isGroupVal ? (place === 1 ? 10 : place === 2 ? 5 : 3) : (place === 1 ? 5 : place === 2 ? 3 : 2);
        return {
          ...w,
          pts: defaultPt,
        };
      })
    );
  };

  // Winner field changes
  const handleWinnerFieldChange = (idx, field, value) => {
    setWinners((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      if (field === 'd') {
        copy[idx].q = DEPT_TO_SQUAD[value] || 'Targaryen';
        if (value === 'MCA' && copy[idx].s > 4) {
          copy[idx].s = 4;
        }
      }
      return copy;
    });
  };

  // Clear single optional winner
  const handleClearWinner = (idx) => {
    setWinners((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], n: '' };
      return copy;
    });
  };

  // Add tied place
  const handleAddTiedPlace = (targetPlace) => {
    setWinners((prev) => {
      let insertIdx = -1;
      for (let i = 0; i < prev.length; i++) {
        if ((prev[i].place || (i >= 2 ? 3 : i + 1)) === targetPlace) {
          insertIdx = i;
        }
      }
      const defaultDept = targetPlace === 1 ? 'CSE' : targetPlace === 2 ? 'ME' : 'EEE';
      const defaultPts = isGroup ? (targetPlace === 1 ? 10 : targetPlace === 2 ? 5 : 3) : (targetPlace === 1 ? 5 : targetPlace === 2 ? 3 : 2);
      const newCard = {
        n: '',
        d: defaultDept,
        s: 4,
        q: DEPT_TO_SQUAD[defaultDept] || 'Lannister',
        place: targetPlace,
        pts: defaultPts,
        isTied: true,
      };

      if (insertIdx === -1) {
        return [...prev, newCard];
      }
      const copy = [...prev];
      copy.splice(insertIdx + 1, 0, newCard);
      return copy;
    });
  };

  // Remove tied card
  const handleRemoveTiedWinner = (idx) => {
    setWinners((prev) => prev.filter((_, i) => i !== idx));
  };

  // Reset form to blank defaults
  const resetForm = () => {
    setIsEditing(false);
    setEditingOriginalName('');
    setEventName('');
    setCategory('Special Event');
    setCustomCategory('');
    setIsGroup(false);
    setStatus('done');
    setDay(2);
    setTime('02:00 PM - 03:00 PM');
    setVenue('Main Stage');
    setWinners([
      { n: '', d: 'CSE', s: 4, q: 'Lannister', place: 1, pts: 5, isTied: false },
      { n: '', d: 'ME', s: 4, q: 'Targaryen', place: 2, pts: 3, isTied: false },
      { n: '', d: 'EEE', s: 4, q: 'Stark', place: 3, pts: 2, isTied: false },
    ]);
  };

  // Edit custom event
  const handleEditCustomEvent = (eventItem) => {
    setIsEditing(true);
    setEditingOriginalName(eventItem.name);
    setEventName(eventItem.name);
    if (['Special Event', 'On Stage', 'Off Stage', 'Pre Stage'].includes(eventItem.category)) {
      setCategory(eventItem.category);
      setCustomCategory('');
    } else {
      setCategory('Custom');
      setCustomCategory(eventItem.category);
    }
    setIsGroup(Boolean(eventItem.isGroup));
    setStatus(eventItem.status || 'done');
    setVenue(eventItem.venue || 'Main Stage');
    setTime(eventItem.time || '02:00 PM - 03:00 PM');
    setDay(typeof eventItem.day === 'number' ? eventItem.day : 2);

    // Populate winners
    if (Array.isArray(eventItem.winners) && eventItem.winners.length > 0) {
      const populated = [];
      const defaultPts = eventItem.isGroup ? { 1: 10, 2: 5, 3: 3 } : { 1: 5, 2: 3, 3: 2 };
      eventItem.winners.forEach((w, idx) => {
        const place = typeof w.place === 'number' ? w.place : (idx >= 2 ? 3 : idx + 1);
        populated.push({
          n: w.n || w.name || '',
          d: w.d || w.dept || 'CSE',
          s: Number(w.s || w.sem || 4),
          q: w.q || w.squad || DEPT_TO_SQUAD[w.d || w.dept || 'CSE'] || 'Lannister',
          place,
          pts: typeof w.pts === 'number' ? w.pts : (defaultPts[place] || 0),
          isTied: false,
        });

        // Check if tied winners exist
        if (w.tied) {
          const tiedList = Array.isArray(w.tied) ? w.tied : [w.tied];
          tiedList.forEach((t) => {
            if (t && typeof t === 'object') {
              populated.push({
                n: t.n || t.name || '',
                d: t.d || t.dept || 'ME',
                s: Number(t.s || t.sem || 4),
                q: t.q || t.squad || DEPT_TO_SQUAD[t.d || t.dept || 'ME'] || 'Targaryen',
                place,
                pts: typeof t.pts === 'number' ? t.pts : (defaultPts[place] || 0),
                isTied: true,
              });
            }
          });
        }
      });

      // Ensure 3 rows minimum
      if (!populated.some(w => w.place === 2)) {
        populated.push({ n: '', d: 'ME', s: 4, q: 'Targaryen', place: 2, pts: eventItem.isGroup ? 5 : 3, isTied: false });
      }
      if (!populated.some(w => w.place === 3)) {
        populated.push({ n: '', d: 'EEE', s: 4, q: 'Stark', place: 3, pts: eventItem.isGroup ? 3 : 2, isTied: false });
      }
      setWinners(populated);
    } else {
      setWinners(DEFAULT_WINNERS);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Loaded "${eventItem.name}" for editing.`);
  };

  // Delete custom event
  const handleDeleteCustomEvent = async (name) => {
    if (!confirm(`Are you sure you want to permanently delete custom event "${name}"? This will remove its points and winners from the public leaderboard and results.`)) {
      return;
    }

    try {
      const res = await adminFetch('/api/super-admin/custom-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          name,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCustomEvents(data.customEvents || []);
        if (editingOriginalName === name) {
          resetForm();
        }
        showToast(data.message || `Custom event "${name}" deleted.`);
      } else {
        showToast(data.error || 'Failed to delete custom event.');
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete custom event.');
    }
  };

  // Save / Submit custom event
  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = eventName.trim();
    if (!cleanName) {
      showToast('Event name is mandatory.');
      return;
    }

    const primaryFirst = winners.find(w => w.place === 1 && !w.isTied) || winners.find(w => w.place === 1);
    if (!primaryFirst?.n?.trim()) {
      showToast('1st Place party / student name is mandatory.');
      return;
    }

    const finalCategory = category === 'Custom' ? (customCategory.trim() || 'Special Event') : category;

    setSaving(true);
    try {
      const res = await adminFetch('/api/super-admin/custom-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          name: cleanName,
          category: finalCategory,
          isGroup,
          status,
          venue,
          time,
          day: Number(day),
          winners,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCustomEvents(data.customEvents || []);
        showToast(data.message || `Custom event "${cleanName}" saved successfully!`);
        resetForm();
      } else {
        showToast(data.error || 'Failed to save custom event.');
      }
    } catch (err) {
      showToast(err.message || 'Error saving custom event.');
    } finally {
      setSaving(false);
    }
  };

  // Squad point preview calculation
  const squadPreview = { Targaryen: 0, Stark: 0, Lannister: 0 };
  winners.forEach((w) => {
    if (w.n?.trim() && w.q && squadPreview[w.q] !== undefined) {
      const ptVal = Number(w.pts) || 0;
      squadPreview[w.q] += ptVal;
    }
  });

  // Calculate total stats
  const totalCustomEvents = customEvents.length;
  let totalPointsGiven = 0;
  const squadTotals = { Targaryen: 0, Stark: 0, Lannister: 0 };
  customEvents.forEach((ev) => {
    const rawWinners = Array.isArray(ev.winners) ? ev.winners : [];
    const defaultPts = ev.isGroup ? { 1: 10, 2: 5, 3: 3 } : { 1: 5, 2: 3, 2: 2 };
    rawWinners.forEach((w, idx) => {
      const place = w.place || idx + 1;
      const pt = typeof w.pts === 'number' ? w.pts : (defaultPts[place] || 0);
      if (w.q && squadTotals[w.q] !== undefined) {
        squadTotals[w.q] += pt;
        totalPointsGiven += pt;
      }
      if (w.tied) {
        const tiedArr = Array.isArray(w.tied) ? w.tied : [w.tied];
        tiedArr.forEach((t) => {
          const tPt = typeof t.pts === 'number' ? t.pts : pt;
          if (t.q && squadTotals[t.q] !== undefined) {
            squadTotals[t.q] += tPt;
            totalPointsGiven += tPt;
          }
        });
      }
    });
  });

  const leadingSquad = Object.entries(squadTotals).sort((a, b) => b[1] - a[1])[0];

  // 1. Loading State
  if (!authChecked) {
    return (
      <div className="adm-wrap">
        <div className="ces-loading-card">
          <div className="ces-spinner" />
          <p>Verifying Super Administrator credentials...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!currentUser) {
    return (
      <div className="adm-wrap">
        <div className="adm-login-card">
          <div className="adm-shield-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            👑
          </div>
          <h2 style={{ margin: '0 0 6px' }}>Super Admin Authentication</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.86rem', margin: '0 0 20px' }}>
            Sign in with your Super Administrator account to access the Custom Events Studio.
          </p>
          <form onSubmit={handleSignIn} className="adm-form">
            <input
              type="email"
              placeholder="superadmin@saaya.fest"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="adm-input"
            />
            <input
              type="password"
              placeholder="Super Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="adm-input"
            />
            {authError && <p className="adm-err">{authError}</p>}
            <button
              type="submit"
              disabled={signingIn}
              className="adm-btn"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#000', fontWeight: 800 }}
            >
              {signingIn ? 'Verifying Super Admin...' : 'Sign In as Super Admin'}
            </button>
            <div style={{ marginTop: 12 }}>
              <Link href="/admin" className="adm-back-link">&larr; Go to Standard Admin Portal</Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 3. Regular Admin Forbidden State (RBAC Restriction)
  if (!currentUser.isSuperAdmin) {
    return (
      <div className="adm-wrap">
        <div className="ces-restricted-card">
          <div className="ces-restricted-icon">🔒</div>
          <h2>Super Administrator Access Required</h2>
          <p>
            Custom Events Creation &amp; Manual Point Distribution is an exclusive governance feature reserved strictly for <b>Super Administrators</b>.
          </p>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>
            Signed in as: <b>{currentUser.email}</b> (Role: <code>{currentUser.role}</code>)
          </p>
          <div className="ces-restricted-actions">
            <Link href="/admin" className="adm-btn" style={{ textDecoration: 'none', display: 'inline-block', width: 'auto' }}>
              &larr; Return to Admin Portal
            </Link>
            <button type="button" onClick={handleSignOut} className="adm-logout-btn">
              Sign In with Different Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Super Admin Studio Main View
  return (
    <div className="adm-wrap">
      {/* Top Header & Breadcrumbs */}
      <div className="adm-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="ces-breadcrumb-link">
              <Link href="/admin">&larr; Admin Portal</Link>
            </span>
            <span style={{ color: 'var(--muted)' }}>/</span>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Custom Events Studio</h1>
            <span className="adm-badge-pill super">👑 SUPER ADMIN EXCLUSIVE</span>
          </div>
          <p style={{ marginTop: 6, marginBottom: 0, color: 'var(--muted)', fontSize: '0.88rem' }}>
            Create and publish custom festival events, record manual participants/parties, and allocate squad points with full leaderboard synchronization.
          </p>
        </div>
        <div className="adm-head-actions">
          <Link href="/admin" className="adm-logout-btn">
            🛡️ Admin Panel
          </Link>
          <Link href="/results" className="adm-view-btn" target="_blank">
            🏆 Hall of Fame &rarr;
          </Link>
          <button onClick={handleSignOut} className="adm-logout-btn">
            Log Out
          </button>
        </div>
      </div>

      {toast && <div className="adm-toast">{toast}</div>}

      {/* Hero Banner with Stats */}
      <div className="spa-hero-banner" style={{ marginBottom: 28 }}>
        <div className="spa-hero-content">
          <div className="spa-hero-badge">
            <span>✨</span> MANUAL EVENT &amp; RESULTS GENERATOR
          </div>
          <h2>Custom Events &amp; Manual Point Engine</h2>
          <p>
            Unlike pre-set schedule events, custom events allow super admins to define any event title, program category, and manual parties on-the-fly. 1st place is mandatory, 2nd &amp; 3rd are optional, with seamless support for tied rankings and direct squad scores.
          </p>
        </div>
        <div className="spa-hero-stat-pills">
          <div className="spa-stat-pill">
            <span className="spa-stat-num">{totalCustomEvents}</span>
            <span className="spa-stat-lbl">Custom Events</span>
          </div>
          <div className="spa-stat-pill">
            <span className="spa-stat-num" style={{ color: '#10b981' }}>{totalPointsGiven}</span>
            <span className="spa-stat-lbl">Pts Awarded</span>
          </div>
          <div className="spa-stat-pill">
            <span className="spa-stat-num" style={{ color: leadingSquad ? SQ[leadingSquad[0]]?.c : '#fbbf24' }}>
              {leadingSquad ? `${leadingSquad[0].slice(0, 4)} (${leadingSquad[1]})` : '—'}
            </span>
            <span className="spa-stat-lbl">Top Squad</span>
          </div>
        </div>
      </div>

      {/* FORM SECTION: CREATE / EDIT CUSTOM EVENT */}
      <div className="adm-section" style={{ marginBottom: 32 }}>
        <div className="adm-section-head">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ margin: 0 }}>
                {isEditing ? `✏️ Edit Custom Event: "${editingOriginalName}"` : '✨ Add New Custom Event'}
              </h2>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="adm-clear-win-btn"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  &times; Cancel Edit (Create New)
                </button>
              )}
            </div>
            <p>
              Fill in the event details and winners. Only 1st place is mandatory. Squads are automatically mapped from the selected department.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* STEP 1: EVENT METADATA */}
          <div className="ces-card-section">
            <div className="ces-card-title">
              <span>01</span> Basic Event Details
            </div>
            <div className="ces-grid-row">
              <div style={{ gridColumn: 'span 2' }}>
                <label className="adm-label">
                  Event Name <span style={{ color: '#e0453b' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Battle of the Bands, FIFA Gaming Championship, Tug of War..."
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  className="adm-input"
                  style={{ fontSize: '1.05rem', fontWeight: 600 }}
                />
              </div>

              <div>
                <label className="adm-label">Event Category / Stage</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="adm-select"
                >
                  <option value="Special Event">⭐ Special Event (Default)</option>
                  <option value="On Stage">🎭 On Stage</option>
                  <option value="Off Stage">🎨 Off Stage</option>
                  <option value="Pre Stage">🎵 Pre Stage</option>
                  <option value="Custom">✏️ Other / Custom Category...</option>
                </select>
                {category === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom category name..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                    className="adm-input"
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>

              <div>
                <label className="adm-label">Event Live Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="adm-select"
                >
                  <option value="done">✓ Done / Awarded (Leaderboard Enabled)</option>
                  <option value="live">● Live Now (Showcase Banner)</option>
                  <option value="upcoming">⏳ Upcoming</option>
                </select>
              </div>

              <div>
                <label className="adm-label">Festival Day</label>
                <select
                  value={day}
                  onChange={(e) => setDay(Number(e.target.value))}
                  className="adm-select"
                >
                  {DAYS.map((dName, dIdx) => (
                    <option key={dIdx} value={dIdx}>
                      Day {dIdx + 1} &middot; {dName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="adm-label">Time Slot</label>
                <input
                  type="text"
                  placeholder="e.g. 02:00 PM - 03:30 PM"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="adm-input"
                />
              </div>

              <div>
                <label className="adm-label">Venue / Stage Location</label>
                <input
                  type="text"
                  placeholder="e.g. Main Auditorium, Seminar Hall, Open Ground..."
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="adm-input"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: PROGRAM TYPE & POINTS SCHEME */}
          <div className="adm-prog-type-wrap" style={{ marginTop: 20 }}>
            <label className="adm-sublabel" style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--heading)' }}>
              Program Classification &amp; Scoring Scheme
            </label>
            <div className="adm-type-toggle">
              <button
                type="button"
                className={`adm-type-btn ${!isGroup ? 'active' : ''}`}
                onClick={() => handleToggleGroup(false)}
              >
                <b>👤 Individual Program</b>
                <span className="adm-pts-tag">Standard scheme: 1st: 5 pts &middot; 2nd: 3 pts &middot; 3rd: 2 pts (editable per party below)</span>
              </button>
              <button
                type="button"
                className={`adm-type-btn ${isGroup ? 'active' : ''}`}
                onClick={() => handleToggleGroup(true)}
              >
                <b>👥 Group Program</b>
                <span className="adm-pts-tag">Standard scheme: 1st: 10 pts &middot; 2nd: 5 pts &middot; 3rd: 3 pts (editable per party below)</span>
              </button>
            </div>
          </div>

          {/* STEP 3: WINNERS & PARTY DETAILS */}
          <div className="ces-card-section" style={{ marginTop: 20 }}>
            <div className="ces-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span>02</span> Parties / Winners &amp; Points Awarded
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--muted)' }}>
                1st place is mandatory &middot; 2nd &amp; 3rd are optional
              </div>
            </div>

            <div className="adm-winners-inputs">
              {winners.map((w, idx) => {
                const place = typeof w.place === 'number' ? w.place : (idx >= 2 ? 3 : idx + 1);
                const isTied = Boolean(w.isTied);
                const isPrimaryFirst = place === 1 && !isTied;
                const maxSem = w.d === 'MCA' ? 4 : 8;
                const squadColor = SQ[w.q]?.c || '#e0453b';

                return (
                  <div
                    key={idx}
                    className={`adm-winner-row ${isPrimaryFirst ? 'adm-win-req' : isTied ? `adm-win-tied adm-win-tied-${place}` : 'adm-win-opt'}`}
                  >
                    <div className="adm-win-head">
                      <div className="adm-win-badge" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>0{place} &middot; {place === 1 ? '1st Place' : place === 2 ? '2nd Place' : '3rd Place'}</span>
                        {isTied && <span style={{ color: '#fbbf24' }}>(Tied / Shared)</span>}
                        <span className="ces-squad-tag" style={{ borderColor: squadColor, color: squadColor }}>
                          ● {w.q}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`adm-win-status-tag ${isPrimaryFirst ? 'req' : isTied ? `tied tied-${place}` : 'opt'}`}>
                          {isPrimaryFirst ? '★ MANDATORY' : isTied ? `TIED ${place === 1 ? '1ST' : place === 2 ? '2ND' : '3RD'}` : 'OPTIONAL'}
                        </span>
                        {!isPrimaryFirst && !isTied && w.n && (
                          <button
                            type="button"
                            onClick={() => handleClearWinner(idx)}
                            className="adm-clear-win-btn"
                            title="Clear party"
                          >
                            &times; Clear
                          </button>
                        )}
                        {isTied && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTiedWinner(idx)}
                            className="adm-clear-win-btn"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                            title="Remove tied party"
                          >
                            &times; Remove Tied
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="adm-win-fields" style={{ gridTemplateColumns: '2fr 1.2fr 1fr 1fr' }}>
                      {/* Name / Party */}
                      <div>
                        <label className="adm-sublabel">
                          Party / Candidate Name {isPrimaryFirst ? <span style={{ color: '#e0453b' }}>*</span> : <span style={{ opacity: 0.6 }}>(Optional)</span>}
                        </label>
                        <input
                          type="text"
                          placeholder={isPrimaryFirst ? 'Candidate or Team Name (Mandatory)' : 'Party / Student Name (Leave blank if none)'}
                          value={w.n}
                          onChange={(e) => handleWinnerFieldChange(idx, 'n', e.target.value)}
                          required={isPrimaryFirst}
                          className="adm-input"
                        />
                      </div>

                      {/* Department */}
                      <div>
                        <label className="adm-sublabel">Department</label>
                        <select
                          value={w.d}
                          onChange={(e) => handleWinnerFieldChange(idx, 'd', e.target.value)}
                          className="adm-select"
                        >
                          {DEPTS.map((d) => (
                            <option key={d} value={d}>
                              {d} ({DEPT_TO_SQUAD[d]})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Semester */}
                      <div>
                        <label className="adm-sublabel">Semester (S1-S{maxSem})</label>
                        <select
                          value={w.s}
                          onChange={(e) => handleWinnerFieldChange(idx, 's', parseInt(e.target.value, 10))}
                          className="adm-select"
                        >
                          {Array.from({ length: maxSem }, (_, i) => i + 1).map((s) => (
                            <option key={s} value={s}>
                              S{s}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Points */}
                      <div>
                        <label className="adm-sublabel">Points Awarded</label>
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={w.pts ?? (isGroup ? (place === 1 ? 10 : place === 2 ? 5 : 3) : (place === 1 ? 5 : place === 2 ? 3 : 2))}
                          onChange={(e) => handleWinnerFieldChange(idx, 'pts', Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className="adm-input"
                          style={{ fontWeight: 700, color: '#fbbf24' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TIED CARDS ACTION BAR */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              <button
                type="button"
                onClick={() => handleAddTiedPlace(1)}
                className="adm-add-tied-btn tied-btn-1"
              >
                + Add Tied 1st Place Card
              </button>
              <button
                type="button"
                onClick={() => handleAddTiedPlace(2)}
                className="adm-add-tied-btn tied-btn-2"
              >
                + Add Tied 2nd Place Card
              </button>
              <button
                type="button"
                onClick={() => handleAddTiedPlace(3)}
                className="adm-add-tied-btn tied-btn-3"
              >
                + Add Tied 3rd Place Card
              </button>
            </div>
          </div>

          {/* SQUAD IMPACT LIVE PREVIEW */}
          <div className="ces-preview-bar">
            <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--heading)' }}>
              ⚡ Real-Time Score Impact:
            </span>
            {SQN.map((squad) => (
              <div key={squad} className="ces-preview-item">
                <span className="ces-dot" style={{ background: SQ[squad].c }} />
                <span>{squad}:</span>
                <b style={{ color: squadPreview[squad] > 0 ? '#10b981' : 'var(--muted)' }}>
                  +{squadPreview[squad]} pts
                </b>
              </div>
            ))}
          </div>

          {/* SUBMIT BUTTON */}
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button
              type="submit"
              disabled={saving}
              className="adm-btn"
              style={{
                flex: 1,
                padding: '14px 28px',
                fontSize: '0.95rem',
                background: 'linear-gradient(135deg, #e0453b, #b91c1c)',
              }}
            >
              {saving ? 'Saving Custom Event...' : (isEditing ? '💾 Update Custom Event & Recalculate Scores' : '💾 Create Custom Event & Add to Leaderboard')}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="adm-logout-btn"
                style={{ padding: '14px 24px' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* SECTION: EXISTING CUSTOM EVENTS */}
      <div className="adm-section">
        <div className="adm-section-head">
          <div>
            <h2>Existing Custom Events ({customEvents.length})</h2>
            <p>
              These events were created manually by super admins. They are automatically integrated into the public Results (Hall of Fame) and Leaderboard.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={fetchCustomEvents}
              disabled={loadingList}
              className="spa-sec-btn"
              title="Refresh custom events list"
            >
              {loadingList ? '↻ Loading...' : '🔄 Refresh List'}
            </button>
          </div>
        </div>

        {loadingList && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)' }}>
            Fetching custom events...
          </div>
        )}

        {!loadingList && customEvents.length === 0 && (
          <div className="spa-empty-box" style={{ padding: '40px 20px' }}>
            <span className="spa-empty-icon">🎪</span>
            <h3>No Custom Events Created Yet</h3>
            <p>
              Use the studio above to add your first custom or off-schedule event. Custom events will instantly update squad scores and appear on the Hall of Fame.
            </p>
          </div>
        )}

        {!loadingList && customEvents.length > 0 && (
          <div className="ces-events-grid">
            {customEvents.map((ev) => {
              const rawWinners = Array.isArray(ev.winners) ? ev.winners : [];
              const p1s = rawWinners.filter(w => (w.place || 1) === 1);
              const p2s = rawWinners.filter(w => (w.place || 2) === 2);
              const p3s = rawWinners.filter(w => (w.place || 3) === 3);

              let evTotalPts = 0;
              rawWinners.forEach(w => {
                const pt = typeof w.pts === 'number' ? w.pts : (ev.isGroup ? 10 : 5);
                evTotalPts += pt;
                if (w.tied) {
                  const tiedArr = Array.isArray(w.tied) ? w.tied : [w.tied];
                  tiedArr.forEach(t => {
                    evTotalPts += typeof t.pts === 'number' ? t.pts : pt;
                  });
                }
              });

              return (
                <div key={ev.name} className="ces-event-card">
                  <div className="ces-card-top">
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className="ces-cat-pill">{ev.category}</span>
                      <span className={`ces-prog-pill ${ev.isGroup ? 'group' : 'ind'}`}>
                        {ev.isGroup ? '👥 Group' : '👤 Individual'}
                      </span>
                    </div>
                    <span className={`adm-ev-badge ${ev.status || 'done'}`}>
                      {ev.status === 'live' ? '● LIVE' : ev.status === 'done' ? '✓ DONE' : 'UPCOMING'}
                    </span>
                  </div>

                  <h3 className="ces-event-name">{ev.name}</h3>

                  <div className="ces-meta-row">
                    {ev.venue && <span>📍 {ev.venue}</span>}
                    {ev.time && <span>⏰ {ev.time}</span>}
                    {typeof ev.day === 'number' && <span>📅 Day {ev.day + 1}</span>}
                  </div>

                  {/* Winners Summary */}
                  <div className="ces-winners-list">
                    {p1s.map((w, i) => (
                      <div key={i} className="ces-win-pill p1">
                        <b>1st:</b>
                        <span>{w.n}</span>
                        <span className="ces-win-dept">({w.d} &middot; S{w.s})</span>
                        <span className="ces-win-sq" style={{ color: SQ[w.q]?.c }}>{w.q}</span>
                        <span className="ces-win-pts">+{w.pts ?? (ev.isGroup ? 10 : 5)} pts</span>
                      </div>
                    ))}
                    {p2s.map((w, i) => (
                      <div key={i} className="ces-win-pill p2">
                        <b>2nd:</b>
                        <span>{w.n}</span>
                        <span className="ces-win-dept">({w.d} &middot; S{w.s})</span>
                        <span className="ces-win-sq" style={{ color: SQ[w.q]?.c }}>{w.q}</span>
                        <span className="ces-win-pts">+{w.pts ?? (ev.isGroup ? 5 : 3)} pts</span>
                      </div>
                    ))}
                    {p3s.map((w, i) => (
                      <div key={i} className="ces-win-pill p3">
                        <b>3rd:</b>
                        <span>{w.n}</span>
                        <span className="ces-win-dept">({w.d} &middot; S{w.s})</span>
                        <span className="ces-win-sq" style={{ color: SQ[w.q]?.c }}>{w.q}</span>
                        <span className="ces-win-pts">+{w.pts ?? (ev.isGroup ? 3 : 2)} pts</span>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="ces-card-footer">
                    <span className="ces-total-pts-tag">
                      Total Awarded: <b>{evTotalPts} pts</b>
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleEditCustomEvent(ev)}
                        className="ces-edit-btn"
                        title="Edit event"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomEvent(ev.name)}
                        className="adm-del-btn"
                        title="Delete custom event"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
