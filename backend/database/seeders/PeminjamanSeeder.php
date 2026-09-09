<?php

namespace Database\Seeders;

use App\Models\Peminjaman;
use App\Models\Peminta;
use App\Models\Tool;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class PeminjamanSeeder extends Seeder
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
            ['kode_barang' => 'T-101', 'jumlah' => 1, 'area' => 'Gardu Induk A', 'pekerjaan' => 'Perbaikan panel listrik', 'hari_pinjam' => 10, 'hari_kembali' => 9],
            ['kode_barang' => 'T-103', 'jumlah' => 2, 'area' => 'Bengkel Mekanikal', 'pekerjaan' => 'Perakitan rak alat', 'hari_pinjam' => 8, 'hari_kembali' => 8],
            ['kode_barang' => 'T-105', 'jumlah' => 1, 'area' => 'Gardu Induk B', 'pekerjaan' => 'Pengecekan arus trafo', 'hari_pinjam' => 6, 'hari_kembali' => 6],
            ['kode_barang' => 'T-201', 'jumlah' => 1, 'area' => 'Bengkel Mekanikal', 'pekerjaan' => 'Pemotongan plat besi', 'hari_pinjam' => 4, 'hari_kembali' => 3],
            ['kode_barang' => 'T-104', 'jumlah' => 1, 'area' => 'Gardu Induk A', 'pekerjaan' => 'Pengeboran dudukan panel', 'hari_pinjam' => 2, 'hari_kembali' => null],
            ['kode_barang' => 'T-202', 'jumlah' => 1, 'area' => 'Bengkel Mekanikal', 'pekerjaan' => 'Pengeboran plat besi', 'hari_pinjam' => 1, 'hari_kembali' => null],
        ];

        foreach ($data as $i => $item) {
            $tool = Tool::where('kode_barang', $item['kode_barang'])->first();
            if (! $tool) {
                continue;
            }

            $peminta = $pekerja[$i % $pekerja->count()];

            Peminjaman::firstOrCreate(
                [
                    'tool_id' => $tool->id,
                    'nama_pekerjaan' => $item['pekerjaan'],
                ],
                [
                    'tanggal' => Carbon::now()->subDays($item['hari_pinjam']),
                    'peminta_id' => $peminta->id,
                    'jumlah' => $item['jumlah'],
                    'area_pekerjaan' => $item['area'],
                    'spesifikasi' => null,
                    'keterangan' => null,
                    'tanggal_kembali' => $item['hari_kembali'] !== null
                        ? Carbon::now()->subDays($item['hari_kembali'])
                        : null,
                    'dicatat_oleh' => $petugas->id,
                ]
            );
        }
    }
}
