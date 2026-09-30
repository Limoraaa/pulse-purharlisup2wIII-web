"use client";
import { useEffect, useState } from "react";
import { Modal, Form, Button, ButtonGroup, Alert, Spinner } from "react-bootstrap";
import { IconClipboardCheck } from "@tabler/icons-react";
import api from "lib/api";
import type { ChecklistStatus, MachinePart, PartMappingPayload } from "./PartMappingType";

interface Props {
  show: boolean;
  onHide: () => void;
  mesinId: number | string; // Biarkan namanya mesinId agar prop dari parent tetap cocok
  mesinNama: string;
  onSubmitted?: () => void; // dipanggil setelah kegiatan berhasil disimpan
}

// Hasil pemeriksaan satu part, ditampung di layar sampai teknisi menyimpan kegiatan.
interface PartResult {
  statuses: Record<string, ChecklistStatus>;
  catatan: string;
}

const STATUS_OPTIONS: { value: ChecklistStatus; label: string; variant: string }[] = [
  { value: "baik", label: "Baik", variant: "success" },
  { value: "perlu_perhatian", label: "Perlu perhatian", variant: "warning" },
  { value: "rusak", label: "Rusak", variant: "danger" },
];

const MARKER_COLOR: Record<ChecklistStatus, string> = {
  baik: "#198754",
  perlu_perhatian: "#ffc107",
  rusak: "#dc3545",
};

const ORDER: Record<ChecklistStatus, number> = { baik: 0, perlu_perhatian: 1, rusak: 2 };

function worstOf(statuses: Record<string, ChecklistStatus>): ChecklistStatus {
  let worst: ChecklistStatus = "baik";
  Object.values(statuses).forEach((s) => {
    if (ORDER[s] > ORDER[worst]) worst = s;
  });
  return worst;
}

export default function PartMappingChecklistModalMotor({ show, onHide, mesinId, mesinNama, onSubmitted }: Props) {
  const [loadingMapping, setLoadingMapping] = useState(true);
  const [gambarUrl, setGambarUrl] = useState<string | null>(null);
  const [parts, setParts] = useState<MachinePart[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Hasil semua part yang sudah diperiksa pada kegiatan ini (key = id part)
  const [results, setResults] = useState<Record<string, PartResult>>({});
  const [teknisi, setTeknisi] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Form pemeriksaan satu part
  const [selectedPart, setSelectedPart] = useState<MachinePart | null>(null);
  const [draftStatuses, setDraftStatuses] = useState<Record<string, ChecklistStatus>>({});
  const [draftCatatan, setDraftCatatan] = useState("");
  const [partError, setPartError] = useState("");

  // Tiap kali modal dibuka: muat peta part & mulai kegiatan baru yang bersih
  useEffect(() => {
    if (!show) return;
    let cancelled = false;

    setResults({});
    setSelectedPart(null);
    setSubmitError("");
    setTeknisi(localStorage.getItem("userName") || "");

    (async () => {
      setLoadingMapping(true);
      setLoadError(null);
      try {
        // PERBAIKAN 1: Ambil data part mapping dari tabel motor konversi
        const res = await api<PartMappingPayload>(`/motor-konversi/${mesinId}/part-mapping`);
        if (!cancelled) {
          setGambarUrl(res?.gambarUrl ?? null);
          setParts(res?.parts ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError("Mapping part untuk motor ini belum tersedia. Minta admin memetakan part terlebih dahulu.");
        }
      } finally {
        if (!cancelled) setLoadingMapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [show, mesinId]);

  const checkedCount = Object.keys(results).length;

  const openPart = (p: MachinePart) => {
    const existing = results[p.id];
    if (existing) {
      setDraftStatuses({ ...existing.statuses });
      setDraftCatatan(existing.catatan);
    } else {
      const initial: Record<string, ChecklistStatus> = {};
      p.checklistItems.forEach((item) => {
        initial[item] = "baik";
      });
      setDraftStatuses(initial);
      setDraftCatatan("");
    }
    setPartError("");
    setSelectedPart(p);
  };

  const draftHasFinding = Object.values(draftStatuses).some((s) => s !== "baik");

  const handleSavePart = () => {
    if (!selectedPart) return;
    if (draftHasFinding && !draftCatatan.trim()) {
      setPartError('Ada item yang bukan "Baik" — catatan temuan wajib diisi.');
      return;
    }
    setResults((prev) => ({
      ...prev,
      [selectedPart.id]: {
        statuses: draftStatuses,
        catatan: draftHasFinding ? draftCatatan.trim() : "",
      },
    }));
    setSelectedPart(null);
  };

  const handleCloseMain = () => {
    if (checkedCount > 0 && !window.confirm("Hasil pemeriksaan belum disimpan dan akan hilang. Tutup?")) {
      return;
    }
    onHide();
  };

  const handleSubmit = async () => {
    if (!teknisi.trim()) {
      setSubmitError("Nama teknisi wajib diisi.");
      return;
    }
    if (checkedCount === 0) {
      setSubmitError("Periksa minimal satu part sebelum menyimpan kegiatan.");
      return;
    }
    if (
      checkedCount < parts.length &&
      !window.confirm(`${parts.length - checkedCount} part belum diperiksa. Tetap simpan kegiatan ini?`)
    ) {
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const hasil = parts
        .filter((p) => results[p.id])
        .map((p) => ({
          partId: p.id,
          partName: p.partName,
          items: p.checklistItems.map((item) => ({
            item,
            status: results[p.id].statuses[item] ?? "baik",
          })),
          catatan: results[p.id].catatan || undefined,
        }));

      // --- TAMBAHAN BARU: Menghitung status keseluruhan untuk disimpan ke log ---
      let overallStatus = "baik";
      hasil.forEach((p) => {
        p.items.forEach((item) => {
          if (ORDER[item.status as keyof typeof ORDER] > ORDER[overallStatus as keyof typeof ORDER]) {
            overallStatus = item.status;
          }
        });
      });

      // PERBAIKAN: Tambahkan uraian_pemeliharaan, status, dan jumlah_part_diperiksa
      await api("/log-pemeliharaan-motor", {
        method: "POST",
        body: JSON.stringify({
          motor_konversi_id: mesinId, 
          uraian_pemeliharaan: "Pemeriksaan Checklist Visual (Peta Komponen)", // <-- Ini yang menyelesaikan error Anda!
          waktu_pelaksana: new Date().toISOString().split("T")[0],
          paraf: teknisi.trim(),
          status: overallStatus,                               // <-- Badge status (Baik/Perlu Perhatian/Rusak)
          jumlah_part_diperiksa: hasil.length,                 // <-- Angka part yang dicek
          jumlah_part_total: parts.length,                     // <-- Angka total part di gambar
          hasil_checklist: hasil,
        }),
      });

      onSubmitted?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Gagal menyimpan kegiatan pemeliharaan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Modal utama: gambar mesin + titik-titik part */}
      <Modal show={show && !selectedPart} onHide={handleCloseMain} centered size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2">
            <IconClipboardCheck size={18} /> Kegiatan Pemeliharaan — {mesinNama}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingMapping ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" className="me-2" /> Memuat peta part...
            </div>
          ) : loadError ? (
            <Alert variant="warning" className="small mb-0">{loadError}</Alert>
          ) : (
            <>
              <p className="text-muted small mb-2">
                Klik tiap titik part dan isi hasil pemeriksaannya. Semua hasil disimpan sekaligus sebagai satu kegiatan.
              </p>
              <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
                <img src={gambarUrl ?? undefined} alt={mesinNama} style={{ maxWidth: "100%", display: "block" }} />
                {parts.map((p) => {
                  const r = results[p.id];
                  const bg = r ? MARKER_COLOR[worstOf(r.statuses)] : "#00529C";
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => openPart(p)}
                      title={r ? `${p.partName} (sudah diperiksa)` : p.partName}
                      style={{
                        position: "absolute",
                        left: `${p.xPercent}%`,
                        top: `${p.yPercent}%`,
                        transform: "translate(-50%, -50%)",
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        border: "2px solid #fff",
                        background: bg,
                        color: r && worstOf(r.statuses) === "perlu_perhatian" ? "#000" : "#fff",
                        fontSize: 13,
                        fontWeight: 600,
                        padding: 0,
                      }}
                    >
                      {p.partNumber}
                    </button>
                  );
                })}
              </div>
              <div className="small text-muted mt-2">
                Biru = belum diperiksa · Hijau = baik · Kuning = perlu perhatian · Merah = rusak
              </div>

              <Form.Group className="mt-3" style={{ maxWidth: 320 }}>
                <Form.Label className="small fw-semibold">Nama teknisi</Form.Label>
                <Form.Control size="sm" value={teknisi} onChange={(e) => setTeknisi(e.target.value)} />
              </Form.Group>

              {submitError && <Alert variant="danger" className="py-2 small mt-3 mb-0">{submitError}</Alert>}
            </>
          )}
        </Modal.Body>
        {!loadingMapping && !loadError && parts.length > 0 && (
          <Modal.Footer className="d-flex justify-content-between">
            <span className="small text-muted">
              Diperiksa: <strong>{checkedCount}</strong> dari {parts.length} part
            </span>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" onClick={handleCloseMain} disabled={submitting}>
                Batal
              </Button>
              <Button onClick={handleSubmit} disabled={submitting || checkedCount === 0}>
                {submitting ? <Spinner size="sm" className="me-1" /> : null}
                Simpan Kegiatan Pemeliharaan
              </Button>
            </div>
          </Modal.Footer>
        )}
      </Modal>

      {/* Modal pemeriksaan satu part */}
      <Modal show={!!selectedPart} onHide={() => setSelectedPart(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Checklist - {selectedPart?.partName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {partError && <Alert variant="danger" className="py-2 small">{partError}</Alert>}

          {selectedPart?.checklistItems.map((item) => (
            <div key={item} className="mb-2 pb-2 border-bottom">
              <div style={{ fontSize: 14, marginBottom: 6 }}>{item}</div>
              <ButtonGroup size="sm">
                {STATUS_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={draftStatuses[item] === opt.value ? opt.variant : `outline-${opt.variant}`}
                    onClick={() => setDraftStatuses((prev) => ({ ...prev, [item]: opt.value }))}
                  >
                    {opt.label}
                  </Button>
                ))}
              </ButtonGroup>
            </div>
          ))}

          {draftHasFinding && (
            <Form.Group className="mt-3">
              <Form.Label className="small fw-semibold">Catatan temuan</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={draftCatatan}
                onChange={(e) => setDraftCatatan(e.target.value)}
                placeholder="Jelaskan temuan/kejanggalan yang ditemukan..."
              />
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setSelectedPart(null)}>
            Batal
          </Button>
          <Button onClick={handleSavePart}>Simpan part ini</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}