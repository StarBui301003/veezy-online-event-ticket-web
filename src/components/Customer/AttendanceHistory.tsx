import SpinnerOverlay from '@/components/SpinnerOverlay';

interface AttendanceHistoryProps {
  attendances: unknown[];
  loading: boolean;
  error: string;
}

const AttendanceHistory = ({ attendances, loading, error }: AttendanceHistoryProps) => {
  return (
    <div className="flex flex-col items-center w-full min-h-[400px]">
      <h2 className="text-2xl font-bold mb-6 text-white">Lịch sử tham dự</h2>
      {loading ? (
        <SpinnerOverlay show={true} />
      ) : error ? (
        <div className="text-red-400 mb-4 bg-red-900/20 rounded-lg border border-red-400/20 px-4 py-2">{error}</div>
      ) : attendances.length === 0 ? (
        <div className="text-gray-400">Bạn chưa tham dự sự kiện nào.</div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-sm text-left bg-slate-800/80 rounded-lg overflow-hidden shadow border border-slate-700">
            <thead>
              <tr className="bg-slate-700 text-slate-100">
                <th className="px-4 py-3 font-medium">Sự kiện</th>
                <th className="px-4 py-3 font-medium">Ngày tham dự</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map((att, idx) => (
                <tr key={att.attendanceId || idx} className="border-b border-slate-700 hover:bg-slate-700/60 transition">
                  <td className="px-4 py-3 text-slate-200">{att.eventName}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{att.attendedAt ? new Date(att.attendedAt).toLocaleString('vi-VN') : ''}</td>
                  <td className="px-4 py-3">
                    {att.status === 'attended' ? (
                      <span className="text-green-400 font-semibold">Đã tham dự</span>
                    ) : (
                      <span className="text-yellow-400 font-semibold">Chưa tham dự</span>
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