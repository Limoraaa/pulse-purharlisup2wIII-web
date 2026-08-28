<?php

namespace Database\Seeders;

use App\Models\Consumable;
use App\Models\ConsumableKeluar;
use App\Models\Peminta;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ConsumableKeluarSeeder extends Seeder
{
    public function run(): void
    {
        $pekerja = Peminta::where('role', 'user')->get();
        $petugas = User::first();

        if ($pekerja->isEmpty() || ! $petugas) {
            $this->command?->warn('Butuh data peminta & user terlebih dahulu.');
            return;
        }

        $data = [
            ['kode_barang' => 'C-001', 'jumlah_keluar' => 20, 'pekerjaan_area' => 'Gardu Induk A', 'nama_pekerjaan' => 'Perapihan kabel panel', 'hari_lalu' => 12],
            ['kode_barang' => 'C-003', 'jumlah_keluar' => 3, 'pekerjaan_area' => 'Bengkel Mekanikal', 'nama_pekerjaan' => 'Pengecatan ulang rangka', 'hari_lalu' => 9],
            ['kode_barang' => 'C-004', 'jumlah_keluar' => 5, 'pekerjaan_area' => 'Gardu Induk B', 'nama_pekerjaan' => 'Pemotongan besi siku', 'hari_lalu' => 7],
            ['kode_barang' => 'C-005', 'jumlah_keluar' => 30, 'pekerjaan_area' => 'Bengkel Mekanikal', 'nama_pekerjaan' => 'Perakitan rak alat', 'hari_lalu' => 5],
            ['kode_barang' => 'C-006', 'jumlah_keluar' => 4, 'pekerjaan_area' => 'Gardu Induk A', 'nama_pekerjaan' => 'Pemeliharaan rutin trafo', 'hari_lalu' => 2],
        ];

        foreach ($data as $i => $item) {
            $consumable = Consumable::where('kode_barang', $item['kode_barang'])->first();
            if (! $consumable) {
                continue;
            }

            $peminta = $pekerja[$i % $pekerja->count()];

                        $keluar = ConsumableKeluar::firstOrCreate(
                [
                    'consumable_id' => $consumable->id,
                    'nama_pekerjaan' => $item['nama_pekerjaan'],
                ],
                [
                    'tanggal' => Carbon::now()->subDays($item['hari_lalu']),
                    'peminta_id' => $peminta->id,
                    'jumlah_keluar' => $item['jumlah_keluar'],
                    'pekerjaan_area' => $item['pekerjaan_area'],
                    'dicatat_oleh' => $petugas->id,
                ]
            );

            if ($keluar->wasRecentlyCreated) {
                $consumable->decrement('stok_awal', $item['jumlah_keluar']);
            }
        }
    }
}
