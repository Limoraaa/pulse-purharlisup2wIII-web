import React from 'react';
import DataOliManager from 'components/manajemenmesin/dataoli/DataOliManager';

export const metadata = {
  title: 'Data Oli | PULSE PUSHARLIS',
  description: 'Monitoring ketersediaan stok oli dan pelumas mesin',
};

export default function DataOliPage() {
  return (
    <>
      <DataOliManager />
    </>
  );
}