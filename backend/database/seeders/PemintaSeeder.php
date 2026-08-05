<?php

namespace Database\Seeders;

use App\Models\Peminta;
use Illuminate\Database\Seeder;

class PemintaSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['nama' => 'Dadang M Syam', 'divisi' => 'HL'],
            ['nama' => 'Jaka Yudha Pamungkas', 'divisi' => 'HL'],
            ['nama' => 'Diki Ambara', 'divisi' => 'HL'],
            ['nama' => 'Dian Widiana', 'divisi' => 'HL'],
            ['nama' => 'Aji Sidik', 'divisi' => 'HL'],
            ['nama' => 'Riyanto', 'divisi' => 'MGTI'],
            ['nama' => 'Edy Supardi', 'divisi' => 'HL'],
            ['nama' => 'Abdul Aziz Muslim', 'divisi' => 'HL'],
        ];

        foreach ($data as $item) {
            Peminta::create($item);
        }
    }
}
