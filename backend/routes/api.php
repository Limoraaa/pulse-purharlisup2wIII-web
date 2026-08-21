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

Route::post('/login', [AuthController::class, 'login']);

// ==========================================
// ROUTE YANG TIDAK BUTUH AUTH (PUBLIC / GENERAL)
// ==========================================
Route::apiResource('tools', ToolController::class);
Route::patch('/tools/{tool}/kurangi-stok', [ToolController::class, 'kurangiStok']);

Route::apiResource('consumable', ConsumableController::class);
Route::apiResource('peminta', PemintaController::class);
Route::patch('/peminta/{id}/aktifkan', [PemintaController::class, 'aktifkan']);

Route::apiResource('consumable-masuk', ConsumableMasukController::class);
Route::apiResource('tools-masuk', ToolMasukController::class);
// HAPUS Route::apiResource('consumable-keluar') DARI SINI
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
});

// --- FITUR SCANNER & CART PUBLIK (Agar Flutter & Web Dashboard sinkron tanpa token khusus scan) ---
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
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // 1. Fitur Proses Akhir & Manajemen Peminjaman Utama (Tetap Butuh Login)
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

    // PINDAHKAN KE SINI: Pastikan apiResource selalu berada di BAWAH rute kustom
    Route::apiResource('consumable-keluar', ConsumableKeluarController::class);

    Route::get('/profile', [UserController::class, 'profile']);
    Route::put('/profile', [UserController::class, 'updateProfile']);
    Route::patch('/profile', [UserController::class, 'updateProfile']);
    Route::post('/profile/photo', [UserController::class, 'uploadPhoto']);
    Route::patch('/profile/password', [UserController::class, 'changePassword']);

    Route::apiResource('users', UserController::class);
    Route::patch('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
    Route::patch('/users/{id}/aktifkan', [UserController::class, 'activate']);
});
