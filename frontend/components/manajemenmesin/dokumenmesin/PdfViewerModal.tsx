'use client';
import { useEffect, useRef, useState } from 'react';
import { Modal, Spinner, Alert } from 'react-bootstrap';
import { apiFetchBinary } from 'lib/api';

interface PdfViewerModalProps {
  show: boolean;
  onHide: () => void;
  dokumenId: number | null;
  judul: string;
}

/**
 * Viewer PDF untuk dokumen rahasia.
 * Halaman dirender ke canvas dengan pdf.js (tanpa viewer bawaan browser),
 * sehingga tidak ada tombol unduh/print dan file tidak punya URL yang bisa dibuka langsung.
 */
export default function PdfViewerModal({ show, onHide, dokumenId, judul }: PdfViewerModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!show || !dokumenId) return;
    let batal = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pdfDoc: any = null;

    const render = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pdfjs, data] = await Promise.all([
          import('pdfjs-dist'),
          apiFetchBinary(`/dokumen-mesin/${dokumenId}/file`),
        ]);
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

        pdfDoc = await pdfjs.getDocument({ data }).promise;
        const container = containerRef.current;
        if (batal || !container) return;
        container.innerHTML = '';

        const lebar = container.clientWidth - 32;
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          if (batal) return;
          const dasar = page.getViewport({ scale: 1 });
          const skala = Math.min(lebar / dasar.width, 2);
          const rasio = window.devicePixelRatio || 1;
          const viewport = page.getViewport({ scale: skala * rasio });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = `${viewport.width / rasio}px`;
          canvas.style.height = `${viewport.height / rasio}px`;
          canvas.className = 'd-block mx-auto mb-3 shadow-sm bg-white';
          container.appendChild(canvas);

          await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
        }
      } catch (e) {
        if (!batal) setError(e instanceof Error ? e.message : 'Dokumen gagal dimuat.');
      } finally {
        if (!batal) setLoading(false);
      }
    };

    render();
    return () => {
      batal = true;
      pdfDoc?.destroy();
    };
  }, [show, dokumenId]);

  // Blokir pintasan simpan & print selama viewer terbuka
  useEffect(() => {
    if (!show) return;
    const blokir = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'p'].includes(e.key.toLowerCase())) e.preventDefault();
    };
    window.addEventListener('keydown', blokir);
    return () => window.removeEventListener('keydown', blokir);
  }, [show]);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable contentClassName="border-0 rounded-4 dokumen-rahasia">
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fs-6 fw-bold">{judul}</Modal.Title>
      </Modal.Header>
      <Modal.Body
        className="bg-body-tertiary p-3"
        style={{ userSelect: 'none', minHeight: '60vh' }}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <div className="small text-muted mt-2">Memuat dokumen...</div>
          </div>
        )}
        {error && <Alert variant="danger">{error}</Alert>}
        <div ref={containerRef} />
      </Modal.Body>
      {/* Dokumen tidak ikut tercetak bila halaman di-print */}
      <style>{`@media print { .dokumen-rahasia { display: none !important; } }`}</style>
    </Modal>
  );
}
