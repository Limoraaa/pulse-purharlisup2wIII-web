"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Form, Table, Spinner } from 'react-bootstrap';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import Link from 'next/link';
import { getColumns, Pekerjaan } from './ColumnDefination';
import PekerjaanFormModal from './PekerjaanFormModal';
import DeleteConfirmModal from './DeleteConfirmModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function DataPekerjaanManager() {
  const [data, setData] = useState<Pekerjaan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPekerjaan, setSelectedPekerjaan] = useState<Pekerjaan | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // 1. READ: Mengambil data dari API
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/pekerjaan`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedPekerjaan(null);
    setIsFormOpen(true);
  };

  const handleEdit = (pekerjaan: Pekerjaan) => {
    setSelectedPekerjaan(pekerjaan);
    setIsFormOpen(true);
  };

  // 2. TOGGLE STATUS: Mengubah status aktif/nonaktif via API
  const handleToggleStatus = async (pekerjaan: Pekerjaan) => {
    try {
      const res = await fetch(`${API_URL}/pekerjaan/${pekerjaan.id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Accept': 'application/json' }
      });
      const json = await res.json();
      if (json.success) {
        fetchData(); // Refresh tabel setelah status diubah
      }
    } catch (error) {
      console.error("Gagal mengubah status:", error);
    }
  };

  const handleDeleteClick = (pekerjaan: Pekerjaan) => {
    setSelectedPekerjaan(pekerjaan);
    setIsDeleteOpen(true);
  };

  // 3. DELETE: Menghapus data via API
  const confirmDelete = async () => {
    if (selectedPekerjaan) {
      try {
        const res = await fetch(`${API_URL}/pekerjaan/${selectedPekerjaan.id}`, {
          method: 'DELETE',
          headers: { 'Accept': 'application/json' }
        });
        const json = await res.json();
        if (json.success) {
          fetchData(); // Refresh tabel setelah dihapus
        }
      } catch (error) {
        console.error("Gagal menghapus data:", error);
      }
    }
    setIsDeleteOpen(false);
    setSelectedPekerjaan(null);
  };

  // 4. CREATE / UPDATE: Menyimpan data via API
  const handleFormSubmit = async (formData: Partial<Pekerjaan>) => {
    const isEdit = !!selectedPekerjaan;
    const url = isEdit ? `${API_URL}/pekerjaan/${selectedPekerjaan.id}` : `${API_URL}/pekerjaan`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        fetchData(); // Refresh tabel
        setIsFormOpen(false);
      } else {
        alert(json.message || "Gagal menyimpan data");
      }
    } catch (error) {
      console.error("Error submitting data:", error);
    }
  };

  const columns = useMemo(() => getColumns({
    onEdit: handleEdit,
    onToggleStatus: handleToggleStatus,
    onDelete: handleDeleteClick
  }), [data]);

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold text-dark">Data Pekerjaan</h2>
          <p className="text-muted mb-2">Mengelola daftar pekerjaan yang dapat dipilih saat peminjaman alat.</p>
          <div className="d-flex align-items-center text-muted small">
            <Link href="/" className="text-decoration-none text-muted">Home</Link>
            <span className="mx-2">•</span>
            <span className="text-muted">Inventaris</span>
            <span className="mx-2">•</span>
            <span className="text-muted">Data Pekerjaan</span>
          </div>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2" onClick={handleAdd}>
          <IconPlus size={18} /> Tambah Data
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center border rounded px-3 py-1 bg-white" style={{ minWidth: '300px' }}>
              <IconSearch size={18} className="text-muted me-2" />
              <Form.Control 
                type="text" 
                placeholder="Cari nama pekerjaan..." 
                className="border-0 shadow-none p-0" 
                style={{ backgroundColor: 'transparent' }}
              />
            </div>
            <div className="text-muted small mt-3 mt-md-0">
              Menampilkan <strong>{data.length}</strong> data
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
               <Spinner animation="border" variant="primary" />
               <p className="mt-2 text-muted">Memuat data pekerjaan...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="text-nowrap align-middle border-bottom">
                <thead className="bg-light text-muted" style={{ fontSize: '0.85rem' }}>
                  <tr>
                    <th className="fw-semibold py-3 border-0">NAMA PEKERJAAN</th>
                    <th className="fw-semibold py-3 border-0">STATUS</th>
                    <th className="fw-semibold py-3 border-0">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length > 0 ? (
                    data.map((item) => (
                      <tr key={item.id}>
                        {columns.map((col: any) => {
                          const cellContext = {
                            row: { original: item },
                            getValue: () => item[col.accessorKey as keyof Pekerjaan],
                          };
                          return (
                            <td key={col.id || col.header} className="py-3 border-light">
                              {col.cell(cellContext)}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center py-4 text-muted">Belum ada data pekerjaan.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <PekerjaanFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSubmit={handleFormSubmit}
        initialData={selectedPekerjaan}
      />

      <DeleteConfirmModal 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        itemName={selectedPekerjaan?.nama_pekerjaan}
      />
    </div>
  );
}