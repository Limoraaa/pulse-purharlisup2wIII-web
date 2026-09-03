<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Pekerjaan;

class PekerjaanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pekerjaanList = [
            ['nama_pekerjaan' => 'TBS TANASA', 'is_active' => true],
            ['nama_pekerjaan' => 'BEARING', 'is_active' => true],
            ['nama_pekerjaan' => 'DUMPER', 'is_active' => true],
            ['nama_pekerjaan' => 'BUCKET ELEVATOR', 'is_active' => true],
        ];

        foreach ($pekerjaanList as $pekerjaan) {
            Pekerjaan::create($pekerjaan);
        }
    }
}