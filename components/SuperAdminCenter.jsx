'use client';
import { useState, useEffect } from 'react';
import { adminFetch } from '../lib/admin-fetch';
import { EV, SQ, SQN } from '../lib/data';

function formatTimestamp(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatTimeAgo(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 30) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function SuperAdminCenter({ currentUser, showToast }) {
  const [activeSubTab, setActiveSubTab] = useState('logs'); // 'logs' | 'admins' | 'analytics' | 'lockdown'
  
  // Audit Logs State
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logLoading, setLogLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [adminFilter, setAdminFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [stats, setStats] = useState(null);

  // Admins Management State
  const [adminsList, setAdminsList] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('admin');
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Lockdown State
  const [isLockedDown, setIsLockedDown] = useState(false);
  const [lockdownReason, setLockdownReason] = useState('');
  const [savingLockdown, setSavingLockdown] = useState(false);

  // Fetch Audit Logs
  const fetchLogs = async () => {
    setLogLoading(true);
    try {
      const params = new URLSearchParams({
        category: categoryFilter,
        limit: '150',
      });
      if (adminFilter) params.append('admin', adminFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await adminFetch(`/api/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalLogs(data.total || 0);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.warn('Failed to load logs:', err);
      showToast?.('Error loading audit logs.');
    } finally {
      setLogLoading(false);
    }
  };

  // Fetch Admins List
  const fetchAdmins = async () => {
    setAdminsLoading(true);
    try {
      const res = await adminFetch('/api/super-admin/admins');
      if (res.ok) {
        const data = await res.json();
        setAdminsList(data.admins || []);
      }
    } catch (err) {
      console.warn('Failed to load admins:', err);
    } finally {
      setAdminsLoading(false);
    }
  };

  // Fetch Lockdown Setting
  const fetchLockdown = async () => {
    try {
      const res = await fetch('/api/super-admin/system');
      if (res.ok) {
        const data = await res.json();
        setIsLockedDown(Boolean(data.isLockedDown));
        if (data.reason) setLockdownReason(data.reason);
      }
    } catch (err) {
      console.warn('Failed to load system settings:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [categoryFilter, adminFilter]);

  useEffect(() => {
    if (activeSubTab === 'admins') fetchAdmins();
    if (activeSubTab === 'lockdown') fetchLockdown();
  }, [activeSubTab]);

  // Handle Search submit
  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  // Export logs to CSV
  const exportToCSV = () => {
    if (!logs.length) {
      showToast?.('No logs to export.');
      return;
    }
    const headers = ['Timestamp', 'Admin Email', 'Admin Role', 'Action', 'Entity', 'Summary', 'Details'];
    const rows = logs.map(l => [
      `"${l.created_at || ''}"`,
      `"${l.admin_email || ''}"`,
      `"${l.admin_role || ''}"`,
      `"${l.action_type || ''}"`,
      `"${(l.entity_name || '').replace(/"/g, '""')}"`,
      `"${(l.summary || '').replace(/"/g, '""')}"`,
      `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `saaya_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Audit logs exported as CSV.');
  };

  // Export logs to JSON
  const exportToJSON = () => {
    if (!logs.length) {
      showToast?.('No logs to export.');
      return;
    }
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `saaya_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Audit logs exported as JSON.');
  };

  // Purge logs (Super Admin only)
  const handlePurgeLogs = async () => {
    if (!confirm('DANGER: Are you sure you want to completely purge the audit log history? This action is permanent and will be logged.')) {
      return;
    }
    try {
      const res = await adminFetch('/api/logs', { method: 'DELETE' });
      if (res.ok) {
        showToast?.('Audit log history purged.');
        fetchLogs();
      } else {
        const d = await res.json();
        showToast?.(d.error || 'Failed to purge logs.');
      }
    } catch (err) {
      showToast?.(err.message || 'Error purging logs.');
    }
  };

  // Add new admin
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newUserId.trim()) {
      showToast?.('User UUID is required.');
      return;
    }
    setAddingAdmin(true);
    try {
      const res = await adminFetch('/api/super-admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_admin',
          userId: newUserId.trim(),
          email: newEmail.trim() || undefined,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast?.(`Administrator ${newEmail || newUserId} added successfully!`);
        setNewUserId('');
        setNewEmail('');
        fetchAdmins();
      } else {
        showToast?.(data.error || 'Failed to add administrator.');
      }
    } catch (err) {
      showToast?.(err.message || 'Error adding admin.');
    } finally {
      setAddingAdmin(false);
    }
  };

  // Update admin role
  const handleRoleToggle = async (userId, currentRole) => {
    const nextRole = currentRole === 'super_admin' ? 'admin' : 'super_admin';
    const actionLabel = nextRole === 'super_admin' ? 'promote this user to Super Admin' : 'demote this user to regular Admin';
    if (!confirm(`Are you sure you want to ${actionLabel}?`)) return;

    try {
      const res = await adminFetch('/api/super-admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_role',
          userId,
          role: nextRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast?.(data.message || 'Role updated.');
        fetchAdmins();
      } else {
        showToast?.(data.error || 'Failed to update role.');
      }
    } catch (err) {
      showToast?.(err.message || 'Error updating role.');
    }
  };

  // Remove admin
  const handleRemoveAdmin = async (userId, adminEmail) => {
    if (!confirm(`Are you sure you want to remove administrator access for ${adminEmail || userId}?`)) return;
    try {
      const res = await adminFetch('/api/super-admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_admin',
          userId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast?.('Administrator removed.');
        fetchAdmins();
      } else {
        showToast?.(data.error || 'Failed to remove admin.');
      }
    } catch (err) {
      showToast?.(err.message || 'Error removing admin.');
    }
  };

  // Toggle lockdown
  const handleSaveLockdown = async () => {
    setSavingLockdown(true);
    try {
      const res = await adminFetch('/api/super-admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isLockedDown: !isLockedDown,
          reason: lockdownReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsLockedDown(Boolean(data.isLockedDown));
        showToast?.(data.message || 'System lockdown updated.');
      } else {
        showToast?.(data.error || 'Failed to update lockdown.');
      }
    } catch (err) {
      showToast?.(err.message || 'Error updating lockdown.');
    } finally {
      setSavingLockdown(false);
    }
  };

  const getActionBadgeColor = (action = '') => {
    if (action.startsWith('POINTS_')) return 'badge-points';
    if (action.startsWith('EVENT_STATUS')) return 'badge-event';
    if (action.startsWith('EVENT_WINNERS')) return 'badge-results';
    if (action.startsWith('GALLERY_')) return 'badge-gallery';
    if (action.startsWith('ADMIN_')) return 'badge-admin';
    if (action.startsWith('LOCKDOWN') || action.startsWith('LOGS_')) return 'badge-system';
    return 'badge-default';
  };

  return (
    <div className="spa-center-wrap">
      {/* Super Admin Center Banner */}
      <div className="spa-hero-banner">
        <div className="spa-hero-content">
          <div className="spa-hero-badge">
            <span className="spa-crown-icon">👑</span> SUPER ADMIN CONTROL SUITE
          </div>
          <h2>Central Governance, Audit Intelligence &amp; Access Controls</h2>
          <p>
            Track real-time admin actions across the portal, verify point modifications, manage team privileges, and secure live festival operations.
          </p>
        </div>
        <div className="spa-hero-stat-pills">
          <div className="spa-stat-pill">
            <span className="spa-stat-num">{totalLogs}</span>
            <span className="spa-stat-lbl">Actions Logged</span>
          </div>
          <div className="spa-stat-pill">
            <span className="spa-stat-num">{adminsList.length || '•'}</span>
            <span className="spa-stat-lbl">Administrators</span>
          </div>
          <div className="spa-stat-pill">
            <span className={`spa-stat-num ${isLockedDown ? 'danger' : 'success'}`}>
              {isLockedDown ? '🔒 LOCKED' : '⚡ LIVE'}
            </span>
            <span className="spa-stat-lbl">System Status</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="spa-subtabs">
        <button
          className={`spa-subtab ${activeSubTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('logs')}
        >
          📜 Audit Logs Explorer
        </button>
        <button
          className={`spa-subtab ${activeSubTab === 'admins' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('admins')}
        >
          👥 Administrator Access
        </button>
        <button
          className={`spa-subtab ${activeSubTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('analytics')}
        >
          📊 Central Analytics
        </button>
        <button
          className={`spa-subtab ${activeSubTab === 'lockdown' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('lockdown')}
        >
          🔒 Emergency Controls
        </button>
      </div>

      {/* ===================== SUBTAB 1: AUDIT LOGS EXPLORER ===================== */}
      {activeSubTab === 'logs' && (
        <div className="spa-tab-content">
          <div className="spa-controls-card">
            <div className="spa-category-chips">
              {[
                { id: 'all', label: 'All Activity' },
                { id: 'points', label: '📊 Point Table' },
                { id: 'events', label: '🔴 Live Events' },
                { id: 'results', label: '🏆 Results & Winners' },
                { id: 'gallery', label: '🖼️ Gallery' },
                { id: 'admins', label: '👥 Admin Access' },
                { id: 'system', label: '⚙️ System' },
              ].map(cat => (
                <button
                  key={cat.id}
                  className={`spa-chip ${categoryFilter === cat.id ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="spa-search-export-row">
              <form onSubmit={handleSearch} className="spa-search-form">
                <input
                  type="text"
                  placeholder="Search logs by admin email, action, or summary..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="spa-search-input"
                />
                <button type="submit" className="spa-search-btn">Search</button>
                {searchQuery && (
                  <button
                    type="button"
                    className="spa-clear-btn"
                    onClick={() => { setSearchQuery(''); fetchLogs(); }}
                  >
                    Clear
                  </button>
                )}
              </form>

              <div className="spa-export-buttons">
                <button type="button" onClick={exportToCSV} className="spa-sec-btn">
                  📥 Export CSV
                </button>
                <button type="button" onClick={exportToJSON} className="spa-sec-btn">
                  📥 Export JSON
                </button>
                <button
                  type="button"
                  onClick={fetchLogs}
                  disabled={logLoading}
                  className="spa-sec-btn refresh-btn"
                  title="Reload live logs"
                >
                  {logLoading ? '↻' : '🔄 Refresh'}
                </button>
                <button type="button" onClick={handlePurgeLogs} className="spa-danger-btn" title="Purge historical logs">
                  🗑️ Purge Logs
                </button>
              </div>
            </div>
          </div>

          {/* Logs List Stream */}
          <div className="spa-logs-stream">
            {logLoading && <div className="spa-loading-bar">Fetching latest audit trail...</div>}

            {!logLoading && logs.length === 0 && (
              <div className="spa-empty-box">
                <span className="spa-empty-icon">🔍</span>
                <h3>No audit logs found</h3>
                <p>No actions match the selected filter criteria. When administrators modify live events, record results, adjust squad points, or upload photos, their actions will appear here in real time.</p>
              </div>
            )}

            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const isSuper = log.admin_role === 'super_admin';
              const badgeClass = getActionBadgeColor(log.action_type);
              const details = log.details || {};

              return (
                <div key={log.id || log.created_at + log.summary} className={`spa-log-card ${badgeClass}`}>
                  <div className="spa-log-card-header">
                    <div className="spa-log-identity">
                      <span className={`adm-badge-pill ${isSuper ? 'super' : 'admin'}`}>
                        {isSuper ? '👑 SUPER ADMIN' : '🛡️ ADMIN'}
                      </span>
                      <strong className="spa-log-email" title={log.admin_email}>
                        {log.admin_email}
                      </strong>
                      <span className={`spa-action-pill ${badgeClass}`}>
                        {log.action_type}
                      </span>
                    </div>
                    <div className="spa-log-time-block">
                      <span className="spa-time-ago">{formatTimeAgo(log.created_at)}</span>
                      <small className="spa-exact-time">{formatTimestamp(log.created_at)}</small>
                    </div>
                  </div>

                  <div className="spa-log-summary-row">
                    <div className="spa-summary-text">
                      {log.summary}
                    </div>
                    <button
                      type="button"
                      className="spa-toggle-details-btn"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    >
                      {isExpanded ? '▲ Hide Details' : '▼ Inspect Data'}
                    </button>
                  </div>

                  {/* Highlights for Point changes */}
                  {details.diffs && (
                    <div className="spa-quick-diff-row">
                      {SQN.map(sq => {
                        const d = details.diffs[sq];
                        if (d === undefined || d === null) return null;
                        const prevVal = details.previousPoints?.[sq] ?? '-';
                        const newVal = details.newPoints?.[sq] ?? '-';
                        return (
                          <span key={sq} className="spa-quick-diff-item" style={{ color: SQ[sq]?.c }}>
                            <b>{sq}</b>: {prevVal} ➔ {newVal} ({d >= 0 ? `+${d}` : d})
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Highlights for Winners */}
                  {details.winners && Array.isArray(details.winners) && (
                    <div className="spa-quick-winners-row">
                      {details.winners.map((w, idx) => (
                        <span key={idx} className="spa-quick-win-tag">
                          #{w.place} {w.name} ({w.dept} · {w.squad})
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Highlights for Event status */}
                  {details.status && (
                    <div className="spa-quick-status-row">
                      <span>Status changed: <code>{details.eventName}</code> ➔ <b>{details.status.toUpperCase()}</b></span>
                    </div>
                  )}

                  {/* Detailed inspection view */}
                  {isExpanded && (
                    <div className="spa-inspect-drawer">
                      <div className="spa-inspect-meta-grid">
                        <div>
                          <small>ADMIN ID / UUID</small>
                          <code>{log.admin_id || 'N/A'}</code>
                        </div>
                        <div>
                          <small>CLIENT IP ADDRESS</small>
                          <code>{details.ip || 'Localhost / Masked'}</code>
                        </div>
                        <div>
                          <small>ENTITY</small>
                          <span>{log.entity_type ? `${log.entity_type} (${log.entity_name || 'N/A'})` : 'Global'}</span>
                        </div>
                        <div>
                          <small>DEVICE / BROWSER</small>
                          <span className="spa-ua-text">{details.userAgent || 'Modern Web Browser'}</span>
                        </div>
                      </div>

                      <div className="spa-json-preview">
                        <small>FULL PAYLOAD DETAILS (JSON)</small>
                        <pre>{JSON.stringify(details, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== SUBTAB 2: ADMIN USER MANAGEMENT ===================== */}
      {activeSubTab === 'admins' && (
        <div className="spa-tab-content">
          <div className="spa-admins-layout">
            {/* Admins Roster Table */}
            <div className="spa-admins-roster">
              <div className="spa-section-head">
                <div>
                  <h3>Authorized Administrators ({adminsList.length})</h3>
                  <p>Accounts with administrative privileges to manage events, results, and point distributions.</p>
                </div>
                <button
                  type="button"
                  onClick={fetchAdmins}
                  className="spa-sec-btn"
                  disabled={adminsLoading}
                >
                  {adminsLoading ? 'Refreshing...' : '🔄 Refresh Roster'}
                </button>
              </div>

              <div className="spa-table-card">
                <table className="spa-table">
                  <thead>
                    <tr>
                      <th>Administrator</th>
                      <th>Role</th>
                      <th>User ID</th>
                      <th>Access Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminsList.map((admin) => {
                      const isSuper = admin.role === 'super_admin';
                      const isCurrent = admin.isCurrentUser;

                      return (
                        <tr key={admin.userId} className={isCurrent ? 'spa-current-user-row' : ''}>
                          <td>
                            <div className="spa-admin-cell">
                              <span className="spa-admin-avatar">
                                {isSuper ? '👑' : '🛡️'}
                              </span>
                              <div>
                                <strong>{admin.email}</strong>
                                {isCurrent && <span className="spa-you-badge">YOU</span>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`adm-badge-pill ${isSuper ? 'super' : 'admin'}`}>
                              {isSuper ? '👑 SUPER ADMIN' : '🛡️ ADMIN'}
                            </span>
                          </td>
                          <td>
                            <code className="spa-uuid-code" title={admin.userId}>
                              {admin.userId.slice(0, 12)}...
                            </code>
                          </td>
                          <td>
                            <span className="spa-status-active">● Active</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="spa-admin-actions">
                              <button
                                type="button"
                                className="spa-role-btn"
                                onClick={() => handleRoleToggle(admin.userId, admin.role)}
                                title={isSuper ? 'Demote to standard Admin' : 'Promote to Super Admin'}
                              >
                                {isSuper ? 'Demote to Admin' : '👑 Promote to Super Admin'}
                              </button>
                              {!isCurrent && (
                                <button
                                  type="button"
                                  className="spa-del-admin-btn"
                                  onClick={() => handleRemoveAdmin(admin.userId, admin.email)}
                                  title="Revoke administrator privileges"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Admin Form Card */}
            <div className="spa-add-admin-card">
              <h3>➕ Add Administrator</h3>
              <p>Authorize a registered Supabase Auth account as an administrator or super administrator.</p>

              <form onSubmit={handleAddAdmin} className="spa-add-form">
                <label className="adm-label">Supabase User UUID <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  required
                  className="adm-input"
                />

                <label className="adm-label" style={{ marginTop: 12 }}>Administrator Email</label>
                <input
                  type="email"
                  placeholder="e.g. organizer@saaya.fest"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="adm-input"
                />

                <label className="adm-label" style={{ marginTop: 12 }}>Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="adm-select"
                >
                  <option value="admin">🛡️ Regular Administrator</option>
                  <option value="super_admin">👑 Super Administrator (Full Governance)</option>
                </select>

                <div className="spa-role-explainer">
                  {newRole === 'super_admin' ? (
                    <small>👑 <b>Super Admin</b> has access to Audit Logs, User Privileges, System Lockdown, and full event data.</small>
                  ) : (
                    <small>🛡️ <b>Regular Admin</b> can update live event statuses, save results/winners, and adjust squad scores.</small>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={addingAdmin}
                  className="adm-btn"
                  style={{ marginTop: 18 }}
                >
                  {addingAdmin ? 'Granting Access...' : 'Grant Administrator Access'}
                </button>
              </form>

              <div className="spa-help-box">
                <h4>💡 How to find the UUID:</h4>
                <ol>
                  <li>Open your <b>Supabase Dashboard</b>.</li>
                  <li>Go to <b>Authentication &rarr; Users</b>.</li>
                  <li>Click <b>Add User</b> to create their email/password.</li>
                  <li>Copy their <b>User UID</b> and paste it into the field above.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SUBTAB 3: CENTRAL ANALYTICS ===================== */}
      {activeSubTab === 'analytics' && (
        <div className="spa-tab-content">
          <div className="spa-analytics-grid">
            <div className="spa-analytics-card">
              <h3>🏆 Squad Leaderboard Breakdown</h3>
              <p>Squad point shares and historical changes.</p>
              <div className="spa-squad-analytics-list">
                {SQN.map(sq => {
                  const s = SQ[sq];
                  return (
                    <div key={sq} className="spa-squad-stat-item" style={{ borderLeftColor: s.c }}>
                      <div>
                        <strong style={{ color: s.c, fontSize: '1.1rem' }}>{sq}</strong>
                        <small style={{ display: 'block', color: 'var(--muted)' }}>{s.d.join(' · ')}</small>
                      </div>
                      <span className="spa-squad-badge" style={{ background: `${s.c}20`, color: s.c }}>
                        Active Squad
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="spa-analytics-card">
              <h3>👥 Most Active Administrators</h3>
              <p>Contributors ranked by volume of recorded website actions.</p>
              {stats?.topAdmins?.length ? (
                <div className="spa-top-admins-list">
                  {stats.topAdmins.map((item, idx) => (
                    <div key={item.email} className="spa-top-admin-row">
                      <div className="spa-top-admin-rank">#{idx + 1}</div>
                      <div className="spa-top-admin-email">{item.email}</div>
                      <div className="spa-top-admin-count">
                        <b>{item.count}</b> actions
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--muted)', marginTop: 12 }}>No activity logged yet.</p>
              )}
            </div>

            <div className="spa-analytics-card spa-span-2">
              <h3>📈 Activity Breakdown by Category</h3>
              <div className="spa-cat-counts-grid">
                <div className="spa-cat-stat-card">
                  <span className="spa-cat-icon">📊</span>
                  <b>{stats?.actionCounts?.points || 0}</b>
                  <span>Point Table Adjustments</span>
                </div>
                <div className="spa-cat-stat-card">
                  <span className="spa-cat-icon">🔴</span>
                  <b>{stats?.actionCounts?.events || 0}</b>
                  <span>Event Live Status Toggles</span>
                </div>
                <div className="spa-cat-stat-card">
                  <span className="spa-cat-icon">🏆</span>
                  <b>{stats?.actionCounts?.results || 0}</b>
                  <span>Results &amp; Winner Saves</span>
                </div>
                <div className="spa-cat-stat-card">
                  <span className="spa-cat-icon">🖼️</span>
                  <b>{stats?.actionCounts?.gallery || 0}</b>
                  <span>Gallery Photo Changes</span>
                </div>
                <div className="spa-cat-stat-card">
                  <span className="spa-cat-icon">👥</span>
                  <b>{stats?.actionCounts?.admins || 0}</b>
                  <span>Admin Access Events</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SUBTAB 4: EMERGENCY CONTROLS ===================== */}
      {activeSubTab === 'lockdown' && (
        <div className="spa-tab-content">
          <div className="spa-lockdown-box">
            <div className={`spa-lockdown-status-banner ${isLockedDown ? 'active' : 'inactive'}`}>
              <div className="spa-lockdown-icon">
                {isLockedDown ? '🚨' : '🛡️'}
              </div>
              <div>
                <h3>
                  {isLockedDown ? 'EMERGENCY LOCKDOWN IS ACTIVE' : 'System Operating in Standard Open Mode'}
                </h3>
                <p>
                  {isLockedDown
                    ? 'Non-super administrators are restricted from publishing results or making score changes. Useful during grand finale announcements.'
                    : 'All authorized administrators have regular edit permissions.'}
                </p>
              </div>
            </div>

            <div className="spa-lockdown-controls">
              <label className="adm-label">Lockdown Announcement / Reason</label>
              <input
                type="text"
                placeholder="e.g. Results under final review by Fest Jury. Scoring temporarily frozen."
                value={lockdownReason}
                onChange={(e) => setLockdownReason(e.target.value)}
                className="adm-input"
              />

              <div style={{ marginTop: 24, display: 'flex', gap: 14 }}>
                <button
                  type="button"
                  onClick={handleSaveLockdown}
                  disabled={savingLockdown}
                  className={`adm-btn ${isLockedDown ? 'spa-btn-revert' : 'spa-btn-lock'}`}
                >
                  {savingLockdown
                    ? 'Updating System...'
                    : isLockedDown
                    ? '🔓 Deactivate Lockdown (Restore Normal Mode)'
                    : '🔒 Activate Emergency Lockdown'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
