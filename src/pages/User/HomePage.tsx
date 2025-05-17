import { useEffect, useState } from 'react';
import { getUserAPI } from '@/services/auth.service';

export const HomePage = () => {
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
      case 1:
        return 'Customer';
      case 2:
        return 'Event Manager';
      case 3:
        return 'Collaborator';
      case 4:
        return 'Other';
      default:
        return 'Unknown';
    }
  };

  return (
    <>
      <div className="bg-blue-300 w-full h-[500px] flex flex-col items-center justify-center">
        <div className="text-blue-950 text-[80px] font-bold">Welcome!!</div>
        {role !== null && (
          <div className="text-blue-800 text-2xl font-semibold mt-2">Role: {roleText(role)}</div>
        )}
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
