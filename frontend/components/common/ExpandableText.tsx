'use client';
import React, { useEffect, useRef, useState } from 'react';

interface ExpandableTextProps {
  text?: string | null;
  lines?: number;
}

// Teks yang dipotong ke beberapa baris; tombol "Selengkapnya" hanya muncul
// bila teks memang melebihi batas baris.
export default function ExpandableText({ text, lines = 2 }: ExpandableTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, lines, expanded]);

  if (!text) return <>-</>;

  return (
    <div>
      <div
        ref={ref}
        style={expanded ? { whiteSpace: 'pre-line' } : {
          display: '-webkit-box',
          WebkitLineClamp: lines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          whiteSpace: 'pre-line',
        }}
      >
        {text}
      </div>
      {(overflowing || expanded) && (
        <button
          type="button"
          className="btn btn-link p-0 border-0 fw-semibold text-decoration-none"
          style={{ fontSize: '0.75rem' }}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Sembunyikan' : 'Selengkapnya'}
        </button>
      )}
    </div>
  );
}
