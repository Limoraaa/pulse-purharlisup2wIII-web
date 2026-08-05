// import node module libraries
import { Metadata } from "next";

// import custom components
import DataUserManager from "components/ruangtools/datauser/DataUserManager";

export const metadata: Metadata = {
  title: "Manajemen User | Ruang Tools",
  description: "Mengelola akun pengguna sistem Ruang Tools",
};

const DataUserPage = () => {
  return <DataUserManager />;
};

export default DataUserPage;