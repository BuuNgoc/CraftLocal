// Header v2 — AI Dropdown added
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, LogOut, ChevronDown, Compass, Package, Info, UserCircle, CalendarCheck, ShoppingBag, Sparkles, Calendar, Bot, Wand2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { getRoleRedirectPath } from '../../utils/roleRedirect';
import { ROLE_LABELS } from '../../utils/constants';
import NotificationBell from '../notifications/NotificationBell';

const Header: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aiDropdownOpen, setAiDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  // Avatar renderer — shows image or fallback initial
  const renderAvatar = (size: 'sm' | 'lg' = 'sm') => {
    const sizeClass = size === 'lg' ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-sm';
    const initial = user?.fullName ? user.fullName[0].toUpperCase() : 'U';

    if (user?.avatar) {
      return (
        <img
          src={user.avatar}
          alt={user.fullName}
          className={`${sizeClass} rounded-full object-cover border border-[#E6DED5]`}
          onError={(e) => {
            // Fallback to initial on image load error
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }

    return (
      <div className={`${sizeClass} rounded-full bg-[#A65A3A]/10 flex items-center justify-center font-bold text-[#A65A3A]`}>
        {initial}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E6DED5] transition-all">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 md:h-[76px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="text-2xl transform group-hover:rotate-12 transition-transform duration-300">🏺</span>
            <span className="font-headline-lg text-2xl font-bold text-[#2F2722] group-hover:text-[#A65A3A] transition-colors tracking-wide">
              CraftLocal
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/workshops"
              className="flex items-center gap-1.5 text-[#2F2722] hover:text-[#A65A3A] transition-colors font-semibold text-[15px]"
            >
              <Compass size={16} />
              Trải nghiệm
            </Link>
            <Link
              to="/products"
              className="flex items-center gap-1.5 text-[#2F2722] hover:text-[#A65A3A] transition-colors font-semibold text-[15px]"
            >
              <Package size={16} />
              Sản phẩm
            </Link>
            <Link
              to="/about"
              className="flex items-center gap-1.5 text-[#2F2722] hover:text-[#A65A3A] transition-colors font-semibold text-[15px]"
            >
              <Info size={16} />
              Giới thiệu
            </Link>
            {/* AI Dropdown */}
            <div className="relative">
              <button
                onClick={() => setAiDropdownOpen(!aiDropdownOpen)}
                className="flex items-center gap-1.5 text-[#2F2722] hover:text-[#A65A3A] transition-colors font-semibold text-[15px]"
              >
                <Bot size={16} />
                AI Trợ lý
                <ChevronDown size={12} className={`transition-transform duration-200 ${aiDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {aiDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAiDropdownOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E6DED5] py-2 z-50 animate-[scaleIn_0.15s_ease-out]">
                    <Link
                      to="/ai/advisor"
                      onClick={() => setAiDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#2F2722] hover:bg-[#FAF7F2] hover:text-[#A65A3A] transition-colors"
                    >
                      <Sparkles size={16} className="text-amber-500" /> Tư vấn Workshop
                    </Link>
                    <Link
                      to="/ai/itinerary"
                      onClick={() => setAiDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#2F2722] hover:bg-[#FAF7F2] hover:text-[#A65A3A] transition-colors"
                    >
                      <Calendar size={16} className="text-orange-500" /> Tạo Lịch Trình
                    </Link>
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link
              to="/cart"
              className="relative p-2.5 hover:bg-[#FAF7F2] border border-[#E6DED5]/40 hover:border-[#E6DED5] rounded-xl transition-all group"
            >
              <ShoppingCart size={20} className="text-[#2F2722] group-hover:text-[#A65A3A] transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-[#A65A3A] text-white text-[11px] rounded-full flex items-center justify-center font-bold shadow-sm animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Notification Bell */}
            <NotificationBell />

            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="hidden md:flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#FAF7F2] border border-[#E6DED5] rounded-xl transition-all"
                >
                  {renderAvatar('sm')}
                  {/* Hidden fallback initial (shown when img onError fires) */}
                  <div className="w-7 h-7 rounded-full bg-[#A65A3A]/10 items-center justify-center text-sm font-bold text-[#A65A3A] hidden">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <span className="text-sm font-semibold text-[#2F2722] max-w-[120px] truncate">
                    {user.fullName}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-[#7A6A5E] transition-transform duration-300 ${
                      profileOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#E6DED5] py-2 z-50 animate-[scaleIn_0.15s_ease-out]">
                      {/* User info header */}
                      <div className="px-5 py-3.5 border-b border-[#E6DED5]">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.fullName}
                              className="w-10 h-10 rounded-full object-cover border border-[#E6DED5]"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#A65A3A]/10 flex items-center justify-center text-base font-bold text-[#A65A3A]">
                              {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#2F2722] truncate">{user.fullName}</p>
                            <p className="text-xs text-[#7A6A5E] truncate">{user.email}</p>
                          </div>
                        </div>
                        <span className="inline-block mt-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#A65A3A]/10 text-[#A65A3A] rounded-full">
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </div>
                      {/* Menu items */}
                      <div className="py-1.5">
                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-[#2F2722] hover:bg-[#FAF7F2] hover:text-[#A65A3A] transition-colors"
                        >
                          <UserCircle size={16} /> Hồ sơ cá nhân
                        </Link>
                        <Link
                          to={getRoleRedirectPath(user.role)}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-[#2F2722] hover:bg-[#FAF7F2] hover:text-[#A65A3A] transition-colors"
                        >
                          <User size={16} /> Bảng điều khiển
                        </Link>
                        {user.role === 'TOURIST' && (
                          <>
                            <Link
                              to="/my-bookings"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-[#2F2722] hover:bg-[#FAF7F2] hover:text-[#A65A3A] transition-colors"
                            >
                              <CalendarCheck size={16} /> Lịch đặt của tôi
                            </Link>
                            <Link
                              to="/my-orders"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-[#2F2722] hover:bg-[#FAF7F2] hover:text-[#A65A3A] transition-colors"
                            >
                              <ShoppingBag size={16} /> Đơn hàng của tôi
                            </Link>
                          </>
                        )}
                      </div>
                      <div className="border-t border-[#E6DED5] pt-1.5">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-[#DC2626] hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} /> Đăng xuất
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4.5 py-2 text-[14px] font-bold text-[#A65A3A] hover:bg-[#A65A3A]/5 rounded-xl transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-[14px] font-bold text-white bg-[#A65A3A] hover:bg-[#8e492b] rounded-xl transition-all shadow-sm active:scale-[0.98]"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 hover:bg-[#FAF7F2] rounded-xl transition-colors border border-[#E6DED5]/40"
            >
              {mobileOpen ? <X size={22} className="text-[#2F2722]" /> : <Menu size={22} className="text-[#2F2722]" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#E6DED5] py-4 space-y-1 animate-[slideDown_0.2s_ease-out]">
            <Link
              to="/workshops"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm font-semibold text-[#2F2722] hover:bg-[#FAF7F2] rounded-xl"
            >
              Trải nghiệm
            </Link>
            <Link
              to="/products"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm font-semibold text-[#2F2722] hover:bg-[#FAF7F2] rounded-xl"
            >
              Sản phẩm
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm font-semibold text-[#2F2722] hover:bg-[#FAF7F2] rounded-xl"
            >
              Giới thiệu
            </Link>
            <div className="px-4 py-2 text-xs font-semibold text-[#7A6A5E] uppercase tracking-wider mt-2">
              AI Trợ lý
            </div>
            <Link
              to="/ai/advisor"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[#2F2722] hover:bg-[#FAF7F2] rounded-xl"
            >
              <Sparkles size={16} className="text-amber-500" /> Tư vấn Workshop
            </Link>
            <Link
              to="/ai/itinerary"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[#2F2722] hover:bg-[#FAF7F2] rounded-xl"
            >
              <Calendar size={16} className="text-orange-500" /> Tạo Lịch Trình
            </Link>
            {isAuthenticated && user ? (
              <div className="border-t border-[#E6DED5]/60 pt-2 mt-2">
                <div className="px-4 py-2 text-xs font-semibold text-[#7A6A5E] uppercase tracking-wider">
                  Tài khoản
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm font-semibold text-[#2F2722] hover:bg-[#FAF7F2] rounded-xl"
                >
                  Hồ sơ cá nhân
                </Link>
                <Link
                  to={getRoleRedirectPath(user.role)}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm font-semibold text-[#2F2722] hover:bg-[#FAF7F2] rounded-xl"
                >
                  Bảng điều khiển
                </Link>
                {user.role === 'TOURIST' && (
                  <>
                    <Link
                      to="/my-bookings"
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 text-sm font-semibold text-[#2F2722] hover:bg-[#FAF7F2] rounded-xl"
                    >
                      Lịch đặt của tôi
                    </Link>
                    <Link
                      to="/my-orders"
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 text-sm font-semibold text-[#2F2722] hover:bg-[#FAF7F2] rounded-xl"
                    >
                      Đơn hàng của tôi
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-[#DC2626] hover:bg-red-50 rounded-xl"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex gap-2.5 px-4 pt-3 border-t border-[#E6DED5]/60">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center px-4 py-3 text-sm font-bold text-[#A65A3A] border border-[#A65A3A] rounded-xl hover:bg-[#A65A3A]/5 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center px-4 py-3 text-sm font-bold text-white bg-[#A65A3A] rounded-xl hover:bg-[#8e492b] transition-colors"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
