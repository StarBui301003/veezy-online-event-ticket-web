import React from 'react';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeDemo: React.FC = () => {
  const { theme } = useTheme();
  const { getCardClass, getButtonClass, getInputClass, getTableClass, getStatusClass } =
    useThemeClasses();

  return (
    <div className="p-6 space-y-6">
      <div className={getCardClass() + ' p-6 rounded-lg border shadow-sm'}>
        <h2 className="text-2xl font-bold mb-4">Theme Demo - {theme} mode</h2>

        {/* Buttons */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Buttons</h3>
          <div className="flex gap-4 flex-wrap">
            <button className={getButtonClass('primary')}>Primary Button</button>
            <button className={getButtonClass('secondary')}>Secondary Button</button>
            <button className={getButtonClass('danger')}>Danger Button</button>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-semibold">Inputs</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Enter text here..."
              className={getInputClass() + ' w-full px-3 py-2 rounded border'}
            />
            <select className={getInputClass() + ' w-full px-3 py-2 rounded border'}>
              <option>Select an option</option>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
        </div>

        {/* Status Badges */}
        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-semibold">Status Badges</h3>
          <div className="flex gap-2 flex-wrap">
            <span className={getStatusClass('success')}>Success</span>
            <span className={getStatusClass('warning')}>Warning</span>
            <span className={getStatusClass('error')}>Error</span>
            <span className={getStatusClass('info')}>Info</span>
          </div>
        </div>

        {/* Table */}
        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-semibold">Table</h3>
          <div className={getTableClass() + ' rounded-lg border overflow-hidden'}>
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-2">John Doe</td>
                  <td className="px-4 py-2">john@example.com</td>
                  <td className="px-4 py-2">
                    <span className={getStatusClass('success')}>Active</span>
                  </td>
                </tr>
                <tr className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-2">Jane Smith</td>
                  <td className="px-4 py-2">jane@example.com</td>
                  <td className="px-4 py-2">
                    <span className={getStatusClass('warning')}>Pending</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-semibold">Cards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className={getCardClass() + ' p-4 rounded-lg border shadow-sm'}>
              <h4 className="font-semibold mb-2">Card 1</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This is a sample card with theme support.
              </p>
            </div>
            <div className={getCardClass() + ' p-4 rounded-lg border shadow-sm'}>
              <h4 className="font-semibold mb-2">Card 2</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Another card demonstrating theme consistency.
              </p>
            </div>
            <div className={getCardClass() + ' p-4 rounded-lg border shadow-sm'}>
              <h4 className="font-semibold mb-2">Card 3</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Third card showing theme integration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeDemo;
