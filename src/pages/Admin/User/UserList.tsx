import { useEffect, useState } from 'react';
import { getUsers, getAccountByIdAPI } from '@/services/Admin/user.service';
import type { User } from '@/types/auth';
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
import UserDetailModal from '@/components/Admin/Modal/UserDetailModal';
import EditUserModal from '@/components/Admin/Modal/EditUserModal';

const pageSizeOptions = [5, 10, 20, 50];

export const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);

  useEffect(() => {
    setLoading(true);
    getUsers()
      .then(async (data) => {
        setUsers(data);
        // Lấy role cho từng accountId
        const roleMap: Record<string, number> = {};
        await Promise.all(
          data.map(async (user) => {
            try {
              const account = await getAccountByIdAPI(user.accountId);
              roleMap[user.accountId] = account.role;
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (err) {
              // Không báo toast, chỉ gán Unknown
              roleMap[user.accountId] = -1;
            }
          })
        );
        setRoles(roleMap);
      })
      .finally(() => setLoading(false));
  }, []);

  const pagedUsers = users.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));

  const roleLabel = (role: number) => {
    switch (role) {
      case 0:
        return 'Admin';
      case 1:
        return 'Customer';
      case 2:
        return 'EventManager';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="p-6">
      <SpinnerOverlay show={loading} />
      <h2 className="text-2xl font-bold mb-4">User List</h2>
      {/* Modal xem chi tiết user */}
      {viewUser && <UserDetailModal user={viewUser} onClose={() => setViewUser(null)} />}
      {/* Modal chỉnh sửa user */}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onUpdated={() => {
            setEditUser(null);
            // Reload lại danh sách nếu muốn
            setLoading(true);
            getUsers()
              .then(async (data) => {
                setUsers(data);
                const roleMap: Record<string, number> = {};
                await Promise.all(
                  data.map(async (user) => {
                    try {
                      const account = await getAccountByIdAPI(user.accountId);
                      roleMap[user.accountId] = account.role;
                    } catch {
                      roleMap[user.accountId] = -1;
                    }
                  })
                );
                setRoles(roleMap);
              })
              .finally(() => setLoading(false));
          }}
        />
      )}
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-blue-200 hover:bg-blue-200">
                <TableHead className="pl-4">#</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
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
                  <TableRow key={user.userId}>
                    <TableCell className="pl-4">{(page - 1) * pageSize + idx + 1}</TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>
                      {user.phone || <span className="text-gray-400">N/A</span>}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {roles[user.accountId] !== undefined ? (
                        roleLabel(roles[user.accountId])
                      ) : (
                        <span className="text-gray-400">...</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center flex items-center justify-center gap-2">
                      <button
                        className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition flex items-center justify-center"
                        title="Edit"
                        onClick={() => setEditUser(user)}
                      >
                        <MdOutlineEdit className="w-4 h-4" />
                      </button>
                      {/* Nút xem chi tiết user */}
                      <button
                        className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition flex items-center justify-center "
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
                              onClick={() => setPage((p) => Math.max(1, p - 1))}
                              aria-disabled={page === 1}
                              className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((i) => (
                            <PaginationItem key={i}>
                              <PaginationLink
                                isActive={i === page}
                                onClick={() => setPage(i)}
                                className={`transition-colors rounded 
                                  ${
                                    i === page
                                      ? 'bg-blue-500 text-white border hover:bg-blue-700 hover:text-white'
                                      : 'text-gray-700 hover:bg-slate-200 hover:text-black'
                                  }
                                  px-2 py-1 mx-0.5`}
                              >
                                {i}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                              aria-disabled={page === totalPages}
                              className={
                                page === totalPages ? 'pointer-events-none opacity-50' : ''
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                    <div className="flex items-center gap-2 justify-end w-full md:w-auto">
                      <span className="text-sm text-gray-700">
                        {users.length === 0
                          ? '0-0 of 0'
                          : `${(page - 1) * pageSize + 1}-${Math.min(
                              page * pageSize,
                              users.length
                            )} of ${users.length}`}
                      </span>
                      <span className="text-sm text-gray-700">Rows per page</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1 px-2 py-1 border rounded text-sm bg-white hover:bg-gray-100 transition min-w-[48px] text-left">
                            {pageSize}
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
                                setPageSize(size);
                                setPage(1);
                              }}
                              className={size === pageSize ? 'font-bold bg-primary/10' : ''}
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
