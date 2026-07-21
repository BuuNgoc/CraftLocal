import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Notification } from '../types/notification.type';
import notificationApi from '../api/notificationApi';
import { useAuth } from '../hooks/useAuth';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: (params?: any) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearRead: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  fetchNotifications: async () => {},
  fetchUnreadCount: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  clearRead: async () => {},
});

const POLL_INTERVAL = 30000; // 30 seconds

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationApi.getUnreadCount();
      setUnreadCount(res.data.data?.unreadCount ?? 0);
    } catch {
      // Silently fail
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async (params?: any) => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await notificationApi.getNotifications(params);
      const data = res.data.data;
      setNotifications(data?.notifications ?? []);
      setUnreadCount(data?.unreadCount ?? 0);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const target = notifications.find((n) => n._id === id);
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Silently fail
    }
  }, [notifications]);

  const clearRead = useCallback(async () => {
    try {
      await notificationApi.clearRead();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    } catch {
      // Silently fail
    }
  }, []);

  // Poll unread count when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      pollRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isAuthenticated, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
