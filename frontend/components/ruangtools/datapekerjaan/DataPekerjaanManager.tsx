"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Form, Table } from 'react-bootstrap';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import Link from 'next/link';
import { getColumns, Pekerjaan } from './ColumnDefination';
import PekerjaanFormModal from './PekerjaanFormModal';
import DeleteConfirmModal from './DeleteConfirmModal';

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

  const fetchData = async () => {
    setLoading(true);
    // TODO: Ganti dengan pemanggilan API ke backend Laravel
    const dummyData: Pekerjaan[] = [
      { id: 1, nama_pekerjaan: 'TBS TANASA', is_active: true },
      { id: 2, nama_pekerjaan: 'BEARING', is_active: true },
      { id: 3, nama_pekerjaan: 'DUMPER', is_active: false },
      { id: 4, nama_pekerjaan: 'BUCKET ELEVATOR', is_active: true },
    ];
    setData(dummyData);
    setLoading(false);
  };

  // Handlers
  const handleAdd = () => {
    setSelectedPekerjaan(null);
    setIsFormOpen(true);
  };

  const handleEdit = (pekerjaan: Pekerjaan) => {
    setSelectedPekerjaan(pekerjaan);
    setIsFormOpen(true);
  };

  const handleToggleStatus = (pekerjaan: Pekerjaan) => {
    // TODO: Panggil API untuk toggle is_active
    console.log("Toggle status untuk ID:", pekerjaan.id);
    const updatedData = data.map(item => 
      item.id === pekerjaan.id ? { ...item, is_active: !item.is_active } : item
    );
    setData(updatedData);
  };

  const handleDeleteClick = (pekerjaan: Pekerjaan) => {
    setSelectedPekerjaan(pekerjaan);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    // TODO: Panggil API untuk hapus data
    if (selectedPekerjaan) {
      const updatedData = data.filter(item => item.id !== selectedPekerjaan.id);
      setData(updatedData);
    }
    setIsDeleteOpen(false);
    setSelectedPekerjaan(null);
  };

  const handleFormSubmit = (formData: Partial<Pekerjaan>) => {
    // TODO: Panggil API untuk Create/Update
    console.log("Data disubmit:", formData);
    setIsFormOpen(false);
  };

  const columns = useMemo(() => getColumns({
    onEdit: handleEdit,
    onToggleStatus: handleToggleStatus,
    onDelete: handleDeleteClick
  }), [data]);

  return (
    <div className="container-fluid p-4">
      {/* Page Header */}
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

      {/* Main Card */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          
          {/* Toolbar (Search & Export) */}
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
              Menampilkan <strong>{data.length}</strong> dari {data.length} data
            </div>
            <div className="d-flex gap-2 mt-3 mt-md-0">
              <Button variant="outline-danger" className="bg-white">Export PDF</Button>
              <Button variant="outline-success" className="bg-white">Export Excel</Button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <p className="text-center py-4">Loading data...</p>
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
                  {data.map((item) => (
                    <tr key={item.id}>
                      {columns.map((col: any) => {
                        // Membuat konteks cell agar info.getValue() berfungsi dengan benar
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
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modals */}
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