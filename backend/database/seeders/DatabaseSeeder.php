<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            PemintaSeeder::class,
            ToolSeeder::class,
        ]);

        \App\Models\User::create([
            'full_name' => 'Staff',
            'email' => 'Staff@inven.com',
            'password' => 'password123',
            'role' => 'staff',
        ]);
    }
}
