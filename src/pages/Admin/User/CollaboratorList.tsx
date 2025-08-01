/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { getCollaboratorsWithFilter, UserFilterParams } from '@/services/Admin/user.service';
import { connectIdentityHub, onIdentity } from '@/services/signalr.service';
import type { UserAccountResponse } from '@/types/Admin/user';
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MdOutlineEdit } from 'react-icons/md';
import { FaEye, FaFilter, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import UserDetailModal from '@/pages/Admin/User/UserDetailModal';
import EditUserModal from '@/pages/Admin/User/EditUserModal';
import { useTranslation } from 'react-i18next';
import { deactivateUserAPI } from '@/services/Admin/user.service';
import { toast } from 'react-toastify';

const pageSizeOptions = [5, 10, 20, 50];

export const CollaboratorList = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserAccountResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [viewUser, setViewUser] = useState<UserAccountResponse | null>(null);
  const [editUser, setEditUser] = useState<UserAccountResponse | null>(null);

  // Search state
  const [collaboratorSearch, setCollaboratorSearch] = useState('');

  // Filter state
  const [filters, setFilters] = useState<UserFilterParams>({
    page: 1,
    pageSize: 5,
    sortDescending: true,
  });

  // Sort state
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDescending, setSortDescending] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Omit<UserFilterParams, 'role'> = {
        searchTerm: collaboratorSearch || filters.searchTerm,
        isActive: filters.isActive,
        isOnline: filters.isOnline,
        isEmailVerified: filters.isEmailVerified,
        page: filters.page,
        pageSize: filters.pageSize,
        sortBy: sortBy || filters.sortBy,
        sortDescending: sortDescending,
      };

      const response = await getCollaboratorsWithFilter(params);
      if (response.flag) {
        setUsers(response.data.items);
        setTotalItems(response.data.totalItems);
        setTotalPages(response.data.totalPages);
        // Don't update filters here to avoid infinite loop
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Connect to IdentityHub for real-time updates
  useEffect(() => {
    connectIdentityHub('http://localhost:5001/hubs/notifications');

    // Listen for real-time collaborator updates
    onIdentity('CollaboratorCreated', (data: any) => {
      console.log('👤 Collaborator created:', data);
      fetchUsers();
    });

    onIdentity('CollaboratorUpdated', (data: any) => {
      console.log('👤 Collaborator updated:', data);
      fetchUsers();
    });

    onIdentity('CollaboratorDeleted', (data: any) => {
      console.log('👤 Collaborator deleted:', data);
      fetchUsers();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, collaboratorSearch, sortBy, sortDescending]);

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setFilters((prev) => ({ ...prev, page: 1, pageSize: newPageSize }));
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDescending(!sortDescending);
    } else {
      setSortBy(column);
      setSortDescending(true);
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <FaSort className="w-3 h-3 text-gray-400" />;
    }
    return sortDescending ? (
      <FaSortDown className="w-3 h-3 text-purple-600" />
    ) : (
      <FaSortUp className="w-3 h-3 text-purple-600" />
    );
  };

  const updateFilter = (key: keyof UserFilterParams, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  // Handle deactivate user
  const handleDeactivateUser = async (user: UserAccountResponse) => {
    try {
      await deactivateUserAPI(user.accountId);
      toast.success('User deactivated successfully!');
      fetchUsers(); // Refresh the list
    } catch (error) {
      toast.error('Failed to deactivate user!');
      console.error('Error deactivating user:', error);
    }
  };

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
            fetchUsers();
          }}
          title="Edit Collaborator"
          disableEmail
        />
      )}

      <div className="overflow-x-auto mb-10">
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
                  placeholder={t('search')}
                  value={collaboratorSearch}
                  onChange={(e) => {
                    setCollaboratorSearch(e.target.value);
                    setFilters((prev) => ({ ...prev, page: 1 }));
                  }}
                />
                {collaboratorSearch && (
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
                      setCollaboratorSearch('');
                      setFilters((prev) => ({ ...prev, page: 1 }));
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
            <div className="flex justify-end gap-2">
              {/* Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex gap-2 items-center border-2 border-blue-500 bg-blue-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-blue-600 hover:text-white hover:border-blue-500">
                    <FaFilter />
                    Filter
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1 text-sm font-semibold">Status</div>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('isActive', undefined)}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.isActive === undefined}
                      readOnly
                      className="mr-2"
                    />
                    <span>All</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('isActive', true)}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.isActive === true}
                      readOnly
                      className="mr-2"
                    />
                    <span>Active</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('isActive', false)}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.isActive === false}
                      readOnly
                      className="mr-2"
                    />
                    <span>Inactive</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1 text-sm font-semibold">Online Status</div>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('isOnline', undefined)}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.isOnline === undefined}
                      readOnly
                      className="mr-2"
                    />
                    <span>All</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('isOnline', true)}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.isOnline === true}
                      readOnly
                      className="mr-2"
                    />
                    <span>Online</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('isOnline', false)}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.isOnline === false}
                      readOnly
                      className="mr-2"
                    />
                    <span>Offline</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1 text-sm font-semibold">Email Verified</div>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('isEmailVerified', undefined)}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.isEmailVerified === undefined}
                      readOnly
                      className="mr-2"
                    />
                    <span>All</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('isEmailVerified', true)}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.isEmailVerified === true}
                      readOnly
                      className="mr-2"
                    />
                    <span>Verified</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('isEmailVerified', false)}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.isEmailVerified === false}
                      readOnly
                      className="mr-2"
                    />
                    <span>Not Verified</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-purple-200 hover:bg-purple-200">
                <TableHead className="text-center" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead style={{ width: '20%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('fullname')}
                  >
                    Name
                    {getSortIcon('fullname')}
                  </div>
                </TableHead>
                <TableHead style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('username')}
                  >
                    Username
                    {getSortIcon('username')}
                  </div>
                </TableHead>
                <TableHead style={{ width: '20%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('email')}
                  >
                    Email
                    {getSortIcon('email')}
                  </div>
                </TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
                  Status
                </TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
                  Online
                </TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
                  Email Verified
                </TableHead>
                <TableHead className="text-center" style={{ width: '15%' }}>
                  <div
                    className="flex items-center justify-center gap-1 cursor-pointer"
                    onClick={() => handleSort('createdat')}
                  >
                    Created At
                    {getSortIcon('createdat')}
                  </div>
                </TableHead>
                <TableHead className="text-center" style={{ width: '15%' }}>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <>
                  {/* Show 5 empty rows when no data */}
                  {Array.from({ length: 5 }, (_, idx) => (
                    <TableRow key={`empty-${idx}`} className="h-[56.8px]">
                      <TableCell colSpan={9} className="border-0"></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : (
                <>
                  {users.map((user, idx) => (
                    <TableRow key={user.userId} className="hover:bg-purple-50">
                      <TableCell className="text-center">
                        {(filters.page - 1) * filters.pageSize + idx + 1}
                      </TableCell>
                      <TableCell className="truncate max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {user.fullName}
                      </TableCell>
                      <TableCell className="truncate max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {user.username}
                      </TableCell>
                      <TableCell className="truncate max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={() => handleDeactivateUser(user)}
                            disabled={loading}
                            className={
                              user.isActive
                                ? '!bg-green-500 !border-green-500'
                                : '!bg-red-400 !border-red-400'
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={`border-2 rounded-[10px] cursor-pointer transition-all ${
                            user.isOnline
                              ? 'border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:text-white hover:border-blue-500'
                              : 'border-gray-500 bg-gray-500 text-white hover:bg-gray-600 hover:text-white hover:border-gray-500'
                          }`}
                        >
                          {user.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={`border-2 rounded-[10px] cursor-pointer transition-all ${
                            user.isEmailVerified
                              ? 'border-green-500 bg-green-500 text-white hover:bg-green-600 hover:text-white hover:border-green-500'
                              : 'border-yellow-500 bg-yellow-500 text-white hover:bg-yellow-600 hover:text-white hover:border-yellow-500'
                          }`}
                        >
                          {user.isEmailVerified ? 'Verified' : 'Not Verified'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-center flex items-center justify-center gap-2">
                        <button
                          className="border-2 border-yellow-400 bg-yellow-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[15px] font-semibold text-white flex items-center justify-center hover:bg-yellow-500 hover:text-white"
                          title="View details"
                          onClick={() => setViewUser(user)}
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[15px] font-semibold text-white hover:bg-[#0071e2]"
                          title="Edit"
                          onClick={() => setEditUser(user)}
                        >
                          <MdOutlineEdit className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Add empty rows to maintain table height */}
                  {Array.from({ length: Math.max(0, 5 - users.length) }, (_, idx) => (
                    <TableRow key={`empty-${idx}`} className="h-[56.8px]">
                      <TableCell colSpan={9} className="border-0"></TableCell>
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={9}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-2 py-2">
                    <div className="flex-1 flex justify-center pl-[200px]">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handlePageChange(Math.max(1, filters.page - 1))}
                              aria-disabled={filters.page === 1}
                              className={filters.page === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                          {(() => {
                            const pages = [];
                            const maxVisiblePages = 7;

                            if (totalPages <= maxVisiblePages) {
                              // Hiển thị tất cả trang nếu tổng số trang <= 7
                              for (let i = 1; i <= totalPages; i++) {
                                pages.push(i);
                              }
                            } else {
                              // Logic hiển thị trang với dấu "..."
                              if (filters.page <= 4) {
                                // Trang hiện tại ở đầu
                                for (let i = 1; i <= 5; i++) {
                                  pages.push(i);
                                }
                                pages.push('...');
                                pages.push(totalPages);
                              } else if (filters.page >= totalPages - 3) {
                                // Trang hiện tại ở cuối
                                pages.push(1);
                                pages.push('...');
                                for (let i = totalPages - 4; i <= totalPages; i++) {
                                  pages.push(i);
                                }
                              } else {
                                // Trang hiện tại ở giữa
                                pages.push(1);
                                pages.push('...');
                                for (let i = filters.page - 1; i <= filters.page + 1; i++) {
                                  pages.push(i);
                                }
                                pages.push('...');
                                pages.push(totalPages);
                              }
                            }

                            return pages.map((item, index) => (
                              <PaginationItem key={index}>
                                {item === '...' ? (
                                  <span className="px-2 py-1 text-gray-500">...</span>
                                ) : (
                                  <PaginationLink
                                    isActive={item === filters.page}
                                    onClick={() => handlePageChange(item as number)}
                                    className={`transition-colors rounded 
                                      ${
                                        item === filters.page
                                          ? 'bg-purple-500 text-white border hover:bg-purple-700 hover:text-white'
                                          : 'text-gray-700 hover:bg-slate-200 hover:text-black'
                                      }
                                      px-2 py-1 mx-0.5`}
                                    style={{
                                      minWidth: 32,
                                      textAlign: 'center',
                                      fontWeight: item === filters.page ? 700 : 400,
                                      cursor: item === filters.page ? 'default' : 'pointer',
                                    }}
                                  >
                                    {item}
                                  </PaginationLink>
                                )}
                              </PaginationItem>
                            ));
                          })()}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                handlePageChange(Math.min(totalPages, filters.page + 1))
                              }
                              aria-disabled={filters.page === totalPages}
                              className={
                                filters.page === totalPages ? 'pointer-events-none opacity-50' : ''
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
                          : `${(filters.page - 1) * filters.pageSize + 1}-${Math.min(
                              filters.page * filters.pageSize,
                              totalItems
                            )} of ${totalItems}`}
                      </span>
                      <span className="text-sm text-gray-700">Rows per page</span>
                      <select
                        className="border rounded px-2 py-1 text-sm bg-white"
                        value={filters.pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      >
                        {pageSizeOptions.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
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

export default CollaboratorList;
