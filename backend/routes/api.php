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

// Fitur Scanner/Kiosk Umum: Tetap di luar auth JIKA berjalan di tablet publik (tanpa login).
// Jika tablet ini juga mengharuskan operator login, pindahkan blok ini ke dalam auth:sanctum.
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
//
// Prinsip permission di file ini mengikuti 3 domain sidebar + matrix RBAC:
//   - OPERASIONAL ALAT   : Dashboard, Inventaris, Transaksi, Riwayat,
//                           Pengajuan Order, Laporan Kerusakan Alat
//   - PEMELIHARAAN MESIN : domain terpisah, permission *_pemeliharaan_mesin
//   - ADMINISTRASI        : Manajemen User (+ pengaturan RBAC)
//
// Tiap modul di matrix RBAC punya level:
//   - 'switch'   -> 1 permission saja (view_X)
//   - 'dropdown' -> view_X (Lihat saja) vs view_X + manage/process/create_X (Kelola penuh)
//
// Kalau satu endpoint DIPAKAI oleh lebih dari satu domain/halaman
// (misal data mesin dipakai halaman Inventaris DAN Pemeliharaan Mesin,
// atau data transaksi dipakai halaman Transaksi DAN Riwayat), middleware-nya
// pakai OR ('permission:a|b') supaya boleh diakses oleh siapapun yang
// punya salah satu dari kedua izin tersebut.
// ==========================================
Route::middleware('auth:sanctum')->group(function () {

    // ------------------------------------------
    // A. GENERAL (Bisa diakses siapapun yang login)
    // ------------------------------------------
    Route::post('/logout', [AuthController::class, 'logout']);

    // Memberikan info profil lengkap dengan role dan permissions ke Next.js
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
    // C. MODUL INVENTARIS (dropdown: view_inventaris / manage_inventaris)
    //    termasuk master data Peminta & Pekerjaan
    // ------------------------------------------
    // Lihat saja
    Route::middleware('permission:view_inventaris')->group(function () {
        Route::get('/pekerjaan/active', [PekerjaanController::class, 'getActive']);
        Route::apiResource('pekerjaan', PekerjaanController::class)->only(['index', 'show']);
    });

    // Tools Masuk & Consumable Masuk ditampilkan di menu Transaksi (bukan Inventaris),
    // jadi boleh diakses lewat izin Inventaris ATAU izin Transaksi.
    Route::middleware('permission:view_inventaris|view_transaksi')->group(function () {
        Route::apiResource('tools-masuk', ToolMasukController::class)->only(['index', 'show']);
        Route::apiResource('consumable-masuk', ConsumableMasukController::class)->only(['index', 'show']);
    });

    // Data master Tools, Consumable & Peminta juga dibaca oleh alur Transaksi/Riwayat
    // (misal untuk menampilkan nama barang & peminta saat scan/riwayat consumable
    // keluar) dan Pengajuan Order (memilih nama alat/barang/peminta saat bikin order),
    // jadi boleh diakses oleh salah satu dari izin domain terkait.
    Route::middleware('permission:view_inventaris|view_transaksi|view_riwayat|view_order')->group(function () {
        Route::apiResource('tools', ToolController::class)->only(['index', 'show']);
        Route::apiResource('consumable', ConsumableController::class)->only(['index', 'show']);
        Route::apiResource('peminta', PemintaController::class)->only(['index', 'show']);
    });

    // Master data Mesin Produksi dipakai baik oleh Inventaris (Operasional Alat)
    // maupun Pemeliharaan Mesin, jadi boleh diakses oleh salah satu dari kedua izin.
    Route::middleware('permission:view_inventaris|view_pemeliharaan_mesin')->group(function () {
        Route::apiResource('mesin-produksi', MesinProduksiController::class)->only(['index', 'show']);
    });

        Route::middleware('permission:manage_inventaris')->group(function () {
        Route::apiResource('tools', ToolController::class)->except(['index', 'show']);
        Route::patch('/tools/{tool}/kurangi-stok', [ToolController::class, 'kurangiStok']);

        Route::apiResource('consumable', ConsumableController::class)->except(['index', 'show']);
    });

    // Tambah/edit/hapus Tools Masuk & Consumable Masuk juga bagian alur kerja Transaksi,
    // jadi boleh dilakukan lewat izin Inventaris ATAU izin kelola Transaksi.
    Route::middleware('permission:manage_inventaris|manage_transaksi')->group(function () {
        Route::apiResource('tools-masuk', ToolMasukController::class)->except(['index', 'show']);
        Route::apiResource('consumable-masuk', ConsumableMasukController::class)->except(['index', 'show']);
    });

    // Kelola data Mesin Produksi bisa dilakukan lewat izin Inventaris ATAU izin
    // khusus Pemeliharaan Mesin (karena mesin bisa ditambah/diedit langsung
    // dari halaman Pemeliharaan Mesin, bukan cuma dari halaman Inventaris).
    Route::middleware('permission:manage_inventaris|manage_pemeliharaan_mesin')->group(function () {
        Route::apiResource('mesin-produksi', MesinProduksiController::class)->except(['index', 'show']);
    });

    // Master Data Peminta & Pekerjaan — CRUD penuh (domain Operasional Alat, Staff full akses)
    Route::middleware('permission:manage_master_data')->group(function () {
        Route::apiResource('peminta', PemintaController::class)->except(['index', 'show']);
        Route::patch('/peminta/{id}/aktifkan', [PemintaController::class, 'aktifkan']);

        Route::apiResource('pekerjaan', PekerjaanController::class)->except(['index', 'show']);
        Route::patch('/pekerjaan/{id}/toggle-status', [PekerjaanController::class, 'toggleStatus']);
    });


    // ------------------------------------------
    // D. MODUL TRANSAKSI (dropdown: view_transaksi / process_transaksi + manage_transaksi)
    //    + MODUL RIWAYAT (switch: view_riwayat) — berbagi endpoint data yang sama
    // ------------------------------------------
    // Route spesifik HARUS didaftarkan sebelum apiResource, agar tidak
    // tertangkap oleh pola /peminjaman/{peminjaman} milik method show()
    Route::middleware('permission:view_riwayat')->group(function () {
        Route::get('/peminjaman/belum-kembali', [PeminjamanController::class, 'belumKembali']);
    });

    // Endpoint ini dipakai baik oleh halaman Transaksi (aktif) maupun Riwayat (histori),
    // jadi boleh diakses kalau punya salah satu dari kedua permission ini.
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
    // E. MODUL PENGAJUAN ORDER (dropdown: view_order / create_order + process_order + manage_order)
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
    //    (dropdown: view_kerusakan_alat / create + process + manage_kerusakan_alat)
    //    + berbagi endpoint index/show dengan MODUL RIWAYAT (halaman "Riwayat Perbaikan")
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
    // DOMAIN: PEMELIHARAAN MESIN (terpisah dari Operasional Alat)
    // ==========================================

    // ------------------------------------------
    // G. MODUL PEMELIHARAAN MESIN (switch: view_pemeliharaan_mesin)
    // ------------------------------------------
    Route::middleware('permission:view_pemeliharaan_mesin')->group(function () {
        Route::get('/log-pemeliharaan/mesin/{mesin_id}', [LogPemeliharaanMesinController::class, 'getByMesin']);
        Route::get('/log-aktivitas', [LogAktivitasMesinController::class, 'index']);
        Route::get('/log-aktivitas/mesin/{mesin_id}', [LogAktivitasMesinController::class, 'getByMesin']);
    });

    Route::middleware('permission:process_pemeliharaan_mesin')->group(function () {
        Route::post('/log-pemeliharaan', [LogPemeliharaanMesinController::class, 'store']);
        Route::post('/log-aktivitas', [LogAktivitasMesinController::class, 'store']);
    });


    // ==========================================
    // DOMAIN: ADMINISTRASI
    // ==========================================

    // ------------------------------------------
    // H. MODUL MANAJEMEN USER (dropdown: view_users / manage_users)
    //    khusus akun & RBAC — TIDAK termasuk master data
    // ------------------------------------------
    Route::middleware('permission:view_users')->group(function () {
        Route::apiResource('users', UserController::class)->only(['index', 'show']);
    });

    Route::middleware('permission:manage_users')->group(function () {
        // Akun Users — bisa diberikan ke role selain Super Admin lewat matrix
        Route::apiResource('users', UserController::class)->except(['index', 'show']);
        Route::patch('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
        Route::patch('/users/{id}/aktifkan', [UserController::class, 'activate']);
    });

    // Pengaturan RBAC (Role & Permissions Matrix) — SENGAJA dicek pakai role langsung,
    // BUKAN permission biasa, supaya tidak bisa "diaktifkan" secara tidak sengaja
    // lewat matrix untuk role manapun selain Super Admin (mencegah privilege escalation:
    // kalau ini pakai permission biasa, role manapun yang punya izin ini bisa
    // memberi dirinya sendiri permission apapun lewat matrix).
    Route::middleware('role:Super Admin')->group(function () {
        Route::get('/permissions/matrix', [RolePermissionController::class, 'getMatrix']);
        Route::put('/permissions/matrix', [RolePermissionController::class, 'updateMatrix']);
        Route::get('/roles', [RolePermissionController::class, 'index']);
        Route::get('/roles/{id}/permissions', [RolePermissionController::class, 'getRolePermissions']);
        Route::put('/roles/{id}/permissions', [RolePermissionController::class, 'updateRolePermissions']);
    });

}); // Penutup grup auth:sanctum
