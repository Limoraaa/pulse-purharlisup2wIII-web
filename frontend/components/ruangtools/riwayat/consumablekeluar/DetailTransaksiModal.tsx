"use client";
// import node module libraries
import { Modal, Button, Table } from "react-bootstrap";

// import custom types
import { RiwayatConsumableKeluarType } from "types/RiwayatTypes";

interface DetailTransaksiModalProps {
  show: boolean;
  onClose: () => void;
  items: RiwayatConsumableKeluarType[]; // semua baris dengan nomor_transaksi yang sama
}

const Row2 = ({ label, value }: { label: string; value: string }) => (
  <div className="d-flex justify-content-between border-bottom py-1 small">
    <span className="text-secondary">{label}</span>
    <span className="fw-semibold">{value}</span>
  </div>
);

const DetailTransaksiModal = ({
  show,
  onClose,
  items,
}: DetailTransaksiModalProps) => {
  if (items.length === 0) return null;
  const header = items[0];

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title as="h5">Detail Transaksi</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <Row2 label="Nama Peminta" value={header.nama_peminta} />
          <Row2 label="Divisi" value={header.divisi} />
          <Row2 label="Area Kerja" value={header.area_kerja} />
          <Row2 label="Tanggal Pengambilan" value={header.tanggal_pengambilan} />
        </div>

        <Table responsive size="sm" className="align-middle">
          <thead>
            <tr>
              <th>Kode Barang</th>
              <th>Nama Barang</th>
              <th>Merk</th>
              <th>Tipe</th>
              <th>ER/E</th>
              <th>Ukuran</th>
              <th className="text-center">Jumlah</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.kode_barang}</td>
                <td>{item.nama_barang}</td>
                <td>{item.merk}</td>
                <td>{item.tipe}</td>
                <td>{item.er_e}</td>
                <td>{item.ukuran}</td>
                <td className="text-center">{item.jumlah}</td>
                <td className="text-secondary small">
                  {item.keterangan || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Tutup
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DetailTransaksiModal;
