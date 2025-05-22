import { SidebarProvider } from '@/components/ui/sidebar';
import { FaCalendarAlt, FaPlus, FaSignOutAlt } from 'react-icons/fa';
import { Outlet, useNavigate } from 'react-router-dom';

// Bên trong component EventManagerLayout
export function EventManagerLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Xóa token hoặc thông tin người dùng khỏi localStorage/cookies
    localStorage.removeItem('authToken');

    // Điều hướng về trang đăng nhập
    navigate('/login');
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        {/* Sidebar */}
        <aside className="w-64 bg-gradient-to-br from-[#0F172A] to-gray-700 p-6 shadow-lg flex flex-col justify-between rounded-lg">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-red-600 text-transparent bg-clip-text">
              Event Manager
            </h1>
            <hr className="my-4 border-gray-600" />
            <nav className="flex flex-col gap-5">
              <a href="/event-manager" className="flex items-center gap-3 hover:text-yellow-300 transition duration-200 transform hover:scale-105">
                <FaCalendarAlt />
                <span>Dashboard</span>
              </a>
              <a href="/event-manager/create-event" className="flex items-center gap-3 hover:text-yellow-300 transition duration-200 transform hover:scale-105">
                <FaPlus />
                <span>Tạo sự kiện</span>
              </a>
            </nav>
          </div>

          {/* Nút đăng xuất hoạt động */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm hover:text-yellow-300 transition duration-200 transform hover:scale-105"
          >
            <FaSignOutAlt />
            Đăng xuất
          </button>
        </aside>

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-y-auto">
           <main className="p-6 w-full h-full">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
