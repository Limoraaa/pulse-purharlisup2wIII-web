"use client";
//import node module libraries
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React, { Fragment, useContext, useEffect, useState } from "react";
import {
  Accordion,
  AccordionContext,
  Badge,
  Image,
  ListGroup,
  Nav,
  useAccordionButton,
} from "react-bootstrap";
import { IconLogout, IconChevronDown } from "@tabler/icons-react";

//import custom types
import { MenuItemType } from "types/menuTypes";

//import custom components
import { CustomToggleLevel2 } from "./SidebarMenuToggle";

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

// ---------------------------------------------------------------------------
// STYLE (inline, tanpa file CSS)
// Palet: teal PLN #0A6C8F / #0097B2, kuning aksen #FDB913
// ---------------------------------------------------------------------------

// Satu baris menu (dipakai oleh menu biasa, toggle induk, dan sub-menu)
const rowStyle = (
  active: boolean,
  hover: boolean,
  sub = false,
  compact = false
): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: compact ? "center" : "flex-start",
  gap: compact ? 0 : 10,
  minHeight: sub ? 38 : 44,
  padding: compact ? "6px 0" : sub ? "8px 12px" : "6px 10px",
  margin: compact ? "2px 6px" : "2px 8px",
  borderRadius: 10,
  fontSize: sub ? 13.5 : 14,
  fontWeight: active ? 600 : 500,
  lineHeight: 1.25,
  color: active ? "#0A6C8F" : "#334155",
  background: active ? "#E3F2F7" : hover ? "#F1F6F8" : "transparent",
  boxShadow: active ? "inset 3px 0 0 #0097B2" : "none",
  transition: "background .15s ease, color .15s ease",
  textDecoration: "none",
  cursor: "pointer",
});

// Kotak ikon di kiri teks
const iconTileStyle = (active: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: 32,
  height: 32,
  borderRadius: 9,
  background: active ? "#0A6C8F" : "#F1F5F8",
  color: active ? "#fff" : "#5B6B7A",
  transition: "background .15s ease, color .15s ease",
});

// Teks boleh turun baris (tidak terpotong)
const labelStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  overflowWrap: "anywhere",
};

// Garis pohon untuk sub-menu
const subListStyle: React.CSSProperties = {
  margin: "2px 0 6px 28px",
  padding: 0,
  borderLeft: "2px solid #E2EBF0",
  borderRadius: 0,
  background: "transparent",
  boxShadow: "none",
};

// Toggle menu induk (menggantikan CustomToggle supaya gayanya seragam)
interface NavToggleProps {
  eventKey: string;
  icon?: React.ReactNode;
  active: boolean;
  compact?: boolean;
  children: React.ReactNode;
}

const NavToggle: React.FC<NavToggleProps> = ({
  eventKey,
  icon,
  active,
  compact = false,
  children,
}) => {
  const { activeEventKey } = useContext(AccordionContext);
  const open = Array.isArray(activeEventKey)
    ? activeEventKey.includes(eventKey)
    : activeEventKey === eventKey;
  const onClick = useAccordionButton(eventKey);
  const [hover, setHover] = useState(false);

  return (
    <Nav.Item as='li'>
      <button
        type='button'
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-expanded={open}
        title={compact && typeof children === "string" ? children : undefined}
        style={{
          ...rowStyle(active, hover, false, compact),
          width: compact ? "calc(100% - 12px)" : "calc(100% - 16px)",
          border: 0,
          textAlign: "left",
        }}>
        <span style={iconTileStyle(active)}>{icon}</span>
        <span style={compact ? { display: "none" } : labelStyle}>{children}</span>
        <IconChevronDown
          size={16}
          style={{
            display: compact ? "none" : "block",
            flexShrink: 0,
            color: "#8A97A5",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .2s ease",
          }}
        />
      </button>
    </Nav.Item>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ hideLogo = false, containerId }) => {
  const location = usePathname();
  const router = useRouter();
  const { handleCollapsed } = useMenu();
  const collapsed = useAppSelector((state) => state.app.collapsed);
  // Mode ciut: hanya ikon yang tampil (teks, panah, dan sub-menu disembunyikan)
  const isCollapsed = collapsed === "collapsed";
  const label: React.CSSProperties = isCollapsed ? { display: "none" } : labelStyle;

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

  // --- STATE UNTUK EFEK HOVER ---
  const [hovered, setHovered] = useState<string | null>(null);
  const hoverProps = (key: string) => ({
    onMouseEnter: () => setHovered(key),
    onMouseLeave: () => setHovered(null),
  });

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
  // Nilai bisa satu permission atau daftar permission (cukup punya salah satu).
  // process_* = level "Isi catatan" (pekerja/vendor) yang hanya melihat halaman catatan.
  const permissionMap: Record<string, string | string[]> = {
    "Dashboard": "view_dashboard",
    "Inventaris": "view_inventaris",
    "Transaksi": "view_transaksi",
    "Riwayat": "view_riwayat",
    "Pengajuan Order": "view_order",
    "Laporan Kerusakan Alat": "view_kerusakan_alat",
    "Dashboard Pemeliharaan": "view_dashboard_pemeliharaan",
    "Pemeliharaan": ["view_pemeliharaan_mesin", "process_pemeliharaan_mesin"],
    "Operasional": ["view_operasional_mesin", "process_operasional_mesin"],
    "Manajemen User": "view_users",
  };

  // Pemetaan berdasarkan link (lebih akurat, karena judul menu ada yang kembar)
  const linkPermissionMap: Record<string, string | string[]> = {
    "/pemeliharaan/dashboard": "view_dashboard_pemeliharaan",
    "/data-mesin": "view_data_mesin",
    "/operasional/mapping-pengerjaan": "view_operasional_mesin",
    "/operasional/data-mesin": ["view_operasional_mesin", "process_operasional_mesin"],
    "/pemeliharaan/kalibrasi": "view_pemeliharaan_mesin",
    "/pemeliharaan/rencana": "view_pemeliharaan_mesin",
    "/pemeliharaan/data-mesin": ["view_pemeliharaan_mesin", "process_pemeliharaan_mesin"],
    "/pemeliharaan/laporan-anggaran": "view_pemeliharaan_mesin",
    "/pemeliharaan/dashboard-motor-konversi": "view_dashboard_pemeliharaan_motor_konversi",
    "/pemeliharaan/data-motor-konversi": "view_pemeliharaan_motor_konversi",
  };

  const getRequiredPerm = (menu: MenuItemType): string[] | undefined => {
    const perm =
      menu.link && linkPermissionMap[menu.link] ? linkPermissionMap[menu.link] : permissionMap[menu.title || menu.name || ""];
    if (!perm) return undefined;
    return Array.isArray(perm) ? perm : [perm];
  };

  // Menu tampil bila user punya salah satu permission-nya; menu bersub tampil bila
  // minimal satu submenunya boleh dilihat (submenu disaring per link).
  const bolehLihat = (menu: MenuItemType): boolean => {
    if (userRole === "Super Admin") return true;
    const perms = getRequiredPerm(menu);
    if (perms && !perms.some((p) => userPermissions.includes(p))) return false;
    if (menu.children) return menu.children.some((child) => bolehLihat(child as MenuItemType));
    return true;
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

  // Link sub-menu (tanpa ikon)
  const generateLink = (item: MenuItemType) => {
    const key = `g-${item.link}`;
    return (
      <Link
        href={`${item.link}`}
        className='nav-link'
        style={rowStyle(location === item.link, hovered === key, true)}
        {...hoverProps(key)}>
        <span className='text' style={label}>{item.name}</span>
        {item.badge && !isCollapsed && (
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
                src={getAssetPath("/images/png/PLN-Pusharlis-UP2W3.png")}
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
            // Menu (atau seluruh submenunya) yang tidak boleh dilihat role ini DISEMBUNYIKAN.
            if (!menu.grouptitle && !bolehLihat(menu)) {
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

              const hasVisibleChild = sectionChildren.some((childMenu) => bolehLihat(childMenu));

              if (!hasVisibleChild) return null;

              return (
                <Nav.Item key={index} as='li'>
                  {isCollapsed ? (
                    <hr
                      style={{
                        margin: "12px 14px",
                        border: 0,
                        borderTop: "1px solid #E2EBF0",
                        opacity: 1,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        margin: index === 0 ? "8px 8px 6px" : "20px 8px 6px",
                        padding: "8px 12px",
                        fontSize: 11.5,
                        fontWeight: 800,
                        letterSpacing: "0.8px",
                        lineHeight: 1.3,
                        color: "#0A6C8F",
                        textTransform: "uppercase",
                        background:
                          "linear-gradient(90deg, #E3F2F7 0%, rgba(227,242,247,0) 100%)",
                        borderLeft: "4px solid #FDB913",
                        borderRadius: "4px 8px 8px 4px",
                      }}>
                      {menu.title}
                    </div>
                  )}
                </Nav.Item>
              );
            } else {
              if (menu.children) {
                return (
                  <Fragment key={index}>
                    <NavToggle
                      eventKey={index.toString()}
                      icon={menu.icon}
                      active={isMenuActive(menu)}
                      compact={isCollapsed}>
                      {menu.title}
                    </NavToggle>
                    <Accordion.Collapse eventKey={index.toString()}>
                      <ListGroup
                        as='ul'
                        className='dropdown-menu flex-column'
                        style={{
                          ...subListStyle,
                          ...(isCollapsed ? { display: "none" } : {}),
                        }}>
                        {menu.children.filter((child) => bolehLihat(child as MenuItemType)).map(function (
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
                                                        const key3 = `l3-${menuLevel3Item.link}`;
                                                        return (
                                                          <ListGroup.Item
                                                            key={menuLevel3Index}
                                                            as='li'
                                                            bsPrefix='nav-item'>
                                                            <Link
                                                              href={`${menuLevel3Item.link}`}
                                                              className='nav-link'
                                                              style={rowStyle(
                                                                location === menuLevel3Item.link,
                                                                hovered === key3,
                                                                true
                                                              )}
                                                              {...hoverProps(key3)}>
                                                              <span style={labelStyle}>
                                                                {menuLevel3Item.name}
                                                              </span>
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
                            const key1 = `l1-${menuLevel1Item.link}`;
                            return (
                              <ListGroup.Item
                                as='li'
                                bsPrefix='nav-item'
                                key={menuLevel1Index}>
                                <Link
                                  href={`${menuLevel1Item?.link}`}
                                  className='nav-link'
                                  style={rowStyle(
                                    location === menuLevel1Item.link,
                                    hovered === key1,
                                    true
                                  )}
                                  {...hoverProps(key1)}>
                                  <span style={labelStyle}>{menuLevel1Item.name}</span>
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
                const active = location === menu.link;
                const key = `m-${index}`;
                return (
                  <Nav.Item as='li' key={index}>
                    <Link
                      href={menu.link ? `${menu.link}` : "#"}
                      className='nav-link'
                      title={isCollapsed ? menu.title : undefined}
                      style={rowStyle(active, hovered === key, false, isCollapsed)}
                      {...hoverProps(key)}>
                      <span className='nav-icon' style={iconTileStyle(active)}>
                        {menu.icon}
                      </span>
                      <span className='text' style={label}>
                        {menu.title}
                      </span>
                    </Link>
                  </Nav.Item>
                );
              }
            }
          })}

          {/* Tombol Logout */}
          <Nav.Item
            as='li'
            style={{
              marginTop: 14,
              paddingTop: 10,
              borderTop: "1px solid #EEF2F5",
            }}>
            <button
              type='button'
              onClick={handleLogout}
              {...hoverProps("logout")}
              title={isCollapsed ? "Logout" : undefined}
              style={{
                ...rowStyle(false, false, false, isCollapsed),
                width: isCollapsed ? "calc(100% - 12px)" : "calc(100% - 16px)",
                border: 0,
                textAlign: "left",
                color: "#C62828",
                fontWeight: 600,
                background: hovered === "logout" ? "#FFECEC" : "transparent",
              }}>
              <span
                className='nav-icon'
                style={{
                  ...iconTileStyle(false),
                  background: "#FFECEC",
                  color: "#C62828",
                }}>
                <IconLogout size={18} />
              </span>
              <span className='text' style={label}>Logout</span>
            </button>
          </Nav.Item>

        </Accordion>
      </div>
    </div>
  );
};

export default Sidebar;