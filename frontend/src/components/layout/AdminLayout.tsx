import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, TrendingUp, Menu } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../notifications/NotificationBell';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={16} /> },
  { to: '/admin/users', label: 'Quản lý người dùng', icon: <Users size={16} /> },
  { to: '/admin/approve-hosts', label: 'Duyệt Chủ xưởng', icon: <UserCheck size={16} /> },
  { to: '/admin/revenue', label: 'Doanh thu', icon: <TrendingUp size={16} /> },
];

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex">
      <Sidebar links={adminLinks} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} title="Quản trị" />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 lg:h-[68px] border-b border-[#E5E7EB] bg-white flex items-center justify-between px-6 lg:px-8 gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-50 border border-[#E5E7EB] rounded-xl transition-all">
              <Menu size={18} className="text-[#0F172A]" />
            </button>
            <h1 className="text-sm font-extrabold text-[#0F172A] tracking-tight uppercase">Hệ Thống Quản Trị Viên</h1>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="text-right hidden sm:block">
                <p className="text-xs font-extrabold text-[#0F172A]">{user.fullName}</p>
                <p className="text-[9px] text-[#DC2626] font-extrabold uppercase tracking-wider">ADMIN</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center font-bold text-[#DC2626] text-xs">
                {user.fullName ? user.fullName[0].toUpperCase() : 'A'}
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

export default AdminLayout;
