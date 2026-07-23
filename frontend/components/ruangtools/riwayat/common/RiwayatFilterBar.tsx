"use client";
// import node module libraries
import { Form, Button, InputGroup } from "react-bootstrap";
import {
  IconFileTypePdf,
  IconFileTypeXls,
  IconCalendarMonth,
  IconCalendar,
} from "@tabler/icons-react";

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

interface RiwayatFilterBarProps {
  bulanFilter: number; // 0 = Semua Bulan, 1-12 = bulan tertentu
  onBulanFilterChange: (v: number) => void;
  tahunFilter: number; // 0 = Semua Tahun
  onTahunFilterChange: (v: number) => void;
  tahunOptions: number[]; // daftar tahun yang ada di data

  onExportPDF: () => void;
  onExportExcel: () => void;
}

const RiwayatFilterBar = ({
  bulanFilter,
  onBulanFilterChange,
  tahunFilter,
  onTahunFilterChange,
  tahunOptions,
  onExportPDF,
  onExportExcel,
}: RiwayatFilterBarProps) => {
  return (
    <div className="riwayat-filterbar d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      {/* Filter Bulan & Tahun */}
      <div className="d-flex flex-wrap align-items-center gap-2">
        <InputGroup className="riwayat-filter-group">
          <InputGroup.Text>
            <IconCalendarMonth size={16} />
          </InputGroup.Text>
          <Form.Select
            value={bulanFilter}
            onChange={(e) => onBulanFilterChange(Number(e.target.value))}
            aria-label="Filter bulan"
          >
            <option value={0}>Semua Bulan</option>
            {NAMA_BULAN.map((nama, index) => (
              <option key={nama} value={index + 1}>
                {nama}
              </option>
            ))}
          </Form.Select>
        </InputGroup>

        <InputGroup className="riwayat-filter-group">
          <InputGroup.Text>
            <IconCalendar size={16} />
          </InputGroup.Text>
          <Form.Select
            value={tahunFilter}
            onChange={(e) => onTahunFilterChange(Number(e.target.value))}
            aria-label="Filter tahun"
          >
            <option value={0}>Semua Tahun</option>
            {tahunOptions.map((tahun) => (
              <option key={tahun} value={tahun}>
                {tahun}
              </option>
            ))}
          </Form.Select>
        </InputGroup>
      </div>

      {/* Tombol Export */}
      <div className="d-flex gap-2">
        <Button
          variant="outline-danger"
          className="d-flex align-items-center gap-2"
          onClick={onExportPDF}
          title="Export PDF"
        >
          <IconFileTypePdf size={18} />
          Export PDF
        </Button>
        <Button
          variant="outline-success"
          className="d-flex align-items-center gap-2"
          onClick={onExportExcel}
          title="Export Excel"
        >
          <IconFileTypeXls size={18} />
          Export Excel
        </Button>
      </div>
    </div>
  );
};

export default RiwayatFilterBar;