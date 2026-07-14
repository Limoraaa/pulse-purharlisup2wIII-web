<?php

namespace Database\Seeders;

use App\Models\Consumable;
use App\Models\ConsumableKeluar;
use App\Models\Peminta;
use App\Models\User;
use Illuminate\Database\Seeder;

class ConsumableKeluarSeeder extends Seeder
{
    public function run(): void
    {
        $staff = User::first();
        $kuas = Consumable::where('kode_barang', 'T-003')->first();
        $diki = Peminta::where('nama', 'Diki Ambara')->first();

        ConsumableKeluar::create([
            'tanggal' => '2026-07-05',
            'consumable_id' => $kuas->id,
            'peminta_id' => $diki->id,
            'jumlah_keluar' => 3,
            'pekerjaan_area' => 'Bucket Elevator',
            'dicatat_oleh' => $staff->id,
        ]);

        // Update stok sesuai transaksi keluar ini
        $kuas->stok_awal -= 3;
        $kuas->save();
    }
}
