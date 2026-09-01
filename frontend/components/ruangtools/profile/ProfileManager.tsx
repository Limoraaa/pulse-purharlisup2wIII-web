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
  Spinner,
} from "react-bootstrap";
import {
   IconEdit,
  IconDeviceFloppy,
  IconX,
  IconLock,
  IconCamera,
  IconLogout,
  IconCircleCheck,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";

// import custom components
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import { Avatar } from "components/common/Avatar";

// import services
import { getProfile, updateProfile, changePassword, uploadAvatar, ProfileApiData } from "services/profileService";

interface ProfileData {
  namaLengkap: string;
  role: string;
  divisi: string;
}

const emptyProfile: ProfileData = {
  namaLengkap: "",
  role: "",
  divisi: "-",
};

const ProfileManager = () => {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [form, setForm] = useState<ProfileData>(emptyProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    lama: "",
    baru: "",
    konfirmasi: "",
   });
    const [showPassword, setShowPassword] = useState({
    lama: false,
    baru: false,
    konfirmasi: false,
  });

  const toggleShowPassword = (field: "lama" | "baru" | "konfirmasi") => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

 
  const [avatarSrc, setAvatarSrc] = useState<string>(() => {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("userAvatarUrl");
        if (cached) return cached;
      }
      return "/images/avatar/avatar-1.jpg";
    });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data: ProfileApiData = await getProfile();
            const mapped: ProfileData = {
        namaLengkap: data.namaLengkap,
        role: data.role,
        divisi: data.divisi,
      };
      setProfile(mapped);
      setForm(mapped);

      if (data.avatarPath) {
        const backendOrigin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "");
        const url = `${backendOrigin}/storage/${data.avatarPath}`;
        setAvatarSrc(url);
        localStorage.setItem("userAvatarUrl", url);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat data profil";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleEdit = () => {
    setForm(profile);
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setForm(profile);
    setSaveError(null);
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
        const updated = await updateProfile({
        namaLengkap: form.namaLengkap,
        divisi: form.divisi,
      });
      const mapped: ProfileData = {
        namaLengkap: updated.namaLengkap,
        role: updated.role,
        divisi: updated.divisi,
      };
      setProfile(mapped);
      setForm(mapped);
      setIsEditing(false);
      showSuccess("Profil berhasil diperbarui.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan profil";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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

    setPasswordSaving(true);
    try {
      await changePassword({
        passwordLama: passwordForm.lama,
        passwordBaru: passwordForm.baru,
        konfirmasiPasswordBaru: passwordForm.konfirmasi,
      });
      setPasswordForm({ lama: "", baru: "", konfirmasi: "" });
      showSuccess("Password berhasil diperbarui.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memperbarui password";
      setPasswordError(message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Preview instan sambil upload jalan di background
  const previewUrl = URL.createObjectURL(file);
    setAvatarSrc(previewUrl);

    setAvatarUploading(true);
    try {
      const result = await uploadAvatar(file);
      setAvatarSrc(result.avatar_url);
      localStorage.setItem("userAvatarUrl", result.avatar_url);
      window.dispatchEvent(new CustomEvent("avatar-updated", { detail: result.avatar_url }));
      showSuccess("Foto profil berhasil diperbarui.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Gagal mengunggah foto profil");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    router.push("/signin");
  };

  if (loading) {
    return (
      <div className="text-center py-6">
        <Spinner animation="border" size="sm" className="me-2" />
        Memuat profil...
      </div>
    );
  }

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
      {loadError && <Alert variant="danger">{loadError}</Alert>}

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
                disabled={avatarUploading}
              >
                {avatarUploading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <IconCamera size={18} />
                )}
                {avatarUploading ? "Mengunggah..." : "Ganti Foto Profil"}
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

              {saveError && <Alert variant="danger">{saveError}</Alert>}

              <Form onSubmit={handleSave}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Label>Nama Lengkap</Form.Label>
                    <Form.Control
                      value={form.namaLengkap}
                      disabled={!isEditing || saving}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, namaLengkap: e.target.value }))
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
                      disabled={!isEditing || saving}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, divisi: e.target.value }))
                      }
                    />
                  </Col>
                </Row>

                {isEditing && (
                  <div className="d-flex gap-2 mt-4">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={saving}
                      className="d-inline-flex align-items-center gap-2"
                    >
                      {saving ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <IconDeviceFloppy size={18} />
                      )}
                      Simpan
                    </Button>
                    <Button
                      variant="outline-secondary"
                      type="button"
                      disabled={saving}
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
                    <div className="position-relative">
                      <Form.Control
                        type={showPassword.lama ? "text" : "password"}
                        value={passwordForm.lama}
                        disabled={passwordSaving}
                        onChange={(e) =>
                          setPasswordForm((p) => ({ ...p, lama: e.target.value }))
                        }
                        style={{ paddingRight: "2.5rem" }}
                      />
                      <Button
                        variant="link"
                        className="position-absolute top-50 end-0 translate-middle-y text-secondary p-0 me-3"
                        onClick={() => toggleShowPassword("lama")}
                        tabIndex={-1}
                        type="button"
                      >
                        {showPassword.lama ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                      </Button>
                    </div>
                  </Col>
                  <Col md={4}>
                    <Form.Label>Password Baru</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showPassword.baru ? "text" : "password"}
                        value={passwordForm.baru}
                        disabled={passwordSaving}
                        onChange={(e) =>
                          setPasswordForm((p) => ({ ...p, baru: e.target.value }))
                        }
                        style={{ paddingRight: "2.5rem" }}
                      />
                      <Button
                        variant="link"
                        className="position-absolute top-50 end-0 translate-middle-y text-secondary p-0 me-3"
                        onClick={() => toggleShowPassword("baru")}
                        tabIndex={-1}
                        type="button"
                      >
                        {showPassword.baru ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                      </Button>
                    </div>
                  </Col>
                  <Col md={4}>
                    <Form.Label>Konfirmasi Password</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showPassword.konfirmasi ? "text" : "password"}
                        value={passwordForm.konfirmasi}
                        disabled={passwordSaving}
                        onChange={(e) =>
                          setPasswordForm((p) => ({ ...p, konfirmasi: e.target.value }))
                        }
                        style={{ paddingRight: "2.5rem" }}
                      />
                      <Button
                        variant="link"
                        className="position-absolute top-50 end-0 translate-middle-y text-secondary p-0 me-3"
                        onClick={() => toggleShowPassword("konfirmasi")}
                        tabIndex={-1}
                        type="button"
                      >
                        {showPassword.konfirmasi ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                      </Button>
                    </div>
                  </Col>
                </Row>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={passwordSaving}
                  className="mt-4 d-inline-flex align-items-center gap-2"
                >
                  {passwordSaving ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <IconLock size={18} />
                  )}
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