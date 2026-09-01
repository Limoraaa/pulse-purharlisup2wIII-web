<?php

namespace Database\Seeders;

use App\Models\Tool;
use App\Models\ToolMasuk;
use App\Models\Peminta;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ToolsMasukSeeder extends Seeder
{
    public function run(): void
    {
        $inventoryMan = Peminta::where('role', 'inventory man')->first();

        if (! $inventoryMan) {
            $this->command?->warn('Tidak ada peminta dengan role inventory man. Jalankan PemintaSeeder dulu.');
            return;
        }

        $data = [
            ['kode_barang' => 'T-101', 'jumlah_masuk' => 5, 'keterangan' => 'Pembelian awal stok kunci pas', 'hari_lalu' => 40],
            ['kode_barang' => 'T-102', 'jumlah_masuk' => 10, 'keterangan' => 'Pembelian awal stok obeng set', 'hari_lalu' => 40],
            ['kode_barang' => 'T-104', 'jumlah_masuk' => 8, 'keterangan' => 'Restock mata bor beton', 'hari_lalu' => 20],
            ['kode_barang' => 'T-201', 'jumlah_masuk' => 1, 'keterangan' => 'Pembelian unit baru', 'hari_lalu' => 60],
            ['kode_barang' => 'T-202', 'jumlah_masuk' => 1, 'keterangan' => 'Pembelian unit baru', 'hari_lalu' => 55],
        ];

        foreach ($data as $item) {
            $tool = Tool::where('kode_barang', $item['kode_barang'])->first();
            if (! $tool) {
                continue;
            }

            ToolMasuk::firstOrCreate(
                ['tool_id' => $tool->id, 'keterangan' => $item['keterangan']],
                [
                    'tanggal' => Carbon::now()->subDays($item['hari_lalu']),
                    'jumlah_masuk' => $item['jumlah_masuk'],
                    'dicatat_oleh' => $inventoryMan->id,
                ]
            );
        }
    }
}
