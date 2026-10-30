"use client";

// import node module libraries
import { useEffect, useState } from "react";
import { Nav } from "react-bootstrap";
import { IconShieldLock, IconUsers } from "@tabler/icons-react";

// import custom components
import DataUserManager from "components/ruangtools/datauser/DataUserManager";
import PermissionMatrix from "components/ruangtools/datauser/PermissionMatrix";
import api from "lib/api";

export default function DataUserPage() {
  const [key, setKey] = useState("users");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    api("/user")
      .then((res: any) => {
        const data = res?.data || res;
        const roles: string[] = (data?.roles || []).map((r: any) => r.name ?? r);
        setIsSuperAdmin(roles.includes("Super Admin"));
      })
      .catch(() => setIsSuperAdmin(false));
  }, []);

  return (
    <div className="manajemen-user-page">
      <div className="mb-4">
        <h1 className="mb-2 h2">Manajemen User</h1>
        <p className="text-secondary mb-0">
          Mengelola akun pengguna sistem{isSuperAdmin ? " dan pengaturan hak akses tiap role" : ""}.
        </p>
      </div>

      {/* Tab hanya tampil kalau ada lebih dari satu menu (Pengaturan Hak Akses khusus Super Admin) */}
      {isSuperAdmin && (
        <Nav variant="underline" activeKey={key} onSelect={(k) => setKey(k || "users")} className="manajemen-user-tabs mb-4">
          <Nav.Item>
            <Nav.Link eventKey="users" className="d-flex align-items-center gap-2">
              <IconUsers size={18} /> Daftar Pengguna
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="permissions" className="d-flex align-items-center gap-2">
              <IconShieldLock size={18} /> Pengaturan Hak Akses
            </Nav.Link>
          </Nav.Item>
        </Nav>
      )}

      {/* Kedua tab tetap terpasang agar perubahan matriks yang belum disimpan tidak hilang saat pindah tab */}
      <div className={key === "users" || !isSuperAdmin ? "" : "d-none"}>
        <DataUserManager />
      </div>
      {isSuperAdmin && (
        <div className={key === "permissions" ? "" : "d-none"}>
          <PermissionMatrix />
        </div>
      )}
    </div>
  );
}
