"use client";
import { tanggalLokal } from "lib/tanggal";
import { useEffect, useState } from "react";
import { Modal, Form, Button, ButtonGroup, Alert, Spinner, Row, Col } from "react-bootstrap";
import { IconClipboardCheck, IconDroplet } from "@tabler/icons-react";
import api from "lib/api";
import AngkaStepper, { teksKeAngka } from "components/common/AngkaStepper";
import { formatJumlahOli } from "./PartMappingType";
import type { ChecklistStatus, MachinePart, PartMappingPayload, TindakanOli } from "./PartMappingType";
import { useFeedback } from "components/common/FeedbackProvider";
import { useRoles } from "hooks/usePermissions";

type AksiCode = "C" | "L" | "P" | "M" | "K";
type JenisPelaksana = "Internal" | "Vendor";

interface Props {
  show: boolean;
  onHide: () => void;
  mesinId: number | string;
  mesinNama: string;
  rencanaId?: number | string | null;
  aksiRencana?: AksiCode | null;
  pelaksanaRencana?: { jenis: JenisPelaksana; namaVendor?: string | null } | null;
  oliStandarId?: number | null; // oli standar mesin (dari Data Mesin), dipilih otomatis
  onSubmitted?: () => void;
}

interface PartResult {
  statuses: Record<string, ChecklistStatus>;
  catatan: Record<string, string>;
}

// Master Data Oli dari Database
interface OliMaster {
  id: number;
  kode_oli: string;
  nama_oli: string;
  stok: number;
  satuan: string;
}

// Pemakaian oli mesin pada kegiatan ini (stok di Data Oli otomatis dipotong)
const TINDAKAN_OLI: { value: TindakanOli; label: string; hint: string }[] = [
  { value: "tambah", label: "Tambah (top-up)", hint: "Oli lama tetap di mesin, hanya ditambah karena berkurang." },
  { value: "ganti", label: "Ganti oli", hint: "Oli lama dikuras habis, lalu diisi oli baru." },
];

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



export default function PartMappingChecklistModal({
  show,
  onHide,
  mesinId,
  mesinNama,
  rencanaId,
  aksiRencana,
  pelaksanaRencana,
  oliStandarId = null,
  onSubmitted,
}: Props) {
  const { confirm: confirmDialog } = useFeedback();
  const [loadingMapping, setLoadingMapping] = useState(true);
  const [gambarUrl, setGambarUrl] = useState<string | null>(null);
  const [parts, setParts] = useState<MachinePart[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [results, setResults] = useState<Record<string, PartResult>>({});
  const [teknisi, setTeknisi] = useState("");
  const [aksi, setAksi] = useState<AksiCode | "">("");
  
  const akunVendor = useRoles().includes("Vendor");
  const jenisPelaksanaAwal: JenisPelaksana = pelaksanaRencana?.jenis ?? (akunVendor ? "Vendor" : "Internal");
  const namaVendorAwal = pelaksanaRencana?.namaVendor ?? "";
  const [jenisPelaksana, setJenisPelaksana] = useState<JenisPelaksana>("Internal");
  const [namaVendor, setNamaVendor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Pemakaian oli (opsional): oli dari Data Oli, default oli standar mesin
  const [olis, setOlis] = useState<OliMaster[]>([]);
  const [pakaiOli, setPakaiOli] = useState(false);
  const [selectedOliId, setSelectedOliId] = useState<string>("");
  const [tindakanOli, setTindakanOli] = useState<TindakanOli>("tambah");
  const [jumlahOli, setJumlahOli] = useState<string>("");

  const [selectedPart, setSelectedPart] = useState<MachinePart | null>(null);
  const [draftStatuses, setDraftStatuses] = useState<Record<string, ChecklistStatus>>({});
  const [draftCatatan, setDraftCatatan] = useState<Record<string, string>>({});
  const [partError, setPartError] = useState("");

  const oliStandar = olis.find((o) => String(o.id) === String(oliStandarId));
  const oliTerpilihUi = olis.find((o) => String(o.id) === selectedOliId);

  const dariRencana = !!aksiRencana;
  const aksiRencanaLabel = AKSI_OPTIONS.find((o) => o.value === aksiRencana)?.label;

  useEffect(() => {
    if (!show) return;
    let cancelled = false;

    setResults({});
    setSelectedPart(null);
    setSubmitError("");
    setAksi("");
    setTeknisi(localStorage.getItem("userName") || "");
    setJenisPelaksana(jenisPelaksanaAwal);
    setNamaVendor(namaVendorAwal || (akunVendor ? localStorage.getItem("userName") || "" : ""));
    setPakaiOli(false);
    setSelectedOliId(oliStandarId ? String(oliStandarId) : "");
    setTindakanOli("tambah");
    setJumlahOli("");

    // Ambil Peta Part
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
        if (!cancelled) setLoadError("Mapping part untuk mesin ini belum tersedia.");
      } finally {
        if (!cancelled) setLoadingMapping(false);
      }
    })();

    // Ambil Daftar Master Oli
    api<any>("/olis")
      .then((res) => {
        const data = res?.data ?? res ?? [];
        if (!cancelled) setOlis(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Gagal memuat data oli", err));

    return () => { cancelled = true; };
  }, [show, mesinId, jenisPelaksanaAwal, namaVendorAwal, akunVendor, oliStandarId]);

  const checkedCount = Object.keys(results).length;

  const openPart = (p: MachinePart) => {
    const existing = results[p.id];
    if (existing) {
      setDraftStatuses({ ...existing.statuses });
      setDraftCatatan({ ...existing.catatan });
    } else {
      const initial: Record<string, ChecklistStatus> = {};
      p.checklistItems.forEach((item) => { initial[item] = "baik"; });
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
    temuan.forEach((item) => { catatan[item] = draftCatatan[item].trim(); });
    setResults((prev) => ({ ...prev, [selectedPart.id]: { statuses: draftStatuses, catatan } }));
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
    ) { return; }
    onHide();
  };

  const handleSubmit = async () => {
    if (!teknisi.trim()) {
      setSubmitError("Nama teknisi wajib diisi.");
      return;
    }
    const aksiKirim: AksiCode | "" = aksiRencana || aksi;
    if (!aksiKirim) {
      setSubmitError("Pilih tindakan yang dikerjakan.");
      return;
    }
    if (checkedCount === 0) {
      setSubmitError("Periksa minimal satu part sebelum menyimpan kegiatan.");
      return;
    }
    if (jenisPelaksana === "Vendor" && !namaVendor.trim()) {
      setSubmitError("Nama vendor wajib diisi bila dikerjakan oleh vendor.");
      return;
    }
    
    // Pemakaian oli: pilih oli & isi jumlah; stok gudang harus cukup
    const jumlahOliAngka = teksKeAngka(jumlahOli);
    if (pakaiOli) {
      if (!selectedOliId) {
        setSubmitError("Pilih oli yang dipakai.");
        return;
      }
      if (!jumlahOli.trim() || !Number.isFinite(jumlahOliAngka) || jumlahOliAngka <= 0) {
        setSubmitError("Isi jumlah oli yang ditambahkan/diganti.");
        return;
      }
      const oliTerpilih = olis.find((o) => String(o.id) === selectedOliId);
      if (oliTerpilih && jumlahOliAngka > Number(oliTerpilih.stok)) {
        setSubmitError(`Stok oli ${oliTerpilih.nama_oli} tidak mencukupi (sisa ${formatJumlahOli(Number(oliTerpilih.stok))} ${oliTerpilih.satuan}).`);
        return;
      }
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
          waktu_pelaksana: tanggalLokal(),
          paraf: teknisi.trim(),
          jumlah_part_total: parts.length,
          hasil_checklist: hasil,
          jenis_pelaksana: jenisPelaksana,
          nama_vendor: jenisPelaksana === "Vendor" ? namaVendor.trim() : null,
          ...(pakaiOli
            ? { oli_id: Number(selectedOliId), tindakan_oli: tindakanOli, jumlah_oli: jumlahOliAngka }
            : {}),
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
                        width: 28, height: 28, borderRadius: "50%",
                        border: "2px solid #fff", background: bg,
                        color: r && worstOf(r.statuses) === "perlu_perhatian" ? "#000" : "#fff",
                        fontSize: 13, fontWeight: 600, padding: 0,
                      }}
                    >
                      {p.partNumber}
                    </button>
                  );
                })}
              </div>
              <div className="small text-muted mt-2 mb-4">
                Biru = belum diperiksa · Hijau = baik · Kuning = perlu perhatian · Merah = rusak
              </div>

              {dariRencana ? (
                <div className="small mt-3">
                  <span className="fw-semibold">Tindakan:</span> {aksiRencanaLabel ?? "sesuai rencana"}{" "}
                  <span className="text-muted">(mengerjakan rencana, hasilnya otomatis menyelesaikan rencana ini)</span>
                </div>
              ) : (
                <Form.Group className="mt-3" style={{ maxWidth: 320 }}>
                  <Form.Label className="small fw-semibold">Tindakan yang dikerjakan</Form.Label>
                  <Form.Select size="sm" value={aksi} onChange={(e) => setAksi(e.target.value as AksiCode | "")}>
                    <option value="">Pilih tindakan...</option>
                    {AKSI_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </Form.Select>
                </Form.Group>
              )}

              {/* Pemakaian oli mesin: diambil dari Data Oli, stok gudang dipotong otomatis */}
              <div className="mt-4 p-3 border rounded bg-body-tertiary">
                <Form.Check
                  type="switch"
                  id="pakai-oli-mesin"
                  className="small fw-semibold"
                  label={<span className="d-inline-flex align-items-center gap-1"><IconDroplet size={16} /> Ada pemakaian oli (ditambah / diganti)</span>}
                  checked={pakaiOli}
                  onChange={(e) => setPakaiOli(e.target.checked)}
                />
                {!pakaiOli && oliStandar && (
                  <div className="text-muted small mt-1">Oli standar mesin: {oliStandar.kode_oli} - {oliStandar.nama_oli}</div>
                )}
                {pakaiOli && (
                  <>
                    <Row className="g-2 mt-1">
                      <Col md={6}>
                        <Form.Label className="small mb-1">Oli</Form.Label>
                        <Form.Select size="sm" value={selectedOliId} onChange={(e) => setSelectedOliId(e.target.value)}>
                          <option value="">Pilih oli...</option>
                          {olis.map((o) => (
                            <option key={o.id} value={o.id} disabled={Number(o.stok) <= 0}>
                              {o.kode_oli} - {o.nama_oli} (sisa {formatJumlahOli(Number(o.stok))} {o.satuan})
                              {String(o.id) === String(oliStandarId) ? " · standar mesin" : ""}
                            </option>
                          ))}
                        </Form.Select>
                        {olis.length === 0 && (
                          <div className="text-muted mt-1" style={{ fontSize: 12 }}>Belum ada data oli. Tambahkan di halaman Data Oli.</div>
                        )}
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small mb-1">Jumlah{oliTerpilihUi ? ` (${oliTerpilihUi.satuan})` : ""}</Form.Label>
                        <AngkaStepper size="sm" value={jumlahOli} onChange={setJumlahOli} step={0.5} ariaLabel="Jumlah oli" />
                      </Col>
                    </Row>
                    <Form.Label className="small mt-2 mb-1 d-block">Tindakan</Form.Label>
                    <ButtonGroup size="sm">
                      {TINDAKAN_OLI.map((t) => (
                        <Button key={t.value} variant={tindakanOli === t.value ? "primary" : "outline-primary"} onClick={() => setTindakanOli(t.value)}>
                          {t.label}
                        </Button>
                      ))}
                    </ButtonGroup>
                    <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                      {TINDAKAN_OLI.find((t) => t.value === tindakanOli)?.hint} Stok di Data Oli otomatis dikurangi saat kegiatan disimpan.
                    </div>
                  </>
                )}
              </div>

              <Form.Group className="mt-4">
                <Form.Label className="small fw-semibold d-block">Pelaksana pekerjaan</Form.Label>
                <div className="d-flex flex-wrap gap-3">
                  <Form.Check type="radio" id="pelaksana-internal" name="jenis-pelaksana" className="small" label="Internal PLN" checked={jenisPelaksana === "Internal"} onChange={() => setJenisPelaksana("Internal")} />
                  <Form.Check type="radio" id="pelaksana-vendor" name="jenis-pelaksana" className="small" label="Vendor (Pihak Ketiga)" checked={jenisPelaksana === "Vendor"} onChange={() => setJenisPelaksana("Vendor")} />
                </div>
                {jenisPelaksana === "Vendor" && (
                  <Form.Control size="sm" className="mt-2" style={{ maxWidth: 320 }} value={namaVendor} onChange={(e) => setNamaVendor(e.target.value)} placeholder="Nama vendor, mis. PT Mitra Teknik" />
                )}
              </Form.Group>

              <Form.Group className="mt-3" style={{ maxWidth: 320 }}>
                <Form.Label className="small fw-semibold">{jenisPelaksana === "Vendor" ? "Nama teknisi / PIC vendor" : "Nama teknisi"}</Form.Label>
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
              <Button variant="outline-secondary" onClick={handleCloseMain} disabled={submitting}>Batal</Button>
              <Button onClick={handleSubmit} disabled={submitting || checkedCount === 0}>
                {submitting ? <Spinner size="sm" className="me-1" /> : null} Simpan Kegiatan
              </Button>
            </div>
          </Modal.Footer>
        )}
      </Modal>

      {/* Modal Pemeriksaan Part */}
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
              {draftStatuses[item] !== "baik" && (
                <Form.Control as="textarea" rows={2} size="sm" className="mt-2" value={draftCatatan[item] ?? ""} onChange={(e) => setDraftCatatan((prev) => ({ ...prev, [item]: e.target.value }))} placeholder={`Catatan temuan untuk "${item}"...`} />
              )}
            </div>
          ))}

        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setSelectedPart(null)}>Batal</Button>
          <Button onClick={handleSavePart}>Simpan part ini</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}