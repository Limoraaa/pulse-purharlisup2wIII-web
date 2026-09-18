<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LogAktivitasMesin;
use App\Models\MesinProduksi;

class LogAktivitasMesinSeeder extends Seeder
{
    public function run()
    {
        // Pastikan ada data mesin setidaknya satu untuk direlasikan
        $mesin = MesinProduksi::first();

        if ($mesin) {
            LogAktivitasMesin::insert([
                [
                    'mesin_produksi_id' => $mesin->id,
                    'operator_pelaksana' => 'Budi Operator',
                    'uraian_pekerjaan' => 'Pengoperasian mesin untuk pemotongan plat baja utama',
                    'tanggal' => '2026-08-01',
                    'waktu_mulai' => '08:00:00',
                    'waktu_selesai' => '12:00:00',
                    'jumlah' => 15,
                    'pemeriksa' => 'Supervisor Andi',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'mesin_produksi_id' => $mesin->id,
                    'operator_pelaksana' => 'Joko Operator',
                    'uraian_pekerjaan' => 'Pencetakan komponen rangka gardan batch 2',
                    'tanggal' => '2026-08-02',
                    'waktu_mulai' => '13:00:00',
                    'waktu_selesai' => '17:00:00',
                    'jumlah' => 20,
                    'pemeriksa' => 'Supervisor Andi',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }
}