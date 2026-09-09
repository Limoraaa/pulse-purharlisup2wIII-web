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
            'manage_master_data',

            // --- PERMISSIONS CRUD LAMA (Biarkan saja jika backend API masih menggunakannya) ---
            'view_tools', 'create_tools', 'edit_tools', 'delete_tools',
            'view_consumable', 'create_consumable', 'edit_consumable', 'delete_consumable',
            'view_peminjaman', 'create_peminjaman', 'edit_peminjaman', 'delete_peminjaman',
            'create_pemeliharaan', 'edit_pemeliharaan', 'delete_pemeliharaan',
            'create_users', 'edit_users', 'delete_users',

            // --- PERMISSIONS UNTUK CRUD PENUH DI OPERASIONAL ALAT ---
            'manage_inventaris',
            'process_transaksi', 'manage_transaksi',
            'create_order', 'process_order', 'manage_order',
            'manage_master_data',

            // --- LAPORAN KERUSAKAN ALAT (domain Operasional Alat) ---
            'view_kerusakan_alat', 'create_kerusakan_alat', 'process_kerusakan_alat', 'manage_kerusakan_alat',

            // --- PEMELIHARAAN MESIN (domain terpisah, TIDAK full akses untuk Staff) ---
            'view_dashboard_pemeliharaan',
            'view_pemeliharaan_mesin', 'create_pemeliharaan_mesin', 'process_pemeliharaan_mesin', 'manage_pemeliharaan_mesin',
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
            // Operasional Alat — FULL ACCESS
            'view_dashboard',
            'view_inventaris', 'manage_inventaris',
            'view_transaksi', 'process_transaksi', 'manage_transaksi',
            'view_riwayat',
            'view_order', 'create_order', 'process_order',
            'view_kerusakan_alat', 'create_kerusakan_alat', 'process_kerusakan_alat', 'manage_kerusakan_alat',
            'manage_master_data',

            // Pemeliharaan Mesin — HANYA LIHAT, tidak CRUD
            'view_dashboard_pemeliharaan',
            'view_pemeliharaan_mesin',

            // Sertakan juga permission CRUD lama agar fungsi backend tidak error
            'view_tools', 'view_consumable',
            'view_peminjaman', 'create_peminjaman', 'edit_peminjaman',
            'create_pemeliharaan', 'edit_pemeliharaan'
        ]);

        // Catatan: Super Admin tidak perlu di-assign permission satu-satu.
        // Kita akan bypass Super Admin di level AuthServiceProvider nanti.
    }
}
