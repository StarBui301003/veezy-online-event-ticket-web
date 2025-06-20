import { useEffect, useState } from 'react';
import { getPaymentsAdmin } from '@/services/Admin/order.service';
import type { AdminPayment } from '@/types/Admin/order';
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

const pageSizeOptions = [5, 10, 20, 50];

export const PaymentListAdmin = () => {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setLoading(true);
    getPaymentsAdmin()
      .then((res) => setPayments(res.data.items))
      .finally(() => setLoading(false));
  }, []);

  const pagedPayments = payments.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(payments.length / pageSize));

  const paymentMethodLabel = (method: number) => {
    switch (method) {
      case 0:
        return 'VietQR';
      case 1:
        return 'Momo';
      case 2:
        return 'VnPay';
      case 3:
        return 'Other';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="p-6">
      <SpinnerOverlay show={loading} />
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-blue-200 hover:bg-blue-200">
                <TableHead className="pl-4">#</TableHead>
                <TableHead>PaymentId</TableHead>
                <TableHead>OrderId</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transaction Code</TableHead>
                <TableHead>Paid At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                    No payments found.
                  </TableCell>
                </TableRow>
              ) : (
                pagedPayments.map((p, idx) => (
                  <TableRow key={p.paymentId}>
                    <TableCell className="pl-4">{(page - 1) * pageSize + idx + 1}</TableCell>
                    <TableCell>{p.paymentId}</TableCell>
                    <TableCell>{p.orderId}</TableCell>
                    <TableCell>{p.amount}</TableCell>
                    <TableCell>{paymentMethodLabel(p.paymentMethod)}</TableCell>
                    <TableCell>
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
                    <TableCell>{p.paidAt ? new Date(p.paidAt).toLocaleString() : 'N/A'}</TableCell>
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
                        {payments.length === 0
                          ? '0-0 of 0'
                          : `${(page - 1) * pageSize + 1}-${Math.min(
                              page * pageSize,
                              payments.length
                            )} of ${payments.length}`}
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
