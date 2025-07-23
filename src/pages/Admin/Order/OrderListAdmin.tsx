import { useEffect, useState } from 'react';
import { connectEventHub, onEvent } from '@/services/signalr.service';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from '@/components/ui/table';
import type { AdminOrderListResponse } from '@/types/Admin/order';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from '@/components/ui/pagination';
import { getOrdersAdmin } from '@/services/Admin/order.service';
import { useTranslation } from 'react-i18next';
import { FaEye } from 'react-icons/fa';
import OrderDetail from './OrderDetail';

const pageSizeOptions = [5, 10, 20, 50];

// Thêm hàm format tiền VND
function formatVND(amount: number | string) {
  if (typeof amount === 'string') amount = parseFloat(amount);
  if (isNaN(amount)) return '';
  return amount.toLocaleString('vi-VN') + ' ₫';
}

export const OrderListAdmin = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminOrderListResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    connectEventHub('http://localhost:5004/notificationHub');
    setLoading(true);
    getOrdersAdmin({ page: page, pageSize: pageSize })
      .then((res) => {
        if (res && res.data) {
          setData({
            ...res.data,
            pageSize: pageSize,
          });
        } else {
          setData(null);
        }
      })
      .catch(() => {
        setData(null);
      })
      .finally(() => {
        setTimeout(() => setLoading(false), 500);
      });

    // Lắng nghe realtime SignalR cho order
    const reload = () => {
      setLoading(true);
      getOrdersAdmin({ page: page, pageSize: pageSize })
        .then((res) => {
          if (res && res.data) {
            setData({
              ...res.data,
              pageSize: pageSize,
            });
          } else {
            setData(null);
          }
        })
        .catch(() => {
          setData(null);
        })
        .finally(() => {
          setTimeout(() => setLoading(false), 500);
        });
    };
    onEvent('OnOrderCreated', reload);
    onEvent('OnOrderUpdated', reload);
    onEvent('OnOrderDeleted', reload);
  }, [page, pageSize]);

  const items = data?.items || [];
  const totalItems = data?.totalItems || 0;
  const totalPages = data?.totalPages || 1;
  // pageSize luôn lấy từ state FE

  return (
    <div className="p-6">
      <SpinnerOverlay show={loading} />
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-blue-200 hover:bg-blue-200">
                <TableHead className="pl-4 text-center" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead className="text-center" style={{ width: '25%' }}>
                  {t('customer')}
                </TableHead>
                <TableHead style={{ width: '25%' }}>Event Name</TableHead>
                <TableHead className="text-center"> {t('totalAmount')}</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                    {t('noOrdersFound')}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((order, idx) => (
                  <TableRow key={order.orderId} className="hover:bg-blue-50 transition-colors">
                    <TableCell className="pl-4 text-center sticky left-0 bg-white z-10">
                      {(page - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell className="text-center">{order.customerName}</TableCell>
                    <TableCell>{order.eventName}</TableCell>
                    <TableCell className="text-center">{formatVND(order.totalAmount)}</TableCell>
                    <TableCell className="text-center flex items-center justify-center gap-2">
                      <button
                        className="border-2 border-yellow-400 bg-yellow-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white flex items-center justify-center hover:bg-yellow-500 hover:text-white"
                        title="View details"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={10}>
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
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((i) => (
                            <PaginationItem key={i}>
                              <PaginationLink
                                isActive={i === page}
                                onClick={() => setPage(i)}
                                className={`transition-colors rounded 
                                  ${
                                    i === page
                                      ? 'bg-blue-500 text-white border hover:bg-blue-700 hover:text-white'
                                      : 'text-gray-700 hover:bg-slate-200 hover:text-black'
                                  }
                                  px-2 py-1 mx-0.5`}
                                style={{
                                  minWidth: 32,
                                  textAlign: 'center',
                                  fontWeight: i === page ? 700 : 400,
                                  cursor: i === page ? 'default' : 'pointer',
                                }}
                              >
                                {i}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
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
                        className="border rounded px-2 py-1 text-sm bg-white"
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
      {selectedOrder && (
        <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};
