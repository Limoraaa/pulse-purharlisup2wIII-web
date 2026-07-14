<?php

namespace Database\Seeders;

use App\Models\Peminjaman;
use App\Models\Peminta;
use App\Models\Tool;
use App\Models\User;
use Illuminate\Database\Seeder;

class PeminjamanSeeder extends Seeder
{
    public function run(): void
    {
        $staff = User::first();
        $matabor = Tool::where('kode_barang', 'I-300')->first();
        $klem = Tool::where('kode_barang', 'I-117')->first();
        $dadang = Peminta::where('nama', 'Dadang M Syam')->first();
        $jaka = Peminta::where('nama', 'Jaka Yudha Pamungkas')->first();

        // Peminjaman yang masih aktif (belum kembali)
        Peminjaman::create([
            'tanggal' => '2026-07-01',
            'tool_id' => $matabor->id,
            'peminta_id' => $dadang->id,
            'jumlah' => 2,
            'area_pekerjaan' => 'Bucket Elevator',
            'dicatat_oleh' => $staff->id,
        ]);

        // Peminjaman yang sudah dikembalikan
        Peminjaman::create([
            'tanggal' => '2026-06-25',
            'tool_id' => $klem->id,
            'peminta_id' => $jaka->id,
            'jumlah' => 1,
            'area_pekerjaan' => 'Bucket Elevator',
            'tanggal_kembali' => '2026-06-28',
            'dicatat_oleh' => $staff->id,
        ]);
    }
}
