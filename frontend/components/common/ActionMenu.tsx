"use client";
/***************************
Component : ActionMenu
****************************

Available Parameters

toggleButton  : Required, it will be an object like, button, icon, span etc... don't use hyperlink for this one.
menuItems     : Optional, it will be menu items, if you omit it will show blank menu, if you have specified list of child items (children parameters ) you don't need to pass anything to menuItems.
className     : Optional, class list for CustomToggle object e.g. circle, rounded, rounded-circle, bg-info etc...
align         : Optional, Menu alignment it can be 'start' or 'end' default = 'end'
drop          : Optional, Open direction it can be 'up', 'up-centered', 'start', 'end', 'down', 'down-centered', default = 'start'.
itemClass     : Optional, class list for Dropdown.Item 
children	    : Optional, it will be list of items of Dropdown.Item, if you have specified list of child item, you don't need to specify menuItems array.

Note: If you have specified both menuItems and children parameters, menuItems will be used.
 
*/

// import node module libraries
import Link from "next/link";
import React, { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Dropdown } from "react-bootstrap";

interface CustomToggleProps {
  children: React.ReactNode;
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

interface ActionMenuProps {
  toggleButton: React.ReactNode;
  className?: string;
  align?: "start" | "end";
  drop?: "up" | "up-centered" | "start" | "end" | "down" | "down-centered";
  menuItems?: Array<{ link: string; menuItem: string; icon?: React.ReactNode }>;
  itemClass?: string;
  children?: React.ReactNode;
  size?: "sm" | "lg" | undefined;
  variant?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  // Opt-in untuk tabel scrollable: tutup saat posisi trigger berubah karena scroll.
  closeOnScroll?: boolean;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  toggleButton,
  className,
  align = "end",
  drop = "start",
  menuItems = [],
  itemClass,
  children,
  size,
  variant,
  onClick,
  closeOnScroll = false,
}) => {
  const menuId = useRef(Symbol("action-menu"));
  const [show, setShow] = useState(false);

  // Portal butuh `document`, yang cuma ada di client -> tunggu mount dulu
  // supaya tidak error waktu server-side render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!closeOnScroll) return;

    const closeMenu = () => setShow(false);
    const closeOtherMenu = (event: Event) => {
      if ((event as CustomEvent<symbol>).detail !== menuId.current) closeMenu();
    };

    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("action-menu-open", closeOtherMenu);

    const tableScroller = document.querySelector(
      ".datatools-page .table-responsive, .dataconsumable-page .table-responsive"
    );
    tableScroller?.addEventListener("scroll", closeMenu, { passive: true });

    return () => {
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("action-menu-open", closeOtherMenu);
      tableScroller?.removeEventListener("scroll", closeMenu);
    };
  }, [closeOnScroll]);

  const handleToggle = (nextShow: boolean) => {
    setShow(nextShow);
    if (nextShow && closeOnScroll) {
      window.dispatchEvent(
        new CustomEvent("action-menu-open", { detail: menuId.current })
      );
    }
  };

  const CustomToggle = React.forwardRef<HTMLAnchorElement, CustomToggleProps>(
    ({ children, onClick }, ref) => (
      <Link
        ref={ref}
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onClick(e);
        }}
        className={className}
      >
        {children}
      </Link>
    )
  );

  CustomToggle.displayName = "CustomToggle";

  const menuContent = (
    <Dropdown.Menu
      align={align}
      // strategy "fixed" + portal: Popper hitung posisi berdasarkan posisi
      // asli tombolnya di layar, sama sekali tidak terpengaruh sticky/overflow
      // ancestor karena elemen menu-nya sendiri sudah dipindah ke document.body.
      popperConfig={{ strategy: "fixed" }}
    >
      {menuItems.length > 0 ? (
        menuItems.map((item, index) => (
          <Dropdown.Item
            key={index}
            as={Link}
            href={item.link}
            className={itemClass}
            onClick={onClick}
          >
            {item.icon ? item.icon : ""}
            {item.menuItem}
          </Dropdown.Item>
        ))
      ) : (
        <Fragment>{children}</Fragment>
      )}
    </Dropdown.Menu>
  );

  return (
    <Dropdown drop={drop} show={closeOnScroll ? show : undefined} onToggle={closeOnScroll ? handleToggle : undefined}>
      <Dropdown.Toggle variant={variant} size={size} as={CustomToggle}>
        {toggleButton}
      </Dropdown.Toggle>

      {/* Portal: elemen menu dirender ke document.body (keluar dari tabel),
          tapi tetap "anak" Dropdown secara React Context, jadi semua logic
          (buka/tutup, keyboard nav, dst) tetap jalan normal. */}
      {mounted ? createPortal(menuContent, document.body) : menuContent}
    </Dropdown>
  );
};

export default ActionMenu;
