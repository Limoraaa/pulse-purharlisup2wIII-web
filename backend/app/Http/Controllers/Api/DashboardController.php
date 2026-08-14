<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConsumableKeluar;
use App\Models\Consumable;
use App\Models\LaporanKerusakanTools;
use App\Models\Peminjaman;
use App\Models\Peminta;
use App\Models\Tool;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    // GET /api/dashboard/summary
    public function summary()
    {
        return response()->json([
            'total_tools' => Tool::count(),
            'total_consumables' => Consumable::count(),
            'total_peminta' => Peminta::where('aktif', true)->count(),
            'sedang_dipinjam' => Peminjaman::whereNull('tanggal_kembali')->sum('jumlah'),
        ]);
    }

    // GET /api/dashboard/stok-menipis
    // Consumable dengan stok < 5, diurutkan dari yang paling sedikit
    public function stokMenipis()
    {
        $data = Consumable::where('stok_awal', '<', 5)
            ->orderBy('stok_awal', 'asc')
            ->limit(5)
            ->get(['id', 'kode_barang', 'nama', 'stok_awal']);

        return response()->json($data);
    }

    // GET /api/dashboard/telat-kembali
    // Peminjaman aktif yang sudah lewat expected_return_date...
    public function telatKembali()
    {
        $batasHari = 30;

        $data = Peminjaman::with(['tool', 'peminta'])
            ->whereNull('tanggal_kembali')
            ->where('tanggal', '<', now()->subDays($batasHari))
            ->orderBy('tanggal', 'asc')
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'kode_barang' => $p->tool->kode_barang ?? '-',
                    'nama_barang' => $p->tool->nama_barang ?? '-',
                    'nama_peminjam' => $p->peminta->nama ?? '-',
                    'tanggal_pinjam' => $p->tanggal,
                    'hari_terlambat' => (int) floor(abs(now()->diffInDays($p->tanggal))),
                ];
            });

        return response()->json($data);
    }

    // GET /api/dashboard/alat-terpopuler
    // Top 5 alat paling sering dipinjam (berdasarkan jumlah transaksi peminjaman)
    public function alatTerpopuler()
    {
        $data = Peminjaman::select('tool_id', DB::raw('COUNT(*) as total_transaksi'), DB::raw('SUM(jumlah) as total_unit'))
            ->groupBy('tool_id')
            ->orderByDesc('total_transaksi')
            ->limit(5)
            // Tambahkan merk dan ukuran di pemanggilan relasi 'with'
            ->with('tool:id,kode_barang,nama_barang,merk,ukuran')
            ->get()
            ->map(function ($row) {
                return [
                    'kode_barang' => $row->tool->kode_barang ?? '-',
                    'nama_barang' => $row->tool->nama_barang ?? '-',
                    // Petakan merk dan ukuran agar terkirim ke frontend
                    'merk' => $row->tool->merk ?? null,
                    'ukuran' => $row->tool->ukuran ?? null,
                    'total_transaksi' => $row->total_transaksi,
                    'total_unit' => $row->total_unit,
                ];
            });

        return response()->json($data);
    }

    // GET /api/dashboard/consumable-terpopuler
    // Top 5 consumable paling banyak diambil (berdasarkan total jumlah_keluar)
    public function consumableTerpopuler()
    {
        $data = ConsumableKeluar::select('consumable_id', DB::raw('SUM(jumlah_keluar) as total_diambil'))
            ->groupBy('consumable_id')
            ->orderByDesc('total_diambil')
            ->limit(5)
            // Tambahkan merk dan ukuran di pemanggilan relasi 'with'
            ->with('consumable:id,kode_barang,nama,merk,ukuran')
            ->get()
            ->map(function ($row) {
                return [
                    'kode_barang' => $row->consumable->kode_barang ?? '-',
                    'nama' => $row->consumable->nama ?? '-',
                    // Petakan merk dan ukuran agar terkirim ke frontend
                    'merk' => $row->consumable->merk ?? null,
                    'ukuran' => $row->consumable->ukuran ?? null,
                    'total_diambil' => $row->total_diambil,
                ];
            });

        return response()->json($data);
    }

    // GET /api/dashboard/kerusakan-summary
    // GET /api/dashboard/kerusakan-summary
    public function kerusakanSummary()
    {
        $bulanIni = LaporanKerusakanTools::whereMonth('tanggal', now()->month)
            ->whereYear('tanggal', now()->year)
            ->sum('jumlah');

        $totalSemua = LaporanKerusakanTools::sum('jumlah');

        // GUNAKAN 'status' DENGAN VALUE 'bisa_diperbaiki'
        // (Sesuai dengan validator di LaporanKerusakanController)
        $sedangDiperbaiki = LaporanKerusakanTools::where('status', 'bisa_diperbaiki')->sum('jumlah');
        $sudahDiperbaiki = LaporanKerusakanTools::where('status', 'selesai_diperbaiki')->sum('jumlah');

        return response()->json([
            'bulan_ini' => $bulanIni,
            'total_semua' => $totalSemua,
            'sedang_diperbaiki' => $sedangDiperbaiki,
            'sudah_diperbaiki' => $sudahDiperbaiki,
        ]);
    }

    // GET /api/dashboard/aktivitas-terbaru
    // Gabungan 10 aktivitas terakhir dari berbagai jenis transaksi
    public function aktivitasTerbaru()
    {
        $peminjaman = Peminjaman::with(['tool', 'peminta'])
            ->latest('tanggal')
            ->limit(10)
            ->get()
            ->map(function ($p) {
                return [
                    'jenis' => 'peminjaman',
                    'deskripsi' => "{$p->peminta->nama} meminjam {$p->tool->nama_barang}",
                    'waktu' => $p->tanggal,
                ];
            });

        $pengembalian = Peminjaman::with(['tool', 'peminta'])
            ->whereNotNull('tanggal_kembali')
            ->latest('tanggal_kembali')
            ->limit(10)
            ->get()
            ->map(function ($p) {
                return [
                    'jenis' => 'pengembalian',
                    'deskripsi' => "{$p->peminta->nama} mengembalikan {$p->tool->nama_barang}",
                    'waktu' => $p->tanggal_kembali,
                ];
            });

        $consumableKeluar = ConsumableKeluar::with(['consumable', 'peminta'])
            ->latest('tanggal')
            ->limit(10)
            ->get()
            ->map(function ($c) {
                return [
                    'jenis' => 'consumable_keluar',
                    'deskripsi' => "{$c->peminta->nama} mengambil {$c->jumlah_keluar} {$c->consumable->nama}",
                    'waktu' => $c->tanggal,
                ];
            });

        $kerusakan = LaporanKerusakanTools::with('tool')
            ->latest('tanggal')
            ->limit(10)
            ->get()
            ->map(function ($k) {
                return [
                    'jenis' => 'kerusakan',
                    'deskripsi' => "{$k->jumlah} unit {$k->tool->nama_barang} dilaporkan rusak",
                    'waktu' => $k->tanggal,
                ];
            });

        $gabungan = $peminjaman
            ->concat($pengembalian)
            ->concat($consumableKeluar)
            ->concat($kerusakan)
            ->sortByDesc('waktu')
            ->take(10)
            ->values();

        return response()->json($gabungan);
    }

    // GET /api/dashboard/tren-peminjaman
    // Total peminjaman per hari, 30 hari terakhir (untuk grafik)
    public function trenPeminjaman()
    {
        $data = Peminjaman::select(
                DB::raw('DATE(tanggal) as tanggal'),
                DB::raw('COUNT(*) as total')
            )
            ->where('tanggal', '>=', now()->subDays(30))
            ->groupBy(DB::raw('DATE(tanggal)'))
            ->orderBy('tanggal', 'asc')
            ->get();

        return response()->json($data);
    }
}
