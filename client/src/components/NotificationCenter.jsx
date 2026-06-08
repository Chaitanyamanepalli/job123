import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Bell, CheckSquare, Trash2, Calendar, FileText, Settings, UserCheck } from 'lucide-react';

const NotificationCenter = ({ socket, user }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.getNotifications();
        setNotifications(res.data || []);
      } catch (err) {
        console.error('Error fetching notifications:', err.message);
      }
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      socket.on('notification', (newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
      });

      return () => {
        socket.off('notification');
      };
    }
  }, [socket]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking notifications read:', err.message);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'status_change':
        return <UserCheck size={16} style={{ color: 'var(--accent)' }} />;
      case 'new_application':
        return <FileText size={16} style={{ color: 'var(--success)' }} />;
      case 'new_message':
        return <Bell size={16} style={{ color: '#6366f1' }} />;
      default:
        return <Bell size={16} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  return (
    <div className="notification-center-container" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        className="theme-switch-btn-nav"
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative' }}
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span 
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: 'var(--error)',
              color: '#ffffff',
              borderRadius: '50%',
              fontSize: '10px',
              fontWeight: 800,
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #111111'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="dashboard-table-card"
          style={{
            position: 'absolute',
            top: '50px',
            right: '0',
            width: '320px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1000,
            padding: '1rem',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--card-shadow), 0 10px 30px rgba(0,0,0,0.15)',
            animation: 'slideUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Notifications</h4>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <CheckSquare size={12} /> Mark all read
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif._id}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    backgroundColor: notif.isRead ? 'transparent' : 'rgba(163, 230, 53, 0.05)',
                    borderLeft: notif.isRead ? '3px solid transparent' : '3px solid var(--accent)',
                    transition: 'all 0.2s ease',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ 
                    width: '28px', 
                    height: '28px', 
                    borderRadius: '50%', 
                    backgroundColor: 'var(--bg-primary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getIcon(notif.type)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flexGrow: 1 }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{notif.title}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.3 }}>{notif.message}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                      <Calendar size={10} /> {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
