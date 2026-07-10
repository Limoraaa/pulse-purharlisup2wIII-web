<?php

namespace Database\Seeders;

use App\Models\Tool;
use Illuminate\Database\Seeder;

class ToolSeeder extends Seeder
{
    public function run(): void
    {
        Tool::create([
            'kode_barang' => 'I-300',
            'nama_barang' => 'MATA BOR',
            'type' => 'BETON',
            'stok' => 20,
            'keadaan' => 'B',
        ]);

        Tool::create([
            'kode_barang' => 'I-117',
            'nama_barang' => 'KLEM',
            'merk' => 'BENZ',
            'type' => 'HASTON',
            'warna' => 'BIRU',
            'ukuran' => '3"',
            'stok' => 3,
            'keadaan' => 'B',
        ]);
    }
}
