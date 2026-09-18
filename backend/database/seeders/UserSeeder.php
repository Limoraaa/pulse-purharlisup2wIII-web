<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Buat user Staff Tools
        $staff = User::create([
            'full_name' => 'Staff Tools',
            'username' => 'staff',
            'email' => 'staff@test.com',
            'password' => Hash::make('password123'),
            'role' => 'Staff Tools',
            'must_change_password' => false,
        ]);
        $staff->assignRole('Staff Tools');

        // 2. Buat user Super Admin
        $superAdmin = User::create([
            'full_name' => 'Super Admin',
            'username' => 'superadmin',
            'email' => 'superadmin@test.com',
            'password' => Hash::make('password123'),
            'role' => 'Super Admin',
            'must_change_password' => false,
        ]);
        $superAdmin->assignRole('Super Admin');

        // 3. Buat user Admin
        $admin = User::create([
            'full_name' => 'Admin Testing',
            'username' => 'admin',
            'email' => 'admin@test.com',
            'password' => Hash::make('password123'),
            'role' => 'Admin',
            'must_change_password' => false,
        ]);
        $admin->assignRole('Admin');

        // 4. Buat user Pekerja Lapangan
        $pekerjaLapangan = User::create([
            'full_name' => 'Pekerja Lapangan Testing',
            'username' => 'lapangan',
            'email' => 'lapangan@test.com',
            'password' => Hash::make('password123'),
            'role' => 'Pekerja Lapangan',
            'must_change_password' => false,
        ]);
        $pekerjaLapangan->assignRole('Pekerja Lapangan');

        // 5. Buat user Pegawai Maintenance Mesin
        $pegawaiMaintenance = User::create([
            'full_name' => 'Pegawai Maintenance Testing',
            'username' => 'maintenance',
            'email' => 'maintenance@test.com',
            'password' => Hash::make('password123'),
            'role' => 'Pegawai Maintenance Mesin',
            'must_change_password' => false,
        ]);
        $pegawaiMaintenance->assignRole('Pegawai Maintenance Mesin');
    }
}
