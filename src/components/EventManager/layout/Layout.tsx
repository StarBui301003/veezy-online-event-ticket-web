import { useState, useEffect, useRef } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import {
  FaHome,
  FaCalendarAlt,
  FaPlus,
  FaClock,
  FaCheckCircle,
  FaTicketAlt,
  FaPercent,
  FaUsers,
  FaChartBar,
  FaBell,
  FaNewspaper,
  FaUserCircle,
  FaComments,
  FaEye,
  FaChevronDown,
  FaChevronRight,
} from 'react-icons/fa';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import SpinnerOverlay from '@/components/SpinnerOverlay';

export function EventManagerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    events: true,
    tickets: false,
    analytics: false,
    content: false,
  });
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    // Xóa tất cả localStorage
    localStorage.clear();
    
    // Hoặc xóa từng key cụ thể nếu muốn giữ lại một số dữ liệu khác
    // localStorage.removeItem("access_token");
    // localStorage.removeItem("refresh_token");
    // localStorage.removeItem("user_data");
    // localStorage.removeItem("user_preferences");
    
    // Xóa tất cả sessionStorage (nếu có sử dụng)
    sessionStorage.clear();
    
    // Xóa tất cả cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Chuyển hướng về trang login
    navigate('/login');
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ví dụ: gọi API khi mount layout hoặc khi cần loading
  useEffect(() => {
    setLoading(true);
    // Giả lập gọi API, thay thế bằng API thực tế nếu cần
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  // Lấy avatar từ localStorage/account và cập nhật khi user-updated
  useEffect(() => {
    const updateAvatar = () => {
      try {
        const accStr = localStorage.getItem('account');
        if (accStr) {
          const acc = JSON.parse(accStr);
          setAvatar(acc.avatar || '');
        }
      } catch {
        setAvatar(null);
      }
    };
    updateAvatar();
    window.addEventListener('user-updated', updateAvatar);
    window.addEventListener('storage', updateAvatar);
    return () => {
      window.removeEventListener('user-updated', updateAvatar);
      window.removeEventListener('storage', updateAvatar);
    };
  }, []);

  const NavItem = ({
    to,
    icon: Icon,
    children,
    isActive = false,
  }: {
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    isActive?: boolean;
  }) => (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
        isActive
          ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 shadow-lg border border-pink-500/30'
          : 'hover:bg-white/5 hover:text-pink-400'
      } hover:drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]`}
    >
      <Icon className="text-sm" />
      <span className="text-sm font-medium">{children}</span>
    </Link>
  );

  const SectionHeader = ({
    section,
    icon: Icon,
    title,
  }: {
    section: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center gap-2 px-2 py-2 text-xs font-semibold
        text-white uppercase tracking-wide
        bg-gradient-to-r from-[#32235a] to-[#5c357a]
        hover:from-[#6d28d9] hover:to-[#ec4899]
        rounded-md transition-colors"
    >
      <Icon className="text-xs" />
      <span>{title}</span>
      {expandedSections[section] ? (
        <FaChevronDown className="ml-auto text-xs" />
      ) : (
        <FaChevronRight className="ml-auto text-xs" />
      )}
    </button>
  );

  return (
    <>
      {loading && <SpinnerOverlay show={loading} />}
      <SidebarProvider>
        <div className="flex h-screen w-screen bg-gradient-to-br from-[#0f0c1a] to-[#1c1429] text-white overflow-hidden">
          {/* Sidebar */}
          <aside className="w-72 bg-gradient-to-br from-[#1e1b2e] to-[#2c2a40] shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-700/50">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]">
                Veezy Manager
              </h1>

              <p className="text-xs text-gray-400 mt-1">Event Management Dashboard</p>
              <br />
              <button
                onClick={() => navigate('/')}
                className="ml-2 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow"
                title="Về trang chủ"
              >
                <FaHome className="text-sm" />
                Home
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
              <div>
                <NavItem
                  to=""
                  icon={FaHome}
                  isActive={isActiveRoute('/event-manager')}
                >
                  Dashboard
                </NavItem>
              </div>

              {/* Event Management */}
              <div>
                <SectionHeader section="events" icon={FaCalendarAlt} title="Quản lý sự kiện" />
                {expandedSections.events && (
                  <div className="ml-4 space-y-1 mt-2">
                    <NavItem
                      to="my-events"
                      icon={FaCalendarAlt}
                      isActive={isActiveRoute('/event-manager/my-events')}
                    >
                      Sự kiện của tôi
                    </NavItem>
                    <NavItem
                      to="create-event"
                      icon={FaPlus}
                      isActive={isActiveRoute('/event-manager/create-event')}
                    >
                      Tạo sự kiện mới
                    </NavItem>

                    <NavItem
                      to="pending-events"
                      icon={FaClock}
                      isActive={isActiveRoute('/event-manager/pending-events')}
                    >
                      Sự kiện đang chờ duyệt
                    </NavItem>
                    <NavItem
                      to="approved-events"
                      icon={FaCheckCircle}
                      isActive={isActiveRoute('/event-manager/approved-events')}
                    >
                      Sự kiện đã duyệt
                    </NavItem>
                    <NavItem
                      to="collaborators"
                      icon={FaUsers}
                      isActive={isActiveRoute('/event-manager/collaborators')}
                    >
                      Quản lý cộng tác viên
                    </NavItem>
                  </div>
                )}
              </div>

              {/* Ticket Management */}
              <div>
                <SectionHeader section="tickets" icon={FaTicketAlt} title="Quản lý vé" />
                {expandedSections.tickets && (
                  <div className="ml-4 space-y-1 mt-2">
                    <NavItem
                      to="tickets/manage"
                      icon={FaTicketAlt}
                      isActive={isActiveRoute('/event-manager/tickets/manage')}
                    >
                      Quản lý vé
                    </NavItem>
                    <NavItem
                      to="discount-codes"
                      icon={FaPercent}
                      isActive={isActiveRoute('/event-manager/discount-codes')}
                    >
                      Mã giảm giá
                    </NavItem>
                    <NavItem
                      to="ticket-sales"
                      icon={FaChartBar}
                      isActive={isActiveRoute('/event-manager/ticket-sales')}
                    >
                      Theo dõi bán vé
                    </NavItem>
                    <NavItem
                      to="check-ins"
                      icon={FaCheckCircle}
                      isActive={isActiveRoute('/event-manager/check-ins')}
                    >
                      Check-in & QR Code
                    </NavItem>
                  </div>
                )}
              </div>

              {/* Analytics */}
              <div>
                <SectionHeader section="analytics" icon={FaChartBar} title="Báo cáo & Phân tích" />
                {expandedSections.analytics && (
                  <div className="ml-4 space-y-1 mt-2">
                    <NavItem
                      to="analytics/overview"
                      icon={FaChartBar}
                      isActive={isActiveRoute('/event-manager/analytics/overview')}
                    >
                      Tổng quan
                    </NavItem>

                    <NavItem
                      to="analytics/participants"
                      icon={FaUsers}
                      isActive={isActiveRoute('/event-manager/analytics/participants')}
                    >
                      Danh sách người tham gia
                    </NavItem>
                    <NavItem
                      to="reviews"
                      icon={FaEye}
                      isActive={isActiveRoute('/event-manager/reviews')}
                    >
                      Đánh giá sự kiện
                    </NavItem>
                    <NavItem
                      to="analytics/predictions"
                      icon={FaChartBar}
                      isActive={isActiveRoute('/event-manager/analytics/predictions')}
                    >
                      Dự đoán AI
                    </NavItem>
                  </div>
                )}
              </div>

              {/* Content & Communication */}
              <div>
                <SectionHeader section="content" icon={FaNewspaper} title="Nội dung & Liên lạc" />
                {expandedSections.content && (
                  <div className="ml-4 space-y-1 mt-2">
                    <NavItem
                      to="news"
                      icon={FaNewspaper}
                      isActive={isActiveRoute('/event-manager/news')}
                    >
                      Quản lý tin tức
                    </NavItem>
                    <NavItem
                      to="notifications"
                      icon={FaBell}
                      isActive={isActiveRoute('/event-manager/notifications')}
                    >
                      Thông báo
                    </NavItem>
                    <NavItem
                      to="chat"
                      icon={FaComments}
                      isActive={isActiveRoute('/event-manager/chat')}
                    >
                      Chat hỗ trợ
                    </NavItem>
                  </div>
                )}
              </div>
            </nav>

            {/* User Account */}
            <div className="p-4 border-t border-gray-700/50">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white bg-gradient-to-r from-[#3a324e] to-[#4b3e65] hover:from-[#4b3e65] hover:to-[#5c4d7a] hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all duration-300 rounded-lg border border-purple-500/20"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-r from-pink-500 to-purple-500 overflow-hidden">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="avatar"
                        className="object-cover w-full h-full rounded-full"
                      />
                    ) : (
                      <FaUserCircle className="text-lg text-white" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-white">Event Manager</div>
                    <div className="text-xs text-gray-300">Quản lý tài khoản</div>
                  </div>
                  <FaChevronDown
                    className={`text-gray-400 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute left-0 bottom-full mb-2 w-full bg-[#2a243b] border border-purple-500/30 rounded-lg shadow-2xl backdrop-blur-sm z-20 overflow-hidden">
                    <Link
                      to="profile"
                      className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-200"
                    >
                      <FaUserCircle className="text-gray-400" />
                      <span>Hồ sơ cá nhân</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-white bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-500 hover:to-red-600 transition-all duration-200 rounded-lg"
                    >
                      <svg
                        className="w-4 h-4 text-gray-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 h-screen min-h-screen overflow-y-auto bg-gradient-to-br from-[#0f0c1a] to-[#1c1429]">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </>
  );
}