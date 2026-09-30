"use client";
// import node module libraries
import { Badge } from "react-bootstrap";
import { IconShoppingCart } from "@tabler/icons-react";

interface CartFABProps {
  itemCount: number;
  onClick: () => void;
}

const CartFAB = ({ itemCount, onClick }: CartFABProps) => {
  if (itemCount === 0) return null; // sembunyikan FAB kalau keranjang kosong

  return (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center cart-fab"
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        width: "60px",
        height: "60px",
        zIndex: 1040,
      }}
      aria-label="Buka Keranjang Peminjaman"
    >
      <IconShoppingCart size={26} />
      <Badge
        bg="danger"
        pill
        className="position-absolute top-0 start-100 translate-middle border border-2 border-white"
      >
        {itemCount}
      </Badge>
    </button>
  );
};

export default CartFAB;
