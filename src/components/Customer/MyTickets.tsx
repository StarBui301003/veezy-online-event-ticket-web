import { Button } from '@/components/ui/button';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { useTranslation } from 'react-i18next';

interface Ticket {
  ticketName: string;
  key: string;
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
  return (
    <div className="flex flex-col items-center w-full min-h-[400px]">
      <h2 className="text-2xl font-bold mb-6 text-white">Vé của tôi</h2>
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
                <tr key={ticket.key} className="border-b border-slate-700 hover:bg-slate-700/60 transition">
                  <td className="px-4 py-3 text-slate-200">{ticket.ticketName}</td>
                  <td className="px-4 py-3">
                    {/* The original code had a QR code image here, but the new Ticket interface doesn't have qrCodeUrl.
                        Assuming the intent was to remove this part or that qrCodeUrl is no longer relevant.
                        For now, I'm removing the QR code image as it's not part of the new Ticket interface. */}
                    <span className="text-gray-400">{t('noQRCode')}</span>
                  </td>
                  <td className="px-4 py-3">
                    {/* The original code had a 'used' status here, but the new Ticket interface doesn't have 'used'.
                        Assuming the intent was to remove this part or that 'used' is no longer relevant.
                        For now, I'm removing the 'used' status as it's not part of the new Ticket interface. */}
                    <span className="text-yellow-400 font-semibold">{t('notUsed')}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">
                    {/* The original code had 'createdAt' here, but the new Ticket interface doesn't have 'createdAt'.
                        Assuming the intent was to remove this part or that 'createdAt' is no longer relevant.
                        For now, I'm removing the 'createdAt' as it's not part of the new Ticket interface. */}
                    {''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Nút quay lại lịch sử mua vé */}
      <Button className="mt-6" variant="secondary" onClick={onBack}>
        {t('backToOrderHistory')}
      </Button>
    </div>
  );
};

export default MyTickets;
