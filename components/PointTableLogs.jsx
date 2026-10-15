'use client';
import { useState, useEffect } from 'react';
import { adminFetch } from '../lib/admin-fetch';
import { SQ } from '../lib/data';

function formatTimeAgo(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 45) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PointTableLogs({ refreshTrigger = 0, initialLogs = [] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'manual' | 'auto'

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/logs?category=points&limit=30');
      if (res.ok) {
        const data = await res.json();
        if (data.logs) setLogs(data.logs);
      }
    } catch (err) {
      console.warn('Failed to load point table logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [refreshTrigger]);

  const filteredLogs = logs.filter(l => {
    if (filter === 'manual') return l.action_type === 'POINTS_MANUAL_OVERRIDE';
    if (filter === 'auto') return l.action_type === 'POINTS_RESET_AUTO';
    return true;
  });

  return (
    <div className="pt-logs-box">
      <div className="pt-logs-header">
        <div className="pt-logs-title-wrap">
          <span className="pt-logs-icon">📜</span>
          <div>
            <h4>Point Table Audit Trail</h4>
            <p>Complete historical log of all squad score adjustments, overrides, and auto recalculations.</p>
          </div>
        </div>
        <div className="pt-logs-actions">
          <div className="pt-logs-filters">
            <button
              type="button"
              className={`pt-filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({logs.length})
            </button>
            <button
              type="button"
              className={`pt-filter-btn ${filter === 'manual' ? 'active' : ''}`}
              onClick={() => setFilter('manual')}
            >
              Manual Overrides
            </button>
            <button
              type="button"
              className={`pt-filter-btn ${filter === 'auto' ? 'active' : ''}`}
              onClick={() => setFilter('auto')}
            >
              Auto Syncs
            </button>
          </div>
          <button
            type="button"
            className="pt-reload-btn"
            onClick={fetchLogs}
            disabled={loading}
            title="Refresh Point Table audit logs"
          >
            {loading ? '↻ Loading...' : '🔄 Refresh Logs'}
          </button>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="pt-logs-empty">
          <span>ℹ️</span>
          <p>No point table changes recorded yet. Adjust points above or sync from results to see live logs.</p>
        </div>
      ) : (
        <div className="pt-logs-list">
          {filteredLogs.map((log) => {
            const isManual = log.action_type === 'POINTS_MANUAL_OVERRIDE';
            const details = log.details || {};
            const prev = details.previousPoints || {};
            const next = details.newPoints || {};
            const diffs = details.diffs || {};
            const adminEmail = log.admin_email || 'Unknown Admin';
            const isSuper = log.admin_role === 'super_admin';

            return (
              <div key={log.id || log.created_at + log.summary} className={`pt-log-card ${isManual ? 'manual-type' : 'auto-type'}`}>
                <div className="pt-log-top">
                  <div className="pt-log-admin-info">
                    <span className={`adm-badge-pill ${isSuper ? 'super' : 'admin'}`}>
                      {isSuper ? '👑 SUPER ADMIN' : '🛡️ ADMIN'}
                    </span>
                    <strong className="pt-log-email" title={adminEmail}>{adminEmail}</strong>
                    <span className="pt-log-action-tag">
                      {isManual ? '⚙️ MANUAL OVERRIDE' : '🔄 AUTO RESET'}
                    </span>
                  </div>
                  <div className="pt-log-time" title={log.created_at ? new Date(log.created_at).toLocaleString() : ''}>
                    🕒 {formatTimeAgo(log.created_at)}
                  </div>
                </div>

                <div className="pt-log-summary">
                  {log.summary}
                </div>

                {isManual && next && (
                  <div className="pt-log-squad-diffs">
                    {['Targaryen', 'Stark', 'Lannister'].map((squad) => {
                      const pVal = prev[squad] ?? '-';
                      const nVal = next[squad] ?? '-';
                      const diff = typeof diffs[squad] === 'number' ? diffs[squad] : (Number(nVal) - Number(pVal));
                      const sqColor = SQ[squad]?.c || '#e0a96d';

                      return (
                        <div key={squad} className="pt-squad-diff-pill" style={{ '--sq-c': sqColor }}>
                          <span className="pt-sq-name" style={{ color: sqColor }}>{squad}:</span>
                          <span className="pt-sq-vals">
                            <b>{pVal}</b> ➔ <b>{nVal}</b>
                          </span>
                          {diff !== 0 && !isNaN(diff) && (
                            <span className={`pt-sq-delta ${diff > 0 ? 'pos' : 'neg'}`}>
                              ({diff > 0 ? `+${diff}` : diff} pts)
                            </span>
                          )}
                          {diff === 0 && (
                            <span className="pt-sq-delta neutral">(no change)</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {details.ip && (
                  <div className="pt-log-meta-footer">
                    <span>Client IP: <code>{details.ip}</code></span>
                    {details.userAgent && <span className="pt-ua-snippet" title={details.userAgent}>Device: {details.userAgent.slice(0, 40)}...</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
