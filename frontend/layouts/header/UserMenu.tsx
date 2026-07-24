"use client";
//import node modules libraries
import React from "react";
import Link from "next/link";

//import custom components
import { Avatar } from "components/common/Avatar";
import { getAssetPath } from "helper/assetPath";

// Avatar kini menjadi navigasi langsung ke halaman Profil (tanpa dropdown).
const UserMenu = () => {
  return (
    <Link
      href="/profile"
      className="d-inline-flex align-items-center"
      aria-label="Buka halaman Profil"
      title="Profil Saya"
    >
      <Avatar
        type="image"
        src={getAssetPath("/images/avatar/avatar-1.jpg")}
        size="sm"
        alt="User Avatar"
        className="rounded-circle"
      />
    </Link>
  );
};

export default UserMenu;
