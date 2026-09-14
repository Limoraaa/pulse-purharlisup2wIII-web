<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Role;
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
                'color' => $role->color ?? 'secondary',
                // Ekstrak hanya nama permission-nya ke dalam array (misal: ['view_dashboard', 'view_inventaris'])
                'permissions' => $role->permissions->pluck('name')->toArray()
            ];
        });

        return response()->json($formattedRoles);
    }

    // Daftar ringkas semua role (dipakai dropdown "Tambah User", dll)
    public function index()
    {
        $roles = Role::select('id', 'name', 'color')->orderBy('name')->get();
        return response()->json($roles);
    }

    // Membuat role baru — lahir tanpa permission apa pun,
    // Super Admin yang mengatur nanti lewat matrix
    public function store(Request $request)
    {
        $allowedColors = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'dark'];

        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'color' => 'nullable|string|in:' . implode(',', $allowedColors),
        ]);

        if (strtolower(trim($request->name)) === 'super admin') {
            return response()->json(['message' => 'Nama role tidak boleh "Super Admin".'], 422);
        }

        $role = Role::create([
            'name' => trim($request->name),
            'color' => $request->color ?? 'secondary',
            'guard_name' => 'web',
        ]);

        return response()->json([
            'id' => $role->id,
            'name' => $role->name,
            'color' => $role->color,
            'permissions' => [],
        ], 201);
    }

        // Mengubah warna role yang sudah ada
    public function updateColor(Request $request, $id)
    {
        $allowedColors = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'dark'];

        $request->validate([
            'color' => 'required|string|in:' . implode(',', $allowedColors),
        ]);

        $role = Role::find($id);
        if (! $role) {
            return response()->json(['message' => 'Role tidak ditemukan'], 404);
        }

        $role->update(['color' => $request->color]);

        return response()->json(['id' => $role->id, 'name' => $role->name, 'color' => $role->color]);
    }

    // Menghapus role — dicegah kalau masih ada user yang memakainya
    public function destroy($id)
    {
        $role = Role::find($id);

        if (! $role) {
            return response()->json(['message' => 'Role tidak ditemukan'], 404);
        }

        if ($role->name === 'Super Admin') {
            return response()->json(['message' => 'Role Super Admin tidak dapat dihapus.'], 422);
        }

        $userCount = $role->users()->count();
        if ($userCount > 0) {
            return response()->json([
                'message' => "Role ini masih dipakai oleh {$userCount} user. Pindahkan user tersebut ke role lain terlebih dahulu.",
            ], 422);
        }

        $role->delete();

        return response()->json(['message' => 'Role berhasil dihapus']);
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
