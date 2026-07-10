<?php

namespace Database\Seeders;

use App\Models\Peminta;
use Illuminate\Database\Seeder;

class PemintaSeeder extends Seeder
{
    public function run(): void
    {
        Peminta::create(['nama' => 'Dadang M Syam', 'kategori' => 'HL']);
        Peminta::create(['nama' => 'Jaka Yudha Pamungkas', 'kategori' => 'HL']);
        Peminta::create(['nama' => 'Diki Ambara', 'kategori' => 'HL']);
        Peminta::create(['nama' => 'Riyanto', 'kategori' => 'MGTI']);
    }
}
