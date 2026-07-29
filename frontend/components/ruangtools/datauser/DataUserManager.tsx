"use client";
import { useEffect, useMemo, useState } from "react";
import { getProfile } from "services/profileService";
import {
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Spinner,
  Alert,
  InputGroup,
  Form,
} from "react-bootstrap";
import {
  IconPlus,
  IconCircleCheck,
  IconSearch,
  IconX,
  IconUsers,
  IconMoodEmpty,
} from "@tabler/icons-react";

import { UserItemType, UserFormValues } from "types/DataUserTypes";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} from "services/userService";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import { getDataUserColumns } from "components/ruangtools/datauser/ColumnDefination";
import UserFormModal from "components/ruangtools/datauser/UserFormModal";
import DeleteConfirmModal from "components/ruangtools/datauser/DeleteConfirmModal";
import ResetPasswordModal from "components/ruangtools/datauser/ResetPasswordModal";

const DataUserManager = () => {
  const [users, setUsers] = useState<UserItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<UserItemType | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
        .then((data) => {
        setIsAdmin(data.role === "super_admin");
        localStorage.setItem("userRole", data.role);
        })
        .catch(() => {
        // Fallback kalau fetch gagal (misal offline sesaat) -- pakai data lama dulu
        const role = localStorage.getItem("userRole");
        setIsAdmin(role === "super_admin");
        });
    }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return users.filter(
      (u) =>
        keyword === "" ||
        u.full_name.toLowerCase().includes(keyword) ||
        u.email.toLowerCase().includes(keyword)
    );
  }, [users, searchTerm]);

  const openAddModal = () => {
    setActiveUser(null);
    setFormError(null);
    setFormModalOpen(true);
  };

  const openEditModal = (user: UserItemType) => {
    setActiveUser(user);
    setFormError(null);
    setFormModalOpen(true);
  };

  const openDeleteModal = (user: UserItemType) => {
    setActiveUser(user);
    setDeleteModalOpen(true);
  };

  const openResetModal = (user: UserItemType) => {
    setActiveUser(user);
    setResetError(null);
    setResetModalOpen(true);
  };

  const handleFormSubmit = async (values: UserFormValues) => {
    setFormError(null);
    try {
      if (activeUser) {
        const updated = await updateUser(activeUser.id, values, isAdmin);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        showSuccess("User berhasil diperbarui.");
      } else {
        const created = await createUser(values, isAdmin);
        setUsers((prev) => [...prev, created]);
        showSuccess("User baru berhasil ditambahkan.");
      }
      setFormModalOpen(false);
      setActiveUser(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan data user");
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeUser) return;
    try {
      await deleteUser(activeUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== activeUser.id));
      showSuccess("User berhasil dihapus.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus user");
    } finally {
      setDeleteModalOpen(false);
      setActiveUser(null);
    }
  };

  const handleResetSubmit = async (passwordBaru: string, konfirmasi: string) => {
    if (!activeUser) return;
    setResetError(null);
    setResetSubmitting(true);
    try {
      await resetUserPassword(activeUser.id, {
        password_baru: passwordBaru,
        password_baru_confirmation: konfirmasi,
      });
      showSuccess(`Password untuk ${activeUser.full_name} berhasil direset.`);
      setResetModalOpen(false);
      setActiveUser(null);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Gagal mereset password");
    } finally {
      setResetSubmitting(false);
    }
  };

  const columns = useMemo(
    () =>
      getDataUserColumns({
        isAdmin,
        onEdit: openEditModal,
        onDelete: openDeleteModal,
        onResetPassword: openResetModal,
      }),
    [isAdmin]
  );

  return (
    <div className="datatools-page">
      {successMessage && (
        <Alert
          variant="success"
          className="d-flex align-items-center gap-2"
          dismissible
          onClose={() => setSuccessMessage(null)}
        >
          <IconCircleCheck size={20} />
          {successMessage}
        </Alert>
      )}

      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-4 w-100" breakpoint="md">
            <div>
              <h1 className="mb-2 h2">Manajemen User</h1>
              <p className="text-secondary mb-0">
                {isAdmin
                  ? "Mengelola seluruh akun pengguna sistem."
                  : "Mengelola akun pengguna baru untuk sistem."}
              </p>
              <DasherBreadcrumb />
            </div>
            <div>
              <Button variant="primary" className="d-flex align-items-center gap-2" onClick={openAddModal}>
                <IconPlus size={18} />
                Tambah User
              </Button>
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6">
        <div className="datatools-toolbar border-bottom">
          <Row className="g-2 align-items-center">
            <Col lg={6} md={7}>
              <InputGroup className="datatools-search">
                <InputGroup.Text>
                  <IconSearch size={18} />
                </InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Cari nama atau email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button variant="link" className="datatools-search-clear" onClick={() => setSearchTerm("")}>
                    <IconX size={16} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col lg={6} md={5} className="text-md-end">
              <span className="text-secondary small">
                Menampilkan <span className="fw-semibold text-body">{filteredUsers.length}</span> dari {users.length} data
              </span>
            </Col>
          </Row>
        </div>

        <CardBody>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" /> Memuat data...
            </div>
          ) : users.length === 0 ? (
            <div className="datatools-empty text-center py-6">
              <div className="datatools-empty-icon mb-3">
                <IconUsers size={32} />
              </div>
              <h5 className="mb-1">Belum ada data user</h5>
              <p className="text-secondary mb-4">Mulai dengan menambahkan user pertama.</p>
              <Button variant="primary" className="d-inline-flex align-items-center gap-2" onClick={openAddModal}>
                <IconPlus size={18} /> Tambah User
              </Button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="datatools-empty text-center py-6">
              <div className="datatools-empty-icon mb-3">
                <IconMoodEmpty size={32} />
              </div>
              <h5 className="mb-1">Tidak ada hasil</h5>
              <p className="text-secondary mb-4">Tidak ditemukan user yang cocok dengan pencarian.</p>
              <Button variant="outline-secondary" className="d-inline-flex align-items-center gap-2" onClick={() => setSearchTerm("")}>
                <IconX size={18} /> Reset Pencarian
              </Button>
            </div>
          ) : (
            <TanstackTable data={filteredUsers} columns={columns} pagination isSortable />
          )}
        </CardBody>
      </Card>

      <UserFormModal
        show={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setActiveUser(null);
          setFormError(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={activeUser}
        isAdmin={isAdmin}
        error={formError}
      />

      <DeleteConfirmModal
        show={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setActiveUser(null);
        }}
        onConfirm={handleConfirmDelete}
        user={activeUser}
      />

      <ResetPasswordModal
        show={resetModalOpen}
        onClose={() => {
          setResetModalOpen(false);
          setActiveUser(null);
          setResetError(null);
        }}
        onSubmit={handleResetSubmit}
        user={activeUser}
        error={resetError}
        submitting={resetSubmitting}
      />
    </div>
  );
};

export default DataUserManager;