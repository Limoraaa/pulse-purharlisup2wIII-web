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

export default function PermissionMatrix() {
  const [roles, setRoles] = useState<RoleMatrix[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Daftar menu navbar sesuai urutan di sidebar aplikasi Anda
  const navbars = [
    { key: 'view_dashboard', label: 'Dashboard' },
    { key: 'view_inventaris', label: 'Inventaris' },
    { key: 'view_transaksi', label: 'Transaksi' },
    { key: 'view_riwayat', label: 'Riwayat' },
    { key: 'view_order', label: 'Pengajuan Order' },
    { key: 'view_pemeliharaan', label: 'Laporan Kerusakan' },
    { key: 'view_users', label: 'Manajemen User' },
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
                const hasNoPermissions = !isSuperAdmin && role.permissions.length === 0;
                const badgeVariant = roleBadgeVariant[role.name] ?? 'secondary';

                return (
                  <tr key={role.id}>
                    <td className="py-3 px-4">
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg={`${badgeVariant}-subtle`} text={`${badgeVariant}-emphasis` as any}>
                          {role.name}
                        </Badge>
                        {isSuperAdmin && (
                          <span title="Super Admin memiliki akses penuh permanen">
                            <IconShieldLock size={15} className="text-muted" />
                          </span>
                        )}
                        {hasNoPermissions && (
                          <Badge bg="light" text="secondary" className="fw-normal border">
                            Belum ada izin
                          </Badge>
                        )}
                      </div>
                    </td>
                    {navbars.map((nav) => {
                      const isChecked = role.permissions.includes(nav.key);

                      return (
                        <td key={nav.key} className="py-3 px-3 text-center">
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
                        </td>
                      );
                    })}
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