<?php

namespace Database\Seeders;

use App\Models\Peminta;
use Illuminate\Database\Seeder;

class PemintaSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['id' => '0004112233', 'nama' => 'Dedi Kurniawan', 'divisi' => 'HL', 'role' => 'inventory man', 'aktif' => true],
            ['id' => '0004112234', 'nama' => 'Rian Setiawan', 'divisi' => 'MGTI', 'role' => 'inventory man', 'aktif' => true],
            ['id' => '0004112235', 'nama' => 'Bambang Sutrisno', 'divisi' => 'HL', 'role' => 'user', 'aktif' => true],
            ['id' => '0004112236', 'nama' => 'Yusuf Hidayat', 'divisi' => 'HL', 'role' => 'user', 'aktif' => true],
            ['id' => '0004112237', 'nama' => 'Wahyu Prasetyo', 'divisi' => 'MGTI', 'role' => 'user', 'aktif' => true],
            ['id' => '0004112238', 'nama' => 'Agus Salim', 'divisi' => 'HL', 'role' => 'user', 'aktif' => true],
            ['id' => '0004112239', 'nama' => 'Fajar Nugroho', 'divisi' => 'HL', 'role' => 'user', 'aktif' => true],
            ['id' => '0004112240', 'nama' => 'Iwan Setiadi', 'divisi' => 'MGTI', 'role' => 'user', 'aktif' => false],
        ];

        foreach ($data as $item) {
            Peminta::updateOrCreate(['id' => $item['id']], $item);
        }
    }
}
