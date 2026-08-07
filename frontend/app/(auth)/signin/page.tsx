"use client";
// import node modules libraries
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormCheck,
  Button,
  Alert,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import Link from "next/link";
import { Image } from "react-bootstrap";
import { IconUser, IconLock, IconEye, IconEyeOff } from "@tabler/icons-react";

// import custom components
import { getAssetPath } from "helper/assetPath";
import apiFetch from "lib/api";

interface LoginResponse {
  user: {
    id: string;
    full_name: string;
    username: string;
    role: string;
  };
  token: string;
  must_change_password: boolean;
}

const SignIn = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // kalau sudah ada sesi login, langsung lempar ke dashboard
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data: LoginResponse = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userName", data.user.full_name);
      localStorage.setItem("userRole", data.user.role);

      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Username atau password salah";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Panel Kiri: Visual */}
        <div className="login-visual login-anim-left">
          <Image
            src={getAssetPath("/images/png/welder2.png")}
            alt="Workshop Produksi Mekanikal PT PLN (PERSERO) PUSHARLIS UP2WIII"
            className="login-visual-img"
          />
          <div className="login-visual-overlay" />
          <div className="login-visual-content">
            <h2 className="login-visual-title">Selamat Datang</h2>
            <p className="login-visual-subtitle">
              Sistem Inventaris dan Peminjaman Alat
              <br />
              Workshop Produksi Mekanikal
              <br />
              PT PLN (PERSERO) PUSHARLIS UP2WIII
            </p>
          </div>
        </div>

        {/* Panel Kanan: Form Login */}
        <div className="login-form-panel login-anim-right">
          <div className="login-form-inner">
            <div className="text-center mb-4">
              <Image
                src={getAssetPath("/images/png/PLN-logo.png")}
                alt="PT PLN (PERSERO) PUSHARLIS UP2WIII"
                className="login-logo"
              />
            </div>

            <div className="mb-4">
              <h1 className="login-title mb-2">Masuk</h1>
              <p className="login-subtitle mb-0">
                Silakan masuk menggunakan akun Anda.
              </p>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <div className="mb-3">
                <Form.Label htmlFor="signinUsernameInput">Username</Form.Label>
                <InputGroup className="login-input">
                  <InputGroup.Text>
                    <IconUser size={18} />
                  </InputGroup.Text>
                  <FormControl
                    type="text"
                    id="signinUsernameInput"
                    placeholder="Masukkan username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                  />
                </InputGroup>
              </div>

              <div className="mb-3">
                <Form.Label htmlFor="signinPasswordInput">Password</Form.Label>
                <InputGroup className="login-input">
                  <InputGroup.Text>
                    <IconLock size={18} />
                  </InputGroup.Text>
                  <FormControl
                    type={showPassword ? "text" : "password"}
                    id="signinPasswordInput"
                    placeholder="Masukkan password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <Button
                    variant="link"
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </Button>
                </InputGroup>
              </div>

              <div className="d-flex align-items-center justify-content-between mb-4">
                <FormCheck
                  label="Ingat saya"
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
              </div>

              <div className="d-grid">
                <Button
                  variant="primary"
                  type="submit"
                  className="login-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Memverifikasi...
                    </>
                  ) : (
                    "Masuk"
                  )}
                </Button>
              </div>
            </Form>

            <div className="login-footer text-center">
              © 2026 PT PLN (PERSERO) PUSHARLIS UP2WIII
              <br />
              Workshop Produksi Mekanikal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
