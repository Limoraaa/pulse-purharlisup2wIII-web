// Perhatikan: Tidak ada tanda "/" di depan kata "components"
import OrderConsumableManager from 'components/orderconsumable/OrderConsumableManager';

export const metadata = {
  title: 'Order Consumable | Inventaris',
};

export default function OrderConsumablePage() {
  return (
    <div className="p-3">
      {/* Judul <h1> di sini sudah dibuang agar tidak double */}
      <OrderConsumableManager />
    </div>
  );
}