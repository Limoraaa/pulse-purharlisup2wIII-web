"use client";
// import node module libraries
import { Offcanvas, Button } from "react-bootstrap";
import { IconTrash, IconMinus, IconPlus } from "@tabler/icons-react";

// import custom types
import { CartItemType } from "types/DataToolsTypes";

interface CartOffcanvasProps {
  show: boolean;
  onClose: () => void;
  items: CartItemType[];
  onUpdateQty: (toolId: string, jumlah: number) => void;
  onRemove: (toolId: string) => void;
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
  // kurangi 1, minimal jumlah = 1 (kalau mau jadi 0, pakai tombol Hapus Barang)
  const handleDecrease = (item: CartItemType) => {
    if (item.jumlah <= 1) return;
    onUpdateQty(item.toolId, item.jumlah - 1);
  };

  // tambah 1, dibatasi maksimal stok tersedia
  const handleIncrease = (item: CartItemType) => {
    if (item.jumlah >= item.maxJumlah) return;
    onUpdateQty(item.toolId, item.jumlah + 1);
  };

  return (
    <Offcanvas show={show} onHide={onClose} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title as="h5">Keranjang Peminjaman</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className="d-flex flex-column">
        {items.length === 0 ? (
          <p className="text-secondary">Keranjang masih kosong.</p>
        ) : (
          <div className="d-flex flex-column gap-4 flex-grow-1">
            {items.map((item) => (
              <div
                key={item.toolId}
                className="d-flex justify-content-between align-items-start border-bottom pb-3"
              >
                <div className="flex-grow-1 me-3">
                  <div className="fw-semibold">{item.namaBarang}</div>
                  <div className="text-secondary small mb-2">
                    {item.kodeBarang}
                  </div>

                  {/* Stepper jumlah: tombol minus - angka - tombol plus */}
                  <div className="d-flex align-items-center gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="d-flex align-items-center justify-content-center p-0"
                      style={{ width: "28px", height: "28px" }}
                      disabled={item.jumlah <= 1}
                      onClick={() => handleDecrease(item)}
                      aria-label="Kurangi Jumlah"
                    >
                      <IconMinus size={14} />
                    </Button>
                    <span
                      className="fw-semibold text-center"
                      style={{ minWidth: "24px" }}
                    >
                      {item.jumlah}
                    </span>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="d-flex align-items-center justify-content-center p-0"
                      style={{ width: "28px", height: "28px" }}
                      disabled={item.jumlah >= item.maxJumlah}
                      onClick={() => handleIncrease(item)}
                      aria-label="Tambah Jumlah"
                    >
                      <IconPlus size={14} />
                    </Button>
                  </div>

                  <div className="text-secondary small mt-1">
                    Maks. {item.maxJumlah} unit tersedia
                  </div>
                </div>
                <Button
                  variant="link"
                  className="text-danger p-0"
                  onClick={() => onRemove(item.toolId)}
                  aria-label="Hapus Barang"
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
          Lanjutkan Peminjaman
        </Button>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default CartOffcanvas;
