<?php

namespace Database\Seeders;

use App\Models\Consumable;
use Illuminate\Database\Seeder;

class ConsumableSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['kode_barang' => 'C-001', 'nama' => 'Kabel Tie', 'merk' => '-', 'type' => 'Nylon', 'er_e' => '-', 'ukuran' => '20cm', 'stok_awal' => 100, 'stok_awal_asli' => 100],
            ['kode_barang' => 'C-002', 'nama' => 'Lakban Hitam', 'merk' => '-', 'type' => 'Kertas', 'er_e' => '-', 'ukuran' => '-', 'stok_awal' => 20, 'stok_awal_asli' => 20],
            ['kode_barang' => 'C-003', 'nama' => 'Kuas Cat', 'merk' => '-', 'type' => '-', 'er_e' => '-', 'ukuran' => '2 inch', 'stok_awal' => 15, 'stok_awal_asli' => 15],
            ['kode_barang' => 'C-004', 'nama' => 'Mata Gerinda Potong', 'merk' => 'Bosch', 'type' => 'Besi', 'er_e' => '-', 'ukuran' => '4 inch', 'stok_awal' => 30, 'stok_awal_asli' => 30],
            ['kode_barang' => 'C-005', 'nama' => 'Baut M8', 'merk' => '-', 'type' => '-', 'er_e' => '-', 'ukuran' => 'M8x30', 'stok_awal' => 200, 'stok_awal_asli' => 200],
            ['kode_barang' => 'C-006', 'nama' => 'Sarung Tangan Safety', 'merk' => 'Krisbow', 'type' => 'Katun', 'er_e' => '-', 'ukuran' => 'L', 'stok_awal' => 25, 'stok_awal_asli' => 25],
            ['kode_barang' => 'C-007', 'nama' => 'Amplas', 'merk' => '-', 'type' => '-', 'er_e' => '-', 'ukuran' => 'No. 120', 'stok_awal' => 40, 'stok_awal_asli' => 40],
            ['kode_barang' => 'C-008', 'nama' => 'Isolasi Listrik', 'merk' => '3M', 'type' => '-', 'er_e' => '-', 'ukuran' => '-', 'stok_awal' => 15, 'stok_awal_asli' => 15],
        ];

        foreach ($data as $item) {
            Consumable::updateOrCreate(['kode_barang' => $item['kode_barang']], $item);
        }
    }
}
