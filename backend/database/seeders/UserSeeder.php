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
            'username' => 'admin',
            'email' => 'admin@test.com',
            'password' => 'password123',
            'role' => 'staff',
            'must_change_password' => false,
        ]);

        User::create([
            'full_name' => 'Super Admin',
            'username' => 'superadmin',
            'email' => 'superadmin@test.com',
            'password' => 'password123',
            'role' => 'super_admin',
            'must_change_password' => false,
        ]);
    }
}
