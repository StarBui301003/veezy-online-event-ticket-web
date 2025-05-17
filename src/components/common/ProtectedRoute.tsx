import { Navigate } from 'react-router-dom';

export function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: number[];
  children: React.ReactNode;
}) {
  const accountStr = localStorage.getItem('account');
  const account = accountStr ? JSON.parse(accountStr) : null;

  if (!account) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(account.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
