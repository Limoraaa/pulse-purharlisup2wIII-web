"use client";
// import node module libraries
import { Form, Button, InputGroup } from "react-bootstrap";
import {
  IconFileTypePdf,
  IconFileTypeXls,
  IconUser,
} from "@tabler/icons-react";
import DateRangePicker from "components/ruangtools/common/DateRangePicker";
import { DateFilterValue } from "components/ruangtools/common/dateUtils";

interface RiwayatFilterBarProps {
  tanggalFilter: DateFilterValue | null;
  onTanggalFilterChange: (v: DateFilterValue | null) => void;

  namaFilter: string;
  onNamaFilterChange: (v: string) => void;
  namaOptions: string[];
  namaLabel?: string;

  onExportPDF: () => void;
  onExportExcel: () => void;
}

const RiwayatFilterBar = ({
  tanggalFilter,
  onTanggalFilterChange,
  namaFilter,
  onNamaFilterChange,
  namaOptions = [],
  namaLabel = "Nama",
  onExportPDF,
  onExportExcel,
}: RiwayatFilterBarProps) => {
  return (
    <div className="riwayat-filterbar">
      {/* Filter Tanggal (date range / bulan) + Nama */}
      <div className="riwayat-filter-controls">
        <DateRangePicker value={tanggalFilter} onChange={onTanggalFilterChange} />

        <InputGroup className="riwayat-filter-group riwayat-nama-filter">
          <InputGroup.Text>
            <IconUser size={16} />
          </InputGroup.Text>
          <Form.Select
            value={namaFilter}
            onChange={(e) => onNamaFilterChange(e.target.value)}
            aria-label={`Filter ${namaLabel}`}
          >
            <option value="">Semua {namaLabel}</option>
            {namaOptions.map((nama) => (
              <option key={nama} value={nama}>
                {nama}
              </option>
            ))}
          </Form.Select>
        </InputGroup>
      </div>

      {/* Tombol Export */}
      <div className="riwayat-export-controls">
        <Button
          variant="outline-danger"
          className="d-inline-flex align-items-center justify-content-center gap-2"
          onClick={onExportPDF}
          title="Export PDF"
        >
          <IconFileTypePdf size={18} />
          Export PDF
        </Button>
        <Button
          variant="outline-success"
          className="d-inline-flex align-items-center justify-content-center gap-2"
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
