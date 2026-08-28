<?php

namespace Database\Seeders;

use App\Models\LaporanKerusakanTools;
use App\Models\Tool;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class LaporanKerusakanToolsSeeder extends Seeder
{
    public function run(): void
    {
        $petugas = User::first();

        if (! $petugas) {
            $this->command?->warn('Butuh data user terlebih dahulu.');
            return;
        }

        $toolMataBor = Tool::where('kode_barang', 'T-104')->first();
        $toolGerinda = Tool::where('kode_barang', 'T-201')->first();
        $toolBorDuduk = Tool::where('kode_barang', 'T-202')->first();

        $data = [];

        if ($toolMataBor) {
            // Alat biasa - sudah selesai diperbaiki, perbaikan_ke tetap null (bukan mesin)
            $data[] = [
                'tool_id' => $toolMataBor->id,
                'jumlah' => 2,
                'keterangan' => 'Mata bor tumpul setelah dipakai berulang',
                'status' => 'selesai_diperbaiki',
                'tanggal_diperbaiki' => Carbon::now()->subDays(5),
                'catatan_perbaikan' => 'Sudah diasah ulang',
                'tingkat_kerusakan' => null,
                'perbaikan_ke' => null,
                'hari_lalu' => 8,
            ];
        }

        if ($toolGerinda) {
            // Mesin - riwayat perbaikan berat pertama
            $data[] = [
                'tool_id' => $toolGerinda->id,
                'jumlah' => 1,
                'keterangan' => 'Motor gerinda berbunyi kasar',
                'status' => 'selesai_diperbaiki',
                'tanggal_diperbaiki' => Carbon::now()->subDays(20),
                'catatan_perbaikan' => 'Ganti brush motor',
                'tingkat_kerusakan' => 'berat',
                'perbaikan_ke' => 1,
                'hari_lalu' => 22,
            ];

            // Mesin - laporan aktif, belum diperbaiki
            $data[] = [
                'tool_id' => $toolGerinda->id,
                'jumlah' => 1,
                'keterangan' => 'Kabel power terkelupas',
                'status' => 'bisa_diperbaiki',
                'tanggal_diperbaiki' => null,
                'catatan_perbaikan' => null,
                'tingkat_kerusakan' => null,
                'perbaikan_ke' => null,
                'hari_lalu' => 3,
            ];
        }

        if ($toolBorDuduk) {
            // Mesin - rusak permanen
            $data[] = [
                'tool_id' => $toolBorDuduk->id,
                'jumlah' => 1,
                'keterangan' => 'Motor terbakar total',
                'status' => 'rusak_permanen',
                'tanggal_diperbaiki' => null,
                'catatan_perbaikan' => null,
                'tingkat_kerusakan' => null,
                'perbaikan_ke' => null,
                'hari_lalu' => 15,
            ];
        }

        foreach ($data as $item) {
            LaporanKerusakanTools::firstOrCreate(
                [
                    'tool_id' => $item['tool_id'],
                    'keterangan' => $item['keterangan'],
                ],
                [
                    'tanggal' => Carbon::now()->subDays($item['hari_lalu']),
                    'peminjaman_id' => null,
                    'jumlah' => $item['jumlah'],
                    'status' => $item['status'],
                    'tanggal_diperbaiki' => $item['tanggal_diperbaiki'],
                    'catatan_perbaikan' => $item['catatan_perbaikan'],
                    'tingkat_kerusakan' => $item['tingkat_kerusakan'],
                    'perbaikan_ke' => $item['perbaikan_ke'],
                    'dilaporkan_oleh' => $petugas->id,
                ]
            );
        }
    }
}
