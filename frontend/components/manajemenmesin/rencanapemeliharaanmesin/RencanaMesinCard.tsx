"use client";
// components/pemeliharaan/rencana/RencanaMesinCard.tsx
// Daftar rencana yang belum dikerjakan untuk SATU mesin, ditampilkan di halaman
// detail Pemeliharaan Mesin. Tombol "Kerjakan" membuka Checklist Visual.
import { useMemo } from "react";
import useSWR from "swr";
import { Card, CardBody, Badge, Button, Spinner, Alert } from "react-bootstrap";
import { IconCalendarEvent, IconClipboardCheck } from "@tabler/icons-react";

import { fetchRencanaMesin } from "services/rencanaPemeliharaanService";
import { RencanaItem } from "types/RencanaPemeliharaanTypes";
import {
  ACTION_META,
  STATUS_VARIANT,
  formatJadwal,
  getStatusTampil,
} from "./RencanaHelpers";

// Dipakai juga oleh halaman induk untuk me-refresh kartu setelah laporan disimpan.
export const rencanaMesinKey = (mesinId: string | number) => `rencana-mesin-${mesinId}`;

interface Props {
  mesinId: string | number;
  canProcess: boolean;
  onKerjakan: (rencana: RencanaItem) => void;
}

const MAX_TAMPIL = 6;

const RencanaMesinCard = ({ mesinId, canProcess, onKerjakan }: Props) => {
  const today = useMemo(() => new Date(), []);

  const { data, error, isLoading } = useSWR(rencanaMesinKey(mesinId), () =>
    fetchRencanaMesin(mesinId)
  );

  const items = data ?? [];
  const tampil = items.slice(0, MAX_TAMPIL);
  const sisa = items.length - tampil.length;

  return (
    <Card className="mb-4">
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0 d-flex align-items-center gap-2">
            <IconCalendarEvent size={20} /> Rencana Pemeliharaan
          </h5>
          <span className="text-secondary small">
            {isLoading ? "" : `${items.length} menunggu dikerjakan`}
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-3 text-secondary">
            <Spinner animation="border" size="sm" className="me-2" /> Memuat rencana...
          </div>
        ) : error ? (
          <Alert variant="danger" className="mb-0 py-2 small">
            {error instanceof Error ? error.message : "Gagal memuat rencana pemeliharaan"}
          </Alert>
        ) : items.length === 0 ? (
          <p className="text-secondary small mb-0">
            Tidak ada rencana yang menunggu untuk mesin ini.
          </p>
        ) : (
          <div className="d-flex flex-column gap-2">
            {tampil.map((r) => {
              const meta = ACTION_META[r.aksi];
              const status = getStatusTampil(r, today);
              return (
                <div
                  key={r.id}
                  className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 border rounded p-2"
                >
                  <div className="d-flex align-items-center gap-3">
                    <span
                      className="d-inline-flex align-items-center justify-content-center rounded fw-bold flex-shrink-0"
                      style={{
                        width: 28,
                        height: 28,
                        fontSize: 13,
                        background: meta.color,
                        color: meta.textColor,
                      }}
                      title={meta.label}
                    >
                      {r.aksi}
                    </span>
                    <div>
                      <div className="fw-semibold">{meta.label}</div>
                      <div className="text-secondary small">{formatJadwal(r)}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Badge pill bg={STATUS_VARIANT[status]}>
                      {status}
                    </Badge>
                    {canProcess && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="d-flex align-items-center gap-1"
                        onClick={() => onKerjakan(r)}
                      >
                        <IconClipboardCheck size={14} /> Kerjakan
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {sisa > 0 && (
              <div className="text-secondary small">
                +{sisa} rencana lainnya. Lihat semuanya di halaman Rencana Pemeliharaan.
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default RencanaMesinCard;