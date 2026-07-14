"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "react-bootstrap";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/signin"); // sesuaikan path halaman login kamu
    } else {
      setChecked(true);
    }
  }, [router]);

  // sambil ngecek, jangan tampilkan apa-apa dulu (hindari "flash" konten sebelum redirect)
  if (!checked) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ height: "100vh" }}
      >
        <Spinner animation="border" />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;