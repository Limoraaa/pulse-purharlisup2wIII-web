<?php

namespace Database\Seeders;

use App\Models\LaporanKerusakanTools;
use App\Models\Tool;
use App\Models\User;
use Illuminate\Database\Seeder;

class LaporanKerusakanToolsSeeder extends Seeder
{
    public function run(): void
    {
        $staff = User::first();
        $penggaris = Tool::where('kode_barang', 'I-427')->first();

        LaporanKerusakanTools::create([
            'tanggal' => '2026-07-08',
            'tool_id' => $penggaris->id,
            'jumlah' => 1,
            'keterangan' => 'Penggaris patah, tidak bisa diperbaiki',
            'dilaporkan_oleh' => $staff->id,
        ]);

        // Update stok sesuai laporan kerusakan ini
        $penggaris->stok -= 1;
        $penggaris->save();
    }
}
