// import node module libraries
import { Metadata } from "next";

// import custom components
import DataToolsManager from "components/ruangtools/datatools/DataToolsManager";

export const metadata: Metadata = {
  title: "Data Tools | Ruang Tools - Admin Panel",
  description: "Mengelola seluruh data peralatan yang terdapat di Ruang Tools",
};

const DataToolsPage = () => {
  return <DataToolsManager />;
};

export default DataToolsPage;
