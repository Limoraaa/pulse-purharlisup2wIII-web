'use client';
import React, { useEffect, useRef, useState } from 'react';
import { IconCalendar, IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';
import {
  DateFilterValue,
  NAMA_BULAN_ID,
  formatDateFilter,
  monthRange,
  toYMD,
} from './dateUtils';

interface DateRangePickerProps {
  value: DateFilterValue | null;
  onChange: (value: DateFilterValue | null) => void;
}

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  // 1 = mode tanggal (range), 2 = mode pilih bulan
  const [mode, setMode] = useState<'date' | 'month'>('date');
  const [tempStart, setTempStart] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  useEffect(() => {
    if (open) {
      setMode('date');
      setTempStart(null);
      // Mulai tampilan di bulan filter aktif jika ada
      if (value) {
        const [y, m] = value.start.split('-').map(Number);
        setViewDate(new Date(y, m - 1, 1));
      }
    }
  }, [open, value]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', onClickOutside);
      document.addEventListener('keydown', onKey);
    }
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const prevYear = () => setViewDate(new Date(year - 1, month, 1));
  const nextYear = () => setViewDate(new Date(year + 1, month, 1));

  const handlePickMonth = (m: number) => {
    onChange(monthRange(year, m));
    setOpen(false);
  };

  const handlePickDay = (day: number) => {
    const ymd = toYMD(new Date(year, month, day));
    if (!tempStart) {
      setTempStart(ymd);
      return;
    }
    // klik kedua => selesaikan rentang
    if (ymd < tempStart) {
      onChange({ start: ymd, end: tempStart });
    } else {
      onChange({ start: tempStart, end: ymd });
    }
    setTempStart(null);
    setOpen(false);
  };

  const handleToday = () => {
    const now = new Date();
    const ymd = toYMD(now);
    onChange({ start: ymd, end: ymd });
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setOpen(false);
  };

  const buildDays = () => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  const isInRange = (day: number) => {
    if (!tempStart || !value) return false;
    const d = toYMD(new Date(year, month, day));
    return d > tempStart && d <= value.end || (d >= value.start && d < value.end);
  };
  const isSelected = (day: number) => {
    const d = toYMD(new Date(year, month, day));
    if (tempStart && d === tempStart) return true;
    return !!value && d >= value.start && d <= value.end;
  };

  const label = formatDateFilter(value);

  return (
    <div className="drp-root" ref={rootRef}>
      <button
        type="button"
        className={`drp-trigger ${value ? 'is-filled' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <IconCalendar size={16} className="drp-trigger-icon" />
        <span className="drp-trigger-text">{label || 'Pilih Tanggal'}</span>
        {value && (
          <span
            role="button"
            className="drp-clear-inline"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            aria-label="Hapus filter tanggal"
          >
            <IconX size={14} />
          </span>
        )}
      </button>

      {open && (
        <div className="drp-popover">
          {/* Header / navigasi */}
          <div className="drp-header">
            {mode === 'date' ? (
              <>
                <button type="button" className="drp-nav" onClick={prevMonth} aria-label="Bulan sebelumnya">
                  <IconChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="drp-title"
                  onClick={() => setMode('month')}
                  title="Pilih bulan/tahun"
                >
                  {NAMA_BULAN_ID[month]} {year}
                </button>
                <button type="button" className="drp-nav" onClick={nextMonth} aria-label="Bulan berikutnya">
                  <IconChevronRight size={18} />
                </button>
              </>
            ) : (
              <>
                <button type="button" className="drp-nav" onClick={prevYear} aria-label="Tahun sebelumnya">
                  <IconChevronLeft size={18} />
                </button>
                <span className="drp-title">{year}</span>
                <button type="button" className="drp-nav" onClick={nextYear} aria-label="Tahun berikutnya">
                  <IconChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          {mode === 'date' ? (
            <>
              <div className="drp-weekdays">
                {DAY_LABELS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="drp-grid">
                {buildDays().map((day, idx) =>
                  day === null ? (
                    <span key={`empty-${idx}`} />
                  ) : (
                    <button
                      key={day}
                      type="button"
                      className={`drp-day ${isSelected(day) ? 'is-selected' : ''} ${isInRange(day) ? 'is-inrange' : ''}`}
                      onClick={() => handlePickDay(day)}
                    >
                      {day}
                    </button>
                  )
                )}
              </div>
            </>
          ) : (
            <div className="drp-month-grid">
              {NAMA_BULAN_ID.map((name, i) => (
                <button key={name} type="button" className="drp-month" onClick={() => handlePickMonth(i)}>
                  {name.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          <div className="drp-actions">
            <button type="button" className="drp-action" onClick={handleToday}>
              Hari Ini
            </button>
            <button type="button" className="drp-action drp-action-danger" onClick={handleClear}>
              Bersihkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
