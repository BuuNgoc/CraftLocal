import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Clock, Package, ShoppingBag, Users, UserPlus, Menu, LogOut, ShieldAlert } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import NotificationBell from '../notifications/NotificationBell';

const hostLinks = [
  { to: '/host/dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={16} /> },
  { to: '/host/workshops', label: 'Quản lý Workshop', icon: <BookOpen size={16} /> },
  { to: '/host/timeslots', label: 'Khung giờ', icon: <Clock size={16} /> },
  { to: '/host/products', label: 'Sản phẩm', icon: <Package size={16} /> },
  { to: '/host/orders', label: 'Đơn hàng', icon: <ShoppingBag size={16} /> },
  { to: '/host/tour-guides', label: 'Hướng dẫn viên', icon: <Users size={16} /> },
  { to: '/host/assign-guide', label: 'Gán HĐV', icon: <UserPlus size={16} /> },
];

const HostLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  if (user && user.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-8 max-w-md shadow-xs space-y-6">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-[#D97706] border border-amber-200 animate-bounce">
            <ShieldAlert size={28} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-[#111827]">Tài khoản đang chờ duyệt</h1>
            <p className="text-gray-500 text-xs font-semibold leading-relaxed">
              Chào <strong className="text-gray-900">{user.fullName}</strong>, tài khoản Chủ xưởng của bạn đã được đăng ký thành công và đang chờ Ban quản trị phê duyệt.
            </p>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">
              Hệ thống sẽ cập nhật ngay khi tài khoản được duyệt. Vui lòng quay lại sau!
            </p>
          </div>
          <Button onClick={logout} variant="outline" className="w-full flex items-center justify-center gap-2">
            <LogOut size={16} /> Đăng xuất
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex">
      <Sidebar links={hostLinks} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} title="Chủ xưởng" />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 lg:h-[68px] border-b border-[#E5E7EB] bg-white flex items-center justify-between px-6 lg:px-8 gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-50 border border-[#E5E7EB] rounded-xl transition-all">
              <Menu size={18} className="text-[#0F172A]" />
            </button>
            <h1 className="text-sm font-extrabold text-[#0F172A] tracking-tight uppercase">Bảng Quản Lý Chủ Xưởng</h1>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="text-right hidden sm:block">
                <p className="text-xs font-extrabold text-[#0F172A]">{user.fullName}</p>
                <p className="text-[9px] text-[#A65A3A] font-extrabold uppercase tracking-wider">HOST</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#A65A3A]/10 border border-[#A65A3A]/25 flex items-center justify-center font-bold text-[#A65A3A] text-xs">
                {user.fullName ? user.fullName[0].toUpperCase() : 'H'}
              </div>
            </div>
          )}
        </header>
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default HostLayout;
