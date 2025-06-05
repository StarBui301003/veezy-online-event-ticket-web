// import { useEffect, useState } from 'react';
// import type { DiscountCodeResponse } from '@/types/Admin/discountCode'; /
// import {
//   Table,
//   TableHeader,
//   TableRow,
//   TableHead,
//   TableBody,
//   TableCell,
//   TableFooter,
// } from '@/components/ui/table';
// import SpinnerOverlay from '@/components/SpinnerOverlay';
// import {
//   Pagination,
//   PaginationContent,
//   PaginationItem,
//   PaginationPrevious,
//   PaginationNext,
//   PaginationLink,
// } from '@/components/ui/pagination';
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
// } from '@/components/ui/dropdown-menu';

// const pageSizeOptions = [5, 10, 20, 50];

// export const DiscountCodeList = () => {
//   const [discountData, setDiscountData] = useState<DiscountCodeResponse['data'] | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   // Hàm load data mỗi khi page hoặc pageSize thay đổi
//   useEffect(() => {
//     setLoading(true);
//     // getDiscountCodes()
//       .then((res) => {
//         // Giả sử API trả tất cả item luôn, ta làm pagination phía client
//         setDiscountData(res.data);
//       })
//       .finally(() => setLoading(false));
//   }, []);

//   // Xử lý phân trang client (nếu API trả tất cả luôn)
//   const items = discountData?.items || [];
//   const totalItems = items.length;
//   const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
//   const pagedItems = items.slice((page - 1) * pageSize, page * pageSize);

//   return (
//     <div className="p-6">
//       <SpinnerOverlay show={loading} />
//       <h2 className="text-2xl font-bold mb-4">Discount Code List</h2>

//       <div className="overflow-x-auto">
//         <div className="p-4 bg-white rounded-xl shadow">
//           <Table className="min-w-full">
//             <TableHeader>
//               <TableRow className="bg-blue-200 hover:bg-blue-200">
//                 <TableHead className="pl-4">#</TableHead>
//                 <TableHead>Code</TableHead>
//                 <TableHead>Discount Type</TableHead>
//                 <TableHead>Value</TableHead>
//                 <TableHead>Minimum</TableHead>
//                 <TableHead>Maximum</TableHead>
//                 <TableHead>Max Usage</TableHead>
//                 <TableHead>Used Count</TableHead>
//                 <TableHead>Expired At</TableHead>
//                 <TableHead>Created At</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {pagedItems.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={10} className="text-center py-4 text-gray-500">
//                     No discount codes found.
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 pagedItems.map((item, idx) => (
//                   <TableRow key={item.discountId}>
//                     <TableCell className="pl-4">{(page - 1) * pageSize + idx + 1}</TableCell>
//                     <TableCell>{item.code}</TableCell>
//                     <TableCell>{item.discountType}</TableCell>
//                     <TableCell>{item.value}</TableCell>
//                     <TableCell>{item.minimum}</TableCell>
//                     <TableCell>{item.maximum}</TableCell>
//                     <TableCell>{item.maxUsage}</TableCell>
//                     <TableCell>{item.usedCount}</TableCell>
//                     <TableCell>{new Date(item.expiredAt).toLocaleString()}</TableCell>
//                     <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//             <TableFooter>
//               <TableRow>
//                 <TableCell colSpan={10}>
//                   <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-2 py-2">
//                     <div className="flex-1 flex justify-center">
//                       <Pagination>
//                         <PaginationContent>
//                           <PaginationItem>
//                             <PaginationPrevious
//                               onClick={() => setPage((p) => Math.max(1, p - 1))}
//                               aria-disabled={page === 1}
//                               className={page === 1 ? 'pointer-events-none opacity-50' : ''}
//                             />
//                           </PaginationItem>
//                           {Array.from({ length: totalPages }, (_, i) => i + 1).map((i) => (
//                             <PaginationItem key={i}>
//                               <PaginationLink
//                                 isActive={i === page}
//                                 onClick={() => setPage(i)}
//                                 className={`transition-colors rounded
//                                   ${
//                                     i === page
//                                       ? 'bg-blue-500 text-white border hover:bg-blue-700 hover:text-white'
//                                       : 'text-gray-700 hover:bg-slate-200 hover:text-black'
//                                   }
//                                   px-2 py-1 mx-0.5`}
//                               >
//                                 {i}
//                               </PaginationLink>
//                             </PaginationItem>
//                           ))}
//                           <PaginationItem>
//                             <PaginationNext
//                               onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                               aria-disabled={page === totalPages}
//                               className={
//                                 page === totalPages ? 'pointer-events-none opacity-50' : ''
//                               }
//                             />
//                           </PaginationItem>
//                         </PaginationContent>
//                       </Pagination>
//                     </div>
//                     <div className="flex items-center gap-2 justify-end w-full md:w-auto">
//                       <span className="text-sm text-gray-700">
//                         {totalItems === 0
//                           ? '0-0 of 0'
//                           : `${(page - 1) * pageSize + 1}-${Math.min(
//                               page * pageSize,
//                               totalItems
//                             )} of ${totalItems}`}
//                       </span>
//                       <span className="text-sm text-gray-700">Rows per page</span>
//                       <DropdownMenu>
//                         <DropdownMenuTrigger asChild>
//                           <button className="flex items-center gap-1 px-2 py-1 border rounded text-sm bg-white hover:bg-gray-100 transition min-w-[48px] text-left">
//                             {pageSize}
//                             <svg
//                               className="w-4 h-4 ml-1"
//                               fill="none"
//                               stroke="currentColor"
//                               strokeWidth="2"
//                               viewBox="0 0 24 24"
//                             >
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 d="M19 9l-7 7-7-7"
//                               />
//                             </svg>
//                           </button>
//                         </DropdownMenuTrigger>
//                         <DropdownMenuContent align="start">
//                           {pageSizeOptions.map((size) => (
//                             <DropdownMenuItem
//                               key={size}
//                               onClick={() => {
//                                 setPageSize(size);
//                                 setPage(1);
//                               }}
//                               className={size === pageSize ? 'font-bold bg-primary/10' : ''}
//                             >
//                               {size}
//                             </DropdownMenuItem>
//                           ))}
//                         </DropdownMenuContent>
//                       </DropdownMenu>
//                     </div>
//                   </div>
//                 </TableCell>
//               </TableRow>
//             </TableFooter>
//           </Table>
//         </div>
//       </div>
//     </div>
//   );
// };
