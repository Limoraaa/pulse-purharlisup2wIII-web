"use client";

import React from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
}

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, itemName }: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Konfirmasi Hapus</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p>Apakah Anda yakin ingin menghapus pekerjaan <strong>{itemName}</strong>?</p>
            <p className="text-danger small">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="button" className="btn btn-danger" onClick={onConfirm}>Hapus</button>
          </div>
        </div>
      </div>
    </div>
  );
}