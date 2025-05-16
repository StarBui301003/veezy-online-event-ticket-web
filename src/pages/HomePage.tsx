import { useEffect, useState } from 'react';
import { getUserAPI } from '@/services/auth.service';

export const HomePage = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const accStr = localStorage.getItem('account');
    if (!accStr) return;
    const accObj = JSON.parse(accStr);
    const userId = accObj.userId; // chỉ lấy userId
    if (!userId) return;
    getUserAPI(userId)
      .then((user) => {
        console.log(user);
        setUser(user);
      })
      .catch(() => setUser(null));
  }, []);

  return (
    <>
      <div className="bg-blue-300 w-full h-[500px] flex items-center justify-center">
        <div className="text-blue-950 text-[80px] font-bold">Welcome!!</div>
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
