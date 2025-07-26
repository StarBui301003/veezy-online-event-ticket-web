import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '@/components/User/layout/Layout';
import { ErrorPage } from '@/pages/ErrorPage';
// import { HomePage } from '@/pages/User/HomePage';
import { LoginPage } from '@/pages/authentication/LoginPage';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { VerifyRegister } from '@/pages/authentication/VerifyRegister';
import { ResetRequestForm } from '@/pages/authentication/ResetRequestForm';
import { ResetNewPasswordForm } from '@/pages/authentication/ResetNewPasswordForm';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { AdminLayout } from './components/Admin/layout/Layout';
import DashboardEvent from './pages/EventManager/DashboardEvent';
import AllNotificationsPage from './pages/EventManager/AllNotificationsPage';
import AttendanceListPage from './pages/EventManager/AttendanceListPage';
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
import NewsManager from './pages/EventManager/NewsManager';
import CreateNews from './pages/EventManager/CreateNews';
import EditNews from './pages/EventManager/EditNews';
import { CommentList } from './pages/Admin/Comment/CommentList';
import { NewsListTabs } from './pages/Admin/News/NewListTabs';
import UserListTabs from './pages/Admin/User/UserListTabs';
import NewsDetail from './pages/Customer/NewsDetail';
// Import new dashboard pages
import TicketSalesDashboard from './pages/EventManager/TicketSalesDashboard';

import FundManagement from './pages/EventManager/FundManagement';
import NotificationManager from './pages/EventManager/NotificationManager';
// Import icons for placeholder pages
import { Users, Eye } from 'lucide-react';
import CreateCollaborator from './pages/EventManager/CreateCollaborator';
import NewsAll from './pages/Customer/NewsAll';

import ReportListTabs from './pages/Admin/Report/ReportListTabs';
import ReportCommentPage from './pages/Customer/ReportCommentPage';
import PaymentFailedPage from './pages/Customer/PaymentFailedPage';
import userActivityService from './services/user-activity.service';
import { OnlineStatusProvider } from './contexts/OnlineStatusContext';
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
  connectIdentityHub,
  onIdentity,
  disconnectIdentityHub,
  connectNewsHub,
  onNews,
  disconnectNewsHub,
  connectCommentHub,
  onComment,
  disconnectCommentHub,
  connectAnalyticsHub,
  onAnalytics,
  disconnectAnalyticsHub,
  connectChatHub,
  onChat,
  disconnectChatHub,
} from './services/signalr.service';
import { Register } from './pages/authentication/Register';
import EventManagerProfile from './pages/Customer/EventManagerProfile';
import DashboardTabs from './pages/Admin/Dashboard/DashboardTabs';
import i18n from './i18n';
import { getUserConfig } from './services/userConfig.service';
import { ChatboxAdmin } from './pages/Admin/Chatbox/ChatboxAdmin';
import EventReviews from './pages/EventManager/EventReviews';
import EventAttendancePredictor from '@/pages/EventManager/EventAttendancePredictor';
import { FundTabs } from './pages/Admin/Fund/FundTabs';
import { NotificationProvider } from './contexts/NotificationContext';
import GlobalNotificationManager from './components/common/GlobalNotificationManager';

function App() {
  useEffect(() => {
    // Đồng bộ ngôn ngữ với user config
    const accStr = localStorage.getItem('account');
    let userId = '';
    if (accStr) {
      try {
        const accObj = JSON.parse(accStr);
        userId = accObj.userId;
      } catch {
        /* ignore */
      }
    }
    if (userId) {
      getUserConfig(userId).then((res) => {
        const lang = res.data.language;
        if (lang === 1) i18n.changeLanguage('vi');
        else if (lang === 2) i18n.changeLanguage('en');
        // Nếu lang === 0 thì giữ nguyên default (en)
      });
    }
  }, []);
  useEffect(() => {
    // Connect directly to services since Ocelot doesn't support SignalR WebSocket

    // 1. NotificationService - Port 5003
    const token = localStorage.getItem('access_token');

    // Initialize user activity tracking if user is logged in
    if (token) {
      userActivityService.initializeActivityTracking();
    }

    // Decode JWT to check claims
    if (token) {
      try {
        JSON.parse(atob(token.split('.')[1]));
      } catch (e) {
        console.error('Failed to decode JWT:', e);
      }
    }

    connectNotificationHub(token || undefined)
      .then(() => {
        // Join admin group if user is admin
        joinAdminGroup();

        // Note: Individual notification handling is now managed by NotificationContext
        // We only keep global logging and admin-specific events here

        // Only handle admin events at global level for logging
        onNotification('AdminNotificationRead', () => {
          // Admin notification read handled
        });
        onNotification('AdminAllNotificationsRead', () => {
          // All admin notifications marked as read
        });
        onNotification('AdminNotificationDeleted', () => {
          // Admin notification deleted
        });
      })
      .catch((err) => {
        console.error('[App] Failed to connect to NotificationService:', err);
      });
    // 2. EventService - NotificationHub for Events real-time (Port 5004)
    connectEventHub(token || undefined).then(() => {
      onEvent('OnEventCreated', () => {
        // Event created
      });
      onEvent('OnNewsUnhidden', () => {
        // News unhidden
      });
      onEvent('OnEventUpdated', () => {
        // Event updated
      });
      onEvent('OnEventDeleted', () => {
        // Event deleted
      });
      onEvent('OnEventApproved', () => {
        // Event approved
      });
      onEvent('OnEventCancelled', () => {
        // Event cancelled
      });
      onEvent('OnEventHidden', () => {
        // Event hidden
      });
      onEvent('OnEventShown', () => {
        // Event shown
      });
      onEvent('OnManagerAdded', () => {
        // Manager added
      });
      onEvent('OnCollaboratorAdded', () => {
        // Collaborator added
      });
      onEvent('OnManagerRemoved', () => {
        // Manager removed
      });
      onEvent('OnCollaboratorRemoved', () => {
        // Collaborator removed
      });
      onEvent('OnTicketSoldIncremented', () => {
        // Ticket sold incremented
      });
      onEvent('OnTicketSoldDecremented', () => {
        // Ticket sold decremented
      });
      onEvent('OnEventNotificationSent', () => {
        // Event notification sent
      });
      // Category events
      onEvent('OnCategoryCreated', () => {
        // Category created
      });
      onEvent('OnCategoryUpdated', () => {
        // Category updated
      });
      onEvent('OnCategoryDeleted', () => {
        // Category deleted
      });
    });

    // 3. TicketService - Port 5005
    connectTicketHub(token || undefined)
      .then(() => {
        onTicket('OnOrderCreated', (data) => {
          console.log('OnOrderCreated:', data);
        });
        onTicket('OnOrderStatusChanged', (data) => {
          console.log('OnOrderStatusChanged:', data);
        });
        onTicket('OnPaymentCompleted', (data) => {
          console.log('OnPaymentCompleted:', data);
        });
        onTicket('OnTicketIssued', (data) => {
          console.log('OnTicketIssued:', data);
        });
        onTicket('OnCheckedIn', (data) => {
          console.log('OnCheckedIn:', data);
        });
      })
      .catch((err) => {
        console.error('Failed to connect to TicketService:', err);
      });

    // 4. IdentityService - Port 5001
    connectIdentityHub(token || undefined)
      .then(() => {
        onIdentity('UserProfileUpdated', (data) => {
          console.log('UserProfileUpdated:', data);
        });
        onIdentity('UserPasswordChanged', (data) => {
          console.log('UserPasswordChanged:', data);
        });
        onIdentity('UserVerifiedEmail', (data) => {
          console.log('UserVerifiedEmail:', data);
        });
        onIdentity('UserUpdated', (data) => {
          console.log('UserUpdated:', data);
        });
        onIdentity('UserAvatarUpdated', (data) => {
          console.log('UserAvatarUpdated:', data);
        });
      })
      .catch((err) => {
        console.error('Failed to connect to IdentityService:', err);
      });

    // 5. EventService - NewsHub for News real-time (Port 5004)
    connectNewsHub(token || undefined)
      .then(() => {
        onNews('OnNewsCreated', (data) => {
          console.log('OnNewsCreated:', data);
        });
        onNews('OnNewsUpdated', (data) => {
          console.log('OnNewsUpdated:', data);
        });
        onNews('OnNewsDeleted', (data) => {
          console.log('OnNewsDeleted:', data);
        });
      })
      .catch((err) => {
        console.error('Failed to connect to NewsHub:', err);
      });

    // 6. EventService - CommentHub for Comments real-time (Port 5004)
    connectCommentHub(token || undefined)
      .then(() => {
        onComment('OnCommentCreated', (data) => {
          console.log('OnCommentCreated:', data);
        });
        onComment('OnCommentUpdated', (data) => {
          console.log('OnCommentUpdated:', data);
        });
        onComment('OnCommentDeleted', (data) => {
          console.log('OnCommentDeleted:', data);
        });
      })
      .catch((err) => {
        console.error('Failed to connect to CommentHub:', err);
      });

    // 7. AnalyticsService - Port 5006 (Optional - may not always be running)
    connectAnalyticsHub(token || undefined)
      .then(() => {
        onAnalytics('OnEventManagerRealtimeOverview', (data) => {
          console.log('OnEventManagerRealtimeOverview:', data);
        });
        onAnalytics('OnEventManagerPerformanceComparison', (data) => {
          console.log('OnEventManagerPerformanceComparison:', data);
        });
      })
      .catch((err) => {
        console.warn('AnalyticsHub not available (Port 5006):', err.message);
        // This is optional, continue without analytics
      });

    // 8. ChatService - Port 5007
    connectChatHub(token || undefined)
      .then(() => {
        onChat('ReceiveMessage', (data) => {
          console.log('ReceiveMessage:', data);
        });
        onChat('UserConnected', (data) => {
          console.log('UserConnected:', data);
        });
        onChat('UserDisconnected', (data) => {
          console.log('UserDisconnected:', data);
        });
        onChat('NewChatRoomCreated', (data) => {
          console.log('NewChatRoomCreated:', data);
        });
      })
      .catch((err) => {
        console.error('Failed to connect to ChatHub:', err);
      });

    // Remove FeedbackService connection as it doesn't have a dedicated port
    // FeedbackService uses NotificationHub through other services
    // Cleanup
    return () => {
      disconnectNotificationHub();
      disconnectEventHub();
      disconnectTicketHub();
      disconnectIdentityHub();
      disconnectNewsHub();
      disconnectCommentHub();
      disconnectAnalyticsHub();
      disconnectChatHub();
      
      // Stop user activity tracking
      userActivityService.stopActivityTracking();
      console.log('🔴 User activity tracking stopped');
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
          path: 'all-notifications',
          element: (
            <ProtectedRoute allowedRoles={[1, 2]}>
              <AllNotificationsPage />
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
          path: 'check-ins',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <AttendanceListPage />
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
              <EventAttendancePredictor />
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
        {
          path: 'fund-management',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <FundManagement />
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
          path: 'attendance-predictor',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <EventAttendancePredictor />
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

  // Get current user info for components
  const getUserInfo = () => {
    try {
      const accountStr = localStorage.getItem('account');
      if (accountStr) {
        const account = JSON.parse(accountStr);
        return {
          userId: account.userId,
          role: account.role,
          isAuthenticated: !!account.userId
        };
      }
    } catch (error) {
      console.error('[App] Error parsing account from localStorage:', error);
    }
    return { userId: undefined, role: undefined, isAuthenticated: false };
  };

  const { userId, role, isAuthenticated } = getUserInfo();

  return (
    <LoadingProvider>
      <OnlineStatusProvider>
        <NotificationProvider userId={userId}>
          <GlobalNotificationManager 
            userId={userId}
            userRole={role}
            isAuthenticated={isAuthenticated}
          />
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
        </NotificationProvider>
      </OnlineStatusProvider>
    </LoadingProvider>
  );
}

export default App;
