import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '@/components/User/layout/Layout';
import { ErrorPage } from '@/pages/ErrorPage';
// import { HomePage } from '@/pages/User/HomePage';
import { LoginPage } from '@/pages/authentication/LoginPage';
import { Register } from './pages/authentication/Register';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { VerifyRegister } from '@/pages/authentication/VerifyRegister';
import { ResetRequestForm } from '@/pages/authentication/ResetRequestForm';
import { ResetNewPasswordForm } from '@/pages/authentication/ResetNewPasswordForm';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Dashboard } from '@/pages/Admin/Dashboard';
import { AdminLayout } from './components/Admin/layout/Layout';
import DashboardEvent from './pages/EventManager/DashboardEvent';
import { EventManagerLayout } from './components/EventManager/layout/Layout';
import CreateEventForm from './pages/EventManager/CreateEvent';
import PendingEventsManager from './pages/EventManager/PendingEventsManager';
import ApprovedEventsManager from './pages/EventManager/ApprovedEventsManager';
import EditEvent from './pages/EventManager/EditEvent';
import CreateTicket from './pages/EventManager/CreateTicket';
import EventListWithTicketManager from './pages/EventManager/EventListWithTicketManager';
import EditTicket from './pages/EventManager/EditTicket';
import { OrderListAdmin } from './pages/Admin/Order/OrderListAdmin';
import EventDetail from './pages/Customer/EventDetail';
import ManagerDiscountCode from './pages/EventManager/ManagerDiscountCode';
import CreateDiscountCode from './pages/EventManager/CreateDiscountCode';
import AllEventsPage from './pages/Customer/AllEventsPage';
import ConfirmOrderPage from './pages/Customer/ConfirmOrderPage';
import PaymentSuccessPage from './pages/Customer/PaymentSuccessPage';
import { PaymentListAdmin } from './pages/Admin/Payment/PaymentListAdmin';
import ProfilePage from '@/pages/Admin/ProfilePage';
import CategoryList from './pages/Admin/Category/CategoryList';
import { DiscountCodeList } from './pages/Admin/DiscountCode/DiscountCodeList';
import ProfileEventManager from './pages/EventManager/ProfileEventManager';
import CollaboratorManager from './pages/EventManager/CollaboratorManager';
import HomePage from './pages/Customer/Home';
import ProfileCustomer from './pages/Customer/ProfileCustomer';
import EventListTabs from './pages/Admin/Event/EventListTabs';
import { ReportPage } from './pages/Admin/Report/ReportPage';

import NewsManager from './pages/EventManager/NewsManager';
import CreateNews from './pages/EventManager/CreateNews';
import EditNews from './pages/EventManager/EditNews';
import { CommentList } from './pages/Admin/Comment/CommentList';

import { NewsListTabs } from './pages/Admin/News/NewListTabs';
import UserListTabs from './pages/Admin/User/UserListTabs';
import NewsDetail from './pages/Customer/NewsDetail';

// Import new dashboard pages
import TicketSalesDashboard from './pages/EventManager/TicketSalesDashboard';
import AnalyticsOverview from './pages/EventManager/AnalyticsOverview';
import NotificationsDashboard from './pages/EventManager/NotificationsDashboard';
import FundManagement from './pages/EventManager/FundManagement';

// Import icons for placeholder pages
import { Users, Eye, ChartBar, MessageCircle, CheckCircle } from 'lucide-react';
import CreateCollaborator from './pages/EventManager/CreateCollaborator';

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <HomePage />,
        },
        {
          path: 'event/:eventId',
          element: <EventDetail />,
        },
        {
          path: 'news/:newsId',
          element: <NewsDetail />,
        },

        {
          path: 'events',
          element: <AllEventsPage />,
        },
        {
          path: 'confirm-order',
          element: (
            <ProtectedRoute allowedRoles={[1, 2]}>
              <ConfirmOrderPage />,
            </ProtectedRoute>
          ),
        },
        {
          path: 'profile',
          element: (
            <ProtectedRoute allowedRoles={[1, 2]}>
              <ProfileCustomer />,
            </ProtectedRoute>
          ),
        },
        {
          path: 'payment-success',

          element: (
            <ProtectedRoute allowedRoles={[1, 2]}>
              <PaymentSuccessPage />,
            </ProtectedRoute>
          ),
        },
      ],
    },
    // Customer = 1, Event Manager = 2
    // {
    //   path: '/example',
    //   element: (
    //     <ProtectedRoute allowedRoles={[1, 2]}>
    //       <Example1 />
    //       <Example2 />
    //     </ProtectedRoute>
    //   ),
    // },

    // Admin
    {
      path: '/admin',
      element: (
        <ProtectedRoute allowedRoles={[0]}>
          <AdminLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: (
            <ProtectedRoute allowedRoles={[0]}>
              <Dashboard />
            </ProtectedRoute>
          ), // /admin
        },
        {
          path: 'event-list',
          element: (
            <ProtectedRoute allowedRoles={[0]}>
              <EventListTabs />
            </ProtectedRoute>
          ),
        },
        {
          path: 'order-list',
          element: (
            <ProtectedRoute allowedRoles={[0]}>
              <OrderListAdmin />
            </ProtectedRoute>
          ),
        },
        {
          path: 'user-list',
          element: (
            <ProtectedRoute allowedRoles={[0]}>
              <UserListTabs />
            </ProtectedRoute>
          ),
        },
        {
          path: 'payment-list',
          element: (
            <ProtectedRoute allowedRoles={[0]}>
              <PaymentListAdmin />
            </ProtectedRoute>
          ),
        },
        {
          path: 'category-list',
          element: (
            <ProtectedRoute allowedRoles={[0]}>
              <CategoryList />
            </ProtectedRoute>
          ),
        },
        {
          path: 'discountCode-list',
          element: (
            <ProtectedRoute allowedRoles={[0]}>
              <DiscountCodeList />
            </ProtectedRoute>
          ),
        },
        {
          path: 'report-list',
          element: (
            <ProtectedRoute allowedRoles={[0]}>
              <ReportPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'news-list',
          element: (
            <ProtectedRoute allowedRoles={[0]}>
              <NewsListTabs />
            </ProtectedRoute>
          ),
        },

        {
          path: 'comment-list',
          element: (
            <ProtectedRoute allowedRoles={[0]}>
              <CommentList />
            </ProtectedRoute>
          ),
        },
        {
          path: 'profile',
          element: (
            <ProtectedRoute allowedRoles={[0]}>
              <ProfilePage />
            </ProtectedRoute>
          ),
        },
      ],
    },
    {
      path: '/event-manager',
      element: (
        <ProtectedRoute allowedRoles={[2]}>
          <EventManagerLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <DashboardEvent />
            </ProtectedRoute>
          ), // /EM
        },
        {
          path: 'profile',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <ProfileEventManager />
            </ProtectedRoute>
          ),
        },
        {
          path: 'create-event',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <CreateEventForm />
            </ProtectedRoute>
          ),
        },
        {
          path: 'pending-events',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <PendingEventsManager />
            </ProtectedRoute>
          ),
        },
        {
          path: 'approved-events',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <ApprovedEventsManager />
            </ProtectedRoute>
          ),
        },
        {
          path: 'collaborators',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <CollaboratorManager />
            </ProtectedRoute>
          ),
        },
        {
          path: 'collaborators/create',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <CreateCollaborator />
            </ProtectedRoute>
          ),
        },
        {
          path: 'collaborators/create/:eventId',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <CreateCollaborator />
            </ProtectedRoute>
          ),
        },
        {
          path: 'edit/:eventId',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <EditEvent />
            </ProtectedRoute>
          ),
        },
        {
          path: 'my-events',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <EventListWithTicketManager />
            </ProtectedRoute>
          ),
        },
        {
          path: 'news',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <NewsManager />
            </ProtectedRoute>
          ),
        },
        {
          path: '/event-manager/tickets/manage',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <EventListWithTicketManager />
            </ProtectedRoute>
          ),
        },

        {
          path: '/event-manager/tickets/create/:eventId',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <CreateTicket />
            </ProtectedRoute>
          ),
        },
        {
          path: '/event-manager/tickets/edit/:eventId/:ticketId',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <EditTicket />
            </ProtectedRoute>
          ),
        },
        {
          path: 'discount-codes',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <ManagerDiscountCode />
            </ProtectedRoute>
          ),
        },
        {
          path: 'discount-codes/create/:eventId',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <CreateDiscountCode />
            </ProtectedRoute>
          ),
        },
        {
          path: 'news/create/:eventId',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <CreateNews />
            </ProtectedRoute>
          ),
        },
        {
          path: 'news/edit/:newsId',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <EditNews />
            </ProtectedRoute>
          ),
        },
        {
          path: 'ticket-sales',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <TicketSalesDashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: 'analytics/overview',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <AnalyticsOverview />
            </ProtectedRoute>
          ),
        },
        {
          path: 'analytics/participants',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <div className="min-h-screen bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white p-8 flex items-center justify-center">
                <div className="text-center">
                  <Users className="text-blue-400 mx-auto mb-4" size={64} />
                  <h1 className="text-3xl font-bold text-blue-300 mb-4">Danh Sách Người Tham Gia</h1>
                  <p className="text-gray-300">Trang này đang được phát triển</p>
                </div>
              </div>
            </ProtectedRoute>
          ),
        },
        {
          path: 'reviews',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <div className="min-h-screen bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white p-8 flex items-center justify-center">
                <div className="text-center">
                  <Eye className="text-yellow-400 mx-auto mb-4" size={64} />
                  <h1 className="text-3xl font-bold text-yellow-300 mb-4">Đánh Giá Sự Kiện</h1>
                  <p className="text-gray-300">Trang này đang được phát triển</p>
                </div>
              </div>
            </ProtectedRoute>
          ),
        },
        {
          path: 'analytics/predictions',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <div className="min-h-screen bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white p-8 flex items-center justify-center">
                <div className="text-center">
                  <ChartBar className="text-purple-400 mx-auto mb-4" size={64} />
                  <h1 className="text-3xl font-bold text-purple-300 mb-4">Dự Đoán AI</h1>
                  <p className="text-gray-300">Trang này đang được phát triển</p>
                </div>
              </div>
            </ProtectedRoute>
          ),
        },
        {
          path: 'notifications',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <NotificationsDashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: 'chat',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <div className="min-h-screen bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white p-8 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="text-green-400 mx-auto mb-4" size={64} />
                  <h1 className="text-3xl font-bold text-green-300 mb-4">Chat Hỗ Trợ</h1>
                  <p className="text-gray-300">Trang này đang được phát triển</p>
                </div>
              </div>
            </ProtectedRoute>
          ),
        },
        {
          path: 'check-ins',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <div className="min-h-screen bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white p-8 flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle className="text-emerald-400 mx-auto mb-4" size={64} />
                  <h1 className="text-3xl font-bold text-emerald-300 mb-4">Check-in & QR Code</h1>
                  <p className="text-gray-300">Trang này đang được phát triển</p>
                </div>
              </div>
            </ProtectedRoute>
          ),
        },
        {
          path: 'fund-management',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <FundManagement />
            </ProtectedRoute>
          ),
        },
      ],
    },
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      path: '/reset-password',
      element: <ResetRequestForm />,
    },
    {
      path: '/new-password',
      element: <ResetNewPasswordForm />,
    },
    {
      path: '/register',
      element: <Register />,
    },
    {
      path: '/verify-email',
      element: <VerifyRegister />,
    },
  ]);
  return (
    <LoadingProvider>
      {/* Nếu muốn giữ loading context, chỉ show loading nhỏ hoặc bỏ luôn */}
      {/* {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      )} */}
      <RouterProvider router={router} />
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </LoadingProvider>
  );
}

export default App;
