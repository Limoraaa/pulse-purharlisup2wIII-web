<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            PemintaSeeder::class,
            ToolSeeder::class,
            ConsumableSeeder::class,
            PeminjamanSeeder::class,
            ConsumableMasukSeeder::class,
            ConsumableKeluarSeeder::class,
            LaporanKerusakanToolsSeeder::class,
            MesinProduksiSeeder::class,
            LogAktivitasMesinSeeder::class,
        ]);
    }
}
