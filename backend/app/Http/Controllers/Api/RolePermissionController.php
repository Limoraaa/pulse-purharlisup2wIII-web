<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionController extends Controller
{
    // =========================================================================
    // FUNGSI BARU UNTUK UI MATRIKS (Semua Role & Semua Menu)
    // =========================================================================

    // Ambil semua role beserta permission-nya
    public function getMatrix()
    {
        // Ambil semua role beserta relasi permissions-nya
        $roles = Role::with('permissions')->get();

        $formattedRoles = $roles->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                // Ekstrak hanya nama permission-nya ke dalam array (misal: ['view_dashboard', 'view_inventaris'])
                'permissions' => $role->permissions->pluck('name')->toArray()
            ];
        });

        return response()->json($formattedRoles);
    }

    // Simpan perubahan matriks untuk semua role sekaligus
    public function updateMatrix(Request $request)
    {
        $request->validate([
            'roles' => 'required|array',
            'roles.*.id' => 'required|exists:roles,id',
            'roles.*.permissions' => 'array',
        ]);

        foreach ($request->roles as $roleData) {
            $role = Role::find($roleData['id']);
            if ($role) {
                // syncPermissions akan otomatis menimpa hak akses lama dengan array yang baru dikirim
                // Gunakan coalesce (?? []) agar tidak error jika permissions kosong
                $role->syncPermissions($roleData['permissions'] ?? []);
            }
        }

        return response()->json(['message' => 'Matriks hak akses berhasil diperbarui!']);
    }


    // =========================================================================
    // FUNGSI LAMA (Dipertahankan jika masih dibutuhkan oleh komponen lain)
    // =========================================================================

    // Mengambil semua permission dan statusnya pada role tertentu
    public function getRolePermissions($roleId)
    {
        $role = Role::with('permissions')->find($roleId);
        $allPermissions = Permission::all();

        if (!$role) {
            return response()->json(['message' => 'Role tidak ditemukan'], 404);
        }

        // Format data agar mudah dibaca Frontend (Next.js) untuk switch toggle
        $formattedPermissions = $allPermissions->map(function ($perm) use ($role) {
            return [
                'id' => $perm->id,
                'name' => $perm->name,
                // Jika role punya permission ini, is_active = true (Toggle ON)
                'is_active' => $role->hasPermissionTo($perm->name) 
            ];
        });

        return response()->json([
            'role' => $role->name,
            'permissions' => $formattedPermissions
        ]);
    }

    // Menyimpan perubahan dari Switch Toggle Frontend
    public function updateRolePermissions(Request $request, $roleId)
    {
        $request->validate([
            // array berisi nama-nama permission yang 'ON'
            'permissions' => 'array', 
            'permissions.*' => 'string|exists:permissions,name'
        ]);

        $role = Role::find($roleId);
        if (!$role) {
            return response()->json(['message' => 'Role tidak ditemukan'], 404);
        }

        // Sync akan otomatis menghapus yang OFF dan menyimpan yang ON
        $role->syncPermissions($request->permissions);

        return response()->json(['message' => 'Hak akses berhasil diperbarui!']);
    }
}