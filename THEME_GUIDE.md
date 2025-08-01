# Theme System Guide

## Overview

Hệ thống theme sáng/tối đã được implement cho toàn bộ admin folder với các tính năng:

- 🌓 **Light/Dark Mode**: Chuyển đổi theme sáng/tối
- 🎨 **CSS Variables**: Sử dụng CSS custom properties
- 🔄 **Context API**: Quản lý state theme toàn cục
- 💾 **Persistent**: Lưu theme vào localStorage và API
- 🎯 **Component Ready**: Sẵn sàng sử dụng cho mọi component

## Cấu trúc Files

```
src/
├── contexts/
│   └── ThemeContext.tsx          # Theme context provider
├── hooks/
│   └── useThemeClasses.ts        # Hook để generate theme classes
├── components/
│   ├── Admin/
│   │   ├── ThemeToggle.tsx       # Toggle switch component
│   │   └── ThemeDemo.tsx         # Demo component
│   └── common/
│       └── ThemedComponent.tsx   # Wrapper component
├── styles/
│   └── theme.css                 # CSS variables và classes
└── components/Admin/layout/
    └── Layout.tsx                # Layout với theme integration
```

## Cách sử dụng

### 1. Sử dụng ThemeContext

```tsx
import { useTheme } from '@/contexts/ThemeContext';

const MyComponent = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
    </div>
  );
};
```

### 2. Sử dụng useThemeClasses Hook

```tsx
import { useThemeClasses } from '@/hooks/useThemeClasses';

const MyComponent = () => {
  const {
    getCardClass,
    getButtonClass,
    getInputClass,
    getTableClass,
    getStatusClass,
  } = useThemeClasses();

  return (
    <div className={getCardClass() + ' p-4 rounded-lg border'}>
      <button className={getButtonClass('primary')}>
        Primary Button
      </button>
      <input 
        className={getInputClass() + ' w-full px-3 py-2 rounded border'}
        placeholder="Enter text..."
      />
      <span className={getStatusClass('success')}>Success</span>
    </div>
  );
};
```

### 3. Sử dụng ThemedComponent

```tsx
import ThemedComponent from '@/components/common/ThemedComponent';

const MyComponent = () => {
  return (
    <ThemedComponent variant="card" size="md" color="primary">
      <h2>Card Title</h2>
      <p>Card content with theme support</p>
    </ThemedComponent>
  );
};
```

### 4. Sử dụng CSS Classes trực tiếp

```tsx
const MyComponent = () => {
  return (
    <div className="card p-4 rounded-lg border">
      <h2 className="text-2xl font-bold">Title</h2>
      <p className="text-gray-600 dark:text-gray-400">
        Content with theme support
      </p>
    </div>
  );
};
```

## CSS Classes Available

### Background Classes
- `bg-white dark:bg-gray-900` - Primary background
- `bg-gray-50 dark:bg-gray-800` - Secondary background
- `bg-gray-100 dark:bg-gray-700` - Tertiary background

### Text Classes
- `text-gray-900 dark:text-gray-100` - Primary text
- `text-gray-600 dark:text-gray-400` - Secondary text
- `text-gray-500 dark:text-gray-500` - Muted text

### Border Classes
- `border-gray-300 dark:border-gray-700` - Primary border
- `border-gray-200 dark:border-gray-600` - Secondary border

### Component Classes
- `card` - Card styling
- `button-primary` - Primary button
- `button-secondary` - Secondary button
- `input` - Input styling
- `table` - Table styling
- `modal` - Modal styling
- `sidebar` - Sidebar styling
- `nav` - Navigation styling

### Status Classes
- `status-success` - Success status
- `status-warning` - Warning status
- `status-error` - Error status
- `status-info` - Info status

## Theme Variables

### Light Theme
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --border-primary: #e2e8f0;
  --border-secondary: #cbd5e1;
  --accent-primary: #3b82f6;
  --accent-secondary: #1d4ed8;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
}
```

### Dark Theme
```css
.dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
  --border-primary: #334155;
  --border-secondary: #475569;
  --accent-primary: #3b82f6;
  --accent-secondary: #60a5fa;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
}
```

## Integration với Components

### 1. Layout Component
Layout đã được tích hợp theme với:
- Header với dark mode support
- Sidebar với theme classes
- Content area với background colors

### 2. ThemeToggle Component
Toggle switch đã được tích hợp với:
- API calls để update user config
- localStorage persistence
- Toast notifications
- Real-time theme switching

### 3. Existing Components
Để áp dụng theme cho components hiện có:

```tsx
// Trước
<div className="bg-white border border-gray-300 p-4">

// Sau
<div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-4">
```

## Best Practices

### 1. Sử dụng CSS Variables
```css
.my-component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}
```

### 2. Sử dụng Tailwind Dark Classes
```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
```

### 3. Sử dụng useThemeClasses Hook
```tsx
const { getCardClass, getButtonClass } = useThemeClasses();
return <div className={getCardClass()}>...</div>;
```

### 4. Testing Theme
```tsx
// Test theme switching
const { theme, toggleTheme } = useTheme();
console.log('Current theme:', theme);
```

## Migration Guide

### 1. Update Existing Components
```tsx
// Cũ
<div className="bg-white p-4 border border-gray-300">

// Mới
<div className="bg-white dark:bg-gray-800 p-4 border border-gray-300 dark:border-gray-700">
```

### 2. Update Forms
```tsx
// Cũ
<input className="border border-gray-300 px-3 py-2" />

// Mới
<input className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2" />
```

### 3. Update Tables
```tsx
// Cũ
<table className="bg-white border border-gray-300">

// Mới
<table className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
```

## Troubleshooting

### 1. Theme không load
- Kiểm tra localStorage có `user_config` không
- Kiểm tra API response có `theme` field không
- Console log để debug

### 2. CSS Classes không apply
- Kiểm tra import `theme.css` trong `main.tsx`
- Kiểm tra Tailwind config có `darkMode: 'class'` không
- Kiểm tra CSS specificity

### 3. Theme không persist
- Kiểm tra API call có thành công không
- Kiểm tra localStorage có được update không
- Kiểm tra ThemeContext có được wrap đúng không

## Examples

Xem `ThemeDemo.tsx` để có ví dụ đầy đủ về cách sử dụng theme system.

## Notes

- Theme được lưu vào localStorage với key `user_config`
- API endpoint: `/api/User/{userId}/config`
- Theme values: 0 = Light, 1 = Dark
- Context được wrap trong `ThemeProvider` ở Layout level 