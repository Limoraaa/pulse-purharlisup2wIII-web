//import node modules libraries
import React from "react";
import { Navbar, Pagination } from "react-bootstrap";
import { ChevronLeft, ChevronRight } from "react-feather";
import { Table as ReactTable, RowData } from "@tanstack/react-table";

interface TablePaginationProps<TData extends RowData> {
  table: ReactTable<TData>;
  hasIcon?: boolean;
}

// Hitung daftar nomor halaman yang ringkas + posisi ellipsis.
// Selalu tampilkan halaman pertama & terakhir, plus jendela di sekitar
// halaman aktif. Nilai "ellipsis" menjadi penanda "…".
// siblingCount = jumlah halaman di kiri/kanan halaman aktif.
const getPaginationRange = (
  pageCount: number,
  currentPage: number, // 1-based
  siblingCount = 1
): (number | "ellipsis")[] => {
  // total slot: first + last + current + 2*sibling + 2 ellipsis
  const totalSlots = siblingCount * 2 + 5;

  // Kalau halaman sedikit, tampilkan semua tanpa ellipsis.
  if (pageCount <= totalSlots) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, pageCount);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < pageCount - 1;

  const range: (number | "ellipsis")[] = [];

  // selalu halaman pertama
  range.push(1);

  if (showLeftEllipsis) {
    range.push("ellipsis");
  } else {
    // isi 2..leftSibling-1 kalau tidak ada ellipsis kiri
    for (let i = 2; i < leftSibling; i++) range.push(i);
  }

  // jendela di sekitar halaman aktif (tanpa duplikat first/last)
  for (let i = leftSibling; i <= rightSibling; i++) {
    if (i !== 1 && i !== pageCount) range.push(i);
  }

  if (showRightEllipsis) {
    range.push("ellipsis");
  } else {
    for (let i = rightSibling + 1; i < pageCount; i++) range.push(i);
  }

  // selalu halaman terakhir
  range.push(pageCount);

  return range;
};

const TablePagination = <TData extends RowData>({
  table,
  hasIcon,
}: TablePaginationProps<TData>) => {
  const pageSize = table.options.state.pagination?.pageSize ?? 10;
  const pageIndex = table.options.state.pagination?.pageIndex ?? 0;
  const pageCount = table.getPageCount();
  const totalRows = table.getFilteredRowModel().rows.length;

  const paginationRange = getPaginationRange(pageCount, pageIndex + 1);

  return (
    <div className="border-top d-md-flex justify-content-between align-items-center p-3">
      <div>
        Menampilkan {totalRows === 0 ? 0 : pageIndex * pageSize + 1}–
        {Math.min((pageIndex + 1) * pageSize, totalRows)} dari {totalRows} data
      </div>
      <Navbar className="mt-2 mt-md-0">
        <Pagination className="mb-0 flex-wrap">
          {/* Previous Button */}
          <Pagination.Item
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            {hasIcon ? <ChevronLeft className="icon-xxs" /> : "Previous"}
          </Pagination.Item>

          {/* Page Numbers (ringkas dengan ellipsis) */}
          {paginationRange.map((item, idx) =>
            item === "ellipsis" ? (
              <Pagination.Ellipsis key={`ellipsis-${idx}`} disabled />
            ) : (
              <Pagination.Item
                key={item}
                active={pageIndex === item - 1}
                onClick={() => table.setPageIndex(item - 1)}
              >
                {item}
              </Pagination.Item>
            )
          )}

          {/* Next Button */}
          <Pagination.Item
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            {hasIcon ? <ChevronRight className="icon-xxs" /> : "Next"}
          </Pagination.Item>
        </Pagination>
      </Navbar>
    </div>
  );
};

export default TablePagination;
