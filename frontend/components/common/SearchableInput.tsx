'use client';
import React, { useMemo, useState } from 'react';
import { Form } from 'react-bootstrap';

export interface SearchableOption {
  value: string; // id unik
  label: string; // teks utama, juga diisikan ke input saat dipilih
  description?: string; // keterangan tambahan di bawah label (mis. tipe & ukuran)
}

interface SearchableInputProps {
  options: SearchableOption[];
  inputValue: string;
  onInputChange: (text: string) => void;
  onSelect: (option: SearchableOption) => void;
  placeholder?: string;
  isInvalid?: boolean;
  maxResults?: number;
}

// Input teks dengan daftar saran yang bisa dicari (cocok per kata pada label & keterangan).
// Pengganti <datalist> karena datalist hanya bisa menampilkan satu baris teks polos.
export default function SearchableInput({
  options,
  inputValue,
  onInputChange,
  onSelect,
  placeholder,
  isInvalid,
  maxResults = 50,
}: SearchableInputProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    const words = inputValue.toLowerCase().split(/\s+/).filter(Boolean);
    const hasil = words.length
      ? options.filter((o) => {
          const teks = `${o.label} ${o.description ?? ''}`.toLowerCase();
          return words.every((w) => teks.includes(w));
        })
      : options;
    return hasil.slice(0, maxResults);
  }, [options, inputValue, maxResults]);

  // Kalau teks input sama persis dengan opsi terpilih, tampilkan semua opsi agar bisa ganti pilihan
  const tampil = options.some((o) => o.label === inputValue) ? options.slice(0, maxResults) : filtered;

  const pilih = (o: SearchableOption) => {
    onSelect(o);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, tampil.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open && tampil[active]) {
      e.preventDefault(); // jangan submit form
      pilih(tampil[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="position-relative">
      <Form.Control
        value={inputValue}
        placeholder={placeholder}
        isInvalid={isInvalid}
        autoComplete="off"
        onChange={(e) => {
          onInputChange(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <div
          className="position-absolute w-100 bg-body border rounded shadow-sm mt-1 overflow-auto"
          style={{ zIndex: 1060, maxHeight: 260 }}
        >
          {tampil.length === 0 ? (
            <div className="px-3 py-2 small text-muted">Tidak ada data yang cocok.</div>
          ) : (
            tampil.map((o, i) => (
              <div
                key={o.value}
                role="option"
                aria-selected={i === active}
                className={`px-3 py-2 border-bottom ${i === active ? 'bg-primary-subtle' : ''}`}
                style={{ cursor: 'pointer' }}
                // mousedown + preventDefault: pilih sebelum input kehilangan fokus (blur menutup daftar)
                onMouseDown={(e) => {
                  e.preventDefault();
                  pilih(o);
                }}
                onMouseEnter={() => setActive(i)}
              >
                <div className="fw-semibold small">{o.label}</div>
                {o.description && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{o.description}</div>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
