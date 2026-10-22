"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Form, Table, Alert, Badge, Spinner, Modal, Row, Col } from "react-bootstrap";
import { IconDroplet, IconMapPin, IconPencil, IconTrash } from "@tabler/icons-react";
import api from "lib/api";
import AngkaStepper, { angkaKeTeks, teksKeAngka } from "components/common/AngkaStepper";
import { JENIS_OLI, SATUAN_OLI, formatJumlahOli, labelOli } from "./PartMappingType";
import type { MachinePart, OliSpec, PartMappingPayload } from "./PartMappingType";

// Isian form oli (opsional) untuk satu part
interface OliForm {
  merek: string;
  jenis: string; // salah satu JENIS_OLI, atau "lainnya"
  jenisLain: string;
  kode: string;
  kapasitas: string; // kosong = tidak diisi
  satuan: string;
}
const OLI_KOSONG: OliForm = { merek: "", jenis: "", jenisLain: "", kode: "", kapasitas: "", satuan: "Liter" };
const JENIS_LAINNYA = "lainnya";

const oliKeForm = (o: OliSpec): OliForm => {
  const dikenal = JENIS_OLI.includes(o.jenis);
  return {
    merek: o.merek,
    jenis: dikenal ? o.jenis : JENIS_LAINNYA,
    jenisLain: dikenal ? "" : o.jenis,
    kode: o.kode,
    kapasitas: o.kapasitas ? angkaKeTeks(o.kapasitas) : "",
    satuan: o.satuan || "Liter",
  };
};

interface Props {
  show: boolean;
  onHide: () => void;
  mesinId: number | string;
  mesinNama: string;
  onSaved?: () => void;
}

export default function PartMappingEditor({ show, onHide, mesinId, mesinNama, onSaved }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [gambarUrl, setGambarUrl] = useState<string | null>(null);
  const [parts, setParts] = useState<MachinePart[]>([]);

  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(null);
  const [partNumber, setPartNumber] = useState("");
  const [partName, setPartName] = useState("");
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [formError, setFormError] = useState("");
  const [pakaiOli, setPakaiOli] = useState(false);
  const [oli, setOli] = useState<OliForm>(OLI_KOSONG);
  // Part yang sedang diedit (null = form untuk part baru)
  const [editingId, setEditingId] = useState<string | null>(null);

  // Muat mapping yang sudah ada untuk mesin ini
  useEffect(() => {
    if (!show) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      // Mulai bersih setiap editor dibuka
      setEditingId(null);
      setPendingPoint(null);
      try {
        const token = localStorage.getItem("token");
        const res = await api<PartMappingPayload>(`/mesin-produksi/${mesinId}/part-mapping`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) {
          setGambarUrl(res?.gambarUrl ?? null);
          setParts(res?.parts ?? []);
        }
      } catch {
        // Belum ada mapping tersimpan itu wajar untuk mesin baru, jangan blokir UI
        if (!cancelled) {
          setGambarUrl(null);
          setParts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [show, mesinId]);

  const handleUploadGambar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("gambar", file);
      const res = await api<{ url: string }>(`/mesin-produksi/${mesinId}/upload-gambar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      setGambarUrl(res.url);
      setParts([]); // koordinat lama tidak relevan untuk gambar baru
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah gambar mesin");
    } finally {
      setUploading(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = imgRef.current!.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    // Saat mengedit, klik gambar memindahkan posisi titik part tersebut
    setPendingPoint({ x: xPercent, y: yPercent });
    setFormError("");
  };

  const handleAddChecklistItem = () => {
    if (!newItemText.trim()) return;
    setChecklistItems((prev) => [...prev, newItemText.trim()]);
    setNewItemText("");
  };

  const handleRemoveChecklistItem = (idx: number) => {
    setChecklistItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetPartForm = () => {
    setEditingId(null);
    setPendingPoint(null);
    setPartNumber("");
    setPartName("");
    setChecklistItems([]);
    setNewItemText("");
    setFormError("");
    setPakaiOli(false);
    setOli(OLI_KOSONG);
  };

  const handleEditPart = (part: MachinePart) => {
    setEditingId(part.id);
    setPendingPoint({ x: part.xPercent, y: part.yPercent });
    setPartNumber(part.partNumber);
    setPartName(part.partName);
    setChecklistItems(part.checklistItems);
    setNewItemText("");
    setFormError("");
    setPakaiOli(!!part.oli);
    setOli(part.oli ? oliKeForm(part.oli) : OLI_KOSONG);
  };

  const ubahOli = (field: keyof OliForm, value: string) => setOli((prev) => ({ ...prev, [field]: value }));

  const handleAddPart = () => {
    if (!pendingPoint) return;
    if (!partNumber.trim() || !partName.trim()) {
      setFormError("Nomor part dan nama part wajib diisi.");
      return;
    }
    if (checklistItems.length === 0) {
      setFormError("Tambahkan minimal satu poin checklist untuk part ini.");
      return;
    }
    // Oli opsional: kalau dinyalakan, merek, jenis & kode wajib diisi
    let oliSpec: OliSpec | null = null;
    if (pakaiOli) {
      const jenis = oli.jenis === JENIS_LAINNYA ? oli.jenisLain.trim() : oli.jenis;
      if (!oli.merek.trim() || !jenis || !oli.kode.trim()) {
        setFormError("Lengkapi merek, jenis, dan kode oli, atau matikan pilihan oli.");
        return;
      }
      const kapasitas = oli.kapasitas.trim() ? teksKeAngka(oli.kapasitas) : null;
      if (kapasitas !== null && (!Number.isFinite(kapasitas) || kapasitas <= 0)) {
        setFormError("Kapasitas oli harus lebih dari 0, atau kosongkan.");
        return;
      }
      oliSpec = { merek: oli.merek.trim(), jenis, kode: oli.kode.trim(), kapasitas, satuan: kapasitas ? oli.satuan : null };
    }
    // Poin yang masih diketik tapi belum ditekan "Tambah" ikut disimpan
    const items = newItemText.trim() ? [...checklistItems, newItemText.trim()] : checklistItems;
    const dataPart = {
      oli: oliSpec,
      partNumber: partNumber.trim(),
      partName: partName.trim(),
      checklistItems: items,
      xPercent: pendingPoint.x,
      yPercent: pendingPoint.y,
    };
    if (editingId) {
      // id dipertahankan agar riwayat checklist yang sudah tersimpan tetap terhubung ke part ini
      setParts((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...dataPart } : p)));
    } else {
      setParts((prev) => [...prev, { id: crypto.randomUUID(), ...dataPart }]);
    }
    resetPartForm();
  };

  const handleRemovePart = (id: string) => {
    setParts((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) resetPartForm();
  };

  const handleSaveMapping = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      await api(`/mesin-produksi/${mesinId}/part-mapping`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gambarUrl, parts }),
      });
      onSaved?.();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan mapping part");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static" scrollable>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2">
          <IconMapPin size={18} /> Peta Part &amp; Checklist — {mesinNama}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" className="me-2" /> Memuat mapping...
          </div>
        ) : (
          <>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Gambar mesin</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={handleUploadGambar} disabled={uploading} />
              {uploading && (
                <div className="small text-muted mt-1">
                  <Spinner animation="border" size="sm" className="me-1" /> Mengunggah...
                </div>
              )}
              {gambarUrl && (
                <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                  Ganti gambar akan menghapus mapping part yang sudah ada (koordinat lama tidak relevan).
                </div>
              )}
            </Form.Group>

            {!gambarUrl ? (
              <div className="text-muted small">Unggah gambar mesin dulu untuk mulai memetakan part.</div>
            ) : (
              <>
                <p className="text-muted small mb-2">
                  {editingId
                    ? "Klik pada gambar untuk memindahkan posisi part yang sedang diedit."
                    : "Klik pada gambar untuk menandai posisi part baru, atau klik titik merah untuk mengedit part."}
                </p>
                <div className="text-center">
                <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
                  <img
                    ref={imgRef}
                    src={gambarUrl}
                    alt={mesinNama}
                    onClick={handleImageClick}
                    style={{ maxWidth: "100%", maxHeight: "60vh", cursor: "crosshair", display: "block" }}
                  />
                  {parts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      title={`${p.partNumber} - ${p.partName} (klik untuk edit)`}
                      onClick={() => handleEditPart(p)}
                      style={{
                        position: "absolute",
                        left: `${p.xPercent}%`,
                        top: `${p.yPercent}%`,
                        transform: "translate(-50%, -50%)",
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        border: "2px solid #fff",
                        background: p.id === editingId ? "#6c757d" : "#dc3545",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        padding: 0,
                      }}
                    >
                      {p.partNumber}
                    </button>
                  ))}
                  {pendingPoint && (
                    <span
                      style={{
                        position: "absolute",
                        left: `${pendingPoint.x}%`,
                        top: `${pendingPoint.y}%`,
                        transform: "translate(-50%, -50%)",
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        border: "2px dashed #FFC20E",
                        background: "rgba(255,194,14,0.2)",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>
                </div>

                {pendingPoint && (
                  <div className="border rounded p-3 mt-3">
                    <h6 className="fs-6">{editingId ? `Edit part ${partNumber}` : "Detail part baru"}</h6>
                    {formError && <Alert variant="danger" className="py-2 small">{formError}</Alert>}

                    <Form.Group className="mb-2">
                      <Form.Label className="small">Nomor part</Form.Label>
                      <Form.Control size="sm" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label className="small">Nama part</Form.Label>
                      <Form.Control size="sm" value={partName} onChange={(e) => setPartName(e.target.value)} />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label className="small">Poin checklist</Form.Label>
                      {checklistItems.length > 0 && (
                        <ul className="list-group mb-2">
                          {checklistItems.map((item, idx) => (
                            <li key={idx} className="list-group-item d-flex justify-content-between align-items-center py-1">
                              <span style={{ fontSize: 13 }}>{item}</span>
                              <Button size="sm" variant="link" className="text-danger p-0" onClick={() => handleRemoveChecklistItem(idx)}>
                                <IconTrash size={14} />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="d-flex gap-2">
                        <Form.Control
                          size="sm"
                          value={newItemText}
                          onChange={(e) => setNewItemText(e.target.value)}
                          placeholder="Tulis poin checklist lalu Enter"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddChecklistItem();
                            }
                          }}
                        />
                        <Button size="sm" variant="outline-secondary" onClick={handleAddChecklistItem}>
                          Tambah
                        </Button>
                      </div>
                    </Form.Group>

                    {/* Oli/pelumas: opsional, hanya untuk part yang memakai oli */}
                    <div className="border rounded p-2 mb-2 bg-body-tertiary">
                      <Form.Check
                        type="switch"
                        id="pakai-oli"
                        className="small fw-semibold"
                        label="Part ini menggunakan oli/pelumas"
                        checked={pakaiOli}
                        onChange={(e) => setPakaiOli(e.target.checked)}
                      />
                      {pakaiOli && (
                        <Row className="g-2 mt-1">
                          <Col sm={4}>
                            <Form.Label className="small mb-1">Merek oli</Form.Label>
                            <Form.Control size="sm" value={oli.merek} onChange={(e) => ubahOli("merek", e.target.value)} placeholder="Contoh: Shell" />
                          </Col>
                          <Col sm={4}>
                            <Form.Label className="small mb-1">Jenis oli</Form.Label>
                            <Form.Select size="sm" value={oli.jenis} onChange={(e) => ubahOli("jenis", e.target.value)}>
                              <option value="">Pilih jenis...</option>
                              {JENIS_OLI.map((j) => <option key={j} value={j}>{j}</option>)}
                              <option value={JENIS_LAINNYA}>Lainnya…</option>
                            </Form.Select>
                            {oli.jenis === JENIS_LAINNYA && (
                              <Form.Control size="sm" className="mt-1" value={oli.jenisLain} onChange={(e) => ubahOli("jenisLain", e.target.value)} placeholder="Tulis jenis oli" />
                            )}
                          </Col>
                          <Col sm={4}>
                            <Form.Label className="small mb-1">Kode oli</Form.Label>
                            <Form.Control size="sm" value={oli.kode} onChange={(e) => ubahOli("kode", e.target.value)} placeholder="Contoh: AX7" />
                          </Col>
                          <Col sm={6}>
                            <Form.Label className="small mb-1">Kapasitas standar <span className="text-muted">(opsional)</span></Form.Label>
                            <AngkaStepper size="sm" value={oli.kapasitas} onChange={(v) => ubahOli("kapasitas", v)} step={0.5} ariaLabel="Kapasitas oli" />
                          </Col>
                          <Col sm={6}>
                            <Form.Label className="small mb-1">Satuan</Form.Label>
                            <Form.Select size="sm" value={oli.satuan} onChange={(e) => ubahOli("satuan", e.target.value)}>
                              {SATUAN_OLI.map((s) => <option key={s} value={s}>{s}</option>)}
                            </Form.Select>
                          </Col>
                        </Row>
                      )}
                    </div>

                    <div className="d-flex gap-2 mt-2">
                      <Button size="sm" onClick={handleAddPart}>
                        {editingId ? "Simpan perubahan part" : "Simpan titik part"}
                      </Button>
                      <Button size="sm" variant="outline-secondary" onClick={resetPartForm}>
                        Batal
                      </Button>
                    </div>
                  </div>
                )}

                <Table size="sm" className="mt-3" bordered>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama part</th>
                      <th>Poin checklist</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((p) => (
                      <tr key={p.id} className={p.id === editingId ? "table-active" : undefined}>
                        <td>{p.partNumber}</td>
                        <td>{p.partName}</td>
                        <td>
                          <Badge bg="secondary" className="mb-1">{p.checklistItems.length} poin</Badge>
                          <ul className="mb-0 ps-3 small text-secondary">
                            {p.checklistItems.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                          {p.oli && (
                            <div className="small mt-1 d-flex align-items-center gap-1 text-primary">
                              <IconDroplet size={14} /> {labelOli(p.oli)}
                              {p.oli.kapasitas ? ` (standar ${formatJumlahOli(p.oli.kapasitas)} ${p.oli.satuan ?? ""})` : ""}
                            </div>
                          )}
                        </td>
                        <td className="text-nowrap">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            className="me-1"
                            title="Edit part & poin checklist"
                            onClick={() => handleEditPart(p)}
                          >
                            <IconPencil size={12} />
                          </Button>
                          <Button size="sm" variant="outline-danger" title="Hapus part" onClick={() => handleRemovePart(p.id)}>
                            <IconTrash size={12} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <span className="text-muted small me-auto">Perubahan baru tersimpan setelah klik &quot;Simpan mapping&quot;.</span>
        <Button variant="outline-secondary" onClick={onHide} disabled={saving}>
          Batal
        </Button>
        <Button onClick={handleSaveMapping} disabled={saving || loading || !gambarUrl}>
          {saving ? <Spinner size="sm" className="me-1" /> : null}
          Simpan mapping
        </Button>
      </Modal.Footer>
    </Modal>
  );
}