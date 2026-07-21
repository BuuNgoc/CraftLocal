import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Calendar, Package, CreditCard, Star, Clock,
  FileCheck, QrCode, CheckCheck, Trash2, Filter, Inbox,
} from 'lucide-react';
import notificationApi from '../../api/notificationApi';
import { useNotifications } from '../../hooks/useNotifications';
import type { Notification, NotificationType } from '../../types/notification.type';
import Loading from '../../components/common/Loading';
import Button from '../../components/common/Button';

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  BOOKING: <Calendar size={18} className="text-blue-500" />,
  ORDER: <Package size={18} className="text-indigo-500" />,
  PAYMENT: <CreditCard size={18} className="text-emerald-500" />,
  SYSTEM: <Bell size={18} className="text-gray-500" />,
  REVIEW: <Star size={18} className="text-amber-500" />,
  TIMESLOT: <Clock size={18} className="text-purple-500" />,
  HOST_APPLICATION: <FileCheck size={18} className="text-teal-500" />,
  CHECK_IN: <QrCode size={18} className="text-green-600" />,
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

const TYPE_LABELS: Record<string, string> = {
  '': 'Tất cả',
  BOOKING: 'Booking',
  ORDER: 'Đơn hàng',
  PAYMENT: 'Thanh toán',
  SYSTEM: 'Hệ thống',
  REVIEW: 'Đánh giá',
  TIMESLOT: 'Khung giờ',
  HOST_APPLICATION: 'Chủ xưởng',
  CHECK_IN: 'Check-in',
};

const READ_TABS = [
  { key: '', label: 'Tất cả' },
  { key: 'false', label: 'Chưa đọc' },
  { key: 'true', label: 'Đã đọc' },
];

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
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { fetchUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [filterRead, setFilterRead] = useState('');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (filterType) params.type = filterType;
      if (filterRead) params.isRead = filterRead;
      const res = await notificationApi.getNotifications(params);
      const data = res.data.data;
      setNotifications(data?.notifications ?? []);
      setTotalPages(data?.totalPages ?? 1);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterRead]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      fetchUnreadCount();
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      fetchUnreadCount();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      fetchUnreadCount();
    } catch {}
  };

  const handleClearRead = async () => {
    try {
      await notificationApi.clearRead();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      fetchUnreadCount();
    } catch {}
  };

  const handleNotifClick = (notif: Notification) => {
    if (!notif.isRead) handleMarkRead(notif._id);
    if (notif.actionUrl) navigate(notif.actionUrl);
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2F2722]">Thông báo</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý tất cả thông báo của bạn</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleMarkAllRead} className="text-xs">
            <CheckCheck size={14} className="mr-1.5" /> Đọc tất cả
          </Button>
          <Button variant="outline" onClick={handleClearRead} className="text-xs text-red-500 border-red-200 hover:bg-red-50">
            <Trash2 size={14} className="mr-1.5" /> Xóa đã đọc
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {READ_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setFilterRead(tab.key); setPage(1); }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              filterRead === tab.key
                ? 'bg-[#A65A3A] text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="mx-2 border-l border-gray-200" />
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setFilterType(key); setPage(1); }}
            className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
              filterType === key
                ? 'bg-[#2F2722] text-white'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {loading ? (
        <Loading text="Đang tải thông báo..." />
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E6DED5] p-16 text-center">
          <Inbox size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-400">Bạn chưa có thông báo nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E6DED5] overflow-hidden shadow-xs divide-y divide-[#F0ECE6]/60">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleNotifClick(notif)}
              className={`flex gap-4 px-6 py-4 cursor-pointer transition-all hover:bg-[#FAF7F2] group ${
                !notif.isRead ? 'bg-[#FFF8F1]' : ''
              }`}
            >
              {/* Icon */}
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${TYPE_BG[notif.type] || 'bg-gray-50 border-gray-100'}`}>
                {TYPE_ICONS[notif.type] || <Bell size={18} className="text-gray-400" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm leading-snug ${!notif.isRead ? 'font-bold text-[#2F2722]' : 'font-semibold text-gray-600'}`}>
                    {notif.title}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    {!notif.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#A65A3A] shrink-0" />
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(notif._id); }}
                      className="p-1 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Xóa thông báo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-gray-400 font-semibold">{timeAgo(notif.createdAt)}</span>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                    notif.priority === 'HIGH'
                      ? 'bg-red-50 text-red-500'
                      : notif.priority === 'LOW'
                      ? 'bg-gray-50 text-gray-400'
                      : 'bg-blue-50 text-blue-500'
                  }`}>
                    {notif.priority === 'HIGH' ? 'Quan trọng' : notif.priority === 'LOW' ? 'Thấp' : 'Thường'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 text-xs font-bold bg-gray-100 rounded-xl disabled:opacity-40 hover:bg-gray-200 transition-colors"
          >
            Trang trước
          </button>
          <span className="text-xs font-semibold text-gray-500">
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 text-xs font-bold bg-gray-100 rounded-xl disabled:opacity-40 hover:bg-gray-200 transition-colors"
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
