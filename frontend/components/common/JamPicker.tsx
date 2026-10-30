"use client";

import { Form, InputGroup } from "react-bootstrap";

interface JamPickerProps {
  value: string; // format "HH:MM" (24 jam)
  onChange: (value: string) => void;
  ariaLabel?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const DAFTAR_JAM = Array.from({ length: 24 }, (_, i) => pad(i));
const DAFTAR_MENIT = Array.from({ length: 12 }, (_, i) => pad(i * 5));

// Pemilih jam format 24 jam (tanpa AM/PM): dropdown jam 00–23 dan menit per 5 menit
export default function JamPicker({ value, onChange, ariaLabel = "Waktu" }: JamPickerProps) {
  const [jam = "00", menit = "00"] = (value || "00:00").split(":");
  // Nilai lama yang tidak kelipatan 5 menit tetap ditampilkan apa adanya
  const opsiMenit = DAFTAR_MENIT.includes(menit) ? DAFTAR_MENIT : [...DAFTAR_MENIT, menit].sort();

  return (
    <InputGroup size="sm" className="flex-nowrap">
      <Form.Select
        aria-label={`${ariaLabel} - jam`}
        value={jam}
        onChange={(e) => onChange(`${e.target.value}:${menit}`)}
        className="bg-body text-body"
      >
        {DAFTAR_JAM.map((j) => (
          <option key={j} value={j}>{j}</option>
        ))}
      </Form.Select>
      <InputGroup.Text className="px-2 fw-bold">:</InputGroup.Text>
      <Form.Select
        aria-label={`${ariaLabel} - menit`}
        value={menit}
        onChange={(e) => onChange(`${jam}:${e.target.value}`)}
        className="bg-body text-body"
      >
        {opsiMenit.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </Form.Select>
      <InputGroup.Text className="small text-secondary">WIB</InputGroup.Text>
    </InputGroup>
  );
}
