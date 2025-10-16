import React, { useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Notification component for displaying user feedback
 * @param {Object} props - Component props
 * @param {string} props.type - Type of notification ('success', 'error', 'warning', 'info')
 * @param {string} props.message - Notification message
 * @param {boolean} props.isVisible - Whether the notification is visible
 * @param {Function} props.onClose - Function to call when notification is closed
 * @param {number} props.duration - Auto-close duration in milliseconds (0 to disable)
 * @param {string} props.id - Unique identifier for the notification
 */
const Notification = ({ 
  type = 'info', 
  message, 
  isVisible = false, 
  onClose, 
  duration = 5000,
  id 
}) => {
  const notificationRef = useRef(null);
  const timeoutRef = useRef(null);

  // Auto-close functionality
  useEffect(() => {
    if (isVisible && duration > 0) {
      timeoutRef.current = setTimeout(() => {
        onClose?.();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, duration, onClose]);

  // Focus management for accessibility
  useEffect(() => {
    if (isVisible && notificationRef.current) {
      notificationRef.current.focus();
    }
  }, [isVisible]);

  // Keyboard navigation
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      onClose?.();
    }
  };

  // Get icon and styles based on type
  const getNotificationConfig = () => {
    const configs = {
      success: {
        icon: CheckCircle,
        className: 'notification-success',
        ariaLabel: 'Success notification'
      },
      error: {
        icon: AlertCircle,
        className: 'notification-error',
        ariaLabel: 'Error notification'
      },
      warning: {
        icon: AlertTriangle,
        className: 'notification-warning',
        ariaLabel: 'Warning notification'
      },
      info: {
        icon: Info,
        className: 'notification-info',
        ariaLabel: 'Information notification'
      }
    };
    return configs[type] || configs.info;
  };

  const config = getNotificationConfig();
  const IconComponent = config.icon;

  if (!isVisible) return null;

  return (
    <div
      ref={notificationRef}
      role="alert"
      aria-live="assertive"
      aria-label={config.ariaLabel}
      tabIndex={-1}
      className={`${config.className} animate-slide-up`}
      onKeyDown={handleKeyDown}
      data-testid={`notification-${type}`}
    >
      <div className="flex items-start gap-3">
        <IconComponent 
          className="h-5 w-5 mt-0.5 flex-shrink-0" 
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-5">
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus-ring rounded-md p-1"
            aria-label="Close notification"
            data-testid="notification-close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Notification; 