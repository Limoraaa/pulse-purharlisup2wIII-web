import OrderToolsManager from 'components/ordertools/OrderToolsManager';

export const metadata = {
  title: 'Order Tools | Inventaris',
};

export default function OrderToolsPage() {
  return (
    <div className="p-3">
      <OrderToolsManager />
    </div>
  );
}
