<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ConsumableController;
use App\Http\Controllers\Api\ToolController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\API\PemintaController;
use App\Http\Controllers\API\PeminjamanController;
use App\Http\Controllers\API\ConsumableMasukController;
use App\Http\Controllers\API\ConsumableKeluarController;
use App\Http\Controllers\API\LaporanKerusakanController;

Route::post('/login', [AuthController::class, 'login']);

// 0. Users (kelola staff & super admin)
Route::apiResource('users', UserController::class);

// 1. tools (simple CRUD)
Route::apiResource('tools', ToolController::class);

// 2. consumable (simple CRUD)
Route::apiResource('consumables', ConsumableController::class);

// 3. Peminta (simple CRUD)
Route::apiResource('peminta', PemintaController::class);

// 4. Peminjaman (CRUD + tandai kembali)
// Route khusus HARUS di atas
Route::post('/peminjaman/scan', [PeminjamanController::class, 'scan']);
Route::get('/peminjaman/antrean', [PeminjamanController::class, 'antrean']);
Route::post('/peminjaman/proses', [PeminjamanController::class, 'prosesPeminjaman']);
Route::patch('/peminjaman/{id}/kembali', [PeminjamanController::class, 'kembali']);

// Baru CRUD
Route::apiResource('peminjaman', PeminjamanController::class);
// 5. Consumable Masuk & Keluar (transaksi stok)
Route::apiResource('consumable-masuk', ConsumableMasukController::class);
Route::apiResource('consumable-keluar', ConsumableKeluarController::class);

// 6. Laporan Kerusakan Tools
Route::apiResource('laporan-kerusakan', LaporanKerusakanController::class);


Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

