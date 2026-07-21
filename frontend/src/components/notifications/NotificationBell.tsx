import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Calendar, Package, CreditCard, Star, Clock,
  FileCheck, QrCode, CheckCheck, Trash2, ExternalLink,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import type { NotificationType } from '../../types/notification.type';

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  BOOKING: <Calendar size={16} className="text-blue-500" />,
  ORDER: <Package size={16} className="text-indigo-500" />,
  PAYMENT: <CreditCard size={16} className="text-emerald-500" />,
  SYSTEM: <Bell size={16} className="text-gray-500" />,
  REVIEW: <Star size={16} className="text-amber-500" />,
  TIMESLOT: <Clock size={16} className="text-purple-500" />,
  HOST_APPLICATION: <FileCheck size={16} className="text-teal-500" />,
  CHECK_IN: <QrCode size={16} className="text-green-600" />,
};

const TYPE_BG: Record<NotificationType, string> = {
  BOOKING: 'bg-blue-50 border-blue-100',
  ORDER: 'bg-indigo-50 border-indigo-100',
  PAYMENT: 'bg-emerald-50 border-emerald-100',
  SYSTEM: 'bg-gray-50 border-gray-100',
  REVIEW: 'bg-amber-50 border-amber-100',
  TIMESLOT: 'bg-purple-50 border-purple-100',
  HOST_APPLICATION: 'bg-teal-50 border-teal-100',
  CHECK_IN: 'bg-green-50 border-green-100',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = Math.max(0, now - date);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

const NotificationBell: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const {
    notifications, unreadCount, isLoading,
    fetchNotifications, markAsRead, markAllAsRead, deleteNotification,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications({ limit: 8 });
    }
  }, [isOpen, fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!isAuthenticated) return null;

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    setIsOpen(false);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 hover:bg-[#FAF7F2] border border-[#E6DED5]/40 hover:border-[#E6DED5] rounded-xl transition-all group"
        aria-label="Thông báo"
      >
        <Bell size={20} className="text-[#2F2722] group-hover:text-[#A65A3A] transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-[#DC2626] text-white text-[11px] rounded-full flex items-center justify-center font-bold shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[380px] bg-white rounded-2xl shadow-2xl border border-[#E6DED5] z-50 overflow-hidden animate-[scaleIn_0.15s_ease-out]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E6DED5]">
            <h3 className="text-sm font-bold text-[#2F2722]">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-semibold text-[#A65A3A] hover:text-[#8e492b] transition-colors"
              >
                <CheckCheck size={14} /> Đọc tất cả
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[420px] overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-6 h-6 border-2 border-[#A65A3A] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-gray-400 mt-3 font-semibold">Đang tải...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400 font-semibold">Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex gap-3 px-5 py-3.5 cursor-pointer transition-all hover:bg-[#FAF7F2] border-b border-[#F0ECE6]/60 last:border-b-0 ${
                    !notif.isRead ? 'bg-[#FFF8F1]' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${TYPE_BG[notif.type] || 'bg-gray-50 border-gray-100'}`}>
                    {TYPE_ICONS[notif.type] || <Bell size={16} className="text-gray-400" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[13px] leading-snug ${!notif.isRead ? 'font-bold text-[#2F2722]' : 'font-semibold text-gray-600'}`}>
                        {notif.title}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#A65A3A] shrink-0" />
                        )}
                        <button
                          onClick={(e) => handleDelete(e, notif._id)}
                          className="p-0.5 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          title="Xóa"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 font-semibold">
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#E6DED5] px-5 py-3">
            <button
              onClick={() => { setIsOpen(false); navigate('/notifications'); }}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-[#A65A3A] hover:text-[#8e492b] transition-colors"
            >
              <ExternalLink size={13} /> Xem tất cả thông báo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
