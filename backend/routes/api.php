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
use App\Http\Controllers\Api\LaporanKerusakanController;

Route::post('/login', [AuthController::class, 'login']);

// 0. Users (kelola staff & super admin)
Route::apiResource('users', UserController::class);

// 1. tools (simple CRUD)
Route::apiResource('tools', ToolController::class);
Route::patch('/tools/{tool}/kurangi-stok', [ToolController::class, 'kurangiStok']);

// 2. consumable (simple CRUD)
Route::apiResource('consumable', ConsumableController::class);

// 3. Peminta (simple CRUD)
Route::apiResource('peminta', PemintaController::class);
Route::patch('/peminta/{id}/aktifkan', [PemintaController::class, 'aktifkan']);

// 4. Peminjaman (CRUD + tandai kembali)
// Route khusus HARUS di atas
Route::post('/peminjaman/scan', [PeminjamanController::class, 'scan']);
Route::get('/peminjaman/antrean', [PeminjamanController::class, 'antrean']);
Route::post('/peminjaman/proses', [PeminjamanController::class, 'prosesPeminjaman']);
Route::patch('/peminjaman/{id}/kembali', [PeminjamanController::class, 'kembali']);

// Baru CRUD
Route::apiResource('peminjaman', PeminjamanController::class);
// 5. Consumable Masuk & Keluar (transaksi stok)
Route::apiResource('consumable', ConsumableController::class);
Route::apiResource('consumable-masuk', ConsumableMasukController::class);
Route::apiResource('consumable-keluar', ConsumableKeluarController::class);

// 6. Laporan Kerusakan Tools
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


Route::middleware('auth:sanctum')->group(function () {

    // Proses Checkout Keranjang Peminjaman Tools
    Route::post('/peminjaman/proses', [PeminjamanController::class, 'prosesPeminjaman']);

    // Proses Checkout Keranjang Consumable Keluar
    Route::post('/consumable-keluar/proses', [ConsumableKeluarController::class, 'prosesKeluar']);

    // Auth & Data User
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

