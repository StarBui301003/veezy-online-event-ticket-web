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
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
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

  const NavItem = ({
    href,
    icon: Icon,
    children,
    isActive = false,
  }: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    isActive?: boolean;
  }) => (
    <a
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
        isActive
          ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 shadow-lg border border-pink-500/30'
          : 'hover:bg-white/5 hover:text-pink-400'
      } hover:drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]`}
    >
      <Icon className="text-sm" />
      <span className="text-sm font-medium">{children}</span>
    </a>
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
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
              <div>
                <NavItem
                  href="/event-manager"
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
                      href="/event-manager/my-events"
                      icon={FaCalendarAlt}
                      isActive={isActiveRoute('/event-manager/my-events')}
                    >
                      Sự kiện của tôi
                    </NavItem>
                    <NavItem
                      href="/event-manager/create-event"
                      icon={FaPlus}
                      isActive={isActiveRoute('/event-manager/create-event')}
                    >
                      Tạo sự kiện mới
                    </NavItem>

                    <NavItem
                      href="/event-manager/pending-events"
                      icon={FaClock}
                      isActive={isActiveRoute('/event-manager/pending-events')}
                    >
                      Sự kiện đang chờ duyệt
                    </NavItem>
                    <NavItem
                      href="/event-manager/approved-events"
                      icon={FaCheckCircle}
                      isActive={isActiveRoute('/event-manager/approved-events')}
                    >
                      Sự kiện đã duyệt
                    </NavItem>
                    <NavItem
                      href="/event-manager/collaborators"
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
                      href="/event-manager/tickets/manage"
                      icon={FaTicketAlt}
                      isActive={isActiveRoute('/event-manager/tickets/manage')}
                    >
                      Quản lý vé
                    </NavItem>
                    <NavItem
                      href="/event-manager/discount-codes"
                      icon={FaPercent}
                      isActive={isActiveRoute('/event-manager/discount-codes')}
                    >
                      Mã giảm giá
                    </NavItem>
                    <NavItem
                      href="/event-manager/ticket-sales"
                      icon={FaChartBar}
                      isActive={isActiveRoute('/event-manager/ticket-sales')}
                    >
                      Theo dõi bán vé
                    </NavItem>
                    <NavItem
                      href="/event-manager/check-ins"
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
                      href="/event-manager/analytics/overview"
                      icon={FaChartBar}
                      isActive={isActiveRoute('/event-manager/analytics/overview')}
                    >
                      Tổng quan
                    </NavItem>

                    <NavItem
                      href="/event-manager/analytics/participants"
                      icon={FaUsers}
                      isActive={isActiveRoute('/event-manager/analytics/participants')}
                    >
                      Danh sách người tham gia
                    </NavItem>
                    <NavItem
                      href="/event-manager/reviews"
                      icon={FaEye}
                      isActive={isActiveRoute('/event-manager/reviews')}
                    >
                      Đánh giá sự kiện
                    </NavItem>
                    <NavItem
                      href="/event-manager/analytics/predictions"
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
                      href="/event-manager/news"
                      icon={FaNewspaper}
                      isActive={isActiveRoute('/event-manager/news')}
                    >
                      Quản lý tin tức
                    </NavItem>
                    <NavItem
                      href="/event-manager/notifications"
                      icon={FaBell}
                      isActive={isActiveRoute('/event-manager/notifications')}
                    >
                      Thông báo
                    </NavItem>
                    <NavItem
                      href="/event-manager/chat"
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
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full flex items-center justify-center shadow-lg">
                    <FaUserCircle className="text-lg" />
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
                    <a
                      href="/event-manager/profile"
                      className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-200"
                    >
                      <FaUserCircle className="text-gray-400" />
                      <span>Hồ sơ cá nhân</span>
                    </a>
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
