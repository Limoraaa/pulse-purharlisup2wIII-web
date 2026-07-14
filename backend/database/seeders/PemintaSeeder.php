<?php

namespace Database\Seeders;

use App\Models\Peminta;
use Illuminate\Database\Seeder;

class PemintaSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['nama' => 'Dadang M Syam', 'kategori' => 'HL'],
            ['nama' => 'Jaka Yudha Pamungkas', 'kategori' => 'HL'],
            ['nama' => 'Diki Ambara', 'kategori' => 'HL'],
            ['nama' => 'Dian Widiana', 'kategori' => 'HL'],
            ['nama' => 'Aji Sidik', 'kategori' => 'HL'],
            ['nama' => 'Riyanto', 'kategori' => 'MGTI'],
            ['nama' => 'Edy Supardi', 'kategori' => 'HL'],
            ['nama' => 'Abdul Aziz Muslim', 'kategori' => 'HL'],
        ];

        foreach ($data as $item) {
            Peminta::create($item);
        }
    }
}
