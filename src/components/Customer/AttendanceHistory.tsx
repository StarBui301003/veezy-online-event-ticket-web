import type { Attendance } from '@/types/attendance';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface AttendanceHistoryProps {
  attendances: Attendance[];
  loading: boolean;
  error: string;
}

const AttendanceHistory = ({ attendances, loading, error }: AttendanceHistoryProps) => {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();

  return (
    <div className="flex flex-col items-center w-full min-h-[400px]">
      <h2 className={cn('text-2xl font-bold mb-6', getThemeClass('text-gray-900', 'text-white'))}>
        Lịch sử tham dự
      </h2>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2
            className={cn(
              'animate-spin w-8 h-8 mb-4',
              getThemeClass('text-blue-600', 'text-purple-400')
            )}
          />
          <p className={cn('text-sm', getThemeClass('text-gray-600', 'text-slate-400'))}>
            {t('loadingAttendance') || 'Đang tải lịch sử tham dự...'}
          </p>
        </div>
      ) : error ? (
        <div
          className={cn(
            'mb-4 rounded-lg border px-4 py-2',
            getThemeClass(
              'text-red-600 bg-red-50/10 border-red-400/20',
              'text-red-400 bg-red-900/20 border-red-400/20'
            )
          )}
        >
          {error}
        </div>
      ) : attendances.length === 0 ? (
        <div className={cn('text-center', getThemeClass('text-gray-500', 'text-gray-400'))}>
          {t('noAttendance')}
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table
            className={cn(
              'min-w-full text-sm text-left rounded-lg overflow-hidden shadow border',
              getThemeClass('bg-white/95 border-gray-200/60', 'bg-slate-800/80 border-slate-700')
            )}
          >
            <thead>
              <tr
                className={cn(
                  getThemeClass('bg-gray-100/80 text-gray-900', 'bg-slate-700 text-slate-100')
                )}
              >
                <th className="px-4 py-3 font-medium">{t('eventName')}</th>
                <th className="px-4 py-3 font-medium">{t('checkedInAt')}</th>
                <th className="px-4 py-3 font-medium">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map((att, idx) => (
                <tr
                  key={att.attendanceId || idx}
                  className={cn(
                    'border-b transition',
                    getThemeClass(
                      'border-gray-200/30 hover:bg-gray-50/50',
                      'border-slate-700 hover:bg-slate-700/60'
                    )
                  )}
                >
                  <td className={cn('px-4 py-3', getThemeClass('text-gray-800', 'text-slate-200'))}>
                    {att.eventName}
                  </td>
                  <td
                    className={cn(
                      'px-4 py-3 text-xs',
                      getThemeClass('text-gray-600', 'text-slate-300')
                    )}
                  >
                    {att.checkedInAt
                      ? new Date(att.checkedInAt).toLocaleString('vi-VN')
                      : 'Not Checked In'}
                  </td>
                  <td className="px-4 py-3">
                    {att.status === 'attended' ? (
                      <span className="text-green-400 font-semibold">{t('attended')}</span>
                    ) : (
                      <span className="text-yellow-400 font-semibold">{t('notAttended')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
