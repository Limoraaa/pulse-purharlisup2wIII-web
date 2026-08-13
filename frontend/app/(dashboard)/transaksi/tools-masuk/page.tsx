// import node module libraries
import { Metadata } from "next";

// import custom components
import ToolMasukManager from "components/ruangtools/toolsmasuk/ToolMasukManager";

export const metadata: Metadata = {
  title: "Tools Masuk | Ruang Tools - Admin Panel",
  description: "Mencatat alat yang masuk",
};

const ToolMasukPage = () => {
  return <ToolMasukManager />;
};

export default ToolMasukPage;