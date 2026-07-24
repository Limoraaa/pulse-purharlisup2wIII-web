"use client";
//import node module libraries
import React, { Fragment, useState, useEffect } from "react";
import Link from "next/link";
import { useMediaQuery } from "react-responsive";
import {
  IconArrowBarLeft,
  IconArrowBarRight,
  IconMenu2,
} from "@tabler/icons-react";
import { Container, ListGroup, Navbar } from "react-bootstrap";

//import custom components
import UserMenu from "./UserMenu";
import ThemeToggle from "./ThemeToggle";
import Flex from "components/common/Flex";
import OffcanvasSidebar from "layouts/OffcanvasSidebar";

//import custom hooks
import useMenu from "hooks/useMenu";

const Header = () => {
  const { toggleMenuHandler, handleCollapsed } = useMenu();

  // 1. Tambahkan state untuk mendeteksi apakah komponen sudah dimuat di browser
  const [hasMounted, setHasMounted] = useState<boolean>(false);

  const isTablet = useMediaQuery({ maxWidth: 990 });

  // 2. Set state menjadi true setelah render pertama (client-side)
  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <Fragment>
      <Navbar expand="lg" className="navbar-glass px-0 px-lg-4">
        <Container fluid className="px-lg-0">
          <Flex alignItems="center" className="gap-4">
            
            {/* 3. Gunakan hasMounted untuk mencegah render di server sebelum ukuran layar diketahui */}
            {hasMounted && isTablet && (
              <div
                className="d-block d-lg-none"
                style={{ cursor: "pointer" }}
                onClick={() => toggleMenuHandler(true)}
              >
                <IconMenu2 size={24} />
              </div>
            )}
            
            {hasMounted && !isTablet && (
              <div>
                <Link href={"#"} className="sidebar-toggle d-flex p-3">
                  <span
                    className="collapse-mini"
                    onClick={() => handleCollapsed("expanded")}
                  >
                    <IconArrowBarLeft
                      size={20}
                      strokeWidth={1.5}
                      className="text-secondary"
                    />
                  </span>
                  <span
                    className="collapse-expanded"
                    onClick={() => handleCollapsed("collapsed")}
                  >
                    <IconArrowBarRight
                      size={20}
                      strokeWidth={1.5}
                      className="text-secondary"
                    />
                  </span>
                </Link>
              </div>
            )}
          </Flex>
          
          <ListGroup
            bsPrefix="list-unstyled"
            as={"ul"}
            className="d-flex align-items-center mb-0 header-actions"
          >
            <ListGroup.Item as="li" className="d-flex align-items-center">
              <ThemeToggle />
            </ListGroup.Item>

            <ListGroup.Item as="li" className="d-flex align-items-center">
              <UserMenu />
            </ListGroup.Item>
          </ListGroup>
        </Container>
      </Navbar>

      {/* 4. Terapkan juga pada sidebar offcanvas agar tidak memicu error yang sama */}
      {hasMounted && isTablet && <OffcanvasSidebar />}
    </Fragment>
  );
};

export default Header;