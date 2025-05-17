import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
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
    //       <Example />
    //     </ProtectedRoute>
    //   ),
    // },
    // Admin
    {
      path: '/admin',
      element: (
        <ProtectedRoute allowedRoles={[0]}>
          <Dashboard />
        </ProtectedRoute>
      ),
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
