"use client";
// import node module libraries
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, CardBody, Button, Alert, Spinner } from "react-bootstrap";
import { IconPlus, IconCircleCheck } from "@tabler/icons-react";

// import custom types
import {
  ConsumableItemType,
  ConsumableMasukType,
  ConsumableMasukFormValues,
} from "types/DataConsumableTypes";

// import custom components
import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import { getConsumableMasukColumns } from "components/ruangtools/consumablemasuk/ColumnDefination";
import ConsumableMasukFormModal from "components/ruangtools/consumablemasuk/ConsumableMasukFormModal";
import DeleteConfirmModal from "components/ruangtools/consumablemasuk/DeleteConfirmModal";

// import service Data Consumable yang SUDAH ADA (dipakai bersama dengan
// halaman Data Consumable) — ini titik integrasi utamanya.
import { getConsumables, updateConsumable } from "services/consumableService";

const ConsumableMasukManager = () => {
  // Daftar barang Data Consumable, dipakai sebagai sumber dropdown "Kode Barang"
  const [consumables, setConsumables] = useState<ConsumableItemType[]>([]);
  const [loadingConsumables, setLoadingConsumables] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadConsumables = async () => {
    setLoadingConsumables(true);
    setErrorMsg(null);
    try {
      const data = await getConsumables();
      setConsumables(data);
    } catch (err) {
      setErrorMsg("Gagal memuat data consumable untuk pilihan Kode Barang.");
    } finally {
      setLoadingConsumables(false);
    }
  };

  useEffect(() => {
    loadConsumables();
  }, []);

  // Catatan Consumable Masuk (riwayat transaksi masuk).
  // Belum ada service/endpoint khusus untuk ini, jadi untuk sekarang
  // disimpan di state lokal saja. Begitu backend sudah punya endpoint
  // (misal getConsumableMasuk / createConsumableMasuk di service terpisah),
  // ganti useState ini dengan fetch dari sana.
  const [masukList, setMasukList] = useState<ConsumableMasukType[]>([]);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<ConsumableMasukType | null>(
    null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openAddModal = () => {
    setActiveItem(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: ConsumableMasukType) => {
    setActiveItem(item);
    setFormModalOpen(true);
  };

  const openDeleteModal = (item: ConsumableMasukType) => {
    setActiveItem(item);
    setDeleteModalOpen(true);
  };

  // ---- submit Tambah / Edit ----
  const handleFormSubmit = async (values: ConsumableMasukFormValues) => {
    try {
      if (activeItem) {
        // Mode Edit: hanya perbarui catatan masuk di state lokal.
        // Tidak menyesuaikan ulang stok Data Consumable secara otomatis —
        // kalau perlu, tambahkan logic penyesuaian selisih jumlah di sini
        // begitu sudah ada endpoint riwayat masuk yang sesungguhnya.
        setMasukList((prev) =>
          prev.map((m) =>
            m.id === activeItem.id ? { ...m, ...values } : m
          )
        );
      } else {
        // Mode Tambah: INI INTEGRASI UTAMANYA.
        // Panggil updateConsumable() dari service asli untuk menambah
        // stok_awal di Data Consumable sejumlah "jumlah_masuk".
        const target = consumables.find((c) => c.id === values.consumable_id);
        if (target) {
          await updateConsumable(target.id, {
            kode_barang: target.kode_barang,
            nama: target.nama,
            merk: target.merk,
            tipe: target.tipe,
            er_e: target.er_e,
            ukuran: target.ukuran,
            stok_awal: target.stok_awal + values.jumlah_masuk,
          });
          // refresh daftar consumable supaya stok yang tampil (kalau ada
          // tempat lain yang menampilkannya) ikut ter-update
          await loadConsumables();
        }

        // catat transaksi masuknya di tabel halaman ini
        setMasukList((prev) => [
          { id: crypto.randomUUID(), ...values },
          ...prev,
        ]);

        setSuccessMessage(
          `Berhasil menambah ${values.jumlah_masuk} unit "${values.nama}" ke Data Consumable.`
        );
        setTimeout(() => setSuccessMessage(null), 5000);
      }

      setFormModalOpen(false);
      setActiveItem(null);
    } catch (err) {
      setErrorMsg("Gagal menyimpan data consumable masuk. Silakan coba lagi.");
    }
  };

  // ---- Hapus ----
  // Catatan: hanya menghapus catatan di tabel ini, TIDAK mengurangi lagi
  // stok Data Consumable yang sudah kadung bertambah. Kalau perlu perilaku
  // "hapus = batalkan penambahan stok", tambahkan pemanggilan
  // updateConsumable() lagi di sini untuk mengurangi stok_awal.
  const handleConfirmDelete = () => {
    if (activeItem) {
      setMasukList((prev) => prev.filter((m) => m.id !== activeItem.id));
    }
    setDeleteModalOpen(false);
    setActiveItem(null);
  };

  const columns = useMemo(
    () =>
      getConsumableMasukColumns({
        onEdit: openEditModal,
        onDelete: openDeleteModal,
      }),
    []
  );

  return (
    <>
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
      {errorMsg && (
        <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      <Row>
        <Col>
          <Flex
            justifyContent="between"
            alignItems="center"
            className="mb-4 w-100"
            breakpoint="md"
          >
            <div>
              <h1 className="mb-2 h2">Consumable Masuk</h1>
              <p className="text-secondary mb-0">
                Mencatat barang Consumable yang masuk.
              </p>
              <DasherBreadcrumb />
            </div>
            <div>
              <Button
                variant="primary"
                className="d-flex align-items-center gap-2"
                onClick={openAddModal}
                disabled={loadingConsumables}
              >
                <IconPlus size={18} />
                Tambah
              </Button>
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6">
        <CardBody>
          {masukList.length === 0 ? (
            <p className="text-secondary text-center py-6 mb-0">
              Belum ada catatan barang masuk. Klik "Tambah" untuk mulai
              mencatat.
            </p>
          ) : (
            <TanstackTable
              data={masukList}
              columns={columns}
              filter
              pagination
              isSortable
              filterPlaceholder="Cari kode / nama barang..."
            />
          )}
        </CardBody>
      </Card>

      <ConsumableMasukFormModal
        show={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setActiveItem(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={activeItem}
        consumableOptions={consumables}
      />
      <DeleteConfirmModal
        show={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        item={activeItem}
      />

      {loadingConsumables && (
        <div
          className="position-fixed bottom-0 end-0 m-4 bg-white shadow rounded-3 px-3 py-2 d-flex align-items-center gap-2"
          style={{ zIndex: 1050 }}
        >
          <Spinner animation="border" size="sm" />
          <span className="small text-secondary">Memuat data consumable...</span>
        </div>
      )}
    </>
  );
};

export default ConsumableMasukManager;
