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

    // GET /api/users
    public function index()
    {
        return response()->json(
            User::select(self::SAFE_COLUMNS)
                ->orderBy('full_name')
                ->get()
        );
    }

    // GET /api/users/{id}
    public function show(string $id)
    {
        $user = User::select(self::SAFE_COLUMNS)->find($id);

        if (! $user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        return response()->json($user);
    }

    // GET /api/profile — data user yang sedang login
    public function profile(Request $request)
    {
        $user = $request->user();

        return response()->json(
            collect($user)->only(self::SAFE_COLUMNS)
        );
    }

    // PUT/PATCH /api/profile — update data diri sendiri
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

    // PATCH /api/profile/password
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

    // POST /api/users
    // Staff: role selalu dipaksa jadi 'staff', apapun yang dikirim.
    // Admin: bebas menentukan role.
    // Password TIDAK diinput manual — sistem generate random & dikembalikan sekali ke frontend.
    public function store(Request $request)
    {
        $currentUser = $request->user();

        if (! $currentUser->hasRole('super_admin')) {
            return response()->json([
                'message' => 'Anda tidak memiliki izin untuk menambahkan user.',
            ], 403);
        }

        $rules = [
            'full_name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'nullable|email|unique:users,email',
            'password' => 'required|string|min:6',
            'divisi' => 'nullable|string|max:255',
            'no_hp' => 'nullable|string|max:20',
        ];

        // Admin boleh isi role, staff tidak perlu kirim role sama sekali
        if ($currentUser->hasRole('super_admin')) {
            $rules['role'] = 'required|in:staff,super_admin';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // Kalau yang bikin akun adalah staff, paksa role jadi staff
        if (! $currentUser->hasRole('super_admin')) {
            $data['role'] = 'staff';
        }

        $data['must_change_password'] = false;
        $data['is_active'] = true;
        $user = User::create($data); // 'password' otomatis di-hash lewat cast 'password' => 'hashed'
        return response()->json($user->only(self::SAFE_COLUMNS), 201);
    }

    // PUT/PATCH /api/users/{id}
    // Hanya Admin yang boleh mengedit user (staff sama sekali tidak punya akses edit).
    public function update(Request $request, string $id)
    {
        $currentUser = $request->user();

        if (! $currentUser->hasRole('super_admin')) {
            return response()->json([
                'message' => 'Anda tidak memiliki izin untuk mengedit user.',
            ], 403);
        }

        $targetUser = User::find($id);

        if (! $targetUser) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|required|string|max:255',
            'username' => 'sometimes|required|string|max:255|unique:users,username,' . $targetUser->id,
            'email' => 'sometimes|nullable|email|unique:users,email,' . $targetUser->id,
            'password' => 'nullable|string|min:6',
            'role' => 'sometimes|required|in:staff,super_admin',
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

        return response()->json($targetUser->only(self::SAFE_COLUMNS));
    }

    // DELETE /api/users/{id}
    // Bukan hapus permanen -- user dinonaktifkan (soft delete) supaya riwayat
    // transaksi yang masih terkait (mis. peminjaman.dicatat_oleh) tetap aman.
    public function destroy(Request $request, string $id)
    {
        $currentUser = $request->user();

        if (! $currentUser->hasRole('super_admin')) {
            return response()->json([
                'message' => 'Anda tidak memiliki izin untuk menonaktifkan user.',
            ], 403);
        }

        $user = User::find($id);

       $user = User::find($id);

        if (! $user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        $user->update(['is_active' => false]);
        $user->tokens()->delete(); // cabut semua sesi/token aktif miliknya

        return response()->json(['message' => 'User berhasil dinonaktifkan']);
    }

    // PATCH /api/users/{id}/aktifkan
    public function activate(Request $request, string $id)
    {
        $currentUser = $request->user();

        if (! $currentUser->hasRole('super_admin')) {
            return response()->json([
                'message' => 'Anda tidak memiliki izin untuk mengaktifkan user.',
            ], 403);
        }

        $user = User::find($id);

        if (! $user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        $user->update(['is_active' => true]);

        return response()->json(['message' => 'User berhasil diaktifkan']);
    }

    // PATCH /api/users/{id}/reset-password
    // Hanya Admin yang boleh me-reset password user lain (tanpa perlu tahu password lama).
    public function resetPassword(Request $request, string $id)
    {
        $currentUser = $request->user();

        if (! $currentUser->hasRole('super_admin')) {
            return response()->json([
                'message' => 'Anda tidak memiliki izin untuk mereset password user.',
            ], 403);
        }

        $targetUser = User::find($id);

        if (! $targetUser) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
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

    // POST /api/profile/photo
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
