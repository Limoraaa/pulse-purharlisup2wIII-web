<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LaporanAnggaranDisburse;
use App\Models\LaporanAnggaranPekerjaan;
use Illuminate\Http\Request;

class LaporanAnggaranController extends Controller
{
    // GET /laporan-anggaran?tahun=2026 -> disburse + pekerjaan di tahun itu
    public function index(Request $request)
    {
        $tahun = (int) $request->query('tahun', date('Y'));

        return response()->json([
            'disburse'  => LaporanAnggaranDisburse::where('tahun', $tahun)->orderBy('bulan')->orderBy('id')->get(),
            'pekerjaan' => LaporanAnggaranPekerjaan::where('tahun', $tahun)->orderBy('bulan')->orderBy('id')->get(),
        ], 200);
    }

    // ---------- Disburse ----------
    private function rulesDisburse(): array
    {
        return [
            'tahun'   => 'required|integer|between:2000,2100',
            'bulan'   => 'required|integer|between:1,12',
            'uraian'  => 'required|string|max:255',
            'nominal' => 'required|numeric|min:0',
        ];
    }

    public function storeDisburse(Request $request)
    {
        $row = LaporanAnggaranDisburse::create($request->validate($this->rulesDisburse()));

        return response()->json(['message' => 'Disburse berhasil disimpan', 'data' => $row], 201);
    }

    public function updateDisburse(Request $request, $id)
    {
        $row = LaporanAnggaranDisburse::findOrFail($id);
        $row->update($request->validate($this->rulesDisburse()));

        return response()->json(['message' => 'Disburse berhasil diperbarui', 'data' => $row], 200);
    }

    public function destroyDisburse($id)
    {
        LaporanAnggaranDisburse::findOrFail($id)->delete();

        return response()->json(['message' => 'Disburse berhasil dihapus'], 200);
    }

    // ---------- Rencana pekerjaan ----------
    private function rulesPekerjaan(): array
    {
        return [
            'tahun'          => 'required|integer|between:2000,2100',
            'bulan'          => 'required|integer|between:1,12',
            'nama_pekerjaan' => 'required|string|max:255',
            'rincian'        => 'nullable|string',
            'biaya'          => 'required|numeric|min:0',
            'biaya_aktual'   => 'nullable|numeric|min:0',
            'status'         => 'required|in:belum_dikerjakan,sedang_dikerjakan,sudah_dikerjakan',
            'nama_vendor'    => 'nullable|string|max:255',
            'no_po'          => 'nullable|string|max:255',
            'keterangan'     => 'nullable|string|max:255',
        ];
    }

    public function storePekerjaan(Request $request)
    {
        $row = LaporanAnggaranPekerjaan::create($request->validate($this->rulesPekerjaan()));

        return response()->json(['message' => 'Rencana pekerjaan berhasil disimpan', 'data' => $row], 201);
    }

    public function updatePekerjaan(Request $request, $id)
    {
        $row = LaporanAnggaranPekerjaan::findOrFail($id);
        $row->update($request->validate($this->rulesPekerjaan()));

        return response()->json(['message' => 'Rencana pekerjaan berhasil diperbarui', 'data' => $row], 200);
    }

    public function destroyPekerjaan($id)
    {
        LaporanAnggaranPekerjaan::findOrFail($id)->delete();

        return response()->json(['message' => 'Rencana pekerjaan berhasil dihapus'], 200);
    }
}