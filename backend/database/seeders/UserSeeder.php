<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'full_name' => 'Admin Testing',
            'email' => 'admin@test.com',
            'password' => 'password123',
            'role' => 'staff',
        ]);

        User::create([
            'full_name' => 'Super Admin',
            'email' => 'superadmin@test.com',
            'password' => 'password123',
            'role' => 'super_admin',
        ]);
    }
}
