import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '@/components/User/layout/Layout';
import { ErrorPage } from '@/pages/ErrorPage';
import { HomePage } from '@/pages/User/HomePage';
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
              <HomePage />
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
          path: 'approved-events-list',
          element: <ApprovedEventList />,
        },
        //LƯU Ý: NHỚ THÊM PATH CHO BREAKCRUMB TRONG LAYOUT ADMIN LAYOUT.TSX
        // Thêm các page con cho admin ở đây, ví dụ:
        // { path: 'users', element: <UserManagement /> },
        // { path: 'events', element: <EventManagement /> },
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
