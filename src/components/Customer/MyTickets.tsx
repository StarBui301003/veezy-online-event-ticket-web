import { Button } from '@/components/ui/button';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Eye, X } from 'lucide-react';

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
  ticketName?: string; // Optional since it's not in the API response
  key?: string; // For React key prop
  status?: string; // For display purposes
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
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);

  // Format status based on ticket data
  const getStatus = (ticket: Ticket) => {
    if (ticket.used) return t('myTickets.status.used');
    if (ticket.checkedInAt) return t('myTickets.status.checkedIn');
    return t('myTickets.status.notUsed');
  };

  const openQRPopup = (qrCodeUrl: string) => {
    setSelectedQRCode(qrCodeUrl);
  };

  const closeQRPopup = () => {
    setSelectedQRCode(null);
  };

  return (
    <div className="flex flex-col items-center w-full min-h-[400px]">
      <h2 className="text-2xl font-bold mb-6 text-white">{t('myTickets.title')}</h2>
      <Button onClick={onBack} className="mb-4">
        {t('myTickets.backButton')}
      </Button>
      {!selectedOrder ? (
        <div className="text-gray-400">{t('myTickets.selectOrderToView')}</div>
      ) : loading ? (
        <SpinnerOverlay show={true} />
      ) : error ? (
        <div className="text-red-400 mb-4 bg-red-900/20 rounded-lg border border-red-400/20 px-4 py-2">
          {error}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-gray-400">{t('myTickets.noTickets')}</div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-sm text-left bg-slate-800/80 rounded-lg overflow-hidden shadow border border-slate-700">
            <thead>
              <tr className="bg-slate-700 text-slate-100">
                <th className="px-4 py-3 font-medium">{t('myTickets.tableHeaders.ticketCode')}</th>
                <th className="px-4 py-3 font-medium">{t('myTickets.tableHeaders.ticketName')}</th>
                <th className="px-4 py-3 font-medium text-center">
                  {t('myTickets.tableHeaders.qrCode')}
                </th>
                <th className="px-4 py-3 font-medium">{t('myTickets.tableHeaders.status')}</th>
                <th className="px-4 py-3 font-medium">{t('myTickets.tableHeaders.createdAt')}</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.issuedId}
                  className="border-b border-slate-700 hover:bg-slate-700/60 transition"
                >
                  <td className="px-4 py-3 text-slate-200 font-mono">{ticket.qrCode}</td>
                  <td className="px-4 py-3 text-slate-200">
                    {ticket.ticketName || t('myTickets.defaultTicketName')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {ticket.qrCodeUrl ? (
                      <button
                        onClick={() => openQRPopup(ticket.qrCodeUrl!)}
                        className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors text-white"
                        title="Xem QR Code"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-gray-400">{t('myTickets.noQRCode')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${
                        ticket.used || ticket.checkedInAt ? 'text-green-400' : 'text-yellow-400'
                      }`}
                    >
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

      {/* QR Code Popup */}
      {selectedQRCode && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 relative">
            {/* Close Button */}
            <button
              onClick={closeQRPopup}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            {/* QR Code Title */}
            <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">QR Code Vé</h3>

            {/* QR Code Image */}
            <div className="flex justify-center mb-4">
              <img
                src={selectedQRCode}
                alt="QR Code"
                className="w-64 h-64 object-contain border-2 border-gray-200 rounded-lg"
              />
            </div>

            {/* Close Button Bottom */}
            <div className="flex justify-center">
              <Button
                onClick={closeQRPopup}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTickets;
