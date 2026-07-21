import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Calendar, QrCode, Menu } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../notifications/NotificationBell';

const guideLinks = [
  { to: '/tour-guide/dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={16} /> },
  { to: '/tour-guide/schedules', label: 'Lịch phân công', icon: <Calendar size={16} /> },
  { to: '/tour-guide/check-in', label: 'Check-in QR', icon: <QrCode size={16} /> },
];

const TourGuideLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex">
      <Sidebar links={guideLinks} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} title="Hướng dẫn viên" />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 lg:h-[68px] border-b border-[#E5E7EB] bg-white flex items-center justify-between px-6 lg:px-8 gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-50 border border-[#E5E7EB] rounded-xl transition-all">
              <Menu size={18} className="text-[#0F172A]" />
            </button>
            <h1 className="text-sm font-extrabold text-[#0F172A] tracking-tight uppercase">Bảng Hướng Dẫn Viên</h1>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="text-right hidden sm:block">
                <p className="text-xs font-extrabold text-[#0F172A]">{user.fullName}</p>
                <p className="text-[9px] text-blue-600 font-extrabold uppercase tracking-wider">TOUR GUIDE</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-600 text-xs">
                {user.fullName ? user.fullName[0].toUpperCase() : 'G'}
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

export default TourGuideLayout;
