<?php

namespace Database\Seeders;

use App\Models\Tool;
use Illuminate\Database\Seeder;

class ToolSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['kode_barang' => 'I-300', 'nama_barang' => 'MATA BOR', 'type' => 'BETON', 'stok' => 20, 'keadaan' => 'B'],
            ['kode_barang' => 'I-117', 'nama_barang' => 'KLEM', 'merk' => 'BENZ', 'type' => 'HASTON', 'warna' => 'BIRU', 'ukuran' => '3"', 'stok' => 3, 'keadaan' => 'B'],
            ['kode_barang' => 'I-120', 'nama_barang' => 'KLEM', 'type' => 'HASTON', 'warna' => 'KUNING', 'ukuran' => '6"', 'stok' => 4, 'keadaan' => 'B'],
            ['kode_barang' => 'I-420', 'nama_barang' => 'PALU', 'type' => 'BESI', 'stok' => 2, 'keadaan' => 'B'],
            ['kode_barang' => 'I-023', 'nama_barang' => 'CHAIN BLOCK', 'merk' => 'SANJIA&GS(1)', 'ukuran' => '2TON', 'stok' => 1, 'keadaan' => 'B'],
            ['kode_barang' => 'I-187', 'nama_barang' => 'KUNCI RING', 'merk' => 'KRISBOW&WIPRO(1)', 'type' => 'PUKUL', 'ukuran' => '30mm', 'stok' => 2, 'keadaan' => 'B'],
            ['kode_barang' => 'I-389', 'nama_barang' => 'METERAN', 'merk' => 'HASTON', 'type' => 'LOCK-BUTTON&MAGNET', 'ukuran' => '10mx25mm', 'stok' => 3, 'keadaan' => 'B'],
            ['kode_barang' => 'I-427', 'nama_barang' => 'PENGGARIS', 'merk' => 'SELLERY', 'type' => 'SIKU', 'warna' => 'SILVER', 'ukuran' => '30cm', 'stok' => 5, 'keadaan' => 'B'],
        ];

        foreach ($data as $item) {
            Tool::create($item);
        }
    }
}
