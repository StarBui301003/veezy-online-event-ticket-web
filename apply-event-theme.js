const fs = require('fs');
const path = require('path');

// Danh sách các file Event cần áp dụng theme
const eventFiles = [
    'CanceledEventList.tsx',
    'CompletedEventList.tsx',
    'RejectedEventList.tsx'
];

// Các thay đổi cần áp dụng
const changes = [
    {
        // Thêm import useThemeClasses
        search: "import { toast } from 'react-toastify';",
        replace: "import { toast } from 'react-toastify';\nimport { useThemeClasses } from '@/hooks/useThemeClasses';"
    },
    {
        // Thêm destructuring useThemeClasses
        search: "}) => {\n  const [data, setData] = useState<PaginatedEventResponse['data'] | null>(null);",
        replace: `}) => {
  const {
    getProfileInputClass,
    getEventListCardClass,
    getEventListTableClass,
    getEventListTableHeaderClass,
    getEventListTableRowClass,
    getEventListDropdownClass,
    getEventListDropdownItemClass,
    getEventListPaginationClass,
    getEventListPageSizeSelectClass,
    getEventListTableBorderClass,
    getEventListTableCellBorderClass,
    getEventListTableHeaderBorderClass,
  } = useThemeClasses();
  const [data, setData] = useState<PaginatedEventResponse['data'] | null>(null);`
    },
    {
        // Thay đổi card container
        search: 'className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow"',
        replace: 'className={`p-4 ${getEventListCardClass()}`}'
    },
    {
        // Thay đổi input search
        search: /className="input pr-8.*?"\s+style=\{[\s\S]*?\}/,
        replace: 'className={`w-[300px] h-10 rounded-[30px] px-4 py-2 text-sm transition-colors ${getProfileInputClass()}`}'
    },
    {
        // Thay đổi dropdown content
        search: 'className="w-56"',
        replace: 'className={`w-56 ${getEventListDropdownClass()}`}'
    },
    {
        // Thay đổi dropdown items
        search: 'className="flex items-center gap-2"',
        replace: 'className={`flex items-center gap-2 ${getEventListDropdownItemClass()}`}'
    },
    {
        // Thay đổi table
        search: 'className="min-w-full"',
        replace: 'className={`min-w-full ${getEventListTableClass()} ${getEventListTableBorderClass()}`}'
    },
    {
        // Thay đổi table header row
        search: /className="bg-[a-zA-Z-]+ hover:bg-[a-zA-Z-]+"/,
        replace: 'className={`${getEventListTableHeaderClass()} ${getEventListTableHeaderBorderClass()}`}'
    },
    {
        // Thay đổi table body
        search: 'className="min-h-[400px]"',
        replace: 'className={`min-h-[400px] ${getEventListTableClass()} ${getEventListTableBorderClass()}`}'
    },
    {
        // Thay đổi table rows
        search: /className="hover:bg-[a-zA-Z-]+"/,
        replace: 'className={`${getEventListTableRowClass()} ${getEventListTableCellBorderClass()}`}'
    },
    {
        // Thay đổi empty rows
        search: 'className="h-[56.8px]"',
        replace: 'className={`h-[56.8px] ${getEventListTableRowClass()} ${getEventListTableCellBorderClass()}`}'
    }
];

// Hàm áp dụng thay đổi cho một file
function applyChangesToFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    changes.forEach(change => {
        if (content.includes(change.search)) {
            content = content.replace(change.search, change.replace);
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
    } else {

    }

}

// Áp dụng cho tất cả các file
const eventDir = path.join(__dirname, 'src/pages/Admin/Event');
eventFiles.forEach(file => {
    const filePath = path.join(eventDir, file);
    if (fs.existsSync(filePath)) {
        applyChangesToFile(filePath);
    }
});
