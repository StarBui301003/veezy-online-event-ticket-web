import { Button } from '@/components/ui/button';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { useTranslation } from 'react-i18next';

interface Ticket {
  issuedId: string;
  ticketOrderId: string;
  ticketId: string;
  eventId: string;
  qrCode: string;
  qrCodeUrl?: string;
  used: boolean;
  checkedInAt: string | null;
  checkedInBy: string | null;
  faceImageUrl: string | null;
  issuedToEmail: string;
  createdAt: string;
  ticketName?: string;  // Optional since it's not in the API response
  key?: string;         // For React key prop
  status?: string;      // For display purposes
}

interface MyTicketsProps {
  tickets: Ticket[];
  loading: boolean;
  error: string;
  selectedOrder: any;
  onBack: () => void;
}

const MyTickets = ({ selectedOrder, tickets, loading, error, onBack }: MyTicketsProps) => {
  const { t } = useTranslation();
  
  // Format status based on ticket data
  const getStatus = (ticket: Ticket) => {
    if (ticket.used) return t('used') || 'Đã sử dụng';
    if (ticket.checkedInAt) return t('checkedIn') || 'Đã check-in';
    return t('notUsed') || 'Chưa sử dụng';
  };

  return (
    <div className="flex flex-col items-center w-full min-h-[400px]">
      <h2 className="text-2xl font-bold mb-6 text-white">Vé của tôi</h2>
      <Button onClick={onBack} className="mb-4">{t('backToOrderHistory') || 'Quay lại lịch sử mua vé'}</Button>
      {!selectedOrder ? (
        <div className="text-gray-400">{t('selectOrderToView')}</div>
      ) : loading ? (
        <SpinnerOverlay show={true} />
      ) : error ? (
        <div className="text-red-400 mb-4 bg-red-900/20 rounded-lg border border-red-400/20 px-4 py-2">{error}</div>
      ) : tickets.length === 0 ? (
        <div className="text-gray-400">{t('noTickets')}</div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-sm text-left bg-slate-800/80 rounded-lg overflow-hidden shadow border border-slate-700">
            <thead>
              <tr className="bg-slate-700 text-slate-100">
                <th className="px-4 py-3 font-medium">Mã vé</th>
                <th className="px-4 py-3 font-medium">Tên vé</th>
                <th className="px-4 py-3 font-medium">QR Code</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.issuedId} className="border-b border-slate-700 hover:bg-slate-700/60 transition">
                  <td className="px-4 py-3 text-slate-200 font-mono">{ticket.qrCode}</td>
                  <td className="px-4 py-3 text-slate-200">{ticket.ticketName || 'Vé sự kiện'}</td>
                  <td className="px-4 py-3">
                    {ticket.qrCodeUrl ? (
                      <img src={ticket.qrCodeUrl} alt="QR Code" style={{ width: 64, height: 64 }} />
                    ) : (
                      <span className="text-gray-400">{t('noQRCode') || 'Không có QR'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${
                      ticket.used || ticket.checkedInAt ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {getStatus(ticket)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('vi-VN') : ''}
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

export default MyTickets;