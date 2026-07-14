<?php

namespace Database\Seeders;

use App\Models\Consumable;
use Illuminate\Database\Seeder;

class ConsumableSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['kode_barang' => 'T-001', 'nama' => 'Kuas', 'ukuran' => '1/2"', 'stok_awal' => 11],
            ['kode_barang' => 'T-002', 'nama' => 'Kuas', 'ukuran' => '1"', 'stok_awal' => 14],
            ['kode_barang' => 'T-003', 'nama' => 'Kuas', 'ukuran' => '2"', 'stok_awal' => 18],
            ['kode_barang' => 'T-005', 'nama' => 'Lakban', 'merk' => 'Kertas', 'stok_awal' => 17],
            ['kode_barang' => 'T-006', 'nama' => 'Lakban', 'merk' => 'Hitam', 'stok_awal' => 4],
            ['kode_barang' => 'T-011', 'nama' => 'Polishing Pad', 'merk' => 'Kuning', 'stok_awal' => 49],
            ['kode_barang' => 'T-015', 'nama' => 'Kabel Tie', 'stok_awal' => 12],
            ['kode_barang' => 'T-020', 'nama' => 'Tungsten', 'merk' => 'Merah', 'ukuran' => '1,6', 'stok_awal' => 34],
        ];

        foreach ($data as $item) {
            Consumable::create($item);
        }
    }
}
