<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required',
        ]);

        // Batasi percobaan login GAGAL: 5x per menit per username + IP (mencegah tebak password).
        // Login yang berhasil tidak dihitung, jadi akun bersama di satu jaringan tidak ikut terblokir.
        $kunci = 'login:' . strtolower($request->username) . '|' . $request->ip();
        if (RateLimiter::tooManyAttempts($kunci, 5)) {
            $detik = RateLimiter::availableIn($kunci);
            return response()->json([
                'message' => "Terlalu banyak percobaan login gagal. Coba lagi dalam {$detik} detik.",
            ], 429);
        }

        $user = User::where('username', $request->username)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            RateLimiter::hit($kunci, 60);
            return response()->json(['message' => 'Username atau password salah'], 401);
        }

        RateLimiter::clear($kunci);

        if (! $user->is_active) {
            return response()->json(['message' => 'Akun Anda telah dinonaktifkan. Hubungi Admin.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        $user->load('roles');
        $allPermissions = $user->getAllPermissions()->pluck('name');

        return response()->json([
            'user' => $user,
            'token' => $token,
            'must_change_password' => $user->must_change_password,
            'roles' => $user->roles->pluck('name'),
            'all_permissions' => $allPermissions,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil']);
    }
}
