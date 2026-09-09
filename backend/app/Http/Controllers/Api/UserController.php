<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UserController extends Controller
{
    // Kolom yang aman ditampilkan (password tidak pernah ikut)
    private const SAFE_COLUMNS = [
        'id', 'full_name', 'username', 'email', 'role', 'divisi', 'no_hp', 'avatar_path', 'is_active', 'must_change_password', 'created_at',
    ];

    public function index()
    {
        return response()->json(
            User::select(self::SAFE_COLUMNS)
                ->orderBy('full_name')
                ->get()
        );
    }

    public function show(string $id)
    {
        $user = User::select(self::SAFE_COLUMNS)->find($id);

        if (! $user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        return response()->json($user);
    }

    public function profile(Request $request)
    {
        $user = $request->user();
        return response()->json(collect($user)->only(self::SAFE_COLUMNS));
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|required|string|max:255',
            'username' => 'sometimes|required|string|max:255|unique:users,username,' . $user->id,
            'email' => 'sometimes|nullable|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'divisi' => 'sometimes|nullable|string|max:255',
            'no_hp' => 'sometimes|nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json($user->only(self::SAFE_COLUMNS));
    }

    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'password_lama' => 'required|string',
            'password_baru' => 'required|string|min:6|confirmed',
        ], [
            'password_baru.confirmed' => 'Konfirmasi password baru tidak cocok.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (! \Illuminate\Support\Facades\Hash::check($request->password_lama, $user->password)) {
            return response()->json([
                'errors' => ['password_lama' => ['Password lama tidak sesuai.']],
            ], 422);
        }

        $user->update([
            'password' => $request->password_baru,
            'must_change_password' => false,
        ]);

        return response()->json(['message' => 'Password berhasil diperbarui']);
    }

    public function store(Request $request)
    {
        // Pengecekan hasRole telah dihapus karena sudah diatasi oleh routes middleware

        $rules = [
            'full_name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'nullable|email|unique:users,email',
            'password' => 'required|string|min:6',
            'divisi' => 'nullable|string|max:255',
            'no_hp' => 'nullable|string|max:20',
            // Perbaikan daftar Role yang diizinkan sesuai kapitalisasi seeder
            'role' => 'required|in:Pegawai,Staff,Admin,Team Leader,Super Admin',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $data['must_change_password'] = false;
        $data['is_active'] = true;

        $user = User::create($data);

        // Tempelkan role Spatie ke user yang baru dibuat
        $user->assignRole($data['role']);

        return response()->json($user->only(self::SAFE_COLUMNS), 201);
    }

    // PUT/PATCH /api/users/{id}
    public function update(Request $request, string $id)
    {
        $targetUser = User::find($id);

        if (! $targetUser) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        if ($targetUser->hasRole('Super Admin') && !auth()->user()->hasRole('Super Admin')) {
            return response()->json(['message' => 'Anda tidak memiliki izin untuk mengubah akun ini.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|required|string|max:255',
            'username' => 'sometimes|required|string|max:255|unique:users,username,' . $targetUser->id,
            'email' => 'sometimes|nullable|email|unique:users,email,' . $targetUser->id,
            'password' => 'nullable|string|min:6',

            // PERBAIKAN DI SINI: Sesuaikan dengan daftar role baru
            'role' => 'sometimes|required|in:Pegawai,Staff,Admin,Team Leader,Super Admin',

            'divisi' => 'sometimes|nullable|string|max:255',
            'no_hp' => 'sometimes|nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $targetUser->update($data);

        // Jika ada perubahan role, sinkronisasikan dengan tabel Spatie
        if (isset($data['role'])) {
            $targetUser->syncRoles([$data['role']]);
        }

        return response()->json($targetUser->only(self::SAFE_COLUMNS));
    }

    public function destroy(Request $request, string $id)
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        if ($user->hasRole('Super Admin') && !auth()->user()->hasRole('Super Admin')) {
            return response()->json(['message' => 'Anda tidak memiliki izin untuk mengubah akun ini.'], 403);
        }

        $user->update(['is_active' => false]);
        $user->tokens()->delete();

        return response()->json(['message' => 'User berhasil dinonaktifkan']);
    }

    public function activate(Request $request, string $id)
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        if ($user->hasRole('Super Admin') && !auth()->user()->hasRole('Super Admin')) {
            return response()->json(['message' => 'Anda tidak memiliki izin untuk mengubah akun ini.'], 403);
        }

        $user->update(['is_active' => true]);

        return response()->json(['message' => 'User berhasil diaktifkan']);
    }

    public function resetPassword(Request $request, string $id)
    {
        $targetUser = User::find($id);

        if (! $targetUser) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        if ($targetUser->hasRole('Super Admin') && !auth()->user()->hasRole('Super Admin')) {
            return response()->json(['message' => 'Anda tidak memiliki izin untuk mengubah akun ini.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'password_baru' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $targetUser->update([
            'password' => $request->password_baru,
        ]);

        return response()->json(['message' => 'Password user berhasil direset']);
    }

    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $user = $request->user();

        if ($user->avatar_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($user->avatar_path);
        }

        $path = $request->file('avatar')->store('avatars', 'public');

        $user->update(['avatar_path' => $path]);

        return response()->json([
            'avatar_path' => $path,
            'avatar_url' => \Illuminate\Support\Facades\Storage::disk('public')->url($path),
        ]);
    }
}
