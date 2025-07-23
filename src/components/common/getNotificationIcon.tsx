import { ReactNode } from 'react';

export const getNotificationIcon = (type: number): ReactNode => {
  switch (type) {
    case 1:
      return (
        <span className="text-amber-500">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" /></svg>
        </span>
      );
    case 2:
      return (
        <span className="text-blue-500">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M11.3 1.046a1 1 0 00-2.6 0l-.25.77a1 1 0 01-.95.69h-.81a1 1 0 00-.98 1.197l.16.81a1 1 0 01-.29.95l-.57.57a1 1 0 00-.12 1.32l.57.57a1 1 0 01.29.95l-.16.81a1 1 0 00.98 1.197h.81a1 1 0 01.95.69l.25.77a1 1 0 002.6 0l.25-.77a1 1 0 01.95-.69h.81a1 1 0 00.98-1.197l-.16-.81a1 1 0 01.29-.95l.57-.57a1 1 0 00.12-1.32l-.57-.57a1 1 0 01-.29-.95l.16-.81a1 1 0 00-.98-1.197h-.81a1 1 0 01-.95-.69l-.25-.77z" /></svg>
        </span>
      );
    case 3:
      return (
        <span className="text-orange-500">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.591c.75 1.334-.213 2.985-1.742 2.985H3.48c-1.53 0-2.492-1.651-1.743-2.985L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V8a1 1 0 112 0v2a1 1 0 01-1 1z" /></svg>
        </span>
      );
    default:
      return (
        <span className="text-purple-500">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884zM18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
        </span>
      );
  }
};
