<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run()
    {
        // Reset cache permission Spatie
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Buat daftar hak akses (Permissions)
        $permissions = [
            // --- PERMISSIONS BARU UNTUK MENU NAVBAR ---
            'view_dashboard',
            'view_inventaris',
            'view_transaksi',
            'view_riwayat',
            'view_order',
            'view_pemeliharaan',
            'view_users',

            // --- PERMISSIONS CRUD LAMA (Biarkan saja jika backend API masih menggunakannya) ---
            'view_tools', 'create_tools', 'edit_tools', 'delete_tools',
            'view_consumable', 'create_consumable', 'edit_consumable', 'delete_consumable',
            'view_peminjaman', 'create_peminjaman', 'edit_peminjaman', 'delete_peminjaman',
            'create_pemeliharaan', 'edit_pemeliharaan', 'delete_pemeliharaan',
            'create_users', 'edit_users', 'delete_users',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // 2. Buat Roles (Termasuk role tambahan yang Anda sebutkan)
        $rolePegawai = Role::firstOrCreate(['name' => 'Pegawai']);
        $roleStaff = Role::firstOrCreate(['name' => 'Staff']);
        $roleAdmin = Role::firstOrCreate(['name' => 'Admin']);
        $roleTeamLeader = Role::firstOrCreate(['name' => 'Team Leader']);
        $roleSuperAdmin = Role::firstOrCreate(['name' => 'Super Admin']);

        // 3. Beri default permission Navbar untuk role tertentu
        // Contoh untuk Staff: Hanya bisa melihat Dashboard, Inventaris, Transaksi, dan Laporan Kerusakan
        $roleStaff->givePermissionTo([
            'view_dashboard',
            'view_inventaris',
            'view_transaksi',
            'view_pemeliharaan',
            
            // Sertakan juga permission CRUD lama agar fungsi backend tidak error
            'view_tools', 'view_consumable', 
            'view_peminjaman', 'create_peminjaman', 'edit_peminjaman',
            'create_pemeliharaan', 'edit_pemeliharaan'
        ]);

        // Catatan: Super Admin tidak perlu di-assign permission satu-satu.
        // Kita akan bypass Super Admin di level AuthServiceProvider nanti.
    }
}