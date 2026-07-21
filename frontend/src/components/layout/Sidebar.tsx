import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { X, LogOut, Compass } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarLink {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  links: SidebarLink[];
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

const Sidebar: React.FC<SidebarProps> = ({ links, isOpen, onClose, title }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[260px] bg-white border-r border-[#E5E7EB] z-50 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#A65A3A] flex items-center justify-center shadow-xs">
                <span className="text-lg">🏺</span>
              </div>
              <div>
                <span className="text-sm font-extrabold text-[#0F172A] block tracking-wide">
                  CraftLocal
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#A65A3A] block">
                  {title}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors">
              <X size={15} className="text-gray-500" />
            </button>
          </div>

          {/* User Info Card */}
          {user && (
            <div className="px-5 py-3.5 border-b border-[#E5E7EB] bg-gray-50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#A65A3A]/10 flex items-center justify-center text-xs font-bold text-[#A65A3A] border border-[#A65A3A]/20">
                {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-gray-900 truncate">{user.fullName}</p>
                <p className="text-[10px] text-gray-400 font-semibold truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Nav Links */}
          <nav className="flex-1 overflow-y-auto p-3.5 space-y-1">
            <NavLink
              to="/"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150"
            >
              <Compass size={16} />
              Về trang chủ chính
            </NavLink>
            <div className="h-px bg-gray-150 my-2" />
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-gray-150/70 text-[#0F172A] shadow-2xs'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <span className="shrink-0 text-gray-500">{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-3.5 border-t border-[#E5E7EB]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-bold text-[#DC2626] hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
