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
import type { AdminOrder } from '@/types/Admin/order';
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

const pageSizeOptions = [5, 10, 20, 50];

export const OrderListAdmin = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    connectEventHub('http://localhost:5004/notificationHub');
    setLoading(true);
    getOrdersAdmin()
      .then((res) => {
        setOrders(res.data?.items || []);
      })
      .catch(() => {
        setOrders([]);
      })
      .finally(() => {
        setTimeout(() => setLoading(false), 500);
      });

    // Lắng nghe realtime SignalR cho order
    const reload = () => {
      setLoading(true);
      getOrdersAdmin()
        .then((res) => {
          setOrders(res.data?.items || []);
        })
        .catch(() => {
          setOrders([]);
        })
        .finally(() => {
          setTimeout(() => setLoading(false), 500);
        });
    };
    onEvent('OnOrderCreated', reload);
    onEvent('OnOrderUpdated', reload);
    onEvent('OnOrderDeleted', reload);
  }, []);

  // Nếu có filter/search, hãy filter ở đây (giống ApprovedEventList)
  const filteredOrders = orders; // Nếu có filter thì filter ở đây

  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-6">
      <SpinnerOverlay show={loading} />
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-blue-200 hover:bg-blue-200">
                <TableHead className="text-center sticky left-0 bg-blue-200 z-10">#</TableHead>
                <TableHead className="text-center sticky left-0 bg-blue-200 z-10">
                  Customer Name
                </TableHead>
                <TableHead>Event Name</TableHead>
                <TableHead>Ticket Name(s)</TableHead>
                <TableHead className="text-center">Price Per Ticket</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-center">Subtotal</TableHead>
                <TableHead className="text-center">Discount Code</TableHead>
                <TableHead className="text-center">Created At</TableHead>
                <TableHead className="text-center">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-4 text-gray-500">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                pagedOrders.map((order, idx) => (
                  <TableRow key={order.orderId} className="hover:bg-blue-50">
                    <TableCell className="text-center sticky left-0 bg-white z-10">
                      {(page - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell className="text-center sticky left-0 bg-white z-10">
                      {order.customerName}
                    </TableCell>
                    <TableCell>{order.eventName}</TableCell>
                    <TableCell>
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item) => item.ticketName).join(', ')
                      ) : (
                        <span className="text-gray-400">No ticket items</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {order.items && order.items.length > 0
                        ? order.items.map((item) => item.pricePerTicket).join(', ')
                        : ''}
                    </TableCell>
                    <TableCell className="text-center">
                      {order.items && order.items.length > 0
                        ? order.items.map((item) => item.quantity).join(', ')
                        : ''}
                    </TableCell>
                    <TableCell className="text-center">
                      {order.items && order.items.length > 0
                        ? order.items.map((item) => item.subtotal).join(', ')
                        : ''}
                    </TableCell>
                    <TableCell className="text-center">
                      {order.discountCode ? (
                        order.discountCode
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                    </TableCell>
                    <TableCell className="text-center">{order.totalAmount}</TableCell>
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
    </div>
  );
};
