import { useState, useEffect } from 'react';
import { CiSearch } from 'react-icons/ci';
import { IoClose } from 'react-icons/io5';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useThemeClasses } from '@/hooks/useThemeClasses';

interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onSearch: () => void;
}

export const MobileSearch = ({
  isOpen,
  onClose,
  searchTerm,
  onSearchTermChange,
  onSearch,
}: MobileSearchProps) => {
  const { getThemeClass } = useThemeClasses();

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      onSearch();
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 sm:hidden transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Search Container */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 p-4 transition-transform duration-300',
          getThemeClass(
            'bg-white border-b border-gray-200',
            'bg-gray-900 border-b border-gray-700'
          ),
          isOpen ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div
            className={cn(
              'flex-1 flex items-center border rounded-lg px-3 py-2',
              getThemeClass('border-gray-300 bg-gray-50', 'border-gray-600 bg-gray-800')
            )}
          >
            <CiSearch
              className={cn('w-6 h-6 mr-2', getThemeClass('text-gray-600', 'text-gray-300'))}
            />
            <Input
              type="text"
              placeholder="Search events, news..."
              className={cn(
                'border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-base',
                getThemeClass('text-gray-900', 'text-white')
              )}
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
            />
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={cn(
              'p-2 rounded-full',
              getThemeClass('text-gray-700 hover:bg-gray-100', 'text-gray-200 hover:bg-white/10')
            )}
            aria-label="Close search"
          >
            <IoClose className="w-6 h-6" />
          </Button>
        </div>

        {/* Search Button */}
        {searchTerm.trim() && (
          <Button
            onClick={handleSearch}
            className="w-full mt-3 bg-blue-600 text-white hover:bg-blue-700"
          >
            Search
          </Button>
        )}
      </div>
    </div>
  );
};
