'use client';

import { useEffect, useState } from 'react';
import { Form, Spinner, Button, Card, Row, Col, Alert, Badge, Modal } from 'react-bootstrap';
import { IconDeviceFloppy, IconShieldLock, IconCircleCheck, IconTrash, IconPencil, IconCheck, IconX } from '@tabler/icons-react';
import api from '/lib/api';
import { useFeedback } from "components/common/FeedbackProvider";

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
// catatPerms  = (opsional) level "Isi catatan": hanya halaman catatan & tambah catatan,
//               tanpa permission lihat (view) sehingga menu lain di modul tidak muncul.
// Lebar kolom matriks (px). Kolom role dibuat tetap agar dropdown tidak terpotong saat role bertambah.
const MODULE_COL_WIDTH = 260;
const ROLE_COL_WIDTH = 165;
// Warna latar header bagian, senada dengan judul grup di sidebar
const SECTION_BG = '#E8F4F8';

interface ModuleConfig {
  key: string;
  label: string;
  hint?: string;
  type: 'switch' | 'dropdown';
  managePerms?: string[];
  catatPerms?: string[];
}

type ModuleLevel = 'none' | 'view' | 'catat' | 'manage';

export default function PermissionMatrix() {
  const { notify } = useFeedback();
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
  const [roleToDelete, setRoleToDelete] = useState<{ id: number; name: string } | null>(null);

  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [editNameError, setEditNameError] = useState<string | null>(null);

  // Daftar modul dikelompokkan persis seperti bagian di sidebar.
  // hint = halaman yang ikut diatur oleh modul tersebut (ditampilkan kecil di bawah nama modul).
  const sections: { title: string; modules: ModuleConfig[] }[] = [
    {
      title: 'Operasional Alat',
      modules: [
        { key: 'view_dashboard', label: 'Dashboard', hint: 'Ringkasan operasional alat', type: 'switch' },
        { key: 'view_inventaris', label: 'Inventaris', hint: 'Data Tools, Data Consumable, Data Peminjam, Data Pekerjaan', type: 'dropdown', managePerms: ['manage_inventaris', 'manage_master_data'] },
        { key: 'view_transaksi', label: 'Transaksi', hint: 'Peminjaman Aktif, Pengembalian Alat, Consumable Masuk, Tools Masuk', type: 'dropdown', managePerms: ['process_transaksi', 'manage_transaksi'] },
        { key: 'view_riwayat', label: 'Riwayat', hint: 'Peminjaman Tools, Consumable Keluar, Riwayat Perbaikan', type: 'switch' },
        { key: 'view_order', label: 'Pengajuan Order', hint: 'Order Consumable, Order Tools', type: 'dropdown', managePerms: ['create_order', 'process_order', 'manage_order'] },
        { key: 'view_kerusakan_alat', label: 'Laporan Kerusakan Alat', hint: 'Pelaporan dan penanganan kerusakan alat', type: 'dropdown', managePerms: ['create_kerusakan_alat', 'process_kerusakan_alat', 'manage_kerusakan_alat'] },
      ],
    },
    {
      title: 'Manajemen Mesin Produksi',
      modules: [
        { key: 'view_dashboard_pemeliharaan', label: 'Dashboard Mesin', hint: 'Ringkasan pemeliharaan dan kondisi mesin', type: 'switch' },
        {
          key: 'view_data_mesin',
          label: 'Data Mesin',
          hint: 'Tambah, edit, nonaktifkan, dan hapus mesin',
          type: 'dropdown',
          managePerms: ['manage_data_mesin'],
        },
        {
          key: 'view_operasional_mesin',
          label: 'Operasional',
          hint: 'Plotting Jadwal Operasional, Catatan Aktivitas Mesin. "Isi catatan": hanya Catatan Aktivitas (tambah saja)',
          type: 'dropdown',
          managePerms: ['process_operasional_mesin', 'manage_operasional_mesin'],
          catatPerms: ['process_operasional_mesin'],
        },
        {
          key: 'view_pemeliharaan_mesin',
          label: 'Pemeliharaan',
          hint: 'Kalibrasi, Rencana Pemeliharaan, Catatan Pemeliharaan, Laporan Anggaran & Vendor. "Isi catatan": hanya Catatan Pemeliharaan (tambah saja)',
          type: 'dropdown',
          managePerms: ['process_pemeliharaan_mesin', 'manage_pemeliharaan_mesin'],
          catatPerms: ['process_pemeliharaan_mesin'],
        },
      ],
    },
    {
      title: 'Pemeliharaan Motor Konversi',
      modules: [
        { key: 'view_dashboard_pemeliharaan_motor_konversi', label: 'Dashboard Pemeliharaan', hint: 'Ringkasan pemeliharaan motor konversi', type: 'switch' },
        {
          key: 'view_pemeliharaan_motor_konversi',
          label: 'Pemeliharaan Motor Konversi',
          hint: 'Data motor konversi dan catatan pemeliharaannya',
          type: 'dropdown',
          managePerms: ['process_pemeliharaan_motor_konversi', 'manage_pemeliharaan_motor_konversi'],
        },
      ],
    },
    {
      title: 'Administrasi',
      modules: [{ key: 'view_users', label: 'Manajemen User', hint: 'Daftar Pengguna', type: 'dropdown', managePerms: ['manage_users'] }],
    },
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
      window.dispatchEvent(new Event('roles-updated'));
      showSuccess(`Role "${created.name}" berhasil dibuat. Atur hak aksesnya di tabel di bawah.`);
    } catch (error: any) {
      setAddRoleError(error?.message || 'Gagal membuat role baru.');
    } finally {
      setAddingRole(false);
    }
  };

const startEditName = (role: RoleMatrix) => {
    setEditingRoleId(role.id);
    setEditingName(role.name);
    setEditNameError(null);
  };

  const cancelEditName = () => {
    setEditingRoleId(null);
    setEditingName('');
    setEditNameError(null);
  };

  const saveEditName = async (roleId: number) => {
    const name = editingName.trim();
    if (!name) {
      setEditNameError('Nama role tidak boleh kosong.');
      return;
    }

    setSavingName(true);
    setEditNameError(null);
    try {
      const res: any = await api(`/roles/${roleId}/name`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
      const updated = res?.data || res;
      setRoles((prev) => prev.map((r) => (r.id === roleId ? { ...r, name: updated?.name ?? name } : r)));
      window.dispatchEvent(new Event('roles-updated'));
      setEditingRoleId(null);
      setEditingName('');
      showSuccess('Nama role berhasil diperbarui.');
    } catch (error: any) {
      setEditNameError(error?.message || 'Gagal mengubah nama role.');
    } finally {
      setSavingName(false);
    }
  };

  const handleColorChange = async (roleId: number, color: string) => {
    setRoles((prev) => prev.map((r) => (r.id === roleId ? { ...r, color } : r)));
    try {
      await api(`/roles/${roleId}/color`, {
        method: 'PATCH',
        body: JSON.stringify({ color }),
      });
      window.dispatchEvent(new Event('roles-updated'));
    } catch (error) {
      console.error('Gagal menyimpan warna role', error);
    }
  };

 const handleDeleteRole = (roleId: number, roleName: string) => {
    setRoleToDelete({ id: roleId, name: roleName });
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;
    const { id: roleId, name: roleName } = roleToDelete;

    setDeletingRoleId(roleId);
    setDeleteError(null);
    try {
      await api(`/roles/${roleId}`, { method: 'DELETE' });
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
      window.dispatchEvent(new Event('roles-updated'));
      showSuccess(`Role "${roleName}" berhasil dihapus.`);
    } catch (error: any) {
      setDeleteError(error?.message || 'Gagal menghapus role.');
      setTimeout(() => setDeleteError(null), 5000);
    } finally {
      setDeletingRoleId(null);
      setRoleToDelete(null);
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

  // Menentukan level akses modul saat ini: 'none' | 'view' | 'catat' | 'manage'
  const getModuleLevel = (role: RoleMatrix, nav: ModuleConfig): ModuleLevel => {
    const catatPerms = nav.catatPerms || [];
    // Permission khusus "Kelola penuh" (di luar permission level Isi catatan)
    const khususKelola = (nav.managePerms || []).filter((p) => !catatPerms.includes(p));
    if (khususKelola.some((p) => role.permissions.includes(p))) return 'manage';
    if (role.permissions.includes(nav.key)) return 'view';
    if (catatPerms.some((p) => role.permissions.includes(p))) return 'catat';
    return 'none';
  };

  const handleDropdownChange = (roleId: number, nav: ModuleConfig, level: ModuleLevel) => {
    setRoles((prevRoles) =>
      prevRoles.map((role) => {
        if (role.id !== roleId) return role;

        const managePerms = nav.managePerms || [];
        const catatPerms = nav.catatPerms || [];
        let newPerms = role.permissions.filter((p) => p !== nav.key && !managePerms.includes(p) && !catatPerms.includes(p));

        if (level === 'view') {
          newPerms = [...newPerms, nav.key];
        } else if (level === 'catat') {
          newPerms = [...newPerms, ...catatPerms];
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
        onChange={(e) => handleDropdownChange(role.id, nav, e.target.value as ModuleLevel)}
        style={{ cursor: isSuperAdmin ? 'not-allowed' : 'pointer', width: '100%' }}
      >
        <option value="none">Tidak ada akses</option>
        <option value="view">Lihat saja</option>
        {nav.catatPerms && <option value="catat">Isi catatan</option>}
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
      notify('Terjadi kesalahan saat menyimpan data.');
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
              <p className="text-secondary mb-0">
                Atur hak akses modul navigasi untuk masing-masing peran (Role) pengguna.
              </p>
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

      {/* Satu tabel untuk semua modul: baris = modul (dikelompokkan seperti sidebar), kolom = role.
          Lebar kolom role tetap, jadi kalau role banyak tabel bisa digeser ke samping. */}
      <div className="d-flex flex-wrap gap-3 text-secondary small mb-3">
        <span><strong className="text-dark">Lihat saja</strong>: hanya bisa melihat data</span>
        <span><strong className="text-dark">Isi catatan</strong>: hanya halaman catatan, bisa menambah catatan (untuk pekerja &amp; vendor)</span>
        <span><strong className="text-dark">Kelola penuh</strong>: bisa tambah, ubah, dan hapus</span>
        <span>Super Admin selalu memiliki akses penuh</span>
        {roles.length > 5 && <span className="ms-md-auto fst-italic">Geser tabel ke kanan untuk melihat role lainnya →</span>}
      </div>
      <Card className="card-lg mb-6 border shadow-sm overflow-hidden">
        {/* maxHeight membuat scrollbar horizontal selalu terlihat tanpa harus scroll ke bawah tabel */}
        <div className="table-responsive" style={{ maxHeight: '75vh' }}>
          <table
            className="table align-middle mb-0"
            style={{ tableLayout: 'fixed', width: MODULE_COL_WIDTH + roles.length * ROLE_COL_WIDTH, minWidth: '100%' }}
          >
            <colgroup>
              <col style={{ width: MODULE_COL_WIDTH }} />
              {roles.map((role) => (
                <col key={role.id} style={{ width: ROLE_COL_WIDTH }} />
              ))}
            </colgroup>
            {sections.map((section) => (
              <tbody key={section.title}>
                {/* Header tiap bagian: nama bagian + nama role, supaya role selalu terlihat di atas modulnya */}
                <tr>
                  <th
                    className="py-3 px-4 text-uppercase small fw-bold"
                    style={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 2,
                      backgroundColor: SECTION_BG,
                      boxShadow: 'inset 4px 0 0 #FDB913',
                      color: '#0A6C8F',
                      letterSpacing: '0.6px',
                    }}
                  >
                    {section.title}
                  </th>
                  {roles.map((role) => {
                    const badgeVariant = role.color ?? 'secondary';
                    return (
                      <th key={role.id} className="py-3 px-2 text-center" style={{ backgroundColor: SECTION_BG }}>
                        <Badge
                          bg={`${badgeVariant}-subtle`}
                          text={`${badgeVariant}-emphasis` as any}
                          className="text-wrap"
                          style={{ lineHeight: 1.3 }}
                        >
                          {roleDisplayLabel[role.name] ?? role.name}
                        </Badge>
                      </th>
                    );
                  })}
                </tr>
                {section.modules.map((nav) => (
                  <tr key={nav.key}>
                    <td
                      className="py-3 px-4"
                      style={{ position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'var(--bs-card-bg, #fff)' }}
                    >
                      <div className="fw-semibold text-dark">{nav.label}</div>
                      {nav.hint && <div className="text-secondary small text-wrap">{nav.hint}</div>}
                    </td>
                    {roles.map((role) => (
                      <td key={role.id} className="py-3 px-2 text-center">
                        {renderModuleCell(role, nav, role.name === 'Super Admin')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
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
          {deleteError && (
            <Alert variant="danger" className="mb-2" dismissible onClose={() => setDeleteError(null)}>
              {deleteError}
            </Alert>
          )}
          <div className="d-flex flex-column gap-2">
            {roles.filter((r) => r.name !== 'Super Admin').map((role) => (
              <div key={role.id} className="border rounded p-2">
                <div className="d-flex align-items-center justify-content-between">
                  {editingRoleId === role.id ? (
                    <div className="d-flex align-items-center gap-2 flex-grow-1 me-2">
                      <Form.Control
                        size="sm"
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditName(role.id);
                          if (e.key === 'Escape') cancelEditName();
                        }}
                        autoFocus
                        disabled={savingName}
                      />
                      <Button
                        variant="link"
                        size="sm"
                        className="text-success p-0"
                        onClick={() => saveEditName(role.id)}
                        disabled={savingName}
                        title="Simpan nama"
                      >
                        {savingName ? <Spinner size="sm" animation="border" /> : <IconCheck size={18} />}
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-secondary p-0"
                        onClick={cancelEditName}
                        disabled={savingName}
                        title="Batal"
                      >
                        <IconX size={18} />
                      </Button>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg={`${role.color ?? 'secondary'}-subtle`} text={`${role.color ?? 'secondary'}-emphasis` as any}>
                        {roleDisplayLabel[role.name] ?? role.name}
                      </Badge>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-secondary p-0"
                        onClick={() => startEditName(role)}
                        title="Ubah nama role"
                      >
                        <IconPencil size={14} />
                      </Button>
                    </div>
                  )}

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
                {editingRoleId === role.id && editNameError && (
                  <div className="text-danger small mt-1">{editNameError}</div>
                )}
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

      {/* Modal Konfirmasi Hapus Role */}
      <Modal show={!!roleToDelete} onHide={() => setRoleToDelete(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Hapus Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Hapus role <strong>&quot;{roleToDelete?.name}&quot;</strong>? Tindakan ini tidak dapat dibatalkan.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setRoleToDelete(null)} disabled={deletingRoleId !== null}>
            Batal
          </Button>
          <Button variant="danger" onClick={confirmDeleteRole} disabled={deletingRoleId !== null}>
            {deletingRoleId !== null ? <><Spinner size="sm" animation="border" /> Menghapus...</> : 'Hapus Role'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}