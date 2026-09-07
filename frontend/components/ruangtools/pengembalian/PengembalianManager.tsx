"use client";
// import node module libraries
import { useEffect, useState } from "react";
import { Row, Col, Alert, Spinner } from "react-bootstrap";
import { IconCircleCheck } from "@tabler/icons-react";
import { createLaporanKerusakan } from "services/laporanKerusakanService";

// import custom types
import { PeminjamanAktifItemType } from "types/DataToolsTypes";

// import services
import { getPeminjamanAktif, tandaiDikembalikan } from "services/peminjamanService";
import { getPemintaAktif } from "services/pemintaService";

// import custom components
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import PengembalianScanForm from "components/ruangtools/pengembalian/PengembalianScanForm";
import PengembalianChecklist, {
  PengembalianBatchItem,
  PengembalianGroupItem,
} from "components/ruangtools/pengembalian/PengembalianChecklist";

const PengembalianManager = () => {
  const [items, setItems] = useState<PeminjamanAktifItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ---- State alur scan ----
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [namaPeminjamAktif, setNamaPeminjamAktif] = useState<string | null>(null);
  const [itemsPeminjam, setItemsPeminjam] = useState<PengembalianGroupItem[] | null>(null);
  const [recordsByGroup, setRecordsByGroup] = useState<Record<string, PeminjamanAktifItemType[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPeminjamanAktif();
      setItems(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat data peminjaman aktif";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ---- Scan kartu peminjam ----
  const handleScan = async (idCard: string) => {
    setScanning(true);
    setScanError(null);
    try {
      const pemintaAktif = await getPemintaAktif();
      const peminta = pemintaAktif.find((p) => p.id === idCard);

      if (!peminta) {
        setScanError("Kartu tidak dikenali atau peminjam tidak aktif.");
        return;
      }

      const milikPeminjamIni = items.filter((item) => item.peminjamId === idCard);

      if (milikPeminjamIni.length === 0) {
        setScanError(`${peminta.nama} tidak sedang meminjam alat apa pun.`);
        return;
      }

      // Gabungkan alat yang sama (dipinjam di transaksi berbeda) jadi 1 baris
      // untuk tampilan, tapi simpan record aslinya untuk alokasi saat submit.
      const grouped: PengembalianGroupItem[] = [];
      const records: Record<string, PeminjamanAktifItemType[]> = {};

      milikPeminjamIni.forEach((item) => {
        if (!records[item.toolId]) {
          records[item.toolId] = [];
          grouped.push({
            id: item.toolId,
            toolId: item.toolId,
            kodeBarang: item.kodeBarang,
            namaBarang: item.namaBarang,
            jumlah: 0,
          });
        }
        records[item.toolId].push(item);
        const g = grouped.find((g) => g.id === item.toolId)!;
        g.jumlah += item.jumlah;
      });

      // Data dari API terurut terbaru->terlama; balik urutan tiap grup
      // supaya alokasi pengembalian FIFO (transaksi terlama duluan).
      Object.keys(records).forEach((toolId) => {
        records[toolId].reverse();
      });

      setNamaPeminjamAktif(peminta.nama);
      setItemsPeminjam(grouped);
      setRecordsByGroup(records);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memverifikasi kartu";
      setScanError(message);
    } finally {
      setScanning(false);
    }
  };

    const handleBackToScan = () => {
    setNamaPeminjamAktif(null);
    setItemsPeminjam(null);
    setRecordsByGroup({});
    setScanError(null);
  };

  // ---- Submit pengembalian sekaligus ----
    const handleBatchSubmit = async (batch: PengembalianBatchItem[]) => {
    setSubmitting(true);
    try {
      const dicatatOleh = localStorage.getItem("userId");

      for (const item of batch) {
        const records = recordsByGroup[item.id] || [];

        let sisaDikembalikan = item.jumlahDikembalikan;
        let poolBisaDiperbaiki = item.kerusakan.find((k) => k.jenisKerusakan === "bisa_diperbaiki")?.jumlah ?? 0;
        let poolRusakPermanen = item.kerusakan.find((k) => k.jenisKerusakan === "rusak_permanen")?.jumlah ?? 0;
        const catatanBisaDiperbaiki = item.kerusakan.find((k) => k.jenisKerusakan === "bisa_diperbaiki")?.catatan ?? "";
        const catatanRusakPermanen = item.kerusakan.find((k) => k.jenisKerusakan === "rusak_permanen")?.catatan ?? "";

        // Alokasikan ke transaksi peminjaman asli, mulai dari yang paling
        // lama (FIFO), sampai jumlahDikembalikan terpenuhi.
        for (const record of records) {
          if (sisaDikembalikan <= 0) break;

          const ambil = Math.min(record.jumlah, sisaDikembalikan);
          await tandaiDikembalikan(record.id, ambil);

          let terpakai = 0;
          const ambilBisaDiperbaiki = Math.min(poolBisaDiperbaiki, ambil);
          if (ambilBisaDiperbaiki > 0) {
            if (!dicatatOleh) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
            await createLaporanKerusakan({
              tanggal: new Date().toISOString(),
              tool_id: item.toolId,
              peminjaman_id: record.id,
              jumlah: ambilBisaDiperbaiki,
              keterangan: catatanBisaDiperbaiki,
              status: "bisa_diperbaiki",
              dilaporkan_oleh: dicatatOleh,
            });
            poolBisaDiperbaiki -= ambilBisaDiperbaiki;
            terpakai += ambilBisaDiperbaiki;
          }

          const ambilRusakPermanen = Math.min(poolRusakPermanen, ambil - terpakai);
          if (ambilRusakPermanen > 0) {
            if (!dicatatOleh) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
            await createLaporanKerusakan({
              tanggal: new Date().toISOString(),
              tool_id: item.toolId,
              peminjaman_id: record.id,
              jumlah: ambilRusakPermanen,
              keterangan: catatanRusakPermanen,
              status: "rusak_permanen",
              dilaporkan_oleh: dicatatOleh,
            });
            poolRusakPermanen -= ambilRusakPermanen;
          }

          sisaDikembalikan -= ambil;
        }
      }

      // Data bisa berubah kompleks (sebagian record berkurang, sebagian
      // selesai), jadi refresh langsung dari server daripada menebak
      // perubahan di state lokal.
      await loadData();

      const totalUnitRusak = batch.reduce(
        (sum, b) => sum + b.kerusakan.reduce((s, k) => s + k.jumlah, 0),
        0
      );
      setSuccessMessage(
        `${batch.length} alat berhasil dikembalikan${
          totalUnitRusak > 0 ? ` (${totalUnitRusak} unit di antaranya ditandai rusak dan masuk Laporan Kerusakan)` : ""
        }.`
      );
      setTimeout(() => setSuccessMessage(null), 5000);

      handleBackToScan();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memproses pengembalian";
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pengembalian-page">
      {successMessage && (
        <Alert
          variant="success"
          className="d-flex align-items-center gap-2"
          dismissible
          onClose={() => setSuccessMessage(null)}
        >
          <IconCircleCheck size={20} />
          {successMessage}
        </Alert>
      )}

      {/* ---- Page Header ---- */}
      <Row>
        <Col>
          <Flex
            justifyContent="between"
            alignItems="center"
            className="mb-4 w-100"
            breakpoint="md"
          >
            <div>
              <h1 className="mb-2 h2">Pengembalian Alat</h1>
              <p className="text-secondary mb-0">
                Scan kartu peminjam, lalu centang alat yang ingin dikembalikan sekaligus.
              </p>
              <DasherBreadcrumb />
            </div>
          </Flex>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-6">
          <Spinner animation="border" size="sm" className="me-2" />
          Memuat data...
        </div>
      ) : !itemsPeminjam ? (
        <PengembalianScanForm onScan={handleScan} loading={scanning} error={scanError} />
      ) : (
        <PengembalianChecklist
          namaPeminjam={namaPeminjamAktif || ""}
          items={itemsPeminjam}
          onBack={handleBackToScan}
          onSubmit={handleBatchSubmit}
          submitting={submitting}
        />
      )}
    </div>
  );
};

export default PengembalianManager;