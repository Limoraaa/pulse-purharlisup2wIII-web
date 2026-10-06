'use client';
import React from 'react';

// Interface disesuaikan dengan struktur database Anda
interface LogPemeliharaan {
  id: number;
  tanggal: string;
  judul: string;
  teknisi: string;
  biaya: string;
  jenis: 'Rutin' | 'Perbaikan' | 'Darurat';
  deskripsi: string;
  status: 'Selesai' | 'Proses' | 'Menunggu Sparepart';
}

interface TimelineProps {
  mesinId: number | string;
}

export default function TimelinePemeliharaan({ mesinId }: TimelineProps) {
  // TODO: Ganti data mock ini dengan fetch API ke backend Laravel/Supabase Anda berdasarkan mesinId
  const maintenanceLogs: LogPemeliharaan[] = [
    {
      id: 1,
      tanggal: '12 Okt 2026',
      judul: 'Kalibrasi Sensor Load Cell HX711',
      teknisi: 'Rafi Ridho',
      biaya: 'Rp 0',
      jenis: 'Rutin',
      deskripsi: 'Melakukan kalibrasi ulang pada sensor beban mesin sesuai jadwal. Hasil pembacaan kembali normal.',
      status: 'Selesai'
    },
    {
      id: 2,
      tanggal: '28 Sep 2026',
      judul: 'Penggantian Komponen Controller ESP32',
      teknisi: 'Tim Mekanik',
      biaya: 'Rp 450.000',
      jenis: 'Perbaikan',
      deskripsi: 'Mengganti board mikrokontroler yang korslet karena lonjakan tegangan listrik di workshop.',
      status: 'Selesai'
    },
    {
      id: 3,
      tanggal: '15 Agu 2026',
      judul: 'Overhaul Ringan & Lubrikasi',
      teknisi: 'Budi Santoso',
      biaya: 'Rp 150.000',
      jenis: 'Rutin',
      deskripsi: 'Pemberian pelumas pada rantai penggerak, pembersihan area motor konversi, dan pengecekan suhu operasional.',
      status: 'Selesai'
    }
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-gray-800">Riwayat Tindakan</h2>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Tambah Log
        </button>
      </div>

      <div className="relative border-l-2 border-gray-200 ml-3 md:ml-4">
        {maintenanceLogs.map((log) => (
          <div key={log.id} className="mb-10 ml-8 relative group">
            {/* Timeline Dot */}
            <span 
              className={`absolute flex items-center justify-center w-4 h-4 rounded-full -left-[39px] ring-4 ring-white ${
                log.jenis === 'Rutin' ? 'bg-blue-500' : log.jenis === 'Perbaikan' ? 'bg-orange-500' : 'bg-red-500'
              }`}
            ></span>
            
            {/* Card Content */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900">{log.judul}</h3>
                <span className="text-sm font-medium text-gray-500 mt-1 md:mt-0 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  {log.tanggal}
                </span>
              </div>
              
              <div className="mb-4 space-x-2">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded ${
                  log.jenis === 'Rutin' ? 'bg-blue-100 text-blue-800' : 
                  log.jenis === 'Perbaikan' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                }`}>
                  {log.jenis}
                </span>
                <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2.5 py-0.5 rounded">
                  {log.status}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                {log.deskripsi}
              </p>

              <div className="flex items-center gap-6 text-sm text-gray-500 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  Teknisi: <span className="font-semibold text-gray-700">{log.teknisi}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Biaya: <span className="font-semibold text-gray-700">{log.biaya}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}