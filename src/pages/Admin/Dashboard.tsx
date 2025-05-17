import { useEffect, useState } from 'react';
import { getUserAPI, LogoutAPI } from '@/services/auth.service';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<number | null>(null);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const accStr = localStorage.getItem('account');
    if (!accStr) return;
    const accObj = JSON.parse(accStr);
    setRole(accObj.role); // Lấy role từ localStorage
    const userId = accObj.userId;
    if (!userId) return;
    getUserAPI(userId)
      .then((user) => {
        setUser(user);
      })
      .catch(() => setUser(null));
  }, []);

  // Map role number to text
  const roleText = (role: number | null) => {
    switch (role) {
      case 0:
        return 'Admin';
      default:
        return 'Unknown';
    }
  };

  // Hàm logout
  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      await LogoutAPI();
    } catch {
      // ignore error
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('account');
    setLoadingLogout(false);
    navigate('/login');
  };

  return (
    <>
      <div className="bg-blue-300 w-full h-[900px] flex flex-col items-center justify-center">
        <div className="text-blue-950 text-[80px] font-bold">This is the admin dashboard</div>
        {role !== null && (
          <div className="text-blue-800 text-2xl font-semibold mt-2">Role: {roleText(role)}</div>
        )}
        {/* Button logout ở giữa màn hình */}
        <button
          onClick={handleLogout}
          className="mt-8 px-8 py-3 bg-red-600 text-white rounded-lg text-xl font-bold hover:bg-red-700 transition flex items-center justify-center"
          disabled={loadingLogout}
        >
          {loadingLogout ? (
            <span className="flex items-center">
              <svg className="animate-spin mr-2 h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Đang đăng xuất...
            </span>
          ) : (
            'Logout'
          )}
        </button>
      </div>
      <div className="bg-blue-300 w-full h-[400px] flex flex-col items-center justify-center">
        {user && (
          <div className="text-blue-900 text-xl font-semibold space-y-2">
            <div>User ID: {user.userId}</div>
            <div>Account ID: {user.accountId}</div>
            <div>Full Name: {user.fullName}</div>
            <div>Phone: {user.phone}</div>
            <div>Email: {user.email}</div>
            <div>
              Avatar:{' '}
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" className="inline w-12 h-12 rounded-full" />
              ) : (
                'No avatar'
              )}
            </div>
            <div>Gender: {user.gender === 0 ? 'Male' : user.gender === 1 ? 'Female' : 'Other'}</div>
            <div>Date of Birth: {user.dob}</div>
          </div>
        )}
      </div>
    </>
  );
};
