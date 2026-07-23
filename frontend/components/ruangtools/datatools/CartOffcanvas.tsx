"use client";
// import node module libraries
import { Offcanvas, Button } from "react-bootstrap";
import {
  IconTrash,
  IconMinus,
  IconPlus,
  IconShoppingCart,
  IconArrowRight,
} from "@tabler/icons-react";

// import custom types
import { CartItemType } from "types/DataToolsTypes";

interface CartOffcanvasProps {
  show: boolean;
  onClose: () => void;
  items: CartItemType[];
  onUpdateQty: (cartId: string | number, jumlah: number) => void;
  onRemove: (cartId: string | number) => void;
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
  const handleDecrease = (item: CartItemType) => {
    if (item.jumlah <= 1) return;
    // Berikan fallback string kosong jika cartId kebetulan undefined
    onUpdateQty(item.cartId ?? "", item.jumlah - 1); 
  };

  const handleIncrease = (item: CartItemType) => {
    if (item.jumlah >= item.maxJumlah) return;
    onUpdateQty(item.cartId ?? "", item.jumlah + 1); 
  };

  const totalUnit = items.reduce((sum, item) => sum + item.jumlah, 0);

  return (
    <Offcanvas show={show} onHide={onClose} placement="end" className="cart-offcanvas">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title as="h5" className="d-flex align-items-center gap-2">
          <span className="cart-title-icon">
            <IconShoppingCart size={20} />
          </span>
          Keranjang Peminjaman
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className="d-flex flex-column">
        {items.length === 0 ? (
          <div className="cart-empty text-center my-auto">
            <div className="cart-empty-icon mb-3">
              <IconShoppingCart size={32} />
            </div>
            <h6 className="mb-1">Keranjang masih kosong</h6>
            <p className="text-secondary small mb-0">
              Tambahkan alat dari tabel Data Tools untuk memulai peminjaman.
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3 flex-grow-1">
            {items.map((item) => (
              <div key={item.cartId || item.toolId} className="cart-item">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{item.namaBarang}</div>
                    <div className="text-secondary small">{item.kodeBarang}</div>
                  </div>
                  <Button
                    variant="link"
                    className="cart-item-remove text-danger p-0"
                    onClick={() => onRemove(item.cartId ?? "")} // <-- Tambahkan fallback ??""
                    aria-label="Hapus Barang"
                  >
                    <IconTrash size={18} />
                  </Button>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="cart-stepper d-flex align-items-center">
                    <Button
                      variant="outline-secondary"
                      className="cart-stepper-btn d-flex align-items-center justify-content-center p-0"
                      disabled={item.jumlah <= 1}
                      onClick={() => handleDecrease(item)}
                      aria-label="Kurangi Jumlah"
                    >
                      <IconMinus size={14} />
                    </Button>
                    <span className="cart-stepper-value fw-semibold text-center">
                      {item.jumlah}
                    </span>
                    <Button
                      variant="outline-secondary"
                      className="cart-stepper-btn d-flex align-items-center justify-content-center p-0"
                      disabled={item.jumlah >= item.maxJumlah}
                      onClick={() => handleIncrease(item)}
                      aria-label="Tambah Jumlah"
                    >
                      <IconPlus size={14} />
                    </Button>
                  </div>
                  <span className="text-secondary small">
                    Maks. {item.maxJumlah} unit
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="cart-footer mt-3 pt-3 border-top">
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
              Lanjutkan Peminjaman
              <IconArrowRight size={18} />
            </Button>
          </div>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default CartOffcanvas;