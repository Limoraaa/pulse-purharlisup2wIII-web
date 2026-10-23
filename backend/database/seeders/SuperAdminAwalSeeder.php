<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

/**
 * Seeder untuk server produksi: hanya membuat satu akun Super Admin.
 * Password diambil dari .env (SUPERADMIN_PASSWORD), bukan password contoh.
 */
class SuperAdminAwalSeeder extends Seeder
{
    public function run(): void
    {
        $password = (string) config('app.superadmin_awal.password');
        if (strlen($password) < 8) {
            throw new RuntimeException('Isi SUPERADMIN_PASSWORD di .env (minimal 8 karakter) sebelum menjalankan seeder di produksi.');
        }

        $username = config('app.superadmin_awal.username') ?: 'superadmin';
        if (User::where('username', $username)->exists()) {
            $this->command?->info("Akun {$username} sudah ada, dilewati.");
            return;
        }

        $user = User::create([
            'full_name' => 'Super Admin',
            'username' => $username,
            'password' => Hash::make($password),
            'role' => 'Super Admin',
            'must_change_password' => false,
        ]);
        $user->assignRole('Super Admin');
    }
}
