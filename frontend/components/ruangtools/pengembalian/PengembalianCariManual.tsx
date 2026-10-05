"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, Form, InputGroup, ListGroup, Badge, Spinner } from "react-bootstrap";
import { IconSearch } from "@tabler/icons-react";
import { getPemintaAktif } from "services/pemintaService";
import { PeminjamanAktifItemType } from "types/DataToolsTypes";

type PemintaOption = Awaited<ReturnType<typeof getPemintaAktif>>[number];

interface Props {
  items: PeminjamanAktifItemType[];
  onSelect: (pemintaId: string) => void;
  disabled?: boolean;
}

const PengembalianCariManual = ({ items, onSelect, disabled = false }: Props) => {
  const [peminta, setPeminta] = useState<PemintaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getPemintaAktif()
      .then(setPeminta)
      .catch(() => setPeminta([]))
      .finally(() => setLoading(false));
  }, []);

  // Total unit yang sedang dipinjam per peminjam
  const totalPinjam = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => {
      map[i.peminjamId] = (map[i.peminjamId] ?? 0) + i.jumlah;
    });
    return map;
  }, [items]);

  const hasil = useMemo(() => {
    const q = query.trim().toLowerCase();
    return peminta
      .filter((p) => totalPinjam[p.id])
      .filter(
        (p) =>
          !q ||
          p.nama.toLowerCase().includes(q) ||
          String(p.id).toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [peminta, totalPinjam, query]);

  return (
    <Card className="mt-4">
      <Card.Body>
        <div className="d-flex align-items-center gap-2 mb-1">
          <IconSearch size={20} />
          <h5 className="mb-0">Cari Peminjam Manual</h5>
        </div>
        <p className="text-secondary small mb-3">
          Cari nama peminjam yang masih memiliki alat pinjaman aktif.
        </p>

        <InputGroup className="mb-3">
          <InputGroup.Text className="bg-transparent">
            <IconSearch size={18} />
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Cari nama peminjam..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={disabled}
            autoFocus
          />
        </InputGroup>

        {loading ? (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" className="me-2" />
            Memuat data...
          </div>
        ) : hasil.length === 0 ? (
          <p className="text-secondary small mb-0">
          </p>
        ) : (
          <ListGroup>
            {hasil.map((p) => (
              <ListGroup.Item
                key={p.id}
                action
                disabled={disabled}
                onClick={() => onSelect(p.id)}
                className="d-flex justify-content-between align-items-center"
              >
                <span>{p.nama}</span>
                <Badge bg="secondary">{totalPinjam[p.id]} unit dipinjam</Badge>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
};

export default PengembalianCariManual;