"use client";

import React, { useState, useEffect } from 'react';
import { Pekerjaan } from './ColumnDefination';

interface PekerjaanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Pekerjaan>) => void;
  initialData?: Pekerjaan | null;
}

export default function PekerjaanFormModal({ isOpen, onClose, onSubmit, initialData }: PekerjaanFormModalProps) {
  const [namaPekerjaan, setNamaPekerjaan] = useState('');

  useEffect(() => {
    if (initialData) {
      setNamaPekerjaan(initialData.nama_pekerjaan);
    } else {
      setNamaPekerjaan('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ nama_pekerjaan: namaPekerjaan });
    setNamaPekerjaan('');
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{initialData ? 'Edit Pekerjaan' : 'Tambah Pekerjaan'}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Nama Pekerjaan</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={namaPekerjaan}
                  onChange={(e) => setNamaPekerjaan(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
              <button type="submit" className="btn btn-primary">Simpan</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}