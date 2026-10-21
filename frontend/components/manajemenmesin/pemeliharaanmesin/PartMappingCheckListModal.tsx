"use client";
import { useEffect, useState } from "react";
import { Modal, Form, Button, ButtonGroup, Alert, Spinner } from "react-bootstrap";
import { IconClipboardCheck } from "@tabler/icons-react";
import api from "lib/api";
import type { ChecklistStatus, MachinePart, PartMappingPayload } from "./PartMappingType";
import { useFeedback } from "components/common/FeedbackProvider";

type AksiCode = "C" | "L" | "P" | "M" | "K";

interface Props {
  show: boolean;
  onHide: () => void;
  mesinId: number | string;
  mesinNama: string;
  rencanaId?: number | string | null; // rencana yang sedang dikerjakan (opsional)
  aksiRencana?: AksiCode | null; // tindakan dari rencana tsb; selalu dikirim ke server bersama rencana_id
  onSubmitted?: () => void; // dipanggil setelah kegiatan berhasil disimpan
}

// Hasil pemeriksaan satu part, ditampung di layar sampai teknisi menyimpan kegiatan.
interface PartResult {
  statuses: Record<string, ChecklistStatus>;
  catatan: Record<string, string>; // catatan temuan per item (hanya item yang bukan "Baik")
}

// Tindakan pemeliharaan yang dikerjakan. Dipakai server untuk mengisi baris Realisasi di Rencana.
const AKSI_OPTIONS: { value: AksiCode; label: string }[] = [
  { value: "C", label: "C - Cleaning / Check" },
  { value: "L", label: "L - Lubrication" },
  { value: "M", label: "M - Maintenance" },
  { value: "P", label: "P - Part Replacement" },
  { value: "K", label: "K - Kalibrasi" },
];

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

// Tanggal lokal (YYYY-MM-DD). toISOString() memakai UTC, sehingga di WIB sebelum jam 07.00
// tanggalnya mundur sehari dan log bisa masuk minggu yang salah.
function todayLocal(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function PartMappingChecklistModal({
  show,
  onHide,
  mesinId,
  mesinNama,
  rencanaId,
  aksiRencana,
  onSubmitted,
}: Props) {
  const { confirm: confirmDialog } = useFeedback();
  const [loadingMapping, setLoadingMapping] = useState(true);
  const [gambarUrl, setGambarUrl] = useState<string | null>(null);
  const [parts, setParts] = useState<MachinePart[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Hasil semua part yang sudah diperiksa pada kegiatan ini (key = id part)
  const [results, setResults] = useState<Record<string, PartResult>>({});
  const [teknisi, setTeknisi] = useState("");
  const [aksi, setAksi] = useState<AksiCode | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Form pemeriksaan satu part
  const [selectedPart, setSelectedPart] = useState<MachinePart | null>(null);
  const [draftStatuses, setDraftStatuses] = useState<Record<string, ChecklistStatus>>({});
  const [draftCatatan, setDraftCatatan] = useState<Record<string, string>>({});
  const [partError, setPartError] = useState("");

  // Dikerjakan dari rencana: tindakan ikut rencana, tidak perlu dipilih lagi.
  // Dropdown hanya muncul untuk kegiatan di luar rencana.
  // Dianggap "dari rencana" hanya kalau tindakan rencananya diketahui (aksiRencana). Kalau halaman induk
  // hanya mengirim rencanaId tanpa aksiRencana, dropdown tetap tampil supaya aksi selalu terkirim.
  const dariRencana = !!aksiRencana;
  const aksiRencanaLabel = AKSI_OPTIONS.find((o) => o.value === aksiRencana)?.label;

  // Tiap kali modal dibuka: muat peta part & mulai kegiatan baru yang bersih
  useEffect(() => {
    if (!show) return;
    let cancelled = false;

    setResults({});
    setSelectedPart(null);
    setSubmitError("");
    setAksi("");
    setTeknisi(localStorage.getItem("userName") || "");

    (async () => {
      setLoadingMapping(true);
      setLoadError(null);
      try {
        const res = await api<PartMappingPayload>(`/mesin-produksi/${mesinId}/part-mapping`);
        if (!cancelled) {
          setGambarUrl(res?.gambarUrl ?? null);
          setParts(res?.parts ?? []);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Mapping part untuk mesin ini belum tersedia. Minta admin memetakan part terlebih dahulu.");
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
      setDraftCatatan({ ...existing.catatan });
    } else {
      const initial: Record<string, ChecklistStatus> = {};
      p.checklistItems.forEach((item) => {
        initial[item] = "baik";
      });
      setDraftStatuses(initial);
      setDraftCatatan({});
    }
    setPartError("");
    setSelectedPart(p);
  };

  const handleSavePart = () => {
    if (!selectedPart) return;
    const temuan = selectedPart.checklistItems.filter((item) => draftStatuses[item] !== "baik");
    const tanpaCatatan = temuan.filter((item) => !draftCatatan[item]?.trim());
    if (tanpaCatatan.length > 0) {
      setPartError(`Catatan temuan wajib diisi untuk: ${tanpaCatatan.join(", ")}.`);
      return;
    }
    const catatan: Record<string, string> = {};
    temuan.forEach((item) => {
      catatan[item] = draftCatatan[item].trim();
    });
    setResults((prev) => ({
      ...prev,
      [selectedPart.id]: { statuses: draftStatuses, catatan },
    }));
    setSelectedPart(null);
  };

  const handleCloseMain = async () => {
    if (
      checkedCount > 0 &&
      !(await confirmDialog({
        title: "Tutup Checklist?",
        message: "Hasil pemeriksaan belum disimpan dan akan hilang.",
        confirmLabel: "Ya, tutup",
        variant: "warning",
      }))
    ) {
      return;
    }
    onHide();
  };

  const handleSubmit = async () => {
    if (!teknisi.trim()) {
      setSubmitError("Nama teknisi wajib diisi.");
      return;
    }

    // Tindakan: dari rencana kalau ada, selain itu dari pilihan teknisi.
    const aksiKirim: AksiCode | "" = aksiRencana || aksi;

    // Tindakan selalu dikirim: server memakainya untuk mencocokkan plotting dan memvalidasi rencana.
    if (!aksiKirim) {
      setSubmitError("Pilih tindakan yang dikerjakan.");
      return;
    }
    if (checkedCount === 0) {
      setSubmitError("Periksa minimal satu part sebelum menyimpan kegiatan.");
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
            catatan: results[p.id].catatan[item] || undefined,
          })),
        }));

      await api("/log-pemeliharaan", {
        method: "POST",
        body: JSON.stringify({
          mesin_produksi_id: mesinId,
          waktu_pelaksana: todayLocal(),
          paraf: teknisi.trim(),
          jumlah_part_total: parts.length,
          hasil_checklist: hasil,
          // rencana_id & aksi dikirim bersama; server hanya menolak kalau tindakannya beda dari rencana
          ...(rencanaId ? { rencana_id: rencanaId } : {}),
          ...(aksiKirim ? { aksi: aksiKirim } : {}),
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

              {/* Tindakan: dipakai untuk mencocokkan kegiatan ini ke plotting di Rencana Pemeliharaan.
                  Kalau dikerjakan dari sebuah rencana, tindakannya ikut rencana itu. */}
              {dariRencana ? (
                <div className="small mt-3">
                  <span className="fw-semibold">Tindakan:</span>{" "}
                  {aksiRencanaLabel ?? "sesuai rencana"}{" "}
                  <span className="text-muted">(mengerjakan rencana, hasilnya otomatis menyelesaikan rencana ini)</span>
                </div>
              ) : (
                <Form.Group className="mt-3" style={{ maxWidth: 320 }}>
                  <Form.Label className="small fw-semibold">Tindakan yang dikerjakan</Form.Label>
                  <Form.Select
                    size="sm"
                    value={aksi}
                    onChange={(e) => setAksi(e.target.value as AksiCode | "")}
                  >
                    <option value="">Pilih tindakan...</option>
                    {AKSI_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Form.Select>
                  {rencanaId && (
                    <Form.Text className="text-muted">
                      Pilih tindakan yang sama dengan rencana yang sedang dikerjakan.
                    </Form.Text>
                  )}
                </Form.Group>
              )}

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
              {checkedCount === 0 && " · periksa minimal 1 part"}
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

      {/* Modal pemeriksaan satu part (hanya menampung ke layar, belum kirim ke server) */}
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
              {/* Catatan terpisah untuk tiap item yang bukan "Baik" */}
              {draftStatuses[item] !== "baik" && (
                <Form.Control
                  as="textarea"
                  rows={2}
                  size="sm"
                  className="mt-2"
                  value={draftCatatan[item] ?? ""}
                  onChange={(e) => setDraftCatatan((prev) => ({ ...prev, [item]: e.target.value }))}
                  placeholder={`Catatan temuan untuk "${item}"...`}
                />
              )}
            </div>
          ))}
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