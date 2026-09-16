<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- Controller Imports ---
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
use App\Http\Controllers\Api\RolePermissionController;
use App\Http\Controllers\Api\MesinProduksiController;
use App\Http\Controllers\Api\LogPemeliharaanMesinController;
use App\Http\Controllers\Api\LogAktivitasMesinController;

// ==========================================
// 1. ROUTE PUBLIK (Tanpa Auth)
// ==========================================
Route::post('/login', [AuthController::class, 'login']);

Route::post('/peminjaman/scan', [PeminjamanController::class, 'scan']);
Route::get('/peminjaman/antrean', [PeminjamanController::class, 'antrean']);
Route::patch('/peminjaman/cart/{id}', [PeminjamanController::class, 'updateCartItem']);
Route::delete('/peminjaman/cart/{id}', [PeminjamanController::class, 'removeCartItem']);

Route::get('/order-consumable', [OrderConsumableController::class, 'index']);
Route::post('/order-consumable', [OrderConsumableController::class, 'store']);
Route::put('/order-consumable/{id}', [OrderConsumableController::class, 'update']);
Route::put('/order-consumable/{id}/status', [OrderConsumableController::class, 'updateStatus']);
Route::delete('/order-consumable/{id}', [OrderConsumableController::class, 'destroy']);

// --- ORDER TOOLS ---
Route::get('/order-tools', [OrderToolController::class, 'index']);
Route::post('/order-tools', [OrderToolController::class, 'store']);
Route::put('/order-tools/{id}/status', [OrderToolController::class, 'updateStatus']);
Route::delete('/order-tools/{id}', [OrderToolController::class, 'destroy']);
Route::put('/order-tools/{id}', [OrderToolController::class, 'update']);

Route::post('/consumable-keluar/scan', [ConsumableKeluarController::class, 'scan']);
Route::get('/consumable-keluar/antrean', [ConsumableKeluarController::class, 'antrean']);
Route::patch('/consumable-keluar/cart/{id}', [ConsumableKeluarController::class, 'updateCartItem']);
Route::delete('/consumable-keluar/antrean/{consumable_id}', [ConsumableKeluarController::class, 'hapusAntrean']);
Route::post('/consumable-keluar/proses', [ConsumableKeluarController::class, 'prosesCartConsumable']);


// ==========================================
// 2. ROUTE TERLINDUNG (WAJIB LOGIN & CEK HAK AKSES)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {

    // ------------------------------------------
    // A. GENERAL (Bisa diakses siapapun yang login)
    // ------------------------------------------
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        $user = $request->user()->load('roles', 'permissions');
        $user->all_permissions = $user->getAllPermissions()->pluck('name');
        return $user;
    });

    Route::get('/profile', [UserController::class, 'profile']);
    Route::put('/profile', [UserController::class, 'updateProfile']);
    Route::patch('/profile', [UserController::class, 'updateProfile']);
    Route::post('/profile/photo', [UserController::class, 'uploadPhoto']);
    Route::patch('/profile/password', [UserController::class, 'changePassword']);


    // ==========================================
    // DOMAIN: OPERASIONAL ALAT
    // ==========================================

    // ------------------------------------------
    // B. MODUL DASHBOARD (switch: view_dashboard)
    // ------------------------------------------
    Route::middleware('permission:view_dashboard')->prefix('dashboard')->group(function () {
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


    // ------------------------------------------
    // C. MODUL INVENTARIS
    // ------------------------------------------
    Route::middleware('permission:view_inventaris')->group(function () {
        Route::get('/pekerjaan/active', [PekerjaanController::class, 'getActive']);
        Route::apiResource('pekerjaan', PekerjaanController::class)->only(['index', 'show']);
    });

    Route::middleware('permission:view_inventaris|view_transaksi')->group(function () {
        Route::apiResource('tools-masuk', ToolMasukController::class)->only(['index', 'show']);
        Route::apiResource('consumable-masuk', ConsumableMasukController::class)->only(['index', 'show']);
    });

    Route::middleware('permission:view_inventaris|view_transaksi|view_riwayat|view_order')->group(function () {
        Route::apiResource('tools', ToolController::class)->only(['index', 'show']);
        Route::apiResource('consumable', ConsumableController::class)->only(['index', 'show']);
        Route::apiResource('peminta', PemintaController::class)->only(['index', 'show']);
    });

    Route::middleware('permission:view_inventaris|view_pemeliharaan_mesin')->group(function () {
        Route::apiResource('mesin-produksi', MesinProduksiController::class)->only(['index', 'show']);
    });

    Route::middleware('permission:manage_inventaris')->group(function () {
        Route::apiResource('tools', ToolController::class)->except(['index', 'show']);
        Route::patch('/tools/{tool}/kurangi-stok', [ToolController::class, 'kurangiStok']);
        Route::apiResource('consumable', ConsumableController::class)->except(['index', 'show']);
    });

    Route::middleware('permission:manage_inventaris|manage_transaksi')->group(function () {
        Route::apiResource('tools-masuk', ToolMasukController::class)->except(['index', 'show']);
        Route::apiResource('consumable-masuk', ConsumableMasukController::class)->except(['index', 'show']);
    });

    Route::middleware('permission:manage_inventaris|manage_pemeliharaan_mesin')->group(function () {
        Route::patch('/mesin-produksi/{id}/toggle-status', [MesinProduksiController::class, 'toggleStatus']);
        Route::apiResource('mesin-produksi', MesinProduksiController::class)->except(['index', 'show']);
    });

    Route::middleware('permission:manage_master_data')->group(function () {
        Route::apiResource('peminta', PemintaController::class)->except(['index', 'show']);
        Route::patch('/peminta/{id}/aktifkan', [PemintaController::class, 'aktifkan']);
        Route::apiResource('pekerjaan', PekerjaanController::class)->except(['index', 'show']);
        Route::patch('/pekerjaan/{id}/toggle-status', [PekerjaanController::class, 'toggleStatus']);
    });


    // ------------------------------------------
    // D. MODUL TRANSAKSI & RIWAYAT
    // ------------------------------------------
    Route::middleware('permission:view_riwayat')->group(function () {
        Route::get('/peminjaman/belum-kembali', [PeminjamanController::class, 'belumKembali']);
    });

    Route::middleware('permission:view_transaksi|view_riwayat')->group(function () {
        Route::apiResource('peminjaman', PeminjamanController::class)->only(['index', 'show']);
        Route::apiResource('consumable-keluar', ConsumableKeluarController::class)->only(['index', 'show']);
    });

    Route::middleware('permission:process_transaksi')->group(function () {
        Route::post('/peminjaman/proses', [PeminjamanController::class, 'prosesPeminjaman']);
        Route::patch('/peminjaman/{id}/kembali', [PeminjamanController::class, 'kembali']);
    });

    Route::middleware('permission:manage_transaksi')->group(function () {
        Route::apiResource('peminjaman', PeminjamanController::class)->except(['index', 'show', 'store']);
        Route::apiResource('consumable-keluar', ConsumableKeluarController::class)->except(['index', 'show', 'store']);
    });


    // ------------------------------------------
    // E. MODUL PENGAJUAN ORDER
    // ------------------------------------------
    Route::middleware('permission:view_order')->group(function () {
        Route::get('/order-consumable', [OrderConsumableController::class, 'index']);
        Route::get('/order-tools', [OrderToolController::class, 'index']);
    });

    Route::middleware('permission:create_order')->group(function () {
        Route::post('/order-consumable', [OrderConsumableController::class, 'store']);
        Route::post('/order-tools', [OrderToolController::class, 'store']);
    });

    Route::middleware('permission:process_order|manage_order')->group(function () {
        Route::put('/order-consumable/{id}/status', [OrderConsumableController::class, 'updateStatus']);
        Route::put('/order-tools/{id}/status', [OrderToolController::class, 'updateStatus']);
        Route::put('/order-tools/{id}', [OrderToolController::class, 'update']);
    });


    // ------------------------------------------
    // F. MODUL LAPORAN KERUSAKAN ALAT
    // ------------------------------------------
    Route::middleware('permission:view_kerusakan_alat|view_riwayat')->group(function () {
        Route::apiResource('laporan-kerusakan', LaporanKerusakanController::class)->only(['index', 'show']);
    });

    Route::middleware('permission:create_kerusakan_alat')->group(function () {
        Route::post('/laporan-kerusakan', [LaporanKerusakanController::class, 'store']);
    });

    Route::middleware('permission:process_kerusakan_alat')->group(function () {
        Route::patch('/laporan-kerusakan/{id}/repair', [LaporanKerusakanController::class, 'repair']);
        Route::patch('/laporan-kerusakan/{id}/tandai-permanen', [LaporanKerusakanController::class, 'tandaiPermanen']);
    });

    Route::middleware('permission:manage_kerusakan_alat')->group(function () {
        Route::apiResource('laporan-kerusakan', LaporanKerusakanController::class)->except(['index', 'show', 'store']);
    });


    // ==========================================
    // DOMAIN: PEMELIHARAAN MESIN
    // ==========================================
    Route::middleware('permission:view_dashboard_pemeliharaan')->group(function () {
        Route::get('/pemeliharaan/dashboard-stats', [LogPemeliharaanMesinController::class, 'getDashboardStats']);
    });

    Route::middleware('permission:view_pemeliharaan_mesin')->group(function () {
        // --- RUTE BARU: GET SEMUA LOG PEMELIHARAAN UNTUK EXPORT ---
        Route::get('/log-pemeliharaan', [LogPemeliharaanMesinController::class, 'index']);
        
        Route::get('/log-pemeliharaan/mesin/{mesin_id}', [LogPemeliharaanMesinController::class, 'getByMesin']);
        Route::get('/log-aktivitas', [LogAktivitasMesinController::class, 'index']);
        Route::get('/log-aktivitas/mesin/{mesin_id}', [LogAktivitasMesinController::class, 'getByMesin']);
    });

    Route::middleware('permission:process_pemeliharaan_mesin')->group(function () {
        Route::post('/log-pemeliharaan', [LogPemeliharaanMesinController::class, 'store']);
        Route::put('/log-pemeliharaan/{id}', [LogPemeliharaanMesinController::class, 'update']);
        Route::delete('/log-pemeliharaan/{id}', [LogPemeliharaanMesinController::class, 'destroy']);
        
        Route::post('/log-aktivitas', [LogAktivitasMesinController::class, 'store']);
        Route::put('/log-aktivitas/{id}', [LogAktivitasMesinController::class, 'update']);
        Route::delete('/log-aktivitas/{id}', [LogAktivitasMesinController::class, 'destroy']);
    });


    // ==========================================
    // DOMAIN: ADMINISTRASI
    // ==========================================
    Route::middleware('permission:view_users')->group(function () {
        Route::apiResource('users', UserController::class)->only(['index', 'show']);
    });

    Route::middleware('permission:manage_users')->group(function () {
        Route::apiResource('users', UserController::class)->except(['index', 'show']);
        Route::patch('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
        Route::patch('/users/{id}/aktifkan', [UserController::class, 'activate']);
        Route::get('/roles', [RolePermissionController::class, 'index']);
    });

    Route::middleware('role:Super Admin')->group(function () {
        Route::get('/permissions/matrix', [RolePermissionController::class, 'getMatrix']);
        Route::put('/permissions/matrix', [RolePermissionController::class, 'updateMatrix']);
        Route::post('/roles', [RolePermissionController::class, 'store']);
        Route::patch('/roles/{id}/color', [RolePermissionController::class, 'updateColor']);
        Route::delete('/roles/{id}', [RolePermissionController::class, 'destroy']);
        Route::get('/roles/{id}/permissions', [RolePermissionController::class, 'getRolePermissions']);
        Route::put('/roles/{id}/permissions', [RolePermissionController::class, 'updateRolePermissions']);
    });

});