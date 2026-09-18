"use client";
//import node modules libraries
import React, { useEffect, useState } from "react";
import Link from "next/link";

//import custom components
import { Avatar } from "components/common/Avatar";
import { getAssetPath } from "helper/assetPath";
import { getProfile } from "services/profileService";

const DEFAULT_AVATAR = getAssetPath("/images/avatar/avatar-1.jpg");

// Avatar kini menjadi navigasi langsung ke halaman Profil (tanpa dropdown).
const UserMenu = () => {
  const [avatarSrc, setAvatarSrc] = useState<string>(() => {
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("userAvatarUrl");
    if (cached) return cached;
  }
  return DEFAULT_AVATAR;
});

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    getProfile()
      .then((data) => {
        if (data.avatarPath) {
          const backendOrigin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "");
          const url = `${backendOrigin}/storage/${data.avatarPath}`;
          setAvatarSrc(url);
          localStorage.setItem("userAvatarUrl", url);
        }
      })
      .catch(() => {});

    // Dengarkan event dari ProfileManager -- update avatar seketika tanpa refresh
    const handleAvatarUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setAvatarSrc(customEvent.detail);
    };
    window.addEventListener("avatar-updated", handleAvatarUpdated);

    return () => {
      window.removeEventListener("avatar-updated", handleAvatarUpdated);
    };
  }, []);

  return (
    <Link
      href="/profile"
      className="d-inline-flex align-items-center"
      aria-label="Buka halaman Profil"
      title="Profil Saya"
    >
      <Avatar
        type="image"
        src={avatarSrc}
        size="sm"
        alt="User Avatar"
        className="rounded-circle"
      />
    </Link>
  );
};

export default UserMenu;