import * as React from "react"
import { useTranslation } from "react-i18next";
import {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"; // Giả sử file ShadCN của bạn ở đây

interface AppPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const AppPagination: React.FC<AppPaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const { t } = useTranslation();

  // Logic để tạo ra các số trang và dấu "..." một cách thông minh
  const pages = React.useMemo(() => {
    const delta = 2; // Số lượng trang hiển thị bên cạnh trang hiện tại
    const left = currentPage - delta;
    const right = currentPage + delta + 1;
    const range: (number | string)[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i < right)) {
        range.push(i);
      }
    }

    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (const i of range) {
      if (l) {
        if (typeof i === 'number' && i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (typeof i === 'number' && i - l > 2) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = typeof i === 'number' ? i : undefined;
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) {
    return null; // Không hiển thị phân trang nếu chỉ có 1 trang
  }

  return (
    <Pagination className="mt-12">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onPageChange(currentPage - 1);
            }}
            // Vô hiệu hóa nút Previous nếu đang ở trang đầu
            className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
          >
            {t('pagination.previous')}
          </PaginationPrevious>
        </PaginationItem>
        
        {pages.map((page, index) => (
          <PaginationItem key={index}>
            {typeof page === 'number' ? (
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(page);
                }}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onPageChange(currentPage + 1);
            }}
            // Vô hiệu hóa nút Next nếu đang ở trang cuối
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
          >
            {t('pagination.next')}
          </PaginationNext>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default AppPagination;