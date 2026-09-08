<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Buat user Admin/Staff
        $staff = User::create([
            'full_name' => 'Admin Testing',
            'username' => 'admin',
            'email' => 'admin@test.com',
            'password' => Hash::make('password123'),
            'role' => 'staff',
            'must_change_password' => false,
        ]);
        // Berikan role 'Staff' dari Spatie
        $staff->assignRole('Staff');

        // 2. Buat user Super Admin
        $superAdmin = User::create([
            'full_name' => 'Super Admin',
            'username' => 'superadmin',
            'email' => 'superadmin@test.com',
            'password' => Hash::make('password123'),
            'role' => 'super_admin',
            'must_change_password' => false,
        ]);
        // Berikan role 'Super Admin' dari Spatie
        $superAdmin->assignRole('Super Admin');
    }
}