<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
        PemintaSeeder::class,
        ToolSeeder::class,
        ConsumableSeeder::class,
        UserSeeder::class,
        ToolsMasukSeeder::class,
        ConsumableMasukSeeder::class,
        PeminjamanSeeder::class,
        ConsumableKeluarSeeder::class,
    ]);
    }
}
