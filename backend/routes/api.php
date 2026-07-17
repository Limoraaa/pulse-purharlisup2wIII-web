<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ConsumableController;
use App\Http\Controllers\Api\ToolController;
use App\Http\Controllers\Api\UserController;
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

// 4. Peminjaman -> khusus route cart & proses WAJIB login (dipakai web + app Flutter)
// karena butuh identitas user yang scan/pilih alat.
// 4. Peminjaman
Route::post('/peminjaman/scan', [PeminjamanController::class, 'scan']);

// Pindahkan route ini KELUAR dari middleware auth:sanctum 
// agar Flutter (tanpa login) dan Web bisa mengaksesnya.
Route::get('/peminjaman/antrean', [PeminjamanController::class, 'antrean']);
Route::patch('/peminjaman/cart/{id}', [PeminjamanController::class, 'updateCartItem']);
Route::delete('/peminjaman/cart/{id}', [PeminjamanController::class, 'removeCartItem']);

// Proses peminjaman tetap butuh auth karena harus tahu siapa yang meminjam
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/peminjaman/proses', [PeminjamanController::class, 'prosesPeminjaman']);
});

// Route khusus HARUS di atas
Route::patch('/peminjaman/{id}/kembali', [PeminjamanController::class, 'kembali']);

// CRUD dasar peminjaman (tidak butuh scoping per user)
Route::apiResource('peminjaman', PeminjamanController::class);

// 5. Consumable Masuk & Keluar (transaksi stok)
Route::apiResource('consumable', ConsumableController::class);
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