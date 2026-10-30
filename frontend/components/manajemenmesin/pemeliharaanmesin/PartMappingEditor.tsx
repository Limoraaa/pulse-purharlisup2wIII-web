"use client";
import { v4 as uuid } from "uuid"; // bukan crypto.randomUUID(): itu hanya tersedia di HTTPS/localhost
import { useEffect, useRef, useState } from "react";
import { Button, Form, Table, Alert, Badge, Spinner, Modal, Nav } from "react-bootstrap";
import { IconMapPin, IconPencil, IconTrash, IconPlus, IconPhoto } from "@tabler/icons-react";
import api from "lib/api";
import { useFeedback } from "components/common/FeedbackProvider";
import { normalisasiMapping } from "./PartMappingType";
import type { MachinePart, MachineView, PartMappingPayload } from "./PartMappingType";

interface Props {
  show: boolean;
  onHide: () => void;
  mesinId: number | string;
  mesinNama: string;
  onSaved?: () => void;
}

export default function PartMappingEditor({ show, onHide, mesinId, mesinNama, onSaved }: Props) {
  const { confirm: confirmDialog } = useFeedback();
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // "add" = tambah view baru, "replace" = ganti gambar view yang aktif
  const uploadModeRef = useRef<"add" | "replace">("add");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [views, setViews] = useState<MachineView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [parts, setParts] = useState<MachinePart[]>([]);

  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(null);
  const [partNumber, setPartNumber] = useState("");
  const [partName, setPartName] = useState("");
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [formError, setFormError] = useState("");
  // Part yang sedang diedit (null = form untuk part baru)
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeView = views.find((v) => v.id === activeViewId) ?? null;
  const partsAktif = parts.filter((p) => p.viewId === activeViewId);

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
          const norm = normalisasiMapping(res);
          setViews(norm.views);
          setParts(norm.parts);
          setActiveViewId(norm.views[0]?.id ?? null);
        }
      } catch {
        // Belum ada mapping tersimpan itu wajar untuk mesin baru, jangan blokir UI
        if (!cancelled) {
          setViews([]);
          setParts([]);
          setActiveViewId(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [show, mesinId]);

  const bukaFilePicker = (mode: "add" | "replace") => {
    uploadModeRef.current = mode;
    fileInputRef.current?.click();
  };

  const handleUploadGambar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // agar file yang sama bisa dipilih ulang
    if (!file) return;
    const mode = uploadModeRef.current;
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
      if (mode === "replace" && activeViewId) {
        setViews((prev) => prev.map((v) => (v.id === activeViewId ? { ...v, gambarUrl: res.url } : v)));
        // koordinat lama tidak relevan untuk gambar baru, hanya untuk view ini
        setParts((prev) => prev.filter((p) => p.viewId !== activeViewId));
        resetPartForm();
      } else {
        const baru: MachineView = { id: uuid(), nama: `View ${views.length + 1}`, gambarUrl: res.url };
        setViews((prev) => [...prev, baru]);
        setActiveViewId(baru.id);
        resetPartForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah gambar mesin");
    } finally {
      setUploading(false);
    }
  };

  const pilihView = (id: string) => {
    if (id === activeViewId) return;
    resetPartForm();
    setActiveViewId(id);
  };

  const handleRenameView = (nama: string) => {
    setViews((prev) => prev.map((v) => (v.id === activeViewId ? { ...v, nama } : v)));
  };

  const handleHapusView = async () => {
    if (!activeView) return;
    const jumlah = partsAktif.length;
    const ok = await confirmDialog({
      title: "Hapus view?",
      message: `View "${activeView.nama}" beserta ${jumlah} part di dalamnya akan dihapus dari mapping.`,
      confirmLabel: "Ya, hapus",
      variant: "warning",
    });
    if (!ok) return;
    const sisa = views.filter((v) => v.id !== activeView.id);
    setViews(sisa);
    setParts((prev) => prev.filter((p) => p.viewId !== activeView.id));
    setActiveViewId(sisa[0]?.id ?? null);
    resetPartForm();
  };

  // Nomor part unik per mesin (lintas view): usulkan angka berikutnya
  const nomorBerikutnya = () => {
    const angka = parts.map((p) => parseInt(p.partNumber, 10)).filter((n) => Number.isFinite(n));
    return String((angka.length ? Math.max(...angka) : 0) + 1);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = imgRef.current!.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    // Saat mengedit, klik gambar memindahkan posisi titik part tersebut
    setPendingPoint({ x: xPercent, y: yPercent });
    if (!editingId && !partNumber.trim()) setPartNumber(nomorBerikutnya());
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
  };

  const handleEditPart = (part: MachinePart) => {
    setActiveViewId(part.viewId); // otomatis pindah ke view tempat part ini berada
    setEditingId(part.id);
    setPendingPoint({ x: part.xPercent, y: part.yPercent });
    setPartNumber(part.partNumber);
    setPartName(part.partName);
    setChecklistItems(part.checklistItems);
    setNewItemText("");
    setFormError("");
  };

  const handleAddPart = () => {
    if (!pendingPoint || !activeViewId) return;
    if (!partNumber.trim() || !partName.trim()) {
      setFormError("Nomor part dan nama part wajib diisi.");
      return;
    }
    if (parts.some((p) => p.id !== editingId && p.partNumber === partNumber.trim())) {
      setFormError(`Nomor part ${partNumber.trim()} sudah dipakai di mesin ini (nomor harus unik lintas view).`);
      return;
    }
    if (checklistItems.length === 0) {
      setFormError("Tambahkan minimal satu poin checklist untuk part ini.");
      return;
    }
    // Poin yang masih diketik tapi belum ditekan "Tambah" ikut disimpan
    const items = newItemText.trim() ? [...checklistItems, newItemText.trim()] : checklistItems;
    const dataPart = {
      partNumber: partNumber.trim(),
      partName: partName.trim(),
      checklistItems: items,
      xPercent: pendingPoint.x,
      yPercent: pendingPoint.y,
    };
    if (editingId) {
      // id & viewId dipertahankan agar riwayat checklist yang sudah tersimpan tetap terhubung ke part ini
      setParts((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...dataPart } : p)));
    } else {
      setParts((prev) => [...prev, { id: uuid(), viewId: activeViewId, ...dataPart }]);
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
        // gambarUrl = view pertama, supaya konsumen lama (yang belum paham views) tetap jalan
        body: JSON.stringify({ gambarUrl: views[0]?.gambarUrl ?? null, views, parts }),
      });
      onSaved?.();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan mapping part");
    } finally {
      setSaving(false);
    }
  };

  const namaView = (viewId: string) => views.find((v) => v.id === viewId)?.nama ?? "-";

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static" scrollable>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2">
          <IconMapPin size={18} /> Peta Part &amp; Checklist — {mesinNama}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

        {/* Input file tunggal dipakai untuk tambah view maupun ganti gambar */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUploadGambar} style={{ display: "none" }} />

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" className="me-2" /> Memuat mapping...
          </div>
        ) : views.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-muted small mb-2">
              Unggah gambar mesin dulu untuk mulai memetakan part. Untuk mesin besar, Anda bisa menambah beberapa view
              (tampak depan, area kerja, panel kontrol, dst.).
            </div>
            <Button size="sm" onClick={() => bukaFilePicker("add")} disabled={uploading}>
              {uploading ? <Spinner size="sm" className="me-1" /> : <IconPhoto size={14} className="me-1" />}
              Unggah gambar pertama
            </Button>
          </div>
        ) : (
          <>
            {/* Tab view */}
            <Nav variant="tabs" className="mb-3 flex-nowrap overflow-auto">
              {views.map((v) => (
                <Nav.Item key={v.id}>
                  <Nav.Link
                    as="button"
                    type="button"
                    active={v.id === activeViewId}
                    onClick={() => pilihView(v.id)}
                    className="text-nowrap small py-2"
                  >
                    {v.nama}{" "}
                    <Badge bg={v.id === activeViewId ? "primary" : "secondary"} pill>
                      {parts.filter((p) => p.viewId === v.id).length}
                    </Badge>
                  </Nav.Link>
                </Nav.Item>
              ))}
              <Nav.Item className="ms-1">
                <Button size="sm" variant="outline-primary" className="my-1 text-nowrap" onClick={() => bukaFilePicker("add")} disabled={uploading}>
                  {uploading && uploadModeRef.current === "add" ? <Spinner size="sm" className="me-1" /> : <IconPlus size={14} className="me-1" />}
                  Tambah view
                </Button>
              </Nav.Item>
            </Nav>

            {/* Pengaturan view aktif */}
            {activeView && (
              <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <Form.Control
                  size="sm"
                  value={activeView.nama}
                  onChange={(e) => handleRenameView(e.target.value)}
                  placeholder="Nama view, mis. Area kerja"
                  style={{ maxWidth: 240 }}
                />
                <Button size="sm" variant="outline-secondary" onClick={() => bukaFilePicker("replace")} disabled={uploading}>
                  {uploading && uploadModeRef.current === "replace" ? <Spinner size="sm" className="me-1" /> : <IconPhoto size={14} className="me-1" />}
                  Ganti gambar
                </Button>
                <Button size="sm" variant="outline-danger" onClick={handleHapusView}>
                  <IconTrash size={14} className="me-1" /> Hapus view
                </Button>
                <span className="text-muted" style={{ fontSize: 12 }}>
                  Ganti gambar hanya menghapus part pada view ini.
                </span>
              </div>
            )}

            {activeView && (
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
                      src={activeView.gambarUrl}
                      alt={`${mesinNama} - ${activeView.nama}`}
                      onClick={handleImageClick}
                      style={{ maxWidth: "100%", maxHeight: "60vh", cursor: "crosshair", display: "block" }}
                    />
                    {partsAktif.map((p) => (
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
                    <h6 className="fs-6">
                      {editingId ? `Edit part ${partNumber}` : "Detail part baru"}{" "}
                      <span className="text-muted fw-normal small">· view {activeView.nama}</span>
                    </h6>
                    {formError && <Alert variant="danger" className="py-2 small">{formError}</Alert>}

                    <Form.Group className="mb-2">
                      <Form.Label className="small">Nomor part (unik per mesin)</Form.Label>
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
              </>
            )}

            {/* Tabel menampilkan semua part dari semua view */}
            <Table size="sm" className="mt-3" bordered>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama part</th>
                  <th>View</th>
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
                      <Badge bg={p.viewId === activeViewId ? "primary" : "light"} text={p.viewId === activeViewId ? undefined : "dark"} className="border">
                        {namaView(p.viewId)}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg="secondary" className="mb-1">{p.checklistItems.length} poin</Badge>
                      <ul className="mb-0 ps-3 small text-secondary">
                        {p.checklistItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
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
      </Modal.Body>
      <Modal.Footer>
        <span className="text-muted small me-auto">Perubahan baru tersimpan setelah klik &quot;Simpan mapping&quot;.</span>
        <Button variant="outline-secondary" onClick={onHide} disabled={saving}>
          Batal
        </Button>
        <Button onClick={handleSaveMapping} disabled={saving || loading || views.length === 0}>
          {saving ? <Spinner size="sm" className="me-1" /> : null}
          Simpan mapping
        </Button>
      </Modal.Footer>
    </Modal>
  );
}