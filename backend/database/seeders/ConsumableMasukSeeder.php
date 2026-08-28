<?php

namespace Database\Seeders;

use App\Models\Consumable;
use App\Models\ConsumableMasuk;
use App\Models\Peminta;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ConsumableMasukSeeder extends Seeder
{
    public function run(): void
    {
        $inventoryMan = Peminta::where('role', 'inventory man')->first();

        if (! $inventoryMan) {
            $this->command?->warn('Tidak ada peminta dengan role inventory man. Jalankan PemintaSeeder dulu.');
            return;
        }

        $data = [
            ['kode_barang' => 'C-001', 'jumlah_masuk' => 100, 'keterangan' => 'Pembelian awal', 'hari_lalu' => 35],
            ['kode_barang' => 'C-002', 'jumlah_masuk' => 20, 'keterangan' => 'Pembelian awal', 'hari_lalu' => 35],
            ['kode_barang' => 'C-004', 'jumlah_masuk' => 30, 'keterangan' => 'Restock mata gerinda', 'hari_lalu' => 15],
            ['kode_barang' => 'C-005', 'jumlah_masuk' => 200, 'keterangan' => 'Pembelian awal', 'hari_lalu' => 35],
            ['kode_barang' => 'C-007', 'jumlah_masuk' => 40, 'keterangan' => 'Restock amplas', 'hari_lalu' => 10],
        ];

                foreach ($data as $item) {
            $consumable = Consumable::where('kode_barang', $item['kode_barang'])->first();
            if (! $consumable) {
                continue;
            }

            $masuk = ConsumableMasuk::firstOrCreate(
                ['consumable_id' => $consumable->id, 'keterangan' => $item['keterangan']],
                [
                    'tanggal' => Carbon::now()->subDays($item['hari_lalu']),
                    'jumlah_masuk' => $item['jumlah_masuk'],
                    'dicatat_oleh' => $inventoryMan->id,
                ]
            );

            if ($masuk->wasRecentlyCreated) {
                $consumable->increment('stok_awal', $item['jumlah_masuk']);
            }
        }
    }
}
