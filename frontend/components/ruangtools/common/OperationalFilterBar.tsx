"use client";

import { Form, Button, InputGroup } from "react-bootstrap";
import { IconCalendarMonth, IconCalendar, IconUser, IconFileTypePdf, IconFileTypeXls } from "@tabler/icons-react";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

interface OperationalFilterBarProps {
  bulan: number;
  tahun: number;
  nama: string;
  tahunOptions: number[];
  namaOptions: string[];
  namaLabel: string;
  onBulanChange: (value: number) => void;
  onTahunChange: (value: number) => void;
  onNamaChange: (value: string) => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
}

const OperationalFilterBar = ({
  bulan,
  tahun,
  nama,
  tahunOptions,
  namaOptions,
  namaLabel,
  onBulanChange,
  onTahunChange,
  onNamaChange,
  onExportPdf,
  onExportExcel,
}: OperationalFilterBarProps) => (
  <div className="operational-filterbar">
    <div className="operational-filter-controls">
      <InputGroup className="operational-filter-group">
        <InputGroup.Text><IconCalendarMonth size={16} /></InputGroup.Text>
        <Form.Select value={bulan} onChange={(e) => onBulanChange(Number(e.target.value))} aria-label="Filter bulan">
          <option value={0}>Semua Bulan</option>
          {MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
        </Form.Select>
      </InputGroup>

      <InputGroup className="operational-filter-group">
        <InputGroup.Text><IconCalendar size={16} /></InputGroup.Text>
        <Form.Select value={tahun} onChange={(e) => onTahunChange(Number(e.target.value))} aria-label="Filter tahun">
          <option value={0}>Semua Tahun</option>
          {tahunOptions.map((year) => <option key={year} value={year}>{year}</option>)}
        </Form.Select>
      </InputGroup>

      <InputGroup className="operational-filter-group operational-name-filter">
        <InputGroup.Text><IconUser size={16} /></InputGroup.Text>
        <Form.Select value={nama} onChange={(e) => onNamaChange(e.target.value)} aria-label={namaLabel}>
          <option value="">{namaLabel}</option>
          {namaOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </Form.Select>
      </InputGroup>
    </div>

    <div className="operational-export-controls">
      <Button variant="outline-danger" className="d-inline-flex align-items-center justify-content-center gap-2" onClick={onExportPdf}>
        <IconFileTypePdf size={18} /> Export PDF
      </Button>
      <Button variant="outline-success" className="d-inline-flex align-items-center justify-content-center gap-2" onClick={onExportExcel}>
        <IconFileTypeXls size={18} /> Export Excel
      </Button>
    </div>
  </div>
);

export default OperationalFilterBar;
