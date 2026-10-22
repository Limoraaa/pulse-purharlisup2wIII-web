'use client';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { IconMinus, IconPlus } from '@tabler/icons-react';

interface Props {
  value: string; // disimpan sebagai teks agar bisa diketik bebas, mis. "1,5"
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  size?: 'sm' | 'lg';
  isInvalid?: boolean;
  ariaLabel?: string;
}

// Terima koma maupun titik sebagai pemisah desimal ("1,5" / "1.5")
export const teksKeAngka = (teks: string) => Number(teks.replace(',', '.'));
export const angkaKeTeks = (angka: number) => String(Math.round(angka * 100) / 100).replace('.', ',');

/** Input angka dengan tombol − / + di kiri-kanan; angka juga bisa diketik langsung (boleh desimal). */
export default function AngkaStepper({ value, onChange, step = 1, min = 0, size, isInvalid, ariaLabel = 'Jumlah' }: Props) {
  const sekarang = teksKeAngka(value);
  const geser = (delta: number) => {
    const dasar = Number.isFinite(sekarang) ? sekarang : 0;
    onChange(angkaKeTeks(Math.max(min, dasar + delta)));
  };

  return (
    <InputGroup size={size} hasValidation>
      <Button
        variant="outline-secondary"
        onClick={() => geser(-step)}
        disabled={!Number.isFinite(sekarang) || sekarang - step < min}
        aria-label={`Kurangi ${ariaLabel.toLowerCase()}`}
        className="d-flex align-items-center"
      >
        <IconMinus size={14} />
      </Button>
      <Form.Control
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ''))}
        inputMode="decimal"
        className="text-center fw-semibold"
        aria-label={ariaLabel}
        isInvalid={isInvalid}
      />
      <Button variant="outline-secondary" onClick={() => geser(step)} aria-label={`Tambah ${ariaLabel.toLowerCase()}`} className="d-flex align-items-center">
        <IconPlus size={14} />
      </Button>
    </InputGroup>
  );
}
