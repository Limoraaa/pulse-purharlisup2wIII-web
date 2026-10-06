"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Form, Table, Alert, Badge, Spinner, Modal } from "react-bootstrap";
import { IconMapPin, IconTrash } from "@tabler/icons-react";
import api from "lib/api";
import type { MachinePart, PartMappingPayload } from "./PartMappingType";

interface Props {
  show: boolean;
  onHide: () => void;
  mesinId: number | string;
  mesinNama: string;
  onSaved?: () => void;
}

export default function PartMappingEditorMotor({ show, onHide, mesinId, mesinNama, onSaved }: Props) {
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

  useEffect(() => {
    if (!show) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await api<PartMappingPayload>(`/motor-konversi/${mesinId}/part-mapping`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) {
          setGambarUrl(res?.gambarUrl ?? null);
          setParts(res?.parts ?? []);
        }
      } catch (err) {
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
      const res = await api<{ url: string }>(`/motor-konversi/${mesinId}/upload-gambar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      setGambarUrl(res.url);
      setParts([]); 
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah gambar motor");
    } finally {
      setUploading(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = imgRef.current!.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
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
    setPendingPoint(null);
    setPartNumber("");
    setPartName("");
    setChecklistItems([]);
    setNewItemText("");
    setFormError("");
  };

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
    const newPart: MachinePart = {
      id: crypto.randomUUID(),
      partNumber: partNumber.trim(),
      partName: partName.trim(),
      checklistItems,
      xPercent: pendingPoint.x,
      yPercent: pendingPoint.y,
    };
    setParts((prev) => [...prev, newPart]);
    resetPartForm();
  };

  const handleRemovePart = (id: string) => {
    setParts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveMapping = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      await api(`/motor-konversi/${mesinId}/part-mapping`, {
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
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
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
              <Form.Label className="small fw-semibold">Gambar Motor</Form.Label>
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
              <div className="text-muted small">Unggah gambar motor dulu untuk mulai memetakan part.</div>
            ) : (
              <>
                <p className="text-muted small mb-2">Klik pada gambar untuk menandai posisi part.</p>
                <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
                  <img
                    ref={imgRef}
                    src={gambarUrl}
                    alt={mesinNama}
                    onClick={handleImageClick}
                    style={{ maxWidth: "100%", cursor: "crosshair", display: "block" }}
                  />
                  {parts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      title={`${p.partNumber} - ${p.partName} (klik untuk hapus)`}
                      onClick={() => handleRemovePart(p.id)}
                      style={{
                        position: "absolute",
                        left: `${p.xPercent}%`,
                        top: `${p.yPercent}%`,
                        transform: "translate(-50%, -50%)",
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        border: "2px solid #fff",
                        background: "#dc3545",
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

                {pendingPoint && (
                  <div className="border rounded p-3 mt-3">
                    <h6 className="fs-6">Detail part baru</h6>
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

                    <div className="d-flex gap-2 mt-2">
                      <Button size="sm" onClick={handleAddPart}>
                        Simpan titik part
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
                      <tr key={p.id}>
                        <td>{p.partNumber}</td>
                        <td>{p.partName}</td>
                        <td>
                          <Badge bg="secondary">{p.checklistItems.length} poin</Badge>
                        </td>
                        <td>
                          <Button size="sm" variant="outline-danger" onClick={() => handleRemovePart(p.id)}>
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