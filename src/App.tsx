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
import AnalyticsOverview from './pages/EventManager/AnalyticsOverview';
import FundManagement from './pages/EventManager/FundManagement';
// Import icons for placeholder pages
import { Users, Eye, ChartBar } from 'lucide-react';
import CreateCollaborator from './pages/EventManager/CreateCollaborator';
import NewsAll from './pages/Customer/NewsAll';

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
import { ChatboxAdmin } from './pages/Admin/Chatbox/ChatboxAdmin';

function App() {
  useEffect(() => {
    // Connect directly to services since Ocelot doesn't support SignalR WebSocket

    // 1. NotificationService - Port 5003
    const token = localStorage.getItem('access_token');
    console.log('JWT Token:', token ? 'exists' : 'not found');

    // Decode JWT to check claims
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('JWT Payload:', payload);
        console.log(
          'Role claim in JWT:',
          payload.role ||
            payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
            'not found'
        );
      } catch (e) {
        console.error('Failed to decode JWT:', e);
      }
    }

    connectNotificationHub('http://localhost:5003/hubs/notifications', token || undefined)
      .then(() => {
        console.log('Connected to NotificationService SignalR (Port 5003)');

        // Join admin group if user is admin
        joinAdminGroup();

        onNotification('ReceiveNotification', (data) => {
          console.log('NotificationService:', data);
          // Handle real-time notifications
        });
        // Remove global ReceiveAdminNotification handler to avoid conflicts with AdminNotificationList component
        // The AdminNotificationList component will handle this event

        // Only handle other admin events at global level for logging
        onNotification('AdminNotificationRead', (data) => {
          console.log('AdminNotificationRead:', data);
        });
        onNotification('AdminAllNotificationsRead', () => {
          console.log('AdminAllNotificationsRead');
        });
        onNotification('AdminNotificationDeleted', (data) => {
          console.log('AdminNotificationDeleted:', data);
        });
      })
      .catch((err) => {
        console.error('Failed to connect to NotificationService:', err);
      });
    // 2. EventService - NotificationHub for Events real-time (Port 5004)
    connectEventHub('http://localhost:5004/notificationHub').then(() => {
      console.log('Connected to EventService SignalR (Port 5004)');
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
      // Category events
      onEvent('OnCategoryCreated', (data) => {
        console.log('OnCategoryCreated:', data);
      });
      onEvent('OnCategoryUpdated', (data) => {
        console.log('OnCategoryUpdated:', data);
      });
      onEvent('OnCategoryDeleted', (data) => {
        console.log('OnCategoryDeleted:', data);
      });
    });

    // 3. TicketService - Port 5005
    connectTicketHub('http://localhost:5005/notificationHub')
      .then(() => {
        console.log('Connected to TicketService SignalR (Port 5005)');
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
    connectIdentityHub('http://localhost:5001/hubs/notifications')
      .then(() => {
        console.log('Connected to IdentityService SignalR (Port 5001)');
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
    connectNewsHub('http://localhost:5004/newsHub')
      .then(() => {
        console.log('Connected to NewsHub SignalR (Port 5004)');
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
    connectCommentHub('http://localhost:5004/commentHub')
      .then(() => {
        console.log('Connected to CommentHub SignalR (Port 5004)');
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
    connectAnalyticsHub('http://localhost:5006/analyticsHub')
      .then(() => {
        console.log('Connected to AnalyticsHub SignalR (Port 5006)');
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
    connectChatHub('http://localhost:5007/chatHub', token || undefined)
      .then(() => {
        console.log('Connected to ChatHub SignalR (Port 5007)');
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
    </LoadingProvider>
  );
}

export default App;
