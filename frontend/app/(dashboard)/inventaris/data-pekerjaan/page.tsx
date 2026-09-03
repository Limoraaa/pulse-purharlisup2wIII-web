import React from 'react';
// Tambahkan karakter '@' di depan '/components'
import DataPekerjaanManager from '/components/ruangtools/datapekerjaan/DataPekerjaanManager';

export const metadata = {
  title: 'Data Pekerjaan - PULSE',
  description: 'Manajemen Data Pekerjaan',
};

export default function DataPekerjaanPage() {
  return (
    <>
      <DataPekerjaanManager />
    </>
  );
}