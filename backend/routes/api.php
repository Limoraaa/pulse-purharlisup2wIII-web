<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ConsumableController;
use App\Http\Controllers\Api\ToolController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\PemintaController;
use App\Http\Controllers\Api\PeminjamanController;
use App\Http\Controllers\Api\ConsumableMasukController;
use App\Http\Controllers\Api\ConsumableKeluarController;
use App\Http\Controllers\Api\ToolMasukController;
use App\Http\Controllers\Api\LaporanKerusakanController;
use App\Http\Controllers\Api\OrderConsumableController;
use App\Http\Controllers\Api\OrderToolController;
use App\Http\Controllers\Api\PekerjaanController;
use App\Http\Controllers\Api\RolePermissionController; // <-- TAMBAHAN IMPORT RBAC

Route::post('/login', [AuthController::class, 'login']);

Route::get('/peminjaman/belum-kembali', [PeminjamanController::class, 'belumKembali']);

// ==========================================
// ROUTE YANG TIDAK BUTUH AUTH (PUBLIC / GENERAL)
// Catatan: Jika aplikasi ini internal, pertimbangkan untuk memindahkan 
// aksi POST/PUT/DELETE di bawah ini ke dalam middleware auth.
// ==========================================
Route::apiResource('tools', ToolController::class);
Route::patch('/tools/{tool}/kurangi-stok', [ToolController::class, 'kurangiStok']);

Route::apiResource('consumable', ConsumableController::class);

Route::apiResource('peminta', PemintaController::class);
Route::patch('/peminta/{id}/aktifkan', [PemintaController::class, 'aktifkan']);

// --- DATA PEKERJAAN ---
Route::get('/pekerjaan/active', [PekerjaanController::class, 'getActive']);
Route::apiResource('pekerjaan', PekerjaanController::class);
Route::patch('/pekerjaan/{id}/toggle-status', [PekerjaanController::class, 'toggleStatus']);
// ----------------------

Route::apiResource('consumable-masuk', ConsumableMasukController::class);
Route::apiResource('tools-masuk', ToolMasukController::class);

Route::apiResource('laporan-kerusakan', LaporanKerusakanController::class);

Route::prefix('dashboard')->group(function () {
    Route::get('/summary', [DashboardController::class, 'summary']);
    Route::get('/stok-menipis', [DashboardController::class, 'stokMenipis']);
    Route::get('/telat-kembali', [DashboardController::class, 'telatKembali']);
    Route::get('/alat-terpopuler', [DashboardController::class, 'alatTerpopuler']);
    Route::get('/consumable-terpopuler', [DashboardController::class, 'consumableTerpopuler']);
    Route::get('/kerusakan-summary', [DashboardController::class, 'kerusakanSummary']);
    Route::get('/aktivitas-terbaru', [DashboardController::class, 'aktivitasTerbaru']);
    Route::get('/tren-peminjaman', [DashboardController::class, 'trenPeminjaman']);
    Route::get('/tren-consumable', [DashboardController::class, 'trenConsumable']);
});

// --- FITUR SCANNER & CART PUBLIK ---
Route::post('/peminjaman/scan', [PeminjamanController::class, 'scan']);
Route::get('/peminjaman/antrean', [PeminjamanController::class, 'antrean']);
Route::patch('/peminjaman/cart/{id}', [PeminjamanController::class, 'updateCartItem']);
Route::delete('/peminjaman/cart/{id}', [PeminjamanController::class, 'removeCartItem']);

Route::get('/order-consumable', [OrderConsumableController::class, 'index']);
Route::post('/order-consumable', [OrderConsumableController::class, 'store']);
Route::put('/order-consumable/{id}/status', [OrderConsumableController::class, 'updateStatus']);

// --- ORDER TOOLS ---
Route::get('/order-tools', [OrderToolController::class, 'index']);
Route::post('/order-tools', [OrderToolController::class, 'store']);
Route::put('/order-tools/{id}/status', [OrderToolController::class, 'updateStatus']);
Route::put('/order-tools/{id}', [OrderToolController::class, 'update']);


// ==========================================
// ROUTE YANG WAJIB LOGIN (SANCTUM MIDDLEWARE)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {

    // Auth & Data User
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Pastikan endpoint /user ini mengembalikan data role & permissions juga
    // agar Frontend (Next.js) tahu hak akses apa saja yang dimiliki user yang sedang login.
    Route::get('/user', function (Request $request) {
        $user = $request->user()->load('roles', 'permissions');
        // Mendapatkan semua nama permission langsung (gabungan direct & via role)
        $user->all_permissions = $user->getAllPermissions()->pluck('name'); 
        return $user;
    });

    // 1. Fitur Proses Akhir & Manajemen Peminjaman Utama
    Route::post('/peminjaman/proses', [PeminjamanController::class, 'prosesPeminjaman']);
    Route::patch('/peminjaman/{id}/kembali', [PeminjamanController::class, 'kembali']);
    Route::apiResource('peminjaman', PeminjamanController::class);

    Route::patch('/laporan-kerusakan/{id}/tandai-permanen', [LaporanKerusakanController::class, 'tandaiPermanen']);
    Route::patch('/laporan-kerusakan/{id}/repair', [LaporanKerusakanController::class, 'repair']);

    // 2. Fitur Keranjang & Scanner Consumable Keluar
    Route::post('/consumable-keluar/scan', [ConsumableKeluarController::class, 'scan']);
    Route::get('/consumable-keluar/antrean', [ConsumableKeluarController::class, 'antrean']);
    Route::patch('/consumable-keluar/cart/{id}', [ConsumableKeluarController::class, 'updateCartItem']);
    Route::delete('/consumable-keluar/antrean/{consumable_id}', [ConsumableKeluarController::class, 'hapusAntrean']);
    Route::post('/consumable-keluar/proses', [ConsumableKeluarController::class, 'prosesCartConsumable']);
    Route::apiResource('consumable-keluar', ConsumableKeluarController::class);

    // Profile (Semua user yang login bisa akses)
    Route::get('/profile', [UserController::class, 'profile']);
    Route::put('/profile', [UserController::class, 'updateProfile']);
    Route::patch('/profile', [UserController::class, 'updateProfile']);
    Route::post('/profile/photo', [UserController::class, 'uploadPhoto']);
    Route::patch('/profile/password', [UserController::class, 'changePassword']);

    // ==========================================
    // ROUTE KHUSUS SUPER ADMIN / STAFF
    // ==========================================
    
    // Menggunakan middleware 'role' dari Spatie untuk membatasi akses manajemen user
    Route::middleware(['role:Super Admin'])->group(function () {
        Route::apiResource('users', UserController::class);
        Route::patch('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
        Route::patch('/users/{id}/aktifkan', [UserController::class, 'activate']);
        
        // --- RUTE UNTUK MATRIKS RBAC BARU ---
        Route::get('/permissions/matrix', [RolePermissionController::class, 'getMatrix']);
        Route::put('/permissions/matrix', [RolePermissionController::class, 'updateMatrix']);
        
        // --- RUTE RBAC LAMA (opsional, dibiarkan jika masih dipakai di tempat lain) ---
        Route::get('/roles', [RolePermissionController::class, 'index']); 
        Route::get('/roles/{id}/permissions', [RolePermissionController::class, 'getRolePermissions']);
        Route::put('/roles/{id}/permissions', [RolePermissionController::class, 'updateRolePermissions']);
    });
});