import { useEffect, useState } from 'react';
import { getUserAPI } from '@/services/auth.service';

export const Dashboard = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<number | null>(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-200 to-blue-300 flex flex-col items-center py-12">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8 flex flex-col items-center mb-8">
        <div className="text-blue-950 text-4xl md:text-6xl font-bold mb-2 text-center">
          Admin Dashboard
        </div>
        {role !== null && (
          <div className="text-blue-800 text-xl md:text-2xl font-semibold mt-2 mb-4">
            Role: {roleText(role)}
          </div>
        )}
      </div>
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
        {user && (
          <div className="w-full flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-300 bg-gray-100 flex items-center justify-center">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="avatar"
                    className="object-contain w-full h-full"
                  />
                ) : (
                  <span className="text-gray-400 text-lg">No avatar</span>
                )}
              </div>
              <div className="mt-3 text-blue-900 font-semibold text-lg">{user.fullName}</div>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-blue-900 text-base">
              <div>
                <span className="font-semibold">User ID:</span> <span className="font-light">{user.userId}</span>
              </div>
              <div>
                <span className="font-semibold">Account ID:</span> <span className="font-light">{user.accountId}</span>
              </div>
              <div>
                <span className="font-semibold">Phone:</span> <span className="font-light">{user.phone}</span>
              </div>
              <div>
                <span className="font-semibold">Email:</span> <span className="font-light">{user.email}</span>
              </div>
              <div>
                <span className="font-semibold">Gender:</span>{' '}
                <span className="font-light">
                  {user.gender === 0 ? 'Male' : user.gender === 1 ? 'Female' : 'Other'}
                </span>
              </div>
              <div>
                <span className="font-semibold">Date of Birth:</span> <span className="font-light">{user.dob}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
