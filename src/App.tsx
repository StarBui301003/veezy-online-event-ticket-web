/* eslint-disable no-empty */
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '@/components/User/layout/Layout';
import { ErrorPage } from '@/pages/ErrorPage';
// import { HomePage } from '@/pages/User/HomePage';
import { LoginPage } from '@/pages/authentication/LoginPage';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { OnlineStatusProvider } from '@/contexts/OnlineStatusContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CategoryMappingProvider } from '@/contexts/CategoryMappingContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { VerifyRegister } from '@/pages/authentication/VerifyRegister';
import { ResetRequestForm } from '@/pages/authentication/ResetRequestForm';
import { ResetNewPasswordForm } from '@/pages/authentication/ResetNewPasswordForm';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { AdminLayout } from './components/Admin/layout/Layout';
import DashboardEvent from './pages/EventManager/DashboardEvent';
import AttendanceListPage from './pages/EventManager/AttendanceListPage';
import { EventManagerLayout } from './components/EventManager/layout/Layout';
import CreateEventForm from './pages/EventManager/CreateEvent';
import PendingEventsManager from './pages/EventManager/PendingEventsManager';
import ApprovedEventsManager from './pages/EventManager/ApprovedEventsManager';
import EditEvent from './pages/EventManager/EditEvent';
import CreateTicket from './pages/EventManager/CreateTicket';
import EventListWithTicketManager from './pages/EventManager/EventListWithTicketManager';
import EditTicket from './pages/EventManager/EditTicket';
import OrderListAdmin from './pages/Admin/Order/OrderListAdmin';
import EventDetail from './pages/Customer/EventDetail';
import ManagerDiscountCode from './pages/EventManager/ManagerDiscountCode';
import CreateDiscountCode from './pages/EventManager/CreateDiscountCode';
import AllEventsPage from './pages/Customer/AllEventsPage';
import ConfirmOrderPage from './pages/Customer/ConfirmOrderPage';
import PaymentSuccessPage from './pages/Customer/PaymentSuccessPage';
import PaymentListAdmin from './pages/Admin/Payment/PaymentListAdmin';
import ProfilePage from '@/pages/Admin/Profile/ProfilePage';
import ChatboxAdmin from './pages/Admin/Chatbox/ChatboxAdmin';
import CategoryList from './pages/Admin/Category/CategoryList';
import { DiscountCodeList } from './pages/Admin/DiscountCode/DiscountCodeList';
import ProfileEventManager from './pages/EventManager/ProfileEventManager';
import CollaboratorManager from './pages/EventManager/CollaboratorManager';
import HomePage from './pages/Customer/Home';
import ProfileCustomer from './pages/Customer/ProfileCustomer';
import EventListTabs from './pages/Admin/Event/EventListTabs';
import NewsManager from './pages/EventManager/NewsManager';
import CreateNews from './pages/EventManager/CreateNews';
import EditNews from './pages/EventManager/EditNews';
import { CommentList } from './pages/Admin/Comment/CommentList';
import { NewsListTabs } from './pages/Admin/News/NewListTabs';
import UserListTabs from './pages/Admin/User/UserListTabs';
import NewsDetail from './pages/Customer/NewsDetail';
import TermsOfUse from './pages/Customer/TermsOfUse';
// Import new dashboard pages
import TicketSalesDashboard from './pages/EventManager/TicketSalesDashboard';
import AnalyticsOverview from './pages/EventManager/AnalyticsOverview';
import FundManagement from './pages/EventManager/FundManagement';
import ChatSupportManager from './pages/EventManager/ChatSupportManager';
// Import icons for placeholder pages
import { Users } from 'lucide-react';
import CreateCollaborator from './pages/EventManager/CreateCollaborator';
import NewsAll from './pages/Customer/NewsAll';
import AllNotificationsPage from './pages/EventManager/AllNotificationsPage';
import SearchResultsPage from './pages/Customer/SearchResultsPage';

import ReportListTabs from './pages/Admin/Report/ReportListTabs';
import ReportCommentPage from './pages/Customer/ReportCommentPage';
import PaymentFailedPage from './pages/Customer/PaymentFailedPage';
import { useEffect } from 'react';
import {
  connectNotificationHub,
  onNotification,
  disconnectNotificationHub,
  joinAdminGroup,
  connectEventHub,
  onEvent,
  disconnectEventHub,
  connectTicketHub,
  onTicket,
  disconnectTicketHub,
  connectFeedbackHub,
  onFeedback,
  disconnectFeedbackHub,
  connectIdentityHub,
  onIdentity,
  disconnectIdentityHub,
  connectAnalyticsHub,
  onAnalytics,
  disconnectAnalyticsHub,
} from './services/signalr.service';

import { Register } from './pages/authentication/Register';
import EventManagerProfile from './pages/Customer/EventManagerProfile';
import DashboardTabs from './pages/Admin/Dashboard/DashboardTabs';
import { FundTabs } from './pages/Admin/Fund/FundTabs';
import EventReviews from './pages/EventManager/EventReviews';
import EventAttendancePredictor from './pages/EventManager/EventAttendancePredictor';

// Thêm import cho NotificationManager
import NotificationManager from './pages/EventManager/NotificationManager';
import EditDiscountCode from './pages/EventManager/EditDiscountCode';

function App() {
  useEffect(() => {
    // Debug: Check if user is admin
    const account = localStorage.getItem('account');
    const token = localStorage.getItem('token');
    const accessToken = localStorage.getItem('access_token');
    
    console.log('Debug localStorage:');
    console.log('- account:', account ? 'exists' : 'null');
    console.log('- token:', token ? token.substring(0, 50) + '...' : 'null');
    console.log('- access_token:', accessToken ? accessToken.substring(0, 50) + '...' : 'null');
    
    if (account) {
      try {
        const accountData = JSON.parse(account);
        console.log('Current user role:', accountData.role);
        console.log('Is admin?', accountData.role === 0 || accountData.role === '0');
      } catch (error) {
        console.error('Failed to parse account data:', error);
      }
    }
    
    // NotificationService - use access_token instead of token
    const finalToken = accessToken || token;
    console.log('Token for NotificationHub:', finalToken ? finalToken.substring(0, 50) + '...' : 'No token');
    
    if (finalToken) {
      // Debug: Decode token to see claims
      try {
        const payload = JSON.parse(atob(finalToken.split('.')[1]));
        console.log('Token payload claims:', payload);
      } catch (error) {
        console.error('Failed to decode token:', error);
      }
    }
    
    connectNotificationHub('http://localhost:5003/hubs/notifications', finalToken).then(async () => {
      console.log('Connected to NotificationService SignalR');
      
      // Check if user is admin and join admin group
      const account = localStorage.getItem('account');
      if (account) {
        try {
          const accountData = JSON.parse(account);
          if (accountData.role === 0 || accountData.role === '0') {
            console.log('User is admin, trying to join admin group explicitly...');
            // Try explicit join as backup (SharedPref.NotificationHub should auto-join in OnConnectedAsync)
            try {
              await joinAdminGroup();
              console.log('✅ Successfully joined admin group explicitly');
            } catch (error) {
              console.log('⚠️ Failed to join admin group explicitly (may already be joined via auto-join):', error);
            }
          }
        } catch (error) {
          console.error('Failed to parse account data:', error);
        }
      }
      
      onNotification('ReceiveNotification', (data) => {
        console.log('NotificationService:', data);
      });
      
      // Listen for admin notifications
      onNotification('ReceiveAdminNotification', (data) => {
        console.log('AdminNotificationService - ReceiveAdminNotification:', data);
      });
      
      onNotification('AdminNotificationRead', (data) => {
        console.log('AdminNotificationService - AdminNotificationRead:', data);
      });
      
      onNotification('AdminAllNotificationsRead', () => {
        console.log('AdminNotificationService - AdminAllNotificationsRead');
      });
      
      onNotification('AdminNotificationDeleted', (data) => {
        console.log('AdminNotificationService - AdminNotificationDeleted:', data);
      });
    });
    // EventService
    connectEventHub('http://localhost:5004/notificationHub').then(() => {
      console.log('Connected to EventService SignalR');
      onEvent('OnEventCreated', (data) => {
        console.log('OnEventCreated:', data);
      });
      onEvent('OnNewsUnhidden', (data) => {
        console.log('OnNewsUnhidden:', data);
      });
      onEvent('OnEventUpdated', (data) => {
        console.log('OnEventUpdated:', data);
      });
      onEvent('OnEventDeleted', (data) => {
        console.log('OnEventDeleted:', data);
      });
      onEvent('OnEventApproved', (data) => {
        console.log('OnEventApproved:', data);
      });
      onEvent('OnEventCancelled', (data) => {
        console.log('OnEventCancelled:', data);
      });
      onEvent('OnEventHidden', (data) => {
        console.log('OnEventHidden:', data);
      });
      onEvent('OnEventShown', (data) => {
        console.log('OnEventShown:', data);
      });
      onEvent('OnManagerAdded', (data) => {
        console.log('OnManagerAdded:', data);
      });
      onEvent('OnCollaboratorAdded', (data) => {
        console.log('OnCollaboratorAdded:', data);
      });
      onEvent('OnManagerRemoved', (data) => {
        console.log('OnManagerRemoved:', data);
      });
      onEvent('OnCollaboratorRemoved', (data) => {
        console.log('OnCollaboratorRemoved:', data);
      });
      onEvent('OnTicketSoldIncremented', (data) => {
        console.log('OnTicketSoldIncremented:', data);
      });
      onEvent('OnTicketSoldDecremented', (data) => {
        console.log('OnTicketSoldDecremented:', data);
      });
      onEvent('OnEventNotificationSent', (data) => {
        console.log('OnEventNotificationSent:', data);
      });
    });
    // TicketService
    connectTicketHub('http://localhost:5005/notificationHub').then(() => {
      console.log('Connected to TicketService SignalR');
      onTicket('TicketChanged', (data) => {
        console.log('TicketService:', data);
      });
    });
    // FeedbackService
    connectFeedbackHub('http://localhost:5008/notificationHub').then(() => {
      console.log('Connected to FeedbackService SignalR');
      onFeedback('FeedbackChanged', (data) => {
        console.log('FeedbackService:', data);
      });
    });
    // IdentityService
    connectIdentityHub('http://localhost:5001/hubs/notifications').then(() => {
      console.log('Connected to IdentityService SignalR');
      onIdentity('OnUserCreated', (data) => {
        console.log('OnUserCreated:', data);
      });
      onIdentity('OnUserUpdated', (data) => {
        console.log('OnUserUpdated:', data);
      });
      onIdentity('OnUserDeleted', (data) => {
        console.log('OnUserDeleted:', data);
      });
      onIdentity('OnUserRoleChanged', (data) => {
        console.log('OnUserRoleChanged:', data);
      });
    });
    // AnalyticsService
    connectAnalyticsHub('http://localhost:5006/analyticsHub').then(() => {
      console.log('Connected to AnalyticsService SignalR');
      onAnalytics('OnEventManagerRealtimeOverview', (data) => {
        console.log('AnalyticsService: OnEventManagerRealtimeOverview', data);
      });
      onAnalytics('OnEventManagerPerformanceComparison', (data) => {
        console.log('AnalyticsService: OnEventManagerPerformanceComparison', data);
      });
    });
    // Cleanup
    return () => {
      disconnectNotificationHub();
      disconnectEventHub();
      disconnectTicketHub();
      disconnectFeedbackHub();
      disconnectIdentityHub();
      disconnectAnalyticsHub();
    };
  }, []);
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
          path: 'news',
          children: [
            {
              index: true,
              element: <NewsAll />,
            },
            {
              path: 'all',
              element: <NewsAll />,
            },
            {
              path: ':newsId',
              element: <NewsDetail />,
            },
          ],
        },
        {
          path: 'terms-of-use',
          element: <TermsOfUse />,
        },
        {
          path: 'report/comment/:commentId',
          element: <ReportCommentPage />,
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
        {
          path: 'payment-failed',
          element: <PaymentFailedPage />,
        },
        {
          path: 'news/all',
          element: <NewsAll />,
        },
        {
          path: 'report/comment/:commentId',
          element: <ReportCommentPage />,
        },
        {
          path: 'event-manager/:id',
          element: <EventManagerProfile />,
        },
        {
          path: 'notifications',
          element: (
            <ProtectedRoute allowedRoles={[1, 2]}>
              <AllNotificationsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'search',
          element: <SearchResultsPage />,
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
              <DashboardTabs />
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
              <ReportListTabs />
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
        {
          path: 'withdraw',
          element: (
            <ProtectedRoute allowedRoles={[0]}>
              <FundTabs />
            </ProtectedRoute>
          ),
        },
        {
          path: 'chatbox',
          element: (
            <ProtectedRoute allowedRoles={[0]}>
              <ChatboxAdmin />
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
          path: 'discount-codes/edit/:discountId',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <EditDiscountCode />
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
          path: 'check-ins',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <AttendanceListPage />
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
          path: 'reviews',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <EventReviews />
            </ProtectedRoute>
          ),
        },
        {
          path: 'analytics/sentiment',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <EventReviews />
            </ProtectedRoute>
          ),
        },
        {
          path: 'analytics/predictions',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <EventAttendancePredictor />
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
                  <h1 className="text-3xl font-bold text-blue-300 mb-4">
                    Danh Sách Người Tham Gia
                  </h1>
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
        {
          path: 'chat-support',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <ChatSupportManager />
            </ProtectedRoute>
          ),
        },
        {
          path: 'notifications',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <AllNotificationsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'notification-manager',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <NotificationManager />
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
  // Get userId from localStorage/account for NotificationProvider
  let userId = '';
  if (typeof window !== 'undefined') {
    const accStr = localStorage.getItem('account');
    if (accStr) {
      try {
        const acc = JSON.parse(accStr);
        userId = acc.userId || acc.accountId || '';
      } catch {}
    }
  }
  return (
    <ThemeProvider>
      <LoadingProvider>
        <NotificationProvider userId={userId}>
          <OnlineStatusProvider>
            <CategoryMappingProvider>
              <RouterProvider router={router} />
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
              />
            </CategoryMappingProvider>
          </OnlineStatusProvider>
        </NotificationProvider>
      </LoadingProvider>
    </ThemeProvider>
  );
}

export default App;
