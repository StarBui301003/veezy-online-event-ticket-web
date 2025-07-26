import { useEffect, useState } from 'react';
import { getCustomerUsers } from '@/services/Admin/user.service';
import type { User } from '@/types/auth';
import type { PaginatedUserResponse } from '@/types/Admin/user';

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from '@/components/ui/table';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { MdOutlineEdit } from 'react-icons/md';
import { FaEye } from 'react-icons/fa';
import UserDetailModal from '@/pages/Admin/User/UserDetailModal';
import EditUserModal from '@/pages/Admin/User/EditUserModal';

const pageSizeOptions = [5, 10, 20, 50];

export const CustomerList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);

  const [viewUser, setViewUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);

  const [userSearch, setUserSearch] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Thêm hàm reload danh sách
  const reloadUsers = () => {
    setLoading(true);
    getCustomerUsers(userPage, userPageSize)
      .then((res: PaginatedUserResponse) => {
        if (res && res.data && Array.isArray(res.data.items)) {
          setUsers(res.data.items);
          setTotalItems(res.data.totalItems);
          setTotalPages(res.data.totalPages);
        } else {
          setUsers([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      })
      .finally(() => setLoading(false));
  };

  // Connect to IdentityHub for real-time updates
  useEffect(() => {
    // Initial data load
    reloadUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    reloadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPage, userPageSize]);

  const filteredUsers = Array.isArray(users)
    ? users.filter(
        (user) =>
          !userSearch ||
          user.fullName.toLowerCase().includes(userSearch.trim().toLowerCase()) ||
          user.email.toLowerCase().includes(userSearch.trim().toLowerCase()) ||
          (user.phone && user.phone.toLowerCase().includes(userSearch.trim().toLowerCase()))
      )
    : [];
  const pagedUsers = filteredUsers;
  // Xóa dòng tính userTotalPages FE
  // const userTotalPages = Math.max(1, Math.ceil(filteredUsers.length / userPageSize));

  return (
    <div className="p-3">
      <SpinnerOverlay show={loading} />
      {viewUser && <UserDetailModal user={viewUser} onClose={() => setViewUser(null)} />}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onUpdated={() => {
            setEditUser(null);
            reloadUsers();
          }}
          title="Edit Customer"
        />
      )}
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <div className="flex-1 flex items-center gap-2">
              <div
                className="InputContainer relative"
                style={{
                  width: 310,
                  height: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(to bottom, #c7eafd, #e0e7ff)',
                  borderRadius: 30,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 10px rgba(0,0,0,0.075)',
                  position: 'relative',
                }}
              >
                <input
                  className="input pr-8"
                  style={{
                    width: 300,
                    height: 40,
                    border: 'none',
                    outline: 'none',
                    caretColor: 'rgb(255,81,0)',
                    backgroundColor: 'rgb(255,255,255)',
                    borderRadius: 30,
                    paddingLeft: 15,
                    letterSpacing: 0.8,
                    color: 'rgb(19,19,19)',
                    fontSize: 13.4,
                  }}
                  placeholder="Search by full name, email, or phone..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                />
                {userSearch && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-red-500 hover:text-red-600 focus:outline-none bg-white rounded-full"
                    style={{
                      border: 'none',
                      outline: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      height: 24,
                      width: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={() => {
                      setUserSearch('');
                      setUserPage(1);
                    }}
                    tabIndex={-1}
                    type="button"
                    aria-label="Clear search"
                  >
                    &#10005;
                  </button>
                )}
              </div>
            </div>
          </div>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-yellow-200 hover:bg-yellow-200">
                <TableHead className="pl-4" style={{ width: '10%' }}>
                  #
                </TableHead>
                <TableHead style={{ width: '25%' }}>Full Name</TableHead>
                <TableHead style={{ width: '15%' }}>Phone</TableHead>
                <TableHead style={{ width: '25%' }}>Email</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                pagedUsers.map((user, idx) => (
                  <TableRow key={user.userId} className="hover:bg-yellow-50">
                    <TableCell className="pl-4">
                      {(userPage - 1) * userPageSize + idx + 1}
                    </TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>
                      {user.phone || <span className="text-gray-400">N/A</span>}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>

                    <TableCell className="text-center flex items-center justify-center gap-2">
                      <button
                        className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2]"
                        title="Edit"
                        onClick={() => setEditUser(user)}
                      >
                        <MdOutlineEdit className="w-4 h-4" />
                      </button>
                      <button
                        className="border-2 border-yellow-400 bg-yellow-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white flex items-center justify-center hover:bg-yellow-500 hover:text-white"
                        title="View details"
                        onClick={() => setViewUser(user)}
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-2 py-2">
                    <div className="flex-1 flex justify-center pl-[200px]">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                              aria-disabled={userPage === 1}
                              className={userPage === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((i) => (
                            <PaginationItem key={i}>
                              <PaginationLink
                                isActive={i === userPage}
                                onClick={() => setUserPage(i)}
                                className={`transition-colors rounded 
                                  ${
                                    i === userPage
                                      ? 'bg-yellow-400 text-white border hover:bg-yellow-500 hover:text-white'
                                      : 'text-gray-700 hover:bg-yellow-100 hover:text-black'
                                  }
                                  px-2 py-1 mx-0.5`}
                              >
                                {i}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setUserPage((p) => Math.min(totalPages, p + 1))}
                              aria-disabled={userPage === totalPages}
                              className={
                                userPage === totalPages ? 'pointer-events-none opacity-50' : ''
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                    <div className="flex items-center gap-2 justify-end w-full md:w-auto">
                      <span className="text-sm text-gray-700">
                        {totalItems === 0
                          ? '0-0 of 0'
                          : `${(userPage - 1) * userPageSize + 1}-${Math.min(
                              userPage * userPageSize,
                              totalItems
                            )} of ${totalItems}`}
                      </span>
                      <span className="text-sm text-gray-700">Rows per page</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1 px-2 py-1 border rounded text-sm bg-white hover:bg-gray-100 transition min-w-[48px] text-left">
                            {userPageSize}
                            <svg
                              className="w-4 h-4 ml-1"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {pageSizeOptions.map((size) => (
                            <DropdownMenuItem
                              key={size}
                              onClick={() => {
                                setUserPageSize(size);
                                setUserPage(1);
                              }}
                              className={size === userPageSize ? 'font-bold bg-primary/10' : ''}
                            >
                              {size}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </div>
  );
};
