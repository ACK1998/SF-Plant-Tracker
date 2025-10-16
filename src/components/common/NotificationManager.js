import React, { useState, useCallback, useRef } from 'react';
import Notification from './Notification';

/**
 * Notification Manager for handling multiple notifications
 * Provides a centralized way to show notifications with proper stacking
 */
const NotificationManager = () => {
  const [notifications, setNotifications] = useState([]);
  const notificationIdRef = useRef(0);

  /**
   * Add a new notification
   * @param {Object} notification - Notification configuration
   * @param {string} notification.type - Type of notification
   * @param {string} notification.message - Notification message
   * @param {number} notification.duration - Auto-close duration
   * @returns {string} Notification ID
   */
  const addNotification = useCallback(({ type, message, duration = 5000 }) => {
    const id = `notification-${++notificationIdRef.current}`;
    
    setNotifications(prev => [
      ...prev,
      { id, type, message, duration, isVisible: true }
    ]);

    return id;
  }, []);

  /**
   * Remove a notification by ID
   * @param {string} id - Notification ID
   */
  const removeNotification = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isVisible: false }
          : notification
      ).filter(notification => notification.id !== id)
    );
  }, []);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Expose methods globally for easy access
  React.useEffect(() => {
    window.showNotification = addNotification;
    window.clearAllNotifications = clearAll;
    
    return () => {
      delete window.showNotification;
      delete window.clearAllNotifications;
    };
  }, [addNotification, clearAll]);

  return (
    <div 
      className="fixed top-4 right-4 z-[var(--z-notification)] space-y-2 pointer-events-none"
      aria-label="Notifications"
    >
      {notifications.map((notification, index) => (
        <div 
          key={notification.id}
          className="pointer-events-auto"
          style={{ 
            zIndex: `calc(var(--z-notification) + ${index})`,
            transform: `translateY(${index * 4}px)`
          }}
        >
          <Notification
            id={notification.id}
            type={notification.type}
            message={notification.message}
            isVisible={notification.isVisible}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationManager; 