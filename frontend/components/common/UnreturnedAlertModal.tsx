'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toast, ToastContainer, Button, Badge } from 'react-bootstrap';
import api from '/lib/api';

export default function UnreturnedAlertModal() {
  const [unreturnedCount, setUnreturnedCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUserAndUnreturnedTools = async () => {
      try {
        const userRes: any = await api('/user');
        const userRole = userRes?.role || userRes?.data?.role;

        if (userRole && userRole.toLowerCase() !== 'staff') {
          return;
        }

        const res: any = await api('/peminjaman/belum-kembali');
        const total = res?.total || 0;

        if (total > 0) {
          setUnreturnedCount(total);
          setShowModal(true);
        }
      } catch (err) {
        console.error('Gagal mengecek hak akses atau data peminjaman', err);
      }
    };

    checkUserAndUnreturnedTools();
  }, []);

  return (
    <ToastContainer
      position="top-end"
      className="p-3"
      style={{ zIndex: 999999, position: 'fixed' }}
    >
      <Toast
        show={showModal}
        onClose={() => setShowModal(false)}
        style={{
          maxWidth: 420,
          borderLeft: '5px solid #dc3545',
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
        }}
      >
        <Toast.Header className="align-items-start py-3">
          <div
            className="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center me-2 flex-shrink-0"
            style={{ width: 42, height: 42 }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc3545"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
          </div>
          <div className="me-auto">
            <strong className="text-body" style={{ fontSize: 16 }}>
              Peringatan Alat
            </strong>
            <div className="text-danger fw-semibold" style={{ fontSize: 12 }}>
              Memerlukan tindakan segera
            </div>
          </div>
        </Toast.Header>
        <Toast.Body>
          <p className="text-secondary mb-3" style={{ fontSize: 14, lineHeight: 1.6 }}>
            Saat ini terdapat{' '}
            <Badge bg="danger" pill className="fw-semibold" style={{ fontSize: 13 }}>
              {unreturnedCount} alat
            </Badge>{' '}
            yang masih dipinjam dan belum dikembalikan oleh peminjam.
          </p>
          <div className="d-flex justify-content-end gap-2">
            <Button
              variant="light"
              className="fw-semibold"
              onClick={() => setShowModal(false)}
            >
              Abaikan
            </Button>
            <Button
              variant="danger"
              className="fw-semibold d-flex align-items-center gap-1"
              onClick={() => {
                setShowModal(false);
                router.push('/transaksi/peminjaman-aktif');
              }}
            >
              Lihat Daftar
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Button>
          </div>
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
}