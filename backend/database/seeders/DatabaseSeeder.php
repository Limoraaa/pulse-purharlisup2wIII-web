<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Server produksi: hanya role/permission + satu Super Admin (tanpa akun & data contoh)
        if (app()->isProduction()) {
            $this->call([
                RolePermissionSeeder::class,
                SuperAdminAwalSeeder::class,
            ]);
            return;
        }

        $this->call([
            RolePermissionSeeder::class, // <-- Wajib paling atas agar role & permission siap
            UserSeeder::class,          // <-- Baru buat user dan assign role-nya di sini
            PemintaSeeder::class,
            ToolSeeder::class,
            ConsumableSeeder::class,
            ToolsMasukSeeder::class,
            ConsumableMasukSeeder::class,
            PeminjamanSeeder::class,
            ConsumableKeluarSeeder::class,
            PekerjaanSeeder::class,
            MesinProduksiSeeder::class,
            LogAktivitasMesinSeeder::class,
        ]);
    }
}