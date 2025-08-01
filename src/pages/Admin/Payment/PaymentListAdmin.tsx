import { useEffect, useState } from 'react';
import { connectEventHub, onEvent } from '@/services/signalr.service';
import { getPaymentsAdmin } from '@/services/Admin/order.service';
import type { AdminPaymentListResponse } from '@/types/Admin/order';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from '@/components/ui/table';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import GenerateTicketModal from './GenerateTicketModal';

const pageSizeOptions = [5, 10, 20, 50];

export const PaymentListAdmin = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminPaymentListResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    connectEventHub('http://localhost:5004/notificationHub');
    setLoading(true);
    getPaymentsAdmin({ page: page, pageSize: pageSize })
      .then((res) => {
        if (res && res.data) {
          setData(res.data);
        } else {
          setData(null);
        }
      })
      .finally(() => {
        setTimeout(() => setLoading(false), 500);
      });

    // Lắng nghe realtime SignalR cho payment
    const reload = () => {
      setLoading(true);
      getPaymentsAdmin({ page: page, pageSize: pageSize })
        .then((res) => {
          if (res && res.data) {
            setData(res.data);
          } else {
            setData(null);
          }
        })
        .finally(() => {
          setTimeout(() => setLoading(false), 500);
        });
    };
    onEvent('OnPaymentCreated', reload);
    onEvent('OnPaymentUpdated', reload);
    onEvent('OnPaymentDeleted', reload);
  }, [page, pageSize]);

  const items = data?.items || [];
  const totalItems = data?.totalItems || 0;
  const totalPages = data?.totalPages || 1;

  const paymentMethodLabel = (method: number) => {
    switch (method) {
      case 0:
        return t('vietQR');
      case 1:
        return t('momo');
      case 2:
        return t('vnPay');
      case 3:
        return t('other');
      default:
        return t('unknown');
    }
  };

  return (
    <div className="p-6">
      <SpinnerOverlay show={loading} />
      <GenerateTicketModal open={showGenerateModal} onClose={() => setShowGenerateModal(false)} />
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
          <div className="flex justify-end mb-4">
            <button
              className="flex gap-2 items-center border-2 border-green-500 bg-green-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-green-600 hover:text-white hover:border-green-500"
              onClick={() => setShowGenerateModal(true)}
            >
              Generate Error Ticket
            </button>
          </div>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-blue-200 hover:bg-blue-200">
                <TableHead className="pl-4" style={{ width: '5%' }}>
                  #
                </TableHead>
                {/* <TableHead style={{ width: '25%' }}>PaymentId</TableHead> */}
                <TableHead style={{ width: '10%' }}>{t('orderId')}</TableHead>
                <TableHead style={{ width: '5%' }} className="text-center">
                  {t('amount')}
                </TableHead>
                <TableHead style={{ width: '5%' }} className="text-center">
                  {t('method')}
                </TableHead>
                <TableHead style={{ width: '5%' }} className="text-center">
                  {t('status')}
                </TableHead>
                <TableHead style={{ width: '10%' }}>{t('transactionCode')}</TableHead>
                <TableHead style={{ width: '5%' }} className="text-center">
                  {t('paidAt')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                    No payments found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((p, idx) => (
                  <TableRow key={p.paymentId} className="hover:bg-blue-50">
                    <TableCell className="pl-4">{(page - 1) * pageSize + idx + 1}</TableCell>
                    {/* <TableCell>{p.paymentId}</TableCell> */}
                    <TableCell>{p.orderId}</TableCell>
                    <TableCell className="text-center">{p.amount}</TableCell>
                    <TableCell className="text-center">
                      {paymentMethodLabel(p.paymentMethod)}
                    </TableCell>
                    <TableCell className="text-center">
                      {p.paymentStatus === 0 && (
                        <Badge className=" border-green-500 bg-green-500 items-center border-2 rounded-[10px] cursor-pointer transition-all text-white hover:bg-green-600 hover:text-white hover:border-green-500">
                          Success
                        </Badge>
                      )}
                      {p.paymentStatus === 1 && (
                        <Badge className="border-red-500 bg-red-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-red-600 hover:text-white hover:border-red-500">
                          Failed
                        </Badge>
                      )}
                      {p.paymentStatus === 2 && (
                        <Badge className="border-yellow-500 bg-yellow-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-yellow-600 hover:text-white">
                          Pending
                        </Badge>
                      )}
                      {p.paymentStatus === 3 && (
                        <Badge className="border-black/70 bg-black/70 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all  hover:bg-black/100 hover:text-white">
                          Other
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{p.transactionCode}</TableCell>
                    <TableCell className="text-center">
                      {p.paidAt ? new Date(p.paidAt).toLocaleString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-2 py-2">
                    <div className="flex-1 flex justify-center pl-[200px]">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setPage((p) => Math.max(1, p - 1))}
                              aria-disabled={page === 1}
                              className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                          {(() => {
                            const pages = [];
                            const maxVisiblePages = 7;

                            if (totalPages <= maxVisiblePages) {
                              // Hiển thị tất cả trang nếu tổng số trang <= 7
                              for (let i = 1; i <= totalPages; i++) {
                                pages.push(i);
                              }
                            } else {
                              // Logic hiển thị trang với dấu "..."
                              if (page <= 4) {
                                // Trang hiện tại ở đầu
                                for (let i = 1; i <= 5; i++) {
                                  pages.push(i);
                                }
                                pages.push('...');
                                pages.push(totalPages);
                              } else if (page >= totalPages - 3) {
                                // Trang hiện tại ở cuối
                                pages.push(1);
                                pages.push('...');
                                for (let i = totalPages - 4; i <= totalPages; i++) {
                                  pages.push(i);
                                }
                              } else {
                                // Trang hiện tại ở giữa
                                pages.push(1);
                                pages.push('...');
                                for (let i = page - 1; i <= page + 1; i++) {
                                  pages.push(i);
                                }
                                pages.push('...');
                                pages.push(totalPages);
                              }
                            }

                            return pages.map((item, index) => (
                              <PaginationItem key={index}>
                                {item === '...' ? (
                                  <span className="px-2 py-1 text-gray-500">...</span>
                                ) : (
                                  <PaginationLink
                                    isActive={item === page}
                                    onClick={() => setPage(item as number)}
                                    className={`transition-colors rounded 
                                      ${
                                        item === page
                                          ? 'bg-blue-500 text-white border hover:bg-blue-700 hover:text-white'
                                          : 'text-gray-700 hover:bg-slate-200 hover:text-black'
                                      }
                                      px-2 py-1 mx-0.5`}
                                    style={{
                                      minWidth: 32,
                                      textAlign: 'center',
                                      fontWeight: item === page ? 700 : 400,
                                      cursor: item === page ? 'default' : 'pointer',
                                    }}
                                  >
                                    {item}
                                  </PaginationLink>
                                )}
                              </PaginationItem>
                            ));
                          })()}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                              aria-disabled={page === totalPages}
                              className={
                                page === totalPages ? 'pointer-events-none opacity-50' : ''
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                    <div className="flex items-center gap-2 justify-end w-full md:w-auto">
                      <span className="text-sm text-gray-700">
                        {totalItems === 0
                          ? '0-0 of 0'
                          : `${(page - 1) * pageSize + 1}-${Math.min(
                              page * pageSize,
                              totalItems
                            )} of ${totalItems}`}
                      </span>
                      <span className="text-sm text-gray-700">Rows per page</span>
                      <select
                        className="flex items-center gap-1 px-2 py-1 border rounded text-sm bg-white hover:bg-gray-100 transition min-w-[48px] text-left"
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setPage(1);
                        }}
                      >
                        {pageSizeOptions.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </div>
  );
};
