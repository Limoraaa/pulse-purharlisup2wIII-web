<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Server produksi: role/permission + satu Super Admin (tanpa akun contoh) + daftar pekerjaan
        if (app()->isProduction()) {
            $this->call([
                RolePermissionSeeder::class,
                SuperAdminAwalSeeder::class,
                PekerjaanSeeder::class,
            ]);
            return;
        }

        // Lokal: hanya data dasar. Data lain (alat, consumable, peminjam, mesin, transaksi)
        // diimpor dari PostgreSQL atau diisi langsung lewat web.
        $this->call([
            RolePermissionSeeder::class, // <-- Wajib paling atas agar role & permission siap
            UserSeeder::class,          // <-- Baru buat user dan assign role-nya di sini
            PekerjaanSeeder::class,
        ]);

        // Data contoh lama tetap tersedia bila diperlukan, jalankan satu per satu, mis.:
        // php artisan db:seed --class=PemintaSeeder
        // Urutan: PemintaSeeder, ToolSeeder, ConsumableSeeder, ToolsMasukSeeder, ConsumableMasukSeeder,
        //         PeminjamanSeeder, ConsumableKeluarSeeder, MesinProduksiSeeder, LogAktivitasMesinSeeder
    }
}
