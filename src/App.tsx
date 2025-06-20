import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '@/components/User/layout/Layout';
import { ErrorPage } from '@/pages/ErrorPage';
// import { HomePage } from '@/pages/User/HomePage';
import { LoginPage } from '@/pages/authentication/LoginPage';
import { Register } from './pages/authentication/Register';
import { LoadingProvider, useLoading } from '@/contexts/LoadingContext';
import { Loader2 } from 'lucide-react';
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
import { UserList } from './pages/Admin/User/UserList';
import EventDetail from './pages/Customer/EventDetail';
import ManagerDiscountCode from './pages/EventManager/ManagerDiscountCode';
import CreateDiscountCode from './pages/EventManager/CreateDiscountCode';
import AllEventsPage from './pages/Customer/AllEventsPage';
import ConfirmOrderPage from './pages/Customer/ConfirmOrderPage';
import PaymentSuccessPage from './pages/Customer/PaymentSuccessPage';
import { PaymentListAdmin } from './pages/Admin/Payment/PaymentListAdmin';
import ProfilePage from '@/pages/Admin/ProfilePage';
import CategoryList from './pages/Admin/Category/CategoryList';
import NewsManager from './pages/EventManager/NewsManager';
import CreateNews from './pages/EventManager/CreateNews';
import NewsDetail from './pages/Customer/NewsDetail';
import EditNews from './pages/EventManager/EditNews';
// import { DiscountCodeList } from './pages/Admin/DiscountCode/DiscountCodeList';

import { DiscountCodeList } from './pages/Admin/DiscountCode/DiscountCodeList';
import { AdminList } from './pages/Admin/User/AdminList';
import ProfileEventManager from './pages/EventManager/ProfileEventManager';
import HomePage from './pages/Customer/Home';
import ProfileCustomer from './pages/Customer/ProfileCustomer';
import EventListTabs from './pages/Admin/Event/EventListTabs';
import { useState, useEffect, useRef } from 'react';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { registerGlobalSpinner } from '@/services/axios.customize';
import { ReportPage } from './pages/Admin/Report/ReportPage';
import { NewsPage } from './pages/Admin/News/NewsPage';

function App() {
  const { loading } = useLoading();
  const [showSpinner, setShowSpinner] = useState(false);
  const spinnerTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    registerGlobalSpinner((show) => {
      if (show) {
        // Khi bắt đầu loading, show spinner ngay
        if (spinnerTimeout.current) clearTimeout(spinnerTimeout.current);
        setShowSpinner(true);
      } else {
        // Khi kết thúc loading, delay 300ms rồi mới tắt spinner
        if (spinnerTimeout.current) clearTimeout(spinnerTimeout.current);
        spinnerTimeout.current = setTimeout(() => setShowSpinner(false), 300);
      }
    });
    // Cleanup timeout khi unmount
    return () => {
      if (spinnerTimeout.current) clearTimeout(spinnerTimeout.current);
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
          path: 'events',
          element: <AllEventsPage />,
        },
        {
          path: 'confirm-order',
          element: (
            <ProtectedRoute allowedRoles={[1]}>
              <ConfirmOrderPage />,
            </ProtectedRoute>
          ),
        },
        {
          path: 'profile',
          element: (
            <ProtectedRoute allowedRoles={[1]}>
              <ProfileCustomer />,
            </ProtectedRoute>
          ),
        },
        {
          path: 'news/:newsId',
          element: (
            <ProtectedRoute allowedRoles={[1, 2]}>
              <NewsDetail />
            </ProtectedRoute>
          ),
        },
        {
          path: 'payment-success',

          element: (
            <ProtectedRoute allowedRoles={[1]}>
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
              <UserList />
            </ProtectedRoute>
          ),
        },
        {
          path: 'admin-list',
          element: (
            <ProtectedRoute allowedRoles={[0]}>
              <AdminList />
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
              <NewsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'comment-list',
          element: (
            <ProtectedRoute allowedRoles={[0]}>
              <NewsPage />
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
          path: 'edit/:eventId',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <EditEvent />
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
          path: 'news',
          element: (
            <ProtectedRoute allowedRoles={[2]}>
              <NewsManager />
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
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      )}
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
      <SpinnerOverlay show={showSpinner} />
    </LoadingProvider>
  );
}

export default App;
