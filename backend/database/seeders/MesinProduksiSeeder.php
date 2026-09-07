<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MesinProduksi;

class MesinProduksiSeeder extends Seeder
{
    public function run()
    {
        // 1. Buat Data Master Mesin
        $mesin = MesinProduksi::create([
            'kode_mesin' => '3MFC1',
            'nama_mesin' => 'Mesin CNC Milling 5 Axis Yamazaki Mazak',
            'lokasi_ruang' => 'WORKSHOP 2',
            'status' => 'Aktif',
        ]);

        // 2. Buat Contoh Log Pemeliharaan (Kartu Gantung)
        $logData = [
            [
                'uraian_pemeliharaan' => 'Membersihkan filter udara, Pengisian coolant, penggisian oli slideway',
                'waktu_pelaksana' => '2026-08-03',
                'keterangan' => 'Coolant oli 4 L, Air 80 L, Oli Slideway 1 L',
                'paraf' => 'Teknisi Budi',
            ],
            [
                'uraian_pemeliharaan' => 'Membersihkan filter udara, Pengisian coolant',
                'waktu_pelaksana' => '2026-08-10',
                'keterangan' => 'Coolant oli 3 L, Air 60 L',
                'paraf' => 'Teknisi Andi',
            ],
            [
                'uraian_pemeliharaan' => 'Membersihkan filter udara, Pengisian coolant, penggisian oli slideway',
                'waktu_pelaksana' => '2026-08-18',
                'keterangan' => 'Coolant oli 3 L, Air 60 L, Oli Slideway 1 L',
                'paraf' => 'Teknisi Budi',
            ],
        ];

        foreach ($logData as $log) {
            $mesin->logPemeliharaan()->create($log);
        }
    }
}