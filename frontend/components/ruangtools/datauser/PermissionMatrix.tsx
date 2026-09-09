'use client';

import { useEffect, useState } from 'react';
import { Form, Spinner, Button, Card, Row, Col, Alert, Badge, Breadcrumb } from 'react-bootstrap';
import { IconDeviceFloppy, IconShieldLock, IconCircleCheck } from '@tabler/icons-react';
import api from '/lib/api';

interface RoleMatrix {
  id: number;
  name: string;
  permissions: string[];
}

// 'switch' = modul cuma punya 1 permission (on/off biasa).
// 'dropdown' = modul punya level "Lihat saja" vs "Kelola penuh".
// managePerms = permission tambahan yang ikut aktif kalau pilih "Kelola penuh".
interface ModuleConfig {
  key: string;
  label: string;
  type: 'switch' | 'dropdown';
  managePerms?: string[];
}

export default function PermissionMatrix() {
  const [roles, setRoles] = useState<RoleMatrix[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Daftar menu navbar sesuai urutan di sidebar aplikasi Anda
  const navbars: ModuleConfig[] = [
    { key: 'view_dashboard', label: 'Dashboard', type: 'switch' },
    { key: 'view_inventaris', label: 'Inventaris', type: 'dropdown', managePerms: ['manage_inventaris'] },
    { key: 'view_transaksi', label: 'Transaksi', type: 'dropdown', managePerms: ['process_transaksi', 'manage_transaksi'] },
    { key: 'view_riwayat', label: 'Riwayat', type: 'switch' },
    { key: 'view_order', label: 'Pengajuan Order', type: 'dropdown', managePerms: ['create_order', 'process_order', 'manage_order'] },
    { key: 'view_kerusakan_alat', label: 'Laporan Kerusakan Alat', type: 'dropdown', managePerms: ['create_kerusakan_alat', 'process_kerusakan_alat', 'manage_kerusakan_alat'] },
  ];
    const pemeliharaanNavbars: ModuleConfig[] = [
    {
      key: 'view_pemeliharaan_mesin',
      label: 'Pemeliharaan Mesin',
      type: 'dropdown',
      managePerms: ['process_pemeliharaan_mesin', 'manage_pemeliharaan_mesin'],
    },
  ];
  const administrasiNavbars: ModuleConfig[] = [
    { key: 'view_users', label: 'Manajemen User', type: 'dropdown', managePerms: ['manage_users'] },
  ];

  // Sama seperti mapping warna badge ROLE di tab Daftar Pengguna,
  // supaya nama role di kedua tab konsisten secara visual.
    const roleBadgeVariant: Record<string, string> = {
    Pegawai: 'info',
    Staff: 'success',
    Admin: 'success',
    'Super Admin': 'warning',
    'Team Leader': 'secondary',
  };

  // Teks yang ditampilkan di badge boleh beda dari nama role asli di database.
  // Key (sisi kiri) HARUS tetap sama persis dengan nama role di database.
  const roleDisplayLabel: Record<string, string> = {
    Pegawai: 'Pegawai',
    Staff: 'Staff Tools',
    Admin: 'Admin',
    'Team Leader': 'Team Leader',
    'Super Admin': 'Super Admin',
  };

  const fetchMatrix = async () => {
    try {
      const res: any = await api('/permissions/matrix');
      const data = res?.data?.data || res?.data || res || [];
      setRoles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Gagal memuat matriks', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const handleToggle = (roleId: number, permKey: string) => {
    setRoles((prevRoles) =>
      prevRoles.map((role) => {
        if (role.id === roleId) {
          const hasPerm = role.permissions.includes(permKey);
          const newPerms = hasPerm
            ? role.permissions.filter((p) => p !== permKey)
            : [...role.permissions, permKey];

          return { ...role, permissions: newPerms };
        }
        return role;
      })
    );
  };

  // Menentukan level akses modul saat ini: 'none' | 'view' | 'manage'
  const getModuleLevel = (role: RoleMatrix, nav: ModuleConfig): 'none' | 'view' | 'manage' => {
    if (nav.managePerms && nav.managePerms.some((p) => role.permissions.includes(p))) return 'manage';
    if (role.permissions.includes(nav.key)) return 'view';
    return 'none';
  };

  const handleDropdownChange = (roleId: number, nav: ModuleConfig, level: 'none' | 'view' | 'manage') => {
    setRoles((prevRoles) =>
      prevRoles.map((role) => {
        if (role.id !== roleId) return role;

        const managePerms = nav.managePerms || [];
        let newPerms = role.permissions.filter((p) => p !== nav.key && !managePerms.includes(p));

        if (level === 'view') {
          newPerms = [...newPerms, nav.key];
        } else if (level === 'manage') {
          newPerms = [...newPerms, nav.key, ...managePerms];
        }

        return { ...role, permissions: newPerms };
      })
    );
  };

  // Render cell tabel: switch biasa untuk modul 1-permission,
  // dropdown 3 level untuk modul yang punya pemisahan lihat/kelola.
  const renderModuleCell = (role: RoleMatrix, nav: ModuleConfig, isSuperAdmin: boolean) => {
    if (nav.type === 'switch') {
      const isChecked = role.permissions.includes(nav.key);
      return (
        <div className="d-flex justify-content-center">
          <Form.Check
            type="switch"
            id={`switch-${role.id}-${nav.key}`}
            checked={isSuperAdmin ? true : isChecked}
            disabled={isSuperAdmin}
            onChange={() => handleToggle(role.id, nav.key)}
            style={{
              cursor: isSuperAdmin ? 'not-allowed' : 'pointer',
              transform: 'scale(1.1)',
            }}
          />
        </div>
      );
    }

    const level = isSuperAdmin ? 'manage' : getModuleLevel(role, nav);
    return (
      <Form.Select
        size="sm"
        value={level}
        disabled={isSuperAdmin}
        onChange={(e) => handleDropdownChange(role.id, nav, e.target.value as 'none' | 'view' | 'manage')}
        style={{ cursor: isSuperAdmin ? 'not-allowed' : 'pointer', minWidth: '150px', margin: '0 auto' }}
      >
        <option value="none">Tidak ada akses</option>
        <option value="view">Lihat saja</option>
        <option value="manage">Kelola penuh</option>
      </Form.Select>
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api('/permissions/matrix', {
        method: 'PUT',
        body: JSON.stringify({ roles: roles }),
      });
      setSuccessMessage('Matriks hak akses berhasil diperbarui!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error('Gagal menyimpan matriks', error);
      alert('Terjadi kesalahan saat menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div>
      {successMessage && (
        <Alert
          variant="success"
          className="d-flex align-items-center gap-2 mb-4"
          dismissible
          onClose={() => setSuccessMessage(null)}
        >
          <IconCircleCheck size={20} />
          {successMessage}
        </Alert>
      )}

      {/* Header Halaman & Tombol Simpan */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h1 className="mb-2 h2">Manajemen User</h1>
              <p className="text-secondary mb-2">
                Atur hak akses modul navigasi untuk masing-masing peran (Role) pengguna.
              </p>
              {/* Breadcrumb — menyamakan posisi & gaya dengan tab Daftar Pengguna */}
              <Breadcrumb className="mb-0 small">
                <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                <Breadcrumb.Item active>Hak Akses</Breadcrumb.Item>
              </Breadcrumb>
            </div>
            <div>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={saving}
                className="d-flex align-items-center gap-2"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" animation="border" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <IconDeviceFloppy size={18} /> Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Kontainer Card Utama (Persis seperti tampilan tabel pada Daftar Pengguna) */}
      <div className="text-uppercase text-secondary fs-7 fw-semibold mb-2 mt-1">
        Operasional Alat
      </div>
      <Card className="card-lg mb-6 border shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 text-nowrap">
            <thead className="table-light text-uppercase fs-7 text-secondary border-bottom">
              <tr>
                <th className="py-3 px-4 fw-semibold" style={{ width: '220px' }}>
                  Role Pengguna
                </th>
                {navbars.map((nav) => (
                  <th key={nav.key} className="py-3 px-3 text-center fw-semibold">
                    {nav.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => {
                const isSuperAdmin = role.name === 'Super Admin';
                const badgeVariant = roleBadgeVariant[role.name] ?? 'secondary';

                return (
                  <tr key={role.id}>
                    <td className="py-3 px-4">
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg={`${badgeVariant}-subtle`} text={`${badgeVariant}-emphasis` as any}>
                          {roleDisplayLabel[role.name] ?? role.name}
                        </Badge>
                      </div>
                    </td>
                    {navbars.map((nav) => (
                      <td key={nav.key} className="py-3 px-3 text-center">
                        {renderModuleCell(role, nav, isSuperAdmin)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
                    </table>
        </div>
      </Card>

      {/* Section terpisah: domain Pemeliharaan Mesin, di luar Operasional Alat */}
      <div className="text-uppercase text-secondary fs-7 fw-semibold mb-2 mt-1">
        Pemeliharaan Mesin
      </div>
      <Card className="card-lg mb-6 border shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 text-nowrap">
            <thead className="table-light text-uppercase fs-7 text-secondary border-bottom">
              <tr>
                <th className="py-3 px-4 fw-semibold" style={{ width: '220px' }}>
                  Role Pengguna
                </th>
                {pemeliharaanNavbars.map((nav) => (
                  <th key={nav.key} className="py-3 px-3 text-center fw-semibold">
                    {nav.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => {
                const isSuperAdmin = role.name === 'Super Admin';
                const badgeVariant = roleBadgeVariant[role.name] ?? 'secondary';

                return (
                  <tr key={role.id}>
                    <td className="py-3 px-4">
                      <Badge bg={`${badgeVariant}-subtle`} text={`${badgeVariant}-emphasis` as any}>
                        {roleDisplayLabel[role.name] ?? role.name}
                      </Badge>
                    </td>
                    {pemeliharaanNavbars.map((nav) => (
                      <td key={nav.key} className="py-3 px-3 text-center">
                        {renderModuleCell(role, nav, isSuperAdmin)}
                      </td>
                    ))}
                  </tr>
                );
              })}
                        </tbody>
          </table>
        </div>
      </Card>

      {/* Section terpisah: domain Administrasi (akun & hak akses) */}
      <div className="text-uppercase text-secondary fs-7 fw-semibold mb-2 mt-1">
        Administrasi
      </div>
      <Card className="card-lg mb-6 border shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 text-nowrap">
            <thead className="table-light text-uppercase fs-7 text-secondary border-bottom">
              <tr>
                <th className="py-3 px-4 fw-semibold" style={{ width: '220px' }}>
                  Role Pengguna
                </th>
                {administrasiNavbars.map((nav) => (
                  <th key={nav.key} className="py-3 px-3 text-center fw-semibold">
                    {nav.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => {
                const isSuperAdmin = role.name === 'Super Admin';
                const badgeVariant = roleBadgeVariant[role.name] ?? 'secondary';

                return (
                  <tr key={role.id}>
                    <td className="py-3 px-4">
                      <Badge bg={`${badgeVariant}-subtle`} text={`${badgeVariant}-emphasis` as any}>
                        {roleDisplayLabel[role.name] ?? role.name}
                      </Badge>
                    </td>
                    {administrasiNavbars.map((nav) => (
                      <td key={nav.key} className="py-3 px-3 text-center">
                        {renderModuleCell(role, nav, isSuperAdmin)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}