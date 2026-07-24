"use client";
// import node module libraries
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Form,
  Alert,
} from "react-bootstrap";
import {
  IconEdit,
  IconDeviceFloppy,
  IconX,
  IconLock,
  IconCamera,
  IconLogout,
  IconCircleCheck,
} from "@tabler/icons-react";

// import custom components
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import { Avatar } from "components/common/Avatar";
import { getAssetPath } from "helper/assetPath";

// Bentuk data profil (murni UI; belum terhubung ke API backend).
interface ProfileData {
  namaLengkap: string;
  username: string;
  email: string;
  role: string;
  divisi: string;
  noHp: string;
}

const ProfileManager = () => {
  const router = useRouter();

  // Data profil awal — diisi dari localStorage bila tersedia.
  const [profile, setProfile] = useState<ProfileData>({
    namaLengkap: "Admin Testing",
    username: "@admin",
    email: "admin@pln.co.id",
    role: "Staff Ruang Tools",
    divisi: "-",
    noHp: "",
  });

  // Salinan form saat mode edit (agar Batal bisa mengembalikan nilai semula).
  const [form, setForm] = useState<ProfileData>(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    lama: "",
    baru: "",
    konfirmasi: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Foto profil (placeholder — belum upload ke server)
  const [avatarSrc, setAvatarSrc] = useState<string>("/images/avatar/avatar-1.jpg");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const storedRole = localStorage.getItem("userRole");
    setProfile((prev) => {
      const next = {
        ...prev,
        namaLengkap: storedName || prev.namaLengkap,
        role: storedRole || prev.role,
      };
      setForm(next);
      return next;
    });
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleEdit = () => {
    setForm(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setForm(profile);
    setIsEditing(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Simpan lokal saja (belum ke API). Nama disinkronkan ke localStorage.
    setProfile(form);
    localStorage.setItem("userName", form.namaLengkap);
    setIsEditing(false);
    showSuccess("Profil berhasil diperbarui.");
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!passwordForm.lama || !passwordForm.baru || !passwordForm.konfirmasi) {
      setPasswordError("Semua field password wajib diisi.");
      return;
    }
    if (passwordForm.baru !== passwordForm.konfirmasi) {
      setPasswordError("Konfirmasi password tidak cocok dengan password baru.");
      return;
    }

    // Belum ada API — reset form & tampilkan notifikasi.
    setPasswordForm({ lama: "", baru: "", konfirmasi: "" });
    showSuccess("Password berhasil diperbarui.");
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Placeholder: pratinjau lokal saja, belum upload ke server.
    const previewUrl = URL.createObjectURL(file);
    setAvatarSrc(previewUrl);
    showSuccess("Foto profil dipilih (pratinjau). Simpan belum tersambung ke server.");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    router.push("/signin");
  };

  return (
    <div className="profile-page">
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

      {/* ---- Page Header ---- */}
      <Row>
        <Col>
          <div className="mb-4">
            <h1 className="mb-2 h2">Profil Saya</h1>
            <p className="text-secondary mb-0">
              Kelola informasi akun dan keamanan Anda.
            </p>
            <DasherBreadcrumb />
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        {/* ---- Kartu Identitas ---- */}
        <Col xl={4} lg={5}>
          <Card className="card-lg h-100">
            <CardBody className="text-center">
              <div className="profile-avatar-wrap mx-auto mb-3">
                <Avatar
                  type="image"
                  src={avatarSrc}
                  size="xl"
                  alt="Foto Profil"
                  className="rounded-circle"
                />
              </div>
              <h4 className="mb-1">{profile.namaLengkap}</h4>
              <div className="text-secondary mb-1">{profile.username}</div>
              <div className="mb-1">
                <span className="badge bg-primary-subtle text-primary-emphasis">
                  {profile.role}
                </span>
              </div>
              {profile.divisi && profile.divisi !== "-" && (
                <div className="text-secondary small">Divisi: {profile.divisi}</div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="d-none"
                onChange={handleAvatarChange}
              />
              <Button
                variant="outline-secondary"
                className="mt-3 d-inline-flex align-items-center gap-2"
                onClick={handleAvatarClick}
              >
                <IconCamera size={18} />
                Ganti Foto Profil
              </Button>
            </CardBody>
          </Card>
        </Col>

        {/* ---- Informasi Profil ---- */}
        <Col xl={8} lg={7}>
          <Card className="card-lg h-100">
            <CardBody>
              <Flex justifyContent="between" alignItems="center" className="mb-4">
                <h5 className="mb-0">Informasi Profil</h5>
                {!isEditing && (
                  <Button
                    variant="primary"
                    className="d-inline-flex align-items-center gap-2"
                    onClick={handleEdit}
                  >
                    <IconEdit size={18} />
                    Edit Profil
                  </Button>
                )}
              </Flex>

              <Form onSubmit={handleSave}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Label>Nama Lengkap</Form.Label>
                    <Form.Control
                      value={form.namaLengkap}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, namaLengkap: e.target.value }))
                      }
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                      value={form.username}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, username: e.target.value }))
                      }
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={form.email}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, email: e.target.value }))
                      }
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Label>Role</Form.Label>
                    <Form.Control value={form.role} disabled readOnly />
                  </Col>
                  <Col md={6}>
                    <Form.Label>Divisi</Form.Label>
                    <Form.Control
                      value={form.divisi}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, divisi: e.target.value }))
                      }
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Label>
                      Nomor HP{" "}
                      <span className="text-secondary fw-normal">(opsional)</span>
                    </Form.Label>
                    <Form.Control
                      value={form.noHp}
                      disabled={!isEditing}
                      placeholder="Contoh: 0812xxxxxxx"
                      onChange={(e) =>
                        setForm((p) => ({ ...p, noHp: e.target.value }))
                      }
                    />
                  </Col>
                </Row>

                {isEditing && (
                  <div className="d-flex gap-2 mt-4">
                    <Button
                      variant="primary"
                      type="submit"
                      className="d-inline-flex align-items-center gap-2"
                    >
                      <IconDeviceFloppy size={18} />
                      Simpan
                    </Button>
                    <Button
                      variant="outline-secondary"
                      type="button"
                      className="d-inline-flex align-items-center gap-2"
                      onClick={handleCancel}
                    >
                      <IconX size={18} />
                      Batal
                    </Button>
                  </div>
                )}
              </Form>
            </CardBody>
          </Card>
        </Col>

        {/* ---- Ubah Password ---- */}
        <Col xs={12}>
          <Card className="card-lg">
            <CardBody>
              <div className="d-flex align-items-center gap-2 mb-4">
                <span className="profile-section-icon">
                  <IconLock size={20} />
                </span>
                <h5 className="mb-0">Ubah Password</h5>
              </div>

              {passwordError && (
                <Alert variant="danger" onClose={() => setPasswordError(null)} dismissible>
                  {passwordError}
                </Alert>
              )}

              <Form onSubmit={handlePasswordSubmit}>
                <Row className="g-3">
                  <Col md={4}>
                    <Form.Label>Password Lama</Form.Label>
                    <Form.Control
                      type="password"
                      value={passwordForm.lama}
                      onChange={(e) =>
                        setPasswordForm((p) => ({ ...p, lama: e.target.value }))
                      }
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label>Password Baru</Form.Label>
                    <Form.Control
                      type="password"
                      value={passwordForm.baru}
                      onChange={(e) =>
                        setPasswordForm((p) => ({ ...p, baru: e.target.value }))
                      }
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label>Konfirmasi Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={passwordForm.konfirmasi}
                      onChange={(e) =>
                        setPasswordForm((p) => ({ ...p, konfirmasi: e.target.value }))
                      }
                    />
                  </Col>
                </Row>
                <Button
                  variant="primary"
                  type="submit"
                  className="mt-4 d-inline-flex align-items-center gap-2"
                >
                  <IconLock size={18} />
                  Simpan Password
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>

        {/* ---- Logout ---- */}
        <Col xs={12}>
          <div className="text-center py-2">
            <Button
              variant="danger"
              className="d-inline-flex align-items-center gap-2"
              onClick={handleLogout}
            >
              <IconLogout size={18} />
              Logout
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ProfileManager;
