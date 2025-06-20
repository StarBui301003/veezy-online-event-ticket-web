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
import { ApprovedEventList } from './pages/Admin/Event/ApprovedEventList';
import { PendingEventList } from './pages/Admin/Event/PendingEventList';
import DashboardEvent from './pages/EventManager/DashboardEvent';
import { EventManagerLayout } from './components/EventManager/layout/Layout';
import CreateEventForm from './pages/EventManager/CreateEvent';
import PendingEventsManager from './pages/EventManager/PendingEventsManager';
import ApprovedEventsManager from './pages/EventManager/ApprovedEventsManager';
import EditEvent from './pages/EventManager/EditEvent';
import CreateTicket from './pages/EventManager/CreateTicket';
import EventListWithTicketManager from './pages/EventManager/EventListWithTicketManager';
import EditTicket from './pages/EventManager/EditTicket';
import Home from './pages/Customer/Home';
import { RejectedEventList } from './pages/Admin/Event/RejectedEventList';
import { OrderListAdmin } from './pages/Admin/Order/OrderListAdmin';
import { UserList } from './pages/Admin/User/UserList';
import EventDetail from './pages/Customer/EventDetail';
import ManagerDiscountCode from './pages/EventManager/ManagerDiscountCode';
import CreateDiscountCode from './pages/EventManager/CreateDiscountCode';
import AllEventsPage from "./pages/Customer/AllEventsPage";
import ConfirmOrderPage from './pages/Customer/ConfirmOrderPage';
import PaymentSuccessPage from './pages/Customer/PaymentSuccessPage';
import { PaymentListAdmin } from './pages/Admin/Payment/PaymentListAdmin';
import ProfilePage from '@/pages/ProfilePage';
import CategoryList from './pages/Admin/Category/CategoryList';
import NewsManager from './pages/EventManager/NewsManager';
import CreateNews from './pages/EventManager/CreateNews';
import NewsDetail from './pages/Customer/NewsDetail';
import EditNews from './pages/EventManager/EditNews';
// import { DiscountCodeList } from './pages/Admin/DiscountCode/DiscountCodeList';


function App() {
  const { loading } = useLoading();

  const router = createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: (
            <ProtectedRoute allowedRoles={[1, 2]}>
              {/* <HomePage /> */}
              <Home />
            </ProtectedRoute>
          ),
        },
        {
          path: 'event/:eventId',
          element: (
            <ProtectedRoute allowedRoles={[1, 2]}>
              <EventDetail />
            </ProtectedRoute>
          ),
        },
       
        {
          path: 'events',
          element: (
            <ProtectedRoute allowedRoles={[1, 2]}>
              <AllEventsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'confirm-order',
          element: (
            <ProtectedRoute allowedRoles={[1, 2]}>
              <ConfirmOrderPage />
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
          element: <PaymentSuccessPage />,
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
          path: 'approved-events-list',
          element: (
            <ProtectedRoute allowedRoles={[0]}>
              <ApprovedEventList />
            </ProtectedRoute>
          ),
        },
        {
          path: 'rejected-events-list',
          element: (
            <ProtectedRoute allowedRoles={[0]}>
              <RejectedEventList />
            </ProtectedRoute>
          ),
        },
        {
          path: 'pending-events-list',
          element: (
            <ProtectedRoute allowedRoles={[0]}>
              <PendingEventList />
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
        // {
        //   path: 'discountCode-list',
        //   element: (
        //     <ProtectedRoute allowedRoles={[0]}>
        //       <DiscountCodeList />
        //     </ProtectedRoute>
        //   ),
        // },
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
    </LoadingProvider>
  );
}

export default App;
