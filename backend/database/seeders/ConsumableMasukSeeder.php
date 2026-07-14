<?php

namespace Database\Seeders;

use App\Models\Consumable;
use App\Models\ConsumableMasuk;
use App\Models\User;
use Illuminate\Database\Seeder;

class ConsumableMasukSeeder extends Seeder
{
    public function run(): void
    {
        $staff = User::first();
        $kuas = Consumable::where('kode_barang', 'T-003')->first();

        ConsumableMasuk::create([
            'tanggal' => '2026-05-11',
            'consumable_id' => $kuas->id,
            'jumlah_masuk' => 20,
            'keterangan' => 'Restock rutin',
            'dicatat_oleh' => $staff->id,
        ]);

        // Update stok sesuai transaksi masuk ini
        $kuas->stok_awal += 20;
        $kuas->save();
    }
}
