<?php

namespace Database\Seeders;

use App\Models\Tool;
use Illuminate\Database\Seeder;

class ToolSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            // Alat biasa (hand tools) - stok boleh lebih dari 1
            ['kode_barang' => 'T-101', 'nama_barang' => 'Kunci Pas Set', 'merk' => 'Krisbow', 'type' => '8-24mm', 'warna' => '-', 'ukuran' => '-', 'stok' => 5, 'keadaan' => 'B', 'kategori' => 'alat_biasa'],
            ['kode_barang' => 'T-102', 'nama_barang' => 'Obeng Set', 'merk' => 'Tekiro', 'type' => 'Plus-Minus', 'warna' => '-', 'ukuran' => '-', 'stok' => 10, 'keadaan' => 'B', 'kategori' => 'alat_biasa'],
            ['kode_barang' => 'T-103', 'nama_barang' => 'Palu Konde', 'merk' => 'Krisbow', 'type' => '-', 'warna' => '-', 'ukuran' => '500gr', 'stok' => 6, 'keadaan' => 'B', 'kategori' => 'alat_biasa'],
            ['kode_barang' => 'T-104', 'nama_barang' => 'Mata Bor Beton', 'merk' => 'Bosch', 'type' => 'Beton', 'warna' => '-', 'ukuran' => '10mm', 'stok' => 8, 'keadaan' => 'B', 'kategori' => 'alat_biasa'],
            ['kode_barang' => 'T-105', 'nama_barang' => 'Tang Ampere', 'merk' => 'Sanwa', 'type' => 'Digital', 'warna' => '-', 'ukuran' => '-', 'stok' => 3, 'keadaan' => 'B', 'kategori' => 'alat_biasa'],

            // Mesin - 1 kode = 1 unit fisik (stok selalu 1)
            ['kode_barang' => 'T-201', 'nama_barang' => 'Gerinda Tangan', 'merk' => 'Makita', 'type' => 'Potong', 'warna' => 'Hijau', 'ukuran' => '4 inch', 'stok' => 1, 'keadaan' => 'B', 'kategori' => 'mesin'],
            ['kode_barang' => 'T-202', 'nama_barang' => 'Mesin Bor Duduk', 'merk' => 'Krisbow', 'type' => 'Meja', 'warna' => 'Kuning', 'ukuran' => '-', 'stok' => 1, 'keadaan' => 'B', 'kategori' => 'mesin'],
            ['kode_barang' => 'T-203', 'nama_barang' => 'Mesin Las Listrik', 'merk' => 'Lakoni', 'type' => 'Inverter 200A', 'warna' => 'Merah', 'ukuran' => '-', 'stok' => 1, 'keadaan' => 'B', 'kategori' => 'mesin'],
        ];

        foreach ($data as $item) {
            Tool::updateOrCreate(['kode_barang' => $item['kode_barang']], $item);
        }
    }
}
