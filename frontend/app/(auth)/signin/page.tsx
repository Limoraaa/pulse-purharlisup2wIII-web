"use client";
// import node modules libraries
import { Fragment, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Feedback from "react-bootstrap/Feedback";
import {
  Row,
  Col,
  Image,
  Card,
  CardBody,
  Form,
  FormLabel,
  FormControl,
  FormCheck,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import Link from "next/link";
import { IconEyeOff } from "@tabler/icons-react";

// import custom components
import Flex from "components/common/Flex";
import { getAssetPath } from "helper/assetPath";
import apiFetch from "lib/api";

interface LoginResponse {
  user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
  token: string;
}

const SignIn = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userName", data.user.full_name);
      localStorage.setItem("userRole", data.user.role);

      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Email atau password salah";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ...sisanya (return JSX) tetap sama persis seperti yang kamu punya, tidak perlu diubah

  return (
    <Fragment>
      <Row className="mb-8">
        <Col xl={{ span: 4, offset: 4 }} md={12}>
          <div className="text-center">
            <Link
              href="/"
              className="fs-2 fw-bold d-flex align-items-center gap-2 justify-content-center mb-6"
            >
              <Image src={getAssetPath("/images/brand/logo/logo-icon.svg")} alt="Dasher" />
              <span>Dasher</span>
            </Link>
            <h1 className="mb-1">Welcome Back</h1>
            <p className="mb-0">Masuk untuk mengelola Ruang Tools</p>
          </div>
        </Col>
      </Row>

      <Row className="justify-content-center">
        <Col xl={5} lg={6} md={8}>
          <Card className="card-lg mb-6">
            <CardBody className="p-6">
              {error && <Alert variant="danger">{error}</Alert>}

              <Form className="mb-6" onSubmit={handleSubmit}>
                <div className="mb-3">
                  <FormLabel htmlFor="signinEmailInput">
                    Email <span className="text-danger">*</span>
                  </FormLabel>
                  <FormControl
                    type="email"
                    id="signinEmailInput"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                  <Feedback type="invalid">Please enter email.</Feedback>
                </div>
                <div className="mb-3">
                  <FormLabel htmlFor="formSignUpPassword">Password</FormLabel>
                  <div className="password-field position-relative">
                    <FormControl
                      type="password"
                      id="formSignUpPassword"
                      className="fakePassword"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    <span>
                      <IconEyeOff className="passwordToggler" size={16} />
                    </span>
                  </div>
                  <Feedback type="invalid">Please enter password.</Feedback>
                </div>
                <Flex className="mb-4" alignItems="center" justifyContent="between">
                  <FormCheck label="Remember me" type="checkbox" />
                  <div>
                    <Link href="" className="text-primary">
                      Forgot Password
                    </Link>
                  </div>
                </Flex>
                <div className="d-grid">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Memproses...
                      </>
                    ) : (
                      "SignIn"
                    )}
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Fragment>
  );
};

export default SignIn;