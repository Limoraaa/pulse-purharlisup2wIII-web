"use client";
//import node module libraries
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React, { Fragment, useEffect, useState } from "react";
import {
  Accordion,
  Badge,
  Image,
  ListGroup,
  Nav,
} from "react-bootstrap";
import { IconLogout } from "@tabler/icons-react";

//import custom types
import { MenuItemType } from "types/menuTypes";

//import custom components
import CustomToggle, { CustomToggleLevel2 } from "./SidebarMenuToggle";

//import custom hooks
import useMenu from "hooks/useMenu";

//import redux store
import { useAppSelector } from "store/store";

// import required routes
import { getAssetPath } from "helper/assetPath";
import { DashboardMenu } from "routes/DashboardRoute";

// Import helper API Anda (Sesuaikan path-nya jika berbeda)
import api from "lib/api"; 

interface SidebarProps {
  hideLogo: boolean;
  containerId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ hideLogo = false, containerId }) => {
  const location = usePathname();
  const router = useRouter();
  const { handleCollapsed } = useMenu();
  const collapsed = useAppSelector((state) => state.app.collapsed);

  // Saat sidebar dalam keadaan menutup (collapsed), cukup arahkan kursor
  // ke area sidebar maka otomatis terbuka. Menutup kembali hanya lewat
  // tombol toggle (tidak otomatis saat kursor pergi).
  const handleSidebarMouseEnter = () => {
    if (collapsed === "collapsed") {
      handleCollapsed("expanded");
    }
  };

  // --- STATE UNTUK RBAC ---
  const [userRole, setUserRole] = useState<string>("");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  // Mengambil data hak akses user yang sedang login
  useEffect(() => {
    const fetchUserAccess = async () => {
      try {
        const res: any = await api("/user");
        const data = res?.data || res;
        
        if (data) {
          // Ambil nama role pertama (misal: "Super Admin", "Staff")
          const roles = data.roles?.map((r: any) => r.name) || [];
          setUserRole(roles[0] || "");
          
          // Ambil seluruh array permissions (misal: ["view_dashboard", "view_users"])
          setUserPermissions(data.all_permissions || []);
        }
      } catch (error) {
        console.error("Gagal memuat hak akses profil", error);
      }
    };
    
    fetchUserAccess();
  }, []);

  // --- KAMUS MAPPING MENU KE PERMISSION ---
  // Mencocokkan nama judul di sidebar (kiri) dengan nama permission di database (kanan)
  const permissionMap: Record<string, string> = {
    "Dashboard": "view_dashboard",
    "Inventaris": "view_inventaris",
    "Transaksi": "view_transaksi",
    "Riwayat": "view_riwayat",
    "Pengajuan Order": "view_order",
    "Laporan Kerusakan Alat": "view_kerusakan_alat",
    "Pemeliharaan": "view_pemeliharaan_mesin", // sebelumnya tidak ada mapping, jadi selalu tampil ke semua role
    "Manajemen User": "view_users",
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    router.push("/signin");
  };

  const isMenuActive = (menu: MenuItemType): boolean => {
    if (menu.link && location === menu.link) return true;
    if (menu.children) {
      return menu.children.some((child) => isMenuActive(child as MenuItemType));
    }
    return false;
  };

  const generateLink = (item: MenuItemType) => {
    return (
      <Link
        href={`${item.link}`}
        className={`nav-link ${location === item.link ? "active" : ""}`}>
        <span className='text'>{item.name}</span>
        {item.badge && (
          <Badge
            className='ms-1'
            bg={item.badgecolor ? item.badgecolor : "primary"}>
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  };

  return (
    <div id={containerId} onMouseEnter={handleSidebarMouseEnter}>
      <div>
        {hideLogo || (
          <div className='brand-logo'>
            <Link
              href='/'
              className='d-none d-md-flex align-items-center pln-brand'>
              <Image
                src={getAssetPath("/images/png/PLN-logo.png")}
                alt='PT PLN (Persero)'
                className='pln-logo'
              />
            </Link>
          </div>
        )}

        <Accordion
          defaultActiveKey='0'
          as='ul'
          bsPrefix='navbar-nav flex-column'>
          
          {/* MAPPING MENU UTAMA */}
          {DashboardMenu.map(function (menu, index) {
            
            // --- LOGIKA CEK HAK AKSES MENU ---
            const menuTitle = menu.title || menu.name || "";
            const requiredPerm = permissionMap[menuTitle];

            // Jika menu ini terdaftar di kamus mapping, DAN user bukan Super Admin,
            // DAN user tidak punya permission tersebut di databasenya, 
            // maka menu ini DISEMBUNYIKAN (return null).
            if (requiredPerm && userRole !== "Super Admin" && !userPermissions.includes(requiredPerm)) {
              return null; 
            }
            // ----------------------------------

                        if (menu.grouptitle) {
              // Cek apakah ada minimal satu menu di bawah section ini yang
              // masih terlihat untuk role user sekarang. Kalau semua anaknya
              // disembunyikan (misal Staff tidak punya akses sama sekali ke
              // domain ini), judul section-nya ikut disembunyikan juga.
              const nextGroupOffset = DashboardMenu.slice(index + 1).findIndex((m) => m.grouptitle);
              const sectionEnd = nextGroupOffset === -1 ? DashboardMenu.length : index + 1 + nextGroupOffset;
              const sectionChildren = DashboardMenu.slice(index + 1, sectionEnd);

              const hasVisibleChild = sectionChildren.some((childMenu) => {
                const childTitle = childMenu.title || childMenu.name || "";
                const childPerm = permissionMap[childTitle];
                return !(childPerm && userRole !== "Super Admin" && !userPermissions.includes(childPerm));
              });

              if (!hasVisibleChild) return null;

              return (
                <Nav.Item key={index} as='li'>
                  <div className='nav-heading'>{menu.title}</div>
                  <hr className='mx-5 nav-line mb-1' />
                </Nav.Item>
              );
            } else {
              if (menu.children) {
                return (
                  <Fragment key={index}>
                    <CustomToggle
                      eventKey={index.toString()}
                      icon={menu.icon}
                      isActive={isMenuActive(menu)}>
                      {menu.title}
                    </CustomToggle>
                    <Accordion.Collapse eventKey={index.toString()}>
                      <ListGroup as='ul' className='dropdown-menu flex-column'>
                        {menu.children.map(function (
                          menuLevel1Item,
                          menuLevel1Index
                        ) {
                          if (menuLevel1Item.children) {
                            return (
                              <ListGroup.Item
                                as='li'
                                bsPrefix='nav-item'
                                key={menuLevel1Index}>
                                <Accordion
                                  defaultActiveKey='0'
                                  bsPrefix='navbar-nav flex-column'>
                                  <CustomToggleLevel2
                                    eventKey={"0"}
                                    href={"#link"}>
                                    {menuLevel1Item.title}
                                  </CustomToggleLevel2>
                                  <Accordion.Collapse eventKey={"0"}>
                                    <ListGroup
                                      as='ul'
                                      bsPrefix=''
                                      className='nav flex-column'>
                                      {menuLevel1Item.children.map(function (
                                        menuLevel2Item,
                                        menuLevel2Index
                                      ) {
                                        if (menuLevel2Item.children) {
                                          return (
                                            <ListGroup.Item
                                              as='li'
                                              bsPrefix='nav-item'
                                              key={menuLevel2Index}>
                                              <Accordion
                                                defaultActiveKey='0'
                                                className='navbar-nav flex-column'>
                                                <CustomToggleLevel2
                                                  eventKey={"0"}>
                                                  {menuLevel2Item.title}
                                                </CustomToggleLevel2>
                                                <Accordion.Collapse
                                                  eventKey={"0"}
                                                  bsPrefix='nav-item'>
                                                  <ListGroup
                                                    as='ul'
                                                    bsPrefix=''
                                                    className='nav flex-column'>
                                                    {menuLevel2Item.children.map(
                                                      function (
                                                        menuLevel3Item,
                                                        menuLevel3Index
                                                      ) {
                                                        return (
                                                          <ListGroup.Item
                                                            key={menuLevel3Index}
                                                            as='li'
                                                            bsPrefix='nav-item'>
                                                            <Link
                                                              href={`${menuLevel3Item.link}`}
                                                              className={`nav-link ${
                                                                location === menuLevel3Item.link ? "active" : ""
                                                              }`}>
                                                              {menuLevel3Item.name}
                                                            </Link>
                                                          </ListGroup.Item>
                                                        );
                                                      }
                                                    )}
                                                  </ListGroup>
                                                </Accordion.Collapse>
                                              </Accordion>
                                            </ListGroup.Item>
                                          );
                                        } else {
                                          return (
                                            <ListGroup.Item
                                              key={menuLevel2Index}
                                              as='li'
                                              bsPrefix='nav-item'>
                                              {generateLink(menuLevel2Item)}
                                            </ListGroup.Item>
                                          );
                                        }
                                      })}
                                    </ListGroup>
                                  </Accordion.Collapse>
                                </Accordion>
                              </ListGroup.Item>
                            );
                          } else {
                            return (
                              <ListGroup.Item
                                as='li'
                                bsPrefix='nav-item'
                                key={menuLevel1Index}>
                                <Link
                                  href={`${menuLevel1Item?.link}`}
                                  className={`nav-link ${
                                    location === menuLevel1Item.link ? "active" : ""
                                  }`}>
                                  {menuLevel1Item.name}
                                </Link>
                              </ListGroup.Item>
                            );
                          }
                        })}
                      </ListGroup>
                    </Accordion.Collapse>
                  </Fragment>
                );
              } else {
                return (
                  <Nav.Item as='li' key={index}>
                    <Link
                      href={menu.link ? `${menu.link}` : "#"}
                      className={`nav-link ${
                        location === menu.link ? "active" : ""
                      }`}>
                      <span className='nav-icon'>{menu.icon}</span>
                      <span className='text'>{menu.title}</span>
                    </Link>
                  </Nav.Item>
                );
              }
            }
          })}

          {/* Tombol Logout */}
          <Nav.Item as='li'>
            <button
              type='button'
              onClick={handleLogout}
              className='nav-link border-0 bg-transparent w-100 text-start'>
              <span className='nav-icon'>
                <IconLogout size={18} />
              </span>
              <span className='text'>Logout</span>
            </button>
          </Nav.Item>

        </Accordion>
      </div>
    </div>
  );
};

export default Sidebar;