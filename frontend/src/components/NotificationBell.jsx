// frontend/src/components/NotificationBell.jsx
import { useState, useEffect, useRef } from 'react';
import { notificationsAPI } from '../api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const prevCountRef = useRef(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll();
      const data = res.data?.data || res.data;
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Tự động làm mới mỗi 1 phút (Polling)
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Xử lý tự động đóng khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = (notifications || []).filter(n => !n.is_read).length;

  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setIsRinging(true);
      const timer = setTimeout(() => setIsRinging(false), 1200);
      prevCountRef.current = unreadCount;
      return () => clearTimeout(timer);
    } else {
      prevCountRef.current = unreadCount;
    }
  }, [unreadCount]);

  const markAsRead = async (id) => {
    await notificationsAPI.markAsRead(id);
    fetchNotifications();
  };

  const getIcon = (type) => {
    switch(type) {
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'maintenance': return '🔧';
      default: return 'ℹ️';
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', marginRight: '20px' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
      >
        <span className={`bell-icon ${isRinging ? 'ringing' : ''}`}>🔔</span> {unreadCount > 0 && (
          <span style={{ 
            position: 'absolute', top: '-5px', right: '-5px', 
            background: 'red', color: 'white', borderRadius: '50%', 
            padding: '2px 6px', fontSize: '12px' 
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{ 
          position: 'absolute', top: '35px', right: '0', width: '300px', 
          background: 'white', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', 
          borderRadius: '8px', zIndex: 1000, maxHeight: '400px', overflowY: 'auto' 
        }}>
          <h4 style={{ padding: '10px 15px', borderBottom: '1px solid #eee', margin: 0 }}>Thông báo</h4>
          {notifications.length === 0 ? (
            <p style={{ padding: '15px', textAlign: 'center', color: '#666', margin: 0 }}>Không có thông báo</p>
          ) : (
            notifications.map(n => (
              <div 
                key={n.id} 
                onClick={() => markAsRead(n.id)}
                style={{ 
                  padding: '10px 15px', borderBottom: '1px solid #f5f5f5', 
                  background: n.is_read ? 'white' : '#f0f8ff', cursor: 'pointer' 
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>
                  {getIcon(n.type)} {n.title}
                </div>
                <div style={{ fontSize: '13px', color: '#555' }}>{n.message}</div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
                  {new Date(n.created_at).toLocaleString('vi-VN')}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
