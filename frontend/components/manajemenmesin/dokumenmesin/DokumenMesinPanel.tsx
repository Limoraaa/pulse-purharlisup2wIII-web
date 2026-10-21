'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { IconEye, IconFileTypePdf, IconRefresh, IconTrash, IconUpload } from '@tabler/icons-react';
import api from 'lib/api';
import PdfViewerModal from './PdfViewerModal';

export type JenisDokumen = 'ik_operasional' | 'ik_pemeliharaan' | 'hirarc';

interface DokumenItem {
  id: number;
  jenis: JenisDokumen;
  judul: string;
  nomor_dokumen: string | null;
  revisi: string | null;
  ukuran: number;
  diunggah_oleh: string | null;
  diperbarui: string;
}

interface DokumenMesinPanelProps {
  jenis: JenisDokumen;
  // Tidak dipakai untuk HIRARC (satu dokumen untuk semua mesin)
  mesinId?: number | string;
  canManage: boolean;
  icon: React.ElementType;
  title: string;
  keterangan: string;
}

const MAKS_UKURAN = 10 * 1024 * 1024; // 10MB, sama dengan validasi backend

const formatUkuran = (byte: number) =>
  byte >= 1024 * 1024 ? `${(byte / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(byte / 1024))} KB`;

const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Panel dokumen rahasia (IK Operasional, IK Pemeliharaan, HIRARC).
 * Satu dokumen PDF per jenis; hanya bisa dilihat di aplikasi, tidak bisa diunduh.
 * Kelola penuh: upload, ganti, hapus. Lihat saja: hanya melihat.
 */
export default function DokumenMesinPanel({ jenis, mesinId, canManage, icon: Icon, title, keterangan }: DokumenMesinPanelProps) {
  const key = jenis === 'hirarc' ? `/dokumen-mesin?jenis=hirarc` : `/dokumen-mesin?jenis=${jenis}&mesin_id=${mesinId}`;
  const { data: dokumen, error, isLoading, mutate } = useSWR<DokumenItem | null>(
    jenis === 'hirarc' || mesinId ? key : null,
    async (url: string) => (await api<{ data: DokumenItem | null }>(url)).data
  );

  const [showViewer, setShowViewer] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [confirmHapus, setConfirmHapus] = useState(false);
  const [menghapus, setMenghapus] = useState(false);
  const [aksiError, setAksiError] = useState<string | null>(null);

  const handleHapus = async () => {
    if (!dokumen) return;
    setMenghapus(true);
    setAksiError(null);
    try {
      await api(`/dokumen-mesin/${dokumen.id}`, { method: 'DELETE' });
      setConfirmHapus(false);
      await mutate(null, { revalidate: false });
    } catch (e) {
      setAksiError(e instanceof Error ? e.message : 'Dokumen gagal dihapus.');
    } finally {
      setMenghapus(false);
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
            <Icon size={18} className="text-primary" /> {title}
          </h6>
          <div className="small text-secondary">{keterangan}</div>
        </div>
      </div>

      {aksiError && (
        <Alert variant="danger" className="py-2 small" dismissible onClose={() => setAksiError(null)}>
          {aksiError}
        </Alert>
      )}

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="sm" />
        </div>
      ) : error ? (
        <Alert variant="danger" className="small d-flex justify-content-between align-items-center">
          <span>{error.message || 'Dokumen gagal dimuat.'}</span>
          <Button size="sm" variant="outline-danger" onClick={() => mutate()}>Muat ulang</Button>
        </Alert>
      ) : !dokumen ? (
        <div className="text-center py-5 border rounded-3 bg-light">
          <IconFileTypePdf size={36} className="mb-2 opacity-50" />
          <p className="fw-semibold mb-1">Belum ada dokumen</p>
          <p className="small text-secondary mb-3">
            {canManage ? 'Upload file PDF untuk ditampilkan di sini.' : 'Dokumen belum diunggah oleh pengelola.'}
          </p>
          {canManage && (
            <Button size="sm" variant="primary" className="d-inline-flex align-items-center gap-1" onClick={() => setShowUpload(true)}>
              <IconUpload size={16} /> Upload Dokumen
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-3 p-3 d-flex flex-wrap align-items-center gap-3">
          <IconFileTypePdf size={40} className="text-danger flex-shrink-0" />
          <div className="flex-grow-1" style={{ minWidth: 200 }}>
            <div className="fw-semibold text-dark">{dokumen.judul}</div>
            <div className="small text-secondary">
              {[dokumen.nomor_dokumen, dokumen.revisi && `Rev. ${dokumen.revisi}`].filter(Boolean).join(' · ') || 'Tanpa nomor dokumen'}
            </div>
            <div className="small text-muted">
              {formatUkuran(dokumen.ukuran)} · diunggah {formatTanggal(dokumen.diperbarui)}
              {dokumen.diunggah_oleh ? ` oleh ${dokumen.diunggah_oleh}` : ''}
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button size="sm" variant="primary" className="d-inline-flex align-items-center gap-1" onClick={() => setShowViewer(true)}>
              <IconEye size={16} /> Lihat
            </Button>
            {canManage &&
              (confirmHapus ? (
                <>
                  <Button size="sm" variant="danger" onClick={handleHapus} disabled={menghapus}>
                    {menghapus ? 'Menghapus...' : 'Ya, hapus'}
                  </Button>
                  <Button size="sm" variant="light" className="border" onClick={() => setConfirmHapus(false)} disabled={menghapus}>
                    Batal
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline-primary" className="d-inline-flex align-items-center gap-1" onClick={() => setShowUpload(true)}>
                    <IconRefresh size={16} /> Ganti
                  </Button>
                  <Button size="sm" variant="outline-danger" className="d-inline-flex align-items-center gap-1" onClick={() => setConfirmHapus(true)}>
                    <IconTrash size={16} /> Hapus
                  </Button>
                </>
              ))}
          </div>
        </div>
      )}

      <PdfViewerModal show={showViewer} onHide={() => setShowViewer(false)} dokumenId={dokumen?.id ?? null} judul={dokumen?.judul ?? title} />

      {canManage && (
        <UploadDokumenModal
          show={showUpload}
          onHide={() => setShowUpload(false)}
          jenis={jenis}
          mesinId={mesinId}
          title={title}
          awal={dokumen ?? null}
          onSaved={async (baru) => {
            setShowUpload(false);
            await mutate(baru, { revalidate: false });
          }}
        />
      )}
    </div>
  );
}

interface UploadDokumenModalProps {
  show: boolean;
  onHide: () => void;
  jenis: JenisDokumen;
  mesinId?: number | string;
  title: string;
  awal: DokumenItem | null;
  onSaved: (dokumen: DokumenItem) => void;
}

function UploadDokumenModal({ show, onHide, jenis, mesinId, title, awal, onSaved }: UploadDokumenModalProps) {
  const [judul, setJudul] = useState('');
  const [nomor, setNomor] = useState('');
  const [revisi, setRevisi] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Isi ulang form setiap modal dibuka (saat "Ganti", data lama dijadikan nilai awal)
  const handleEnter = () => {
    setJudul(awal?.judul ?? '');
    setNomor(awal?.nomor_dokumen ?? '');
    setRevisi(awal?.revisi ?? '');
    setFile(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setFormError('Pilih file PDF terlebih dahulu.');
    if (file.type !== 'application/pdf') return setFormError('File harus berformat PDF.');
    if (file.size > MAKS_UKURAN) return setFormError('Ukuran file maksimal 10 MB.');

    const form = new FormData();
    form.append('jenis', jenis);
    if (jenis !== 'hirarc' && mesinId !== undefined) form.append('mesin_id', String(mesinId));
    form.append('judul', judul.trim());
    if (nomor.trim()) form.append('nomor_dokumen', nomor.trim());
    if (revisi.trim()) form.append('revisi', revisi.trim());
    form.append('file', file);

    setSaving(true);
    setFormError(null);
    try {
      const res = await api<{ data: DokumenItem }>('/dokumen-mesin', { method: 'POST', body: form });
      onSaved(res.data);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Dokumen gagal disimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} onEnter={handleEnter} centered contentClassName="border-0 rounded-4">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-5">{awal ? `Ganti ${title}` : `Upload ${title}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger" className="py-2 small">{formError}</Alert>}
          {awal && (
            <Alert variant="warning" className="py-2 small">
              Dokumen lama akan diganti dengan file yang baru diunggah.
            </Alert>
          )}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">Judul dokumen</Form.Label>
            <Form.Control
              required
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Instruksi Kerja Operasional Mesin Laser Welding"
            />
          </Form.Group>
          <div className="row g-2 mb-3">
            <div className="col-7">
              <Form.Label className="fw-semibold small">Nomor dokumen</Form.Label>
              <Form.Control value={nomor} onChange={(e) => setNomor(e.target.value)} placeholder="Contoh: IK.042.UP3" />
            </div>
            <div className="col-5">
              <Form.Label className="fw-semibold small">Revisi</Form.Label>
              <Form.Control value={revisi} onChange={(e) => setRevisi(e.target.value)} placeholder="Contoh: 01" />
            </div>
          </div>
          <Form.Group>
            <Form.Label className="fw-semibold small">File PDF</Form.Label>
            <Form.Control
              type="file"
              accept="application/pdf"
              required
              onChange={(e) => setFile((e.target as HTMLInputElement).files?.[0] ?? null)}
            />
            <Form.Text className="text-secondary">Format PDF, maksimal 10 MB.</Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" type="button" onClick={onHide} disabled={saving}>Batal</Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? 'Mengunggah...' : 'Simpan'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
