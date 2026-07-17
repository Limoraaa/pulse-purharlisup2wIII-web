'use client'

import { Offcanvas, Button } from "react-bootstrap";
import { IconTrash, IconMinus, IconPlus } from "@tabler/icons-react";

import { ConsumableCartItemType } from "types/DataConsumableTypes"; 

interface CartOffcanvasProps {
  show: boolean;
  onClose: () => void;
  items: ConsumableCartItemType[];
  onUpdateQty: (consumable_id: string, jumlah: number) => void;
  onRemove: (consumable_id: string) => void;
  onProceed: () => void;
}

const CartOffcanvas = ({
  show,
  onClose,
  items,
  onUpdateQty,
  onRemove,
  onProceed,
}: CartOffcanvasProps) => {
  
  const handleDecrease = (item: ConsumableCartItemType) => {
    if (item.jumlah <= 1) return;
    onUpdateQty(item.consumable_id, item.jumlah - 1);
  };

  const handleIncrease = (item: ConsumableCartItemType) => {
    // TAMBAHKAN VALIDASI STOK DI SINI
    // Pastikan item memiliki properti 'stok_tersedia' atau 'maxJumlah'
    if (item.jumlah >= item.stok_tersedia) {
      alert(`Stok maksimal untuk ${item.nama} telah tercapai!`);
      return;
    }
    onUpdateQty(item.consumable_id, item.jumlah + 1);
  };

  return (
    <Offcanvas show={show} onHide={onClose} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title as="h5">Antrean Pengambilan Bahan</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className="d-flex flex-column">
        {items.length === 0 ? (
          <p className="text-secondary">Antrean masih kosong.</p>
        ) : (
          <div className="d-flex flex-column gap-4 flex-grow-1">
            {items.map((item) => (
              <div
                key={item.consumable_id}
                className="d-flex justify-content-between align-items-start border-bottom pb-3"
              >
                <div className="flex-grow-1 me-3">
                  <div className="fw-semibold">{item.nama}</div>
                  <div className="text-secondary small mb-2">{item.kode_barang}</div>

                  {/* Stepper jumlah dengan validasi */}
                  <div className="d-flex align-items-center gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="d-flex align-items-center justify-content-center p-0"
                      style={{ width: "28px", height: "28px" }}
                      disabled={item.jumlah <= 1}
                      onClick={() => handleDecrease(item)}
                    >
                      <IconMinus size={14} />
                    </Button>
                    <span className="fw-semibold text-center" style={{ minWidth: "24px" }}>
                      {item.jumlah}
                    </span>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="d-flex align-items-center justify-content-center p-0"
                      style={{ width: "28px", height: "28px" }}
                      disabled={item.jumlah >= item.stok_tersedia}
                      onClick={() => handleIncrease(item)}
                    >
                      <IconPlus size={14} />
                    </Button>
                  </div>
                  
                  {/* Informasi stok tersedia */}
                  <div className="text-secondary small mt-1">
                    Tersedia: {item.stok_tersedia}
                  </div>
                </div>
                
                <Button
                  variant="link"
                  className="text-danger p-0"
                  onClick={() => onRemove(item.consumable_id)}
                >
                  <IconTrash size={18} />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="primary"
          className="w-100 mt-4"
          disabled={items.length === 0}
          onClick={onProceed}
        >
          Proses Pengambilan Bahan
        </Button>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default CartOffcanvas;