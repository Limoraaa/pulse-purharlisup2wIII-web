'use client';
import { Form, InputGroup } from 'react-bootstrap';

interface Props {
  value: number | null; // null = belum diisi
  onChange: (value: number | null) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  isInvalid?: boolean;
  ariaLabel?: string;
}

// 1250000 -> "1.250.000"
const formatRibuan = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 0 });

/**
 * Input nominal rupiah: hanya angka, pemisah ribuan otomatis saat mengetik ("1.250.000"),
 * tanpa angka 0 yang menempel di depan. Nilai yang dikirim ke induk tetap berupa angka.
 */
export default function InputRupiah({ value, onChange, required, disabled, placeholder = '0', isInvalid, ariaLabel }: Props) {
  return (
    <InputGroup hasValidation>
      <InputGroup.Text>Rp</InputGroup.Text>
      <Form.Control
        type="text"
        inputMode="numeric"
        value={value === null || value === undefined ? '' : formatRibuan(value)}
        onChange={(e) => {
          const digit = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
          onChange(digit === '' ? null : Number(digit));
        }}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        isInvalid={isInvalid}
        aria-label={ariaLabel}
      />
    </InputGroup>
  );
}
