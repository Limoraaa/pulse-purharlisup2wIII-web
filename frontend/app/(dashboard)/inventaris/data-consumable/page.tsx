// import node module libraries
import { Metadata } from "next";

// import custom components
import DataConsumableManager from "components/dataconsumable/DataConsumableManager";

export const metadata: Metadata = {
  title: "Data Consumable | Ruang Tools - Admin Panel",
  description: "Mengelola seluruh data consumable yang terdapat di Ruang Tools",
};

const DataConsumablePage = () => {
  return <DataConsumableManager />;
};

export default DataConsumablePage;