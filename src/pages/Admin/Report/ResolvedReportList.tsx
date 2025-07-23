import { useEffect, useState } from 'react';
import { connectFeedbackHub, onFeedback } from '@/services/signalr.service';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from '@/components/ui/pagination';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { getResolvedReport } from '@/services/Admin/report.service';
import { getUserByIdAPI } from '@/services/Admin/user.service';
import type { Report } from '@/types/Admin/report';
import { FaEye } from 'react-icons/fa';
import ReportDetailModal from './ReportDetailModal';
const pageSizeOptions = [5, 10, 20, 50];

const targetTypeMap: Record<number, string> = {
  0: 'News',
  1: 'Event',
  2: 'EventManager',
  3: 'Comment',
};

const statusMap: Record<number, string> = {
  0: 'Pending',
  1: 'Resolved',
  2: 'Rejected',
};

export const ResolvedReportList = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [reporterNames, setReporterNames] = useState<Record<string, string>>({});
  const [viewReport, setViewReport] = useState<Report | null>(null);

  useEffect(() => {
    connectFeedbackHub('http://localhost:5008/notificationHub');
    // Lắng nghe realtime SignalR cho report
    const reload = () => reloadList(page, pageSize, search);
    onFeedback('OnReportCreated', reload);
    onFeedback('OnReportUpdated', reload);
    onFeedback('OnReportDeleted', reload);
    onFeedback('OnReportStatusChanged', reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    reloadList(page, pageSize, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search]);

  useEffect(() => {
    const fetchReporters = async () => {
      const ids = Array.from(new Set(reports.map((r) => r.reporterId).filter(Boolean)));
      const names: Record<string, string> = {};
      await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await getUserByIdAPI(id);
            names[id] = res.fullName || id;
          } catch {
            names[id] = id;
          }
        })
      );
      setReporterNames(names);
    };
    if (reports.length > 0) fetchReporters();
  }, [reports]);

  const reloadList = (pageArg: number, pageSizeArg: number, searchArg: string) => {
    setLoading(true);
    getResolvedReport(pageArg, pageSizeArg, searchArg)
      .then((res) => {
        if (res && res.data && Array.isArray(res.data.items)) {
          setReports(res.data.items);
        } else {
          setReports([]);
        }
      })
      .finally(() => setTimeout(() => setLoading(false), 500));
  };

  const pagedReports = reports;
  const totalPages = Math.max(1, Math.ceil(reports.length / pageSize));

  return (
    <div className="p-3">
      <SpinnerOverlay show={loading} />
      {/* Modal detail */}
      {viewReport && (
        <ReportDetailModal
          report={viewReport}
          reporterName={reporterNames[viewReport.reporterId]}
          onClose={() => setViewReport(null)}
          targetTypeMap={targetTypeMap}
          statusMap={statusMap}
          showNote={true}
        />
      )}

      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
          {/* Search */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <div className="flex-1 flex items-center gap-2">
              <div
                className="InputContainer relative"
                style={{
                  width: 310,
                  height: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(to bottom, #c7eafd, #e0e7ff)',
                  borderRadius: 30,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 10px rgba(0,0,0,0.075)',
                  position: 'relative',
                }}
              >
                <input
                  className="input pr-8"
                  style={{
                    width: 300,
                    height: 40,
                    border: 'none',
                    outline: 'none',
                    caretColor: 'rgb(255,81,0)',
                    backgroundColor: 'rgb(255,255,255)',
                    borderRadius: 30,
                    paddingLeft: 15,
                    letterSpacing: 0.8,
                    color: 'rgb(19,19,19)',
                    fontSize: 13.4,
                  }}
                  placeholder="Search by reason or report ID..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                {search && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-red-500 hover:text-red-600 focus:outline-none bg-white rounded-full"
                    style={{
                      border: 'none',
                      outline: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      height: 24,
                      width: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={() => {
                      setSearch('');
                      setPage(1);
                    }}
                    tabIndex={-1}
                    type="button"
                    aria-label="Clear search"
                  >
                    &#10005;
                  </button>
                )}
              </div>
            </div>
          </div>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-blue-200 hover:bg-blue-200">
                <TableHead className="text-center" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead style={{ width: '10%' }}>Target Type</TableHead>
                <TableHead style={{ width: '10%' }}>Reporter</TableHead>
                <TableHead style={{ width: '20%' }}>Reason</TableHead>
                <TableHead style={{ width: '7%' }}>Status</TableHead>
                <TableHead style={{ width: '5%' }}>Created At</TableHead>
                <TableHead style={{ width: '7%' }}>Updated At</TableHead>
                <TableHead style={{ width: '20%' }} className="text-center">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-4 text-gray-500">
                    No reports found.
                  </TableCell>
                </TableRow>
              ) : (
                pagedReports.map((item, idx) => (
                  <TableRow key={item.reportId} className="hover:bg-blue-50">
                    <TableCell className="text-center">{(page - 1) * pageSize + idx + 1}</TableCell>
                    <TableCell>{targetTypeMap[item.targetType] ?? item.targetType}</TableCell>
                    <TableCell className="truncate max-w-[120px]">
                      {reporterNames[item.reporterId] || item.reporterId || 'unknown'}
                    </TableCell>
                    <TableCell className="truncate max-w-[120px]">{item.reason}</TableCell>
                    <TableCell>{statusMap[item.status] ?? item.status}</TableCell>
                    <TableCell>
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.updatedAt ? (
                        new Date(item.updatedAt).toLocaleString()
                      ) : (
                        <span className="text-gray-400 ">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          className="border-2 border-yellow-400 bg-yellow-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[15px] font-semibold text-white flex items-center justify-center hover:bg-yellow-500 hover:text-white"
                          title="View details"
                          onClick={() => setViewReport(item)}
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                      </div>
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
                        {reports.length === 0
                          ? '0-0 of 0'
                          : `${(page - 1) * pageSize + 1}-${Math.min(
                              page * pageSize,
                              reports.length
                            )} of ${reports.length}`}
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
