<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
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

// --- PEMELIHARAAN MESIN (domain terpisah) ---
            'view_dashboard_pemeliharaan',
            'view_pemeliharaan_mesin', 'create_pemeliharaan_mesin', 'process_pemeliharaan_mesin', 'manage_pemeliharaan_mesin',
            // Operasional Mesin (Plotting Jadwal & Catatan Aktivitas Mesin)
            // process_operasional_mesin = level "Isi catatan" (tambah catatan aktivitas saja)
            'view_operasional_mesin', 'process_operasional_mesin', 'manage_operasional_mesin',
            // Data Mesin (master data: tambah, edit, nonaktifkan, hapus mesin)
            'view_data_mesin', 'manage_data_mesin',

            // --- PEMELIHARAAN MOTOR KONVERSI (domain terpisah) ---
            'view_dashboard_pemeliharaan_motor_konversi',
            'view_pemeliharaan_motor_konversi', 'process_pemeliharaan_motor_konversi', 'manage_pemeliharaan_motor_konversi',

            // --- ADMINISTRASI ---
            'manage_users',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // 2. Buat Roles — nama & warna disesuaikan dengan yang sudah diatur lewat "Kelola Role"
        $roleAdmin = Role::firstOrCreate(['name' => 'Admin'], ['color' => 'primary']);
        $roleStaff = Role::firstOrCreate(['name' => 'Staff Tools'], ['color' => 'success']);
        $rolePekerjaLapangan = Role::firstOrCreate(['name' => 'Pekerja Lapangan'], ['color' => 'info']);
        $rolePegawaiMaintenance = Role::firstOrCreate(['name' => 'Pegawai Maintenance Mesin'], ['color' => 'success']);
        $roleVendor = Role::firstOrCreate(['name' => 'Vendor'], ['color' => 'secondary']);
        $roleSuperAdmin = Role::firstOrCreate(['name' => 'Super Admin'], ['color' => 'warning']);

        // 3. Beri default permission sesuai matriks

        // --- ADMIN: akses penuh ke semua modul ---
        $roleAdmin->givePermissionTo([
            'view_dashboard',
            'view_inventaris', 'manage_inventaris',
            'view_transaksi', 'process_transaksi', 'manage_transaksi',
            'view_riwayat',
            'view_order', 'create_order', 'process_order', 'manage_order',
            'view_kerusakan_alat', 'create_kerusakan_alat', 'process_kerusakan_alat', 'manage_kerusakan_alat',
            'manage_master_data',
            'view_dashboard_pemeliharaan',
            'view_pemeliharaan_mesin', 'create_pemeliharaan_mesin', 'process_pemeliharaan_mesin', 'manage_pemeliharaan_mesin',
            'view_operasional_mesin', 'process_operasional_mesin', 'manage_operasional_mesin',
            'view_data_mesin', 'manage_data_mesin',
            'view_dashboard_pemeliharaan_motor_konversi',
            'view_pemeliharaan_motor_konversi', 'process_pemeliharaan_motor_konversi', 'manage_pemeliharaan_motor_konversi',
            'view_users', 'manage_users',
        ]);

        // --- STAFF TOOLS: full akses Operasional Alat, TIDAK ADA akses Pemeliharaan Mesin sama sekali ---
        $roleStaff->givePermissionTo([
            'view_dashboard',
            'view_inventaris', 'manage_inventaris',
            'view_transaksi', 'process_transaksi', 'manage_transaksi',
            'view_riwayat',
            'view_order', 'create_order', 'process_order', 'manage_order',
            'view_kerusakan_alat', 'create_kerusakan_alat', 'process_kerusakan_alat', 'manage_kerusakan_alat',
            'manage_master_data',

            // Sertakan juga permission CRUD lama agar fungsi backend tidak error
            'view_tools', 'view_consumable',
            'view_peminjaman', 'create_peminjaman', 'edit_peminjaman',
            'create_pemeliharaan', 'edit_pemeliharaan'
        ]);

        // --- PEKERJA LAPANGAN & VENDOR: level "Isi catatan" ---
        // Hanya menu Catatan Aktivitas Mesin & Catatan Pemeliharaan Mesin; bisa menambah catatan,
        // IK/HIRARC/kebutuhan/kalibrasi/peta part hanya dilihat. syncPermissions dipakai agar
        // izin lama yang lebih luas ikut dicabut saat seeder dijalankan ulang.
        $izinPencatat = ['process_operasional_mesin', 'process_pemeliharaan_mesin'];
        $rolePekerjaLapangan->syncPermissions($izinPencatat);
        $roleVendor->syncPermissions($izinPencatat);

        // --- PEGAWAI MAINTENANCE MESIN: kelola penuh SELURUH domain Pemeliharaan Mesin
        // (termasuk Dashboard Pemeliharaan), TIDAK ADA akses modul lain ---
        $rolePegawaiMaintenance->givePermissionTo([
            'view_dashboard_pemeliharaan',
            'view_pemeliharaan_mesin', 'process_pemeliharaan_mesin', 'manage_pemeliharaan_mesin',
            'view_operasional_mesin', 'process_operasional_mesin', 'manage_operasional_mesin',
            'view_data_mesin', 'manage_data_mesin',
        ]);

        // Catatan: Super Admin tidak perlu di-assign permission satu-satu.
        // Kita bypass Super Admin di level AppServiceProvider (Gate::before).
    }
}
