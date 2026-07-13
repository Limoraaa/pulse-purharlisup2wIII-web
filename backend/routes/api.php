<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ConsumableController;
use App\Http\Controllers\Api\ToolController;
<<<<<<< HEAD
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\API\PemintaController;
use App\Http\Controllers\API\PeminjamanController;
use App\Http\Controllers\API\ConsumableMasukController;
use App\Http\Controllers\API\ConsumableKeluarController;
use App\Http\Controllers\API\LaporanKerusakanController;
=======
use App\Http\Controllers\Api\PemintaController;
use App\Http\Controllers\Api\PeminjamanController;
use App\Http\Controllers\Api\ConsumableMasukController;
use App\Http\Controllers\Api\ConsumableKeluarController;
use App\Http\Controllers\Api\LaporanKerusakanController;
>>>>>>> 26c8a2194235fc78add65a6edf59d36116152f98


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
Route::apiResource('peminjaman', PeminjamanController::class);
Route::patch('peminjaman/{id}/kembali', [PeminjamanController::class, 'kembali']);
Route::post('/peminjaman/scan', [App\Http\Controllers\API\PeminjamanController::class, 'store']);

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

