"use client";

// import node module libraries
import { useState } from "react";
import { Tabs, Tab } from "react-bootstrap";

// import custom components
import DataUserManager from "components/ruangtools/datauser/DataUserManager";
import PermissionMatrix from "components/ruangtools/datauser/PermissionMatrix";

export default function DataUserPage() {
  const [key, setKey] = useState("users");

  return (
    <div className="p-6 animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen User</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Mengelola seluruh akun pengguna sistem dan hak akses matriks.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <Tabs
          id="manajemen-user-tabs"
          activeKey={key}
          onSelect={(k) => setKey(k || "users")}
          className="mb-4 border-b border-gray-200 dark:border-slate-700"
        >
          {/* TAB 1: Daftar Akun Pengguna */}
          <Tab eventKey="users" title="👥 Daftar Pengguna">
            <div className="pt-3">
              <DataUserManager />
            </div>
          </Tab>

          {/* TAB 2: Pengaturan Hak Akses / Permission Matrix */}
          <Tab eventKey="permissions" title="🔐 Pengaturan Hak Akses">
            <div className="pt-3">
              <PermissionMatrix />
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}