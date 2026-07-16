"use client";
// import node module libraries
import { Row, Col, Form, Button } from "react-bootstrap";
import { IconFileTypePdf, IconFileTypeXls } from "@tabler/icons-react";

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
    <Row className="align-items-end g-3 mb-4">
      <Col md={3} sm={6}>
        <Form.Label className="mb-1 small text-secondary">
          Bulan
        </Form.Label>
        <Form.Select
          size="sm"
          value={bulanFilter}
          onChange={(e) => onBulanFilterChange(Number(e.target.value))}
        >
          <option value={0}>Semua Bulan</option>
          {NAMA_BULAN.map((nama, index) => (
            <option key={nama} value={index + 1}>
              {nama}
            </option>
          ))}
        </Form.Select>
      </Col>
      <Col md={3} sm={6}>
        <Form.Label className="mb-1 small text-secondary">
          Tahun
        </Form.Label>
        <Form.Select
          size="sm"
          value={tahunFilter}
          onChange={(e) => onTahunFilterChange(Number(e.target.value))}
        >
          <option value={0}>Semua Tahun</option>
          {tahunOptions.map((tahun) => (
            <option key={tahun} value={tahun}>
              {tahun}
            </option>
          ))}
        </Form.Select>
      </Col>
      <Col md={6} sm={12} className="d-flex gap-2">
        <Button
          variant="outline-danger"
          size="sm"
          className="d-flex align-items-center gap-1 flex-fill"
          onClick={onExportPDF}
          title="Export PDF"
        >
          <IconFileTypePdf size={16} />
          PDF
        </Button>
        <Button
          variant="outline-success"
          size="sm"
          className="d-flex align-items-center gap-1 flex-fill"
          onClick={onExportExcel}
          title="Export Excel"
        >
          <IconFileTypeXls size={16} />
          Excel
        </Button>
      </Col>
    </Row>
  );
};

export default RiwayatFilterBar;