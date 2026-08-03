import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// ── Category → icon + colour mapping ─────────────────────────────────────────
const CATEGORY_META = {
  company_register: { icon: '🏢', color: '#2563EB', bg: '#EFF6FF' },
  company_approved: { icon: '✅', color: '#059669', bg: '#ECFDF5' },
  company_rejected: { icon: '❌', color: '#DC2626', bg: '#FEF2F2' },
  drive_posted:     { icon: '📋', color: '#7C3AED', bg: '#F5F3FF' },
  drive_approved:   { icon: '🚀', color: '#059669', bg: '#ECFDF5' },
  drive_rejected:   { icon: '🚫', color: '#DC2626', bg: '#FEF2F2' },
  student_placed:   { icon: '🎉', color: '#D97706', bg: '#FFFBEB' },
  student_blacklisted: { icon: '⛔', color: '#DC2626', bg: '#FEF2F2' },
  info:             { icon: '💡', color: '#0F766E', bg: '#F0FDFA' },
};

const getMeta = (category) => CATEGORY_META[category] || CATEGORY_META.info;

// ── Exported hook for pages to get unread count ─────────────────────────
export const useNotificationCount = () => {
  const { isAuthenticated } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    if (!isAuthenticated) return;
    api.get('/auth/notifications/unread-count')
      .then(r => setCount(r.data?.count || 0))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 20000); // poll every 20 s
    return () => clearInterval(t);
  }, [refresh]);

  return { count, refresh };
};

// ── Main Drawer Component ──────────────────────────────────────────────────────
const NotificationDrawer = ({ isOpen, onClose }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    api.get('/auth/notifications')
      .then(r => setNotifications(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  const markAllRead = async () => {
    try {
      await api.put('/auth/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const markOneRead = async (id) => {
    try {
      await api.put(`/auth/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <div
      className="notification-overlay"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.25)',
        zIndex: 2000,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        className="notification-drawer"
        onClick={e => e.stopPropagation()}
        style={{
          width: '400px',
          maxWidth: '100vw',
          height: '100vh',
          background: '#fff',
          boxShadow: '-4px 0 32px rgba(0,0,0,0.14)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.22s ease-out',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 14px',
          borderBottom: '1px solid #E5E7EB',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>Notifications</span>
            {unreadCount > 0 && (
              <span style={{
                background: '#EF4444', color: '#fff',
                borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                padding: '1px 8px',
              }}>
                {unreadCount} new
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 600, color: '#0F766E',
                  padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '18px', color: '#9CA3AF', lineHeight: 1,
                padding: '2px 4px',
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 0' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏳</div>
              <div style={{ fontSize: '13px' }}>Loading notifications…</div>
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '60px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔔</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>No notifications yet</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Events like new company registrations and drive submissions will appear here.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map(n => {
                const meta = getMeta(n.category);
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markOneRead(n.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: n.is_read ? '1px solid #F3F4F6' : '1px solid #E0E7FF',
                      background: n.is_read ? '#FAFAFA' : '#fff',
                      cursor: n.is_read ? 'default' : 'pointer',
                      transition: 'background 0.15s',
                      opacity: n.is_read ? 0.72 : 1,
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: '36px', height: '36px',
                      borderRadius: '10px',
                      background: meta.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0,
                    }}>
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                          {n.title}
                        </span>
                        {!n.is_read && (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#2563EB', marginLeft: '6px' }}>
                            NEW
                          </span>
                        )}
                      </div>
                      <p style={{
                        fontSize: '13px', color: '#374151', margin: '0 0 4px',
                        lineHeight: 1.45,
                      }}>
                        {n.message}
                      </p>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{n.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #E5E7EB',
          flexShrink: 0,
          textAlign: 'center',
        }}>
          <button
            onClick={fetchNotifications}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '12px', color: '#6B7280', fontWeight: 500,
            }}
          >
            ↺ Refresh
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default NotificationDrawer;
