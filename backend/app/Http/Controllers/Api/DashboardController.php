<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tool;
use App\Models\Peminjaman;
use App\Models\Consumable;
use App\Models\ConsumableKeluar;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        // ==========================
        // CARD STATISTICS
        // ==========================

        $totalTools = Tool::count();

        $toolsDipinjam = Peminjaman::whereNull('tanggal_kembali')->count();

        $toolsRusak = Tool::where('keadaan', 'R')->count();

        $toolsReady = max(0, Tool::sum('stok') - $toolsDipinjam);

        $totalConsumable = DB::table('consumables')
            ->leftJoin('consumable_masuk', 'consumables.id', '=', 'consumable_masuk.consumable_id')
            ->leftJoin('consumable_keluar', 'consumables.id', '=', 'consumable_keluar.consumable_id')
            ->selectRaw('
                COALESCE(SUM(consumables.stok_awal),0)
                + COALESCE(SUM(consumable_masuk.jumlah_masuk),0)
                - COALESCE(SUM(consumable_keluar.jumlah_keluar),0)
                as total
            ')
            ->value('total');

        // ==========================
        // RIWAYAT PEMINJAMAN
        // ==========================

        $recentBorrowing = Peminjaman::with([
            'tool:id,nama_barang,kode_barang',
            'peminta:id,nama'
        ])
            ->latest('tanggal')
            ->take(5)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'tanggal' => Carbon::parse($item->tanggal)->format('d M Y H:i'),
                    'tool' => optional($item->tool)->nama_barang,
                    'kode' => optional($item->tool)->kode_barang,
                    'peminjam' => optional($item->peminta)->nama,
                    'jumlah' => $item->jumlah,
                    'status' => $item->tanggal_kembali ? 'Kembali' : 'Dipinjam',
                ];
            });

        // ==========================
        // RIWAYAT CONSUMABLE
        // ==========================

        $recentConsumable = ConsumableKeluar::with([
            'consumable:id,nama',
            'peminta:id,nama'
        ])
            ->latest('tanggal')
            ->take(5)
            ->get()
            ->map(function ($item) {
                return [
                    'tanggal' => Carbon::parse($item->tanggal)->format('d M Y H:i'),
                    'nama' => optional($item->consumable)->nama,
                    'peminta' => optional($item->peminta)->nama,
                    'jumlah' => $item->jumlah_keluar,
                ];
            });

        // ==========================
        // LOW STOCK CONSUMABLE
        // ==========================

        $lowStockConsumables = Consumable::select(
            'id',
            'kode_barang',
            'nama',
            'stok_awal'
        )
            ->orderBy('stok_awal')
            ->take(5)
            ->get();

        // ==========================
        // GRAFIK 7 HARI TERAKHIR
        // ==========================

        $chart = [];

        for ($i = 6; $i >= 0; $i--) {

            $date = Carbon::today()->subDays($i);

            $chart[] = [
                'tanggal' => $date->format('d M'),

                'peminjaman' => Peminjaman::whereDate(
                    'tanggal',
                    $date
                )->count(),

                'consumable' => ConsumableKeluar::whereDate(
                    'tanggal',
                    $date
                )->sum('jumlah_keluar')
            ];
        }

        return response()->json([

            'stats' => [

                'total_tools' => $totalTools,

                'tools_ready' => $toolsReady,

                'tools_dipinjam' => $toolsDipinjam,

                'tools_rusak' => $toolsRusak,

                'total_consumable' => (int) $totalConsumable

            ],

            'recentBorrowing' => $recentBorrowing,

            'recentConsumable' => $recentConsumable,

            'lowStockConsumables' => $lowStockConsumables,

            'chart' => $chart

        ]);
    }
}