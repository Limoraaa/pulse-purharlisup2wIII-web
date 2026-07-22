'use client'

import { Offcanvas, Button } from "react-bootstrap";
import {
  IconTrash,
  IconMinus,
  IconPlus,
  IconShoppingCart,
  IconArrowRight,
} from "@tabler/icons-react";

// Sesuaikan import type dengan model Consumable
import { ConsumableCartItemType } from "types/DataConsumableTypes";

interface CartOffcanvasProps {
  show: boolean;
  onClose: () => void;
  items: ConsumableCartItemType[]; // Gunakan interface khusus untuk keranjang consumable
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
    // Menambah jumlah, bisa disesuaikan jika ingin ada batas maxJumlah
    onUpdateQty(item.consumable_id, item.jumlah + 1);
  };

  const totalUnit = items.reduce((sum, item) => sum + item.jumlah, 0);

  return (
    <Offcanvas show={show} onHide={onClose} placement="end" className="consumable-cart-offcanvas">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title as="h5" className="d-flex align-items-center gap-2">
          <span className="consumable-cart-title-icon">
            <IconShoppingCart size={20} />
          </span>
          Antrean Pengambilan Bahan
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className="d-flex flex-column">
        {items.length === 0 ? (
          /* Empty state */
          <div className="consumable-cart-empty text-center my-auto">
            <div className="consumable-cart-empty-icon mb-3">
              <IconShoppingCart size={32} />
            </div>
            <h6 className="mb-1">Antrean masih kosong</h6>
            <p className="text-secondary small mb-0">
              Tambahkan bahan dari tabel Data Consumable untuk memulai pengambilan.
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3 flex-grow-1">
            {items.map((item) => (
              <div key={item.consumable_id} className="consumable-cart-item">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{item.nama}</div>
                    <div className="text-secondary small">{item.kode_barang}</div>
                  </div>
                  <Button
                    variant="link"
                    className="consumable-cart-item-remove text-danger p-0"
                    onClick={() => onRemove(item.consumable_id)}
                    aria-label="Hapus Barang"
                  >
                    <IconTrash size={18} />
                  </Button>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-3">
                  {/* Stepper jumlah */}
                  <div className="consumable-cart-stepper d-flex align-items-center">
                    <Button
                      variant="outline-secondary"
                      className="consumable-cart-stepper-btn d-flex align-items-center justify-content-center p-0"
                      disabled={item.jumlah <= 1}
                      onClick={() => handleDecrease(item)}
                      aria-label="Kurangi Jumlah"
                    >
                      <IconMinus size={14} />
                    </Button>
                    <span className="consumable-cart-stepper-value fw-semibold text-center">
                      {item.jumlah}
                    </span>
                    <Button
                      variant="outline-secondary"
                      className="consumable-cart-stepper-btn d-flex align-items-center justify-content-center p-0"
                      onClick={() => handleIncrease(item)}
                      aria-label="Tambah Jumlah"
                    >
                      <IconPlus size={14} />
                    </Button>
                  </div>
                  <span className="text-secondary small">
                    Stok {item.stok_tersedia} unit
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="consumable-cart-footer mt-3 pt-3 border-top">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-secondary">Total item</span>
              <span className="fw-semibold">
                {items.length} jenis &middot; {totalUnit} unit
              </span>
            </div>
            <Button
              variant="primary"
              className="w-100 d-flex align-items-center justify-content-center gap-2"
              disabled={items.length === 0}
              onClick={onProceed}
            >
              Proses Pengambilan Bahan
              <IconArrowRight size={18} />
            </Button>
          </div>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default CartOffcanvas;
