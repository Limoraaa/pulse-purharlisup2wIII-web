"use client";
import { useState } from "react";
import { Card, CardBody, Form, Button, Alert } from "react-bootstrap";
import { IconScan } from "@tabler/icons-react";

interface PengembalianScanFormProps {
  onScan: (idCard: string) => void;
  loading?: boolean;
  error?: string | null;
}

const PengembalianScanForm = ({ onScan, loading = false, error = null }: PengembalianScanFormProps) => {
  const [idCard, setIdCard] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCard.trim()) return;
    onScan(idCard.trim());
  };

  return (
    <Card className="card-lg mb-4">
      <CardBody>
        <div className="d-flex align-items-center gap-2 mb-3">
          <IconScan size={22} className="text-primary" />
          <h5 className="mb-0">Scan Kartu Peminjam</h5>
        </div>
        <p className="text-secondary small mb-3">
          Tap kartu ID peminjam untuk menampilkan daftar alat yang sedang ia pinjam.
        </p>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <div className="d-flex gap-2">
            <Form.Control
              type="password"
              autoComplete="off"
              autoFocus
              placeholder="Tap kartu ID di sini..."
              value={idCard}
              onChange={(e) => setIdCard(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={loading}
            />
            <Button variant="primary" type="submit" disabled={loading || !idCard.trim()}>
              {loading ? "Mencari..." : "Cari"}
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  );
};

export default PengembalianScanForm;