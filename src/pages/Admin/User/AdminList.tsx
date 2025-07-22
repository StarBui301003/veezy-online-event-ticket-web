import { useEffect, useState } from 'react';
import { getAdminUsers } from '@/services/Admin/user.service';
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
import { FaEye, FaPlus } from 'react-icons/fa';
import UserDetailModal from '@/pages/Admin/User/UserDetailModal';
import EditUserModal from '@/pages/Admin/User/EditUserModal';
import CreateAdminModal from '@/pages/Admin/User/CreateAdminModal';
import { useTranslation } from 'react-i18next';

const pageSizeOptions = [5, 10, 20, 50];

export const AdminList = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [adminPage, setAdminPage] = useState(1);
  const [adminPageSize, setAdminPageSize] = useState(10);

  const [viewUser, setViewUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [adminSearch, setAdminSearch] = useState('');

  // Thêm hàm reload danh sách
  const reloadUsers = () => {
    setLoading(true);
    getAdminUsers()
      .then((data) => {
        setUsers(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reloadUsers();
  }, []);

  const adminUsers = users;

  const filteredAdmins = adminUsers.filter(
    (user) =>
      !adminSearch ||
      user.fullName.toLowerCase().includes(adminSearch.trim().toLowerCase()) ||
      user.email.toLowerCase().includes(adminSearch.trim().toLowerCase()) ||
      (user.phone && user.phone.toLowerCase().includes(adminSearch.trim().toLowerCase()))
  );

  const pagedAdmins = filteredAdmins.slice(
    (adminPage - 1) * adminPageSize,
    adminPage * adminPageSize
  );
  const adminTotalPages = Math.max(1, Math.ceil(filteredAdmins.length / adminPageSize));

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
          title="Edit Admin"
          disableEmail
        />
      )}
      <CreateAdminModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setShowCreateModal(false);
          reloadUsers();
        }}
      />
      <div className="overflow-x-auto mb-10">
        <div className="p-4 bg-white rounded-xl shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            {/* Remove <h2 className="font-bold text-lg text-blue-700">Admin List</h2> */}
            {/* Keep search and create button layout */}
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
                  placeholder={t('search')}
                  value={adminSearch}
                  onChange={(e) => {
                    setAdminSearch(e.target.value);
                    setAdminPage(1);
                  }}
                />
                {adminSearch && (
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
                      setAdminSearch('');
                      setAdminPage(1);
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
            <div className="flex justify-end">
              <button
                className="flex gap-2 items-center border-2 border-green-500 bg-green-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-green-600 hover:text-white hover:border-green-500"
                onClick={() => setShowCreateModal(true)}
              >
                <FaPlus />
                {t('create')}
              </button>
            </div>
          </div>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-blue-200 hover:bg-blue-200">
                <TableHead className="pl-4" style={{ width: '10%' }}>
                  #
                </TableHead>
                <TableHead style={{ width: '25%' }}>{t('fullName')}</TableHead>
                <TableHead style={{ width: '15%' }}>{t('phone')}</TableHead>
                <TableHead style={{ width: '25%' }}>{t('email')}</TableHead>
                {/* <TableHead>Role</TableHead> */}
                <TableHead className="text-center">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedAdmins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                    {t('noUsersFound')}
                  </TableCell>
                </TableRow>
              ) : (
                pagedAdmins.map((user, idx) => (
                  <TableRow key={user.userId} className="hover:bg-blue-50">
                    <TableCell className="pl-4 ">
                      {(adminPage - 1) * adminPageSize + idx + 1}
                    </TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>
                      {user.phone || <span className="text-gray-400">N/A</span>}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>

                    <TableCell className="text-center flex items-center justify-center gap-2">
                      <button
                        className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2]"
                        title={t('edit')}
                        onClick={() => setEditUser(user)}
                      >
                        <MdOutlineEdit className="w-4 h-4" />
                      </button>
                      <button
                        className="border-2 border-yellow-400 bg-yellow-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white flex items-center justify-center hover:bg-yellow-500 hover:text-white"
                        title={t('view')}
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
                              onClick={() => setAdminPage((p) => Math.max(1, p - 1))}
                              aria-disabled={adminPage === 1}
                              className={adminPage === 1 ? 'pointer-events-none opacity-50' : ''}
                            >
                              {t('previous')}
                            </PaginationPrevious>
                          </PaginationItem>
                          {Array.from({ length: adminTotalPages }, (_, i) => i + 1).map((i) => (
                            <PaginationItem key={i}>
                              <PaginationLink
                                isActive={i === adminPage}
                                onClick={() => setAdminPage(i)}
                                className={`transition-colors rounded 
                                  ${
                                    i === adminPage
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
                              onClick={() => setAdminPage((p) => Math.min(adminTotalPages, p + 1))}
                              aria-disabled={adminPage === adminTotalPages}
                              className={
                                adminPage === adminTotalPages
                                  ? 'pointer-events-none opacity-50'
                                  : ''
                              }
                            >
                              {t('next')}
                            </PaginationNext>
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                    <div className="flex items-center gap-2 justify-end w-full md:w-auto">
                      <span className="text-sm text-gray-700">
                        {filteredAdmins.length === 0
                          ? '0-0 of 0'
                          : `${(adminPage - 1) * adminPageSize + 1}-${Math.min(
                              adminPage * adminPageSize,
                              filteredAdmins.length
                            )} of ${filteredAdmins.length}`}
                      </span>
                      <span className="text-sm text-gray-600">{t('rowsPerPage')}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1 px-2 py-1 border rounded text-sm bg-white hover:bg-gray-100 transition min-w-[48px] text-left">
                            {adminPageSize}
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
                                setAdminPageSize(size);
                                setAdminPage(1);
                              }}
                              className={size === adminPageSize ? 'font-bold bg-primary/10' : ''}
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

export default AdminList;
