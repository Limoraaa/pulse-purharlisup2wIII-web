<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

// Data Oli kini punya baris sendiri di matriks RBAC (kelompok Manajemen Mesin Produksi),
// tidak lagi ikut izin Inventaris. Level awal disamakan dengan akses sebelumnya:
// Admin = Akses penuh, Pegawai Maintenance Mesin = Lihat saja, role lain = Tidak ada.
return new class extends Migration
{
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (['view_data_oli', 'manage_data_oli'] as $nama) {
            Permission::firstOrCreate(['name' => $nama, 'guard_name' => 'web']);
        }

        Role::where('name', 'Admin')->where('guard_name', 'web')->first()
            ?->givePermissionTo(['view_data_oli', 'manage_data_oli']);
        Role::where('name', 'Pegawai Maintenance Mesin')->where('guard_name', 'web')->first()
            ?->givePermissionTo('view_data_oli');

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        Permission::whereIn('name', ['view_data_oli', 'manage_data_oli'])->where('guard_name', 'web')->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
