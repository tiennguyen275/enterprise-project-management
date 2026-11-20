import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { createUserNotificationHubConnection } from '../services/signalr';
import UserAvatar from './UserAvatar';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';

export default function NotificationBell() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let isMounted = true;
    api.get('/notifications', { params: { limit: 20 } })
      .then((res) => {
        if (!isMounted || !res.data) return;
        const loaded = res.data.items || [];
        seenIdsRef.current = new Set(loaded.map((n) => n.id));
        setUnreadCount(res.data.unreadCount || 0);
        setItems(loaded);
      })
      .catch((err) => {
        console.error('Lỗi tải thông báo:', err);
      });

    const token = localStorage.getItem('token');
    if (!token) {
      return () => {
        isMounted = false;
      };
    }

    const hub = createUserNotificationHubConnection((notification) => {
      if (!isMounted || !notification?.id) return;
      const isNew = !seenIdsRef.current.has(notification.id);
      seenIdsRef.current.add(notification.id);
      setItems((prev) => [notification, ...prev.filter((x) => x.id !== notification.id)].slice(0, 25));
      if (isNew && !notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      isMounted = false;
      hub.stop();
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const handleItemClick = async (item) => {
    if (!item.isRead) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      api.patch(`/notifications/${item.id}/read`).catch(() => {});
    }
    setOpen(false);
    if (item.linkUrl) {
      navigate(item.linkUrl);
    }
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    api.patch('/notifications/read-all').catch(() => {});
  };

  return (
    <div ref={containerRef} className="notification-bell-wrap">
      <button
        type="button"
        className={`btn-notification-bell ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        title="Thông báo của bạn"
      >
        <NotificationsNoneOutlinedIcon style={{ fontSize: 19 }} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notif-header">
            <strong>Thông báo ({unreadCount} chưa đọc)</strong>
            {unreadCount > 0 && (
              <button type="button" className="btn-mark-all" onClick={handleMarkAllRead}>
                <DoneAllIcon style={{ fontSize: 14 }} />
                <span>Đọc tất cả</span>
              </button>
            )}
          </div>

          <div className="notif-list">
            {items.length === 0 ? (
              <div className="notif-empty">Chưa có thông báo nào.</div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`notif-item ${item.isRead ? '' : 'is-unread'}`}
                  onClick={() => handleItemClick(item)}
                >
                  <UserAvatar
                    name={item.actorName || 'EPMS'}
                    avatarUrl={item.actorAvatarUrl}
                    size="sm"
                  />
                  <div className="notif-body">
                    <div className="notif-title">{item.title}</div>
                    <div className="notif-message">{item.message}</div>
                    <div className="notif-time">
                      {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                      · {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  {!item.isRead && <span className="notif-unread-dot" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

