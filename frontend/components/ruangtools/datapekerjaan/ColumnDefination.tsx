"use client";

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Dropdown } from 'react-bootstrap';
import { IconDotsVertical } from '@tabler/icons-react';

export interface Pekerjaan {
  id: number;
  nama_pekerjaan: string;
  is_active: boolean;
}

interface ColumnProps {
  onEdit: (pekerjaan: Pekerjaan) => void;
  onToggleStatus: (pekerjaan: Pekerjaan) => void;
  onDelete: (pekerjaan: Pekerjaan) => void;
}

export const getColumns = ({ onEdit, onToggleStatus, onDelete }: ColumnProps): ColumnDef<Pekerjaan>[] => [
  {
    header: 'NAMA PEKERJAAN',
    accessorKey: 'nama_pekerjaan',
    cell: (info) => <span className="fw-medium text-dark">{info.getValue() as string}</span>,
  },
  {
    header: 'STATUS',
    accessorKey: 'is_active',
    cell: (info) => {
      const isActive = info.getValue() as boolean;
      return (
        <span 
          className={`badge ${isActive ? 'bg-success text-success' : 'bg-secondary text-secondary'} bg-opacity-10 px-3 py-2 rounded-1`}
          style={{ fontWeight: 600 }}
        >
          {isActive ? 'Aktif' : 'Nonaktif'}
        </span>
      );
    },
  },
  {
    header: 'AKSI',
    id: 'actions',
    cell: (info) => {
      const pekerjaan = info.row.original;
      return (
        <Dropdown>
          <Dropdown.Toggle as="div" bsPrefix=" " className="cursor-pointer text-muted" style={{ cursor: 'pointer' }}>
            <IconDotsVertical size={20} />
          </Dropdown.Toggle>
          <Dropdown.Menu align="end">
            <Dropdown.Item onClick={() => onEdit(pekerjaan)}>Edit Data</Dropdown.Item>
            <Dropdown.Item onClick={() => onToggleStatus(pekerjaan)}>
              {pekerjaan.is_active ? 'Nonaktifkan' : 'Aktifkan'}
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item className="text-danger" onClick={() => onDelete(pekerjaan)}>Hapus Data</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      );
    },
  },
];