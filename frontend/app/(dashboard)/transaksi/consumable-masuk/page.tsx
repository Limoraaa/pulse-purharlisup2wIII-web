// import node module libraries
import { Metadata } from "next";

// import custom components
import ConsumableMasukManager from "components/ruangtools/consumablemasuk/ConsumableMasukManager";

export const metadata: Metadata = {
  title: "Consumable Masuk | Ruang Tools - Admin Panel",
  description: "Mencatat barang Consumable yang masuk",
};

const ConsumableMasukPage = () => {
  return <ConsumableMasukManager />;
};

export default ConsumableMasukPage;
