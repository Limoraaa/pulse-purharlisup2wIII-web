"use client";
// import node module libraries
import { Modal, Button, Table, Badge } from "react-bootstrap";
import { IconArrowBackUp } from "@tabler/icons-react";

// import custom types
import { TransaksiPeminjamanType, ToolCondition } from "types/DataToolsTypes";

const kondisiVariant = (kondisi: ToolCondition) => {
  switch (kondisi) {
    case "Baik":
      return { bg: "success-subtle", text: "success-emphasis" };
    case "Rusak Ringan":
      return { bg: "warning-subtle", text: "warning-emphasis" };
    case "Rusak Berat":
    case "Rusak Permanen":
      return { bg: "danger-subtle", text: "danger-emphasis" };
  }
};

interface DetailTransaksiModalProps {
  show: boolean;
  onClose: () => void;
  transaksi: TransaksiPeminjamanType | null;
  onReturn: (transaksi: TransaksiPeminjamanType) => void;
}

const DetailTransaksiModal = ({
  show,
  onClose,
  transaksi,
  onReturn,
}: DetailTransaksiModalProps) => {
  if (!transaksi) return null;

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title as="h5">Detail Transaksi</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <Row2 label="Nama Peminjam" value={transaksi.namaPeminjam} />
          <Row2 label="Divisi" value={transaksi.divisi} />
          <Row2 label="Area Kerja" value={transaksi.areaKerja} />
          <Row2 label="Tanggal Pinjam" value={transaksi.tanggalPeminjaman} />
        </div>

        <Table responsive size="sm" className="align-middle">
          <thead>
            <tr>
              <th>Nama Barang</th>
              <th className="text-center">Jumlah</th>
              <th>Kondisi Saat Dipinjam</th>
            </tr>
          </thead>
          <tbody>
            {transaksi.items.map((item) => {
              const { bg, text } = kondisiVariant(item.kondisiSaatDipinjam);
              return (
                <tr key={item.toolId}>
                  <td>{item.namaBarang}</td>
                  <td className="text-center">{item.jumlah}</td>
                  <td>
                    <Badge bg={bg} text={text}>
                      {item.kondisiSaatDipinjam}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Tutup
        </Button>
        {transaksi.status === "Sedang Dipinjam" && (
          <Button
            variant="primary"
            className="d-flex align-items-center gap-2"
            onClick={() => onReturn(transaksi)}
          >
            <IconArrowBackUp size={18} />
            Alat Dikembalikan
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

const Row2 = ({ label, value }: { label: string; value: string }) => (
  <div className="d-flex justify-content-between border-bottom py-1 small">
    <span className="text-secondary">{label}</span>
    <span className="fw-semibold">{value}</span>
  </div>
);

export default DetailTransaksiModal;
