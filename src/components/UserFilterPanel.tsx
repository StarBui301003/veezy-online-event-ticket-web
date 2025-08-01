import React from 'react';
import { UserFilterParams } from '@/services/Admin/user.service';

interface UserFilterPanelProps {
  filters: UserFilterParams;
  onFiltersChange: (filters: UserFilterParams) => void;
  showRoleFilter?: boolean;
  showInactiveFilter?: boolean;
}

export const UserFilterPanel: React.FC<UserFilterPanelProps> = ({
  filters,
  onFiltersChange,
  showRoleFilter = false,
  showInactiveFilter = false,
}) => {
  const updateFilter = (key: keyof UserFilterParams, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1, // Reset to first page when filters change
    });
  };

  return (
    <div className="mb-4 p-4 bg-white rounded-xl shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={filters.searchTerm || ''}
            onChange={(e) => updateFilter('searchTerm', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Role Filter (only for general user search) */}
        {showRoleFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={filters.role || ''}
              onChange={(e) => updateFilter('role', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Customer">Customer</option>
              <option value="EventManager">Event Manager</option>
              <option value="Collaborator">Collaborator</option>
            </select>
          </div>
        )}
        
        {/* Status Filters */}
        {!showInactiveFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.isActive === undefined ? '' : filters.isActive.toString()}
              onChange={(e) => updateFilter('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Online Status</label>
          <select
            value={filters.isOnline === undefined ? '' : filters.isOnline.toString()}
            onChange={(e) => updateFilter('isOnline', e.target.value === '' ? undefined : e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="true">Online</option>
            <option value="false">Offline</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Verified</label>
          <select
            value={filters.isEmailVerified === undefined ? '' : filters.isEmailVerified.toString()}
            onChange={(e) => updateFilter('isEmailVerified', e.target.value === '' ? undefined : e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="true">Verified</option>
            <option value="false">Not Verified</option>
          </select>
        </div>
      </div>
      
      {/* Sort Options */}
      <div className="mt-4 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select
            value={filters.sortBy || ''}
            onChange={(e) => updateFilter('sortBy', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Default (Online + Created Date)</option>
            <option value="fullname">Full Name</option>
            <option value="username">Username</option>
            <option value="email">Email</option>
            <option value="createdat">Created Date</option>
            <option value="lastactiveat">Last Active</option>
            <option value="lastlogin">Last Login</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
          <select
            value={filters.sortDescending?.toString() || 'true'}
            onChange={(e) => updateFilter('sortDescending', e.target.value === 'true')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="true">Descending</option>
            <option value="false">Ascending</option>
          </select>
        </div>
      </div>
    </div>
  );
}; 