'use client';

import { useEffect, useState } from 'react';
import { Form, Spinner, Button, Card, Row, Col, Alert, Badge, Breadcrumb, Modal, Dropdown } from 'react-bootstrap';
import { IconDeviceFloppy, IconShieldLock, IconCircleCheck, IconPlus, IconTrash, IconDotsVertical, IconPalette } from '@tabler/icons-react';
import api from '/lib/api';

interface RoleMatrix {
  id: number;
  name: string;
  color?: string;
  permissions: string[];
}

const AVAILABLE_COLORS = [
  { value: 'primary', label: 'Biru' },
  { value: 'success', label: 'Hijau' },
  { value: 'info', label: 'Cyan' },
  { value: 'warning', label: 'Kuning' },
  { value: 'danger', label: 'Merah' },
  { value: 'secondary', label: 'Abu-abu' },
  { value: 'dark', label: 'Gelap' },
];

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

  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('secondary');
  const [addRoleError, setAddRoleError] = useState<string | null>(null);
  const [addingRole, setAddingRole] = useState(false);

  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      key: 'view_dashboard_pemeliharaan',
      label: 'Dashboard Pemeliharaan',
      type: 'switch',
    },
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

  // Teks yang ditampilkan di badge boleh beda dari nama role asli di database.
  // Key (sisi kiri) HARUS tetap sama persis dengan nama role di database.
  const roleDisplayLabel: Record<string, string> = {
    Pegawai: 'Pegawai',
    Staff: 'Staff',
    Admin: 'Admin',
    'Team Leader': 'Team Leader',
    'Super Admin': 'Super Admin',
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
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

  const handleAddRole = async () => {
    const name = newRoleName.trim();
    if (!name) {
      setAddRoleError('Nama role tidak boleh kosong.');
      return;
    }

    setAddingRole(true);
    setAddRoleError(null);
    try {
      const res: any = await api('/roles', {
        method: 'POST',
        body: JSON.stringify({ name, color: newRoleColor }),
      });
      const created = res?.data || res;
      setRoles((prev) => [...prev, { id: created.id, name: created.name, color: created.color, permissions: [] }]);
      setShowAddRoleModal(false);
      setNewRoleName('');
      setNewRoleColor('secondary');
      showSuccess(`Role "${created.name}" berhasil dibuat. Atur hak aksesnya di tabel di bawah.`);
    } catch (error: any) {
      setAddRoleError(error?.message || 'Gagal membuat role baru.');
    } finally {
      setAddingRole(false);
    }
  };

  const handleColorChange = async (roleId: number, color: string) => {
    setRoles((prev) => prev.map((r) => (r.id === roleId ? { ...r, color } : r)));
    try {
      await api(`/roles/${roleId}/color`, {
        method: 'PATCH',
        body: JSON.stringify({ color }),
      });
    } catch (error) {
      console.error('Gagal menyimpan warna role', error);
    }
  };

  const handleDeleteRole = async (roleId: number, roleName: string) => {
    if (!confirm(`Hapus role "${roleName}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    setDeletingRoleId(roleId);
    setDeleteError(null);
    try {
      await api(`/roles/${roleId}`, { method: 'DELETE' });
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
      showSuccess(`Role "${roleName}" berhasil dihapus.`);
    } catch (error: any) {
      setDeleteError(error?.message || 'Gagal menghapus role.');
      setTimeout(() => setDeleteError(null), 5000);
    } finally {
      setDeletingRoleId(null);
    }
  };

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
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                onClick={() => setShowAddRoleModal(true)}
                className="d-flex align-items-center gap-2"
              >
                <IconShieldLock size={18} /> Kelola Role
              </Button>
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
                const badgeVariant = role.color ?? 'secondary';

                return (
                  <tr key={role.id}>
                    <td className="py-3 px-4">
                      <Badge bg={`${badgeVariant}-subtle`} text={`${badgeVariant}-emphasis` as any}>
                        {roleDisplayLabel[role.name] ?? role.name}
                      </Badge>
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
                const badgeVariant = role.color ?? 'secondary';

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
                const badgeVariant = role.color ?? 'secondary';

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
      {/* Modal Tambah Role */}
      <Modal show={showAddRoleModal} onHide={() => { setShowAddRoleModal(false); setAddRoleError(null); setNewRoleName(''); }} centered>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <IconShieldLock size={20} /> Kelola Role
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addRoleError && <Alert variant="danger">{addRoleError}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Nama Role Baru</Form.Label>
            <Form.Control
              type="text"
              placeholder="Contoh: Supervisor Gudang"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
              autoFocus
            />
            <Form.Text className="text-secondary">
              Role baru akan dibuat tanpa hak akses apa pun. Atur hak aksesnya di tabel matrix setelah dibuat.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>Warna Badge</Form.Label>
            <div className="d-flex gap-2 flex-wrap">
              {AVAILABLE_COLORS.map((c) => (
                <span
                  key={c.value}
                  onClick={() => setNewRoleColor(c.value)}
                  title={c.label}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'inline-block',
                    border: newRoleColor === c.value ? '2px solid #333' : '1px solid #ddd',
                  }}
                  className={`bg-${c.value}`}
                />
              ))}
            </div>
          </Form.Group>
          <div className="d-flex justify-content-end mb-4">
            <Button variant="primary" size="sm" onClick={handleAddRole} disabled={addingRole}>
              {addingRole ? <><Spinner size="sm" animation="border" /> Menyimpan...</> : 'Buat Role'}
            </Button>
          </div>

          <hr />

          <Form.Label className="fw-semibold">Role yang Sudah Ada</Form.Label>
          <div className="d-flex flex-column gap-2">
            {roles.filter((r) => r.name !== 'Super Admin').map((role) => (
              <div key={role.id} className="d-flex align-items-center justify-content-between border rounded p-2">
                <Badge bg={`${role.color ?? 'secondary'}-subtle`} text={`${role.color ?? 'secondary'}-emphasis` as any}>
                  {roleDisplayLabel[role.name] ?? role.name}
                </Badge>
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex gap-1">
                    {AVAILABLE_COLORS.map((c) => (
                      <span
                        key={c.value}
                        onClick={() => handleColorChange(role.id, c.value)}
                        title={c.label}
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'inline-block',
                          border: (role.color ?? 'secondary') === c.value ? '2px solid #333' : '1px solid #ddd',
                        }}
                        className={`bg-${c.value}`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-danger p-0"
                    disabled={deletingRoleId === role.id}
                    onClick={() => handleDeleteRole(role.id, role.name)}
                    title="Hapus role"
                  >
                    {deletingRoleId === role.id ? <Spinner size="sm" animation="border" /> : <IconTrash size={16} />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowAddRoleModal(false); setAddRoleError(null); setNewRoleName(''); }}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>

      {deleteError && (
        <Alert variant="danger" className="mt-3" dismissible onClose={() => setDeleteError(null)}>
          {deleteError}
        </Alert>
      )}
    </div>
  );
}