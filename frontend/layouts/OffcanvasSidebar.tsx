"use client";
//import node modules libraries
import { Image } from "react-bootstrap";
import Offcanvas from "react-bootstrap/Offcanvas";
import OffcanvasBody from "react-bootstrap/OffcanvasBody";
import OffcanvasHeader from "react-bootstrap/OffcanvasHeader";
import Link from "next/link";

//import custom components
import Sidebar from "./Sidebar";

//import custom hooks
import useMenu from "hooks/useMenu";
import { getAssetPath } from "helper/assetPath";

const OffcanvasSidebar = () => {
  const { showMenu, toggleMenuHandler } = useMenu();

  return (
    <Offcanvas
      placement={"start"}
      show={showMenu}
      onHide={() => toggleMenuHandler(false)}
      backdrop={true}
      bsPrefix="offcanvasNav offcanvas offcanvas-start "
    >
      <OffcanvasHeader closeButton>
        <Link href="/" className="d-flex align-items-center gap-2 pln-brand">
          <Image
            src={getAssetPath("/images/png/PLN-logo.png")}
            alt="PT PLN (Persero)"
            className="pln-logo"
          />
          
        </Link>
      </OffcanvasHeader>
      <OffcanvasBody className="p-0 ">
        <Sidebar hideLogo />
      </OffcanvasBody>
    </Offcanvas>
  );
};

export default OffcanvasSidebar;
