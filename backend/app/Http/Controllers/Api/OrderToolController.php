<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderTool;
use Illuminate\Http\Request;

class OrderToolController extends Controller
{
    public function index(Request $request)
    {
        $query = OrderTool::with('peminta');

        if ($request->has('status_pembelian') && $request->status_pembelian !== 'semua') {
            $query->where('status_pembelian', $request->status_pembelian);
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('tanggal_pengajuan', 'desc')->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'peminta_id'        => 'required|exists:peminta,id',
            'tool_id'           => 'nullable|string',
            'kode_barang'       => 'nullable|string',
            'nama_barang'       => 'required|string',
            'merek'             => 'nullable|string',
            'tipe'              => 'nullable|string',
            'er_e'              => 'nullable|string',
            'ukuran'            => 'nullable|string',
            'pekerjaan'         => 'nullable|string', // <-- TAMBAHAN FIELD PEKERJAAN
            'spesifikasi'       => 'nullable|string',
            'jumlah'            => 'required|integer|min:1',
            'satuan'            => 'required|string',
            'harga'             => 'required|numeric|min:0',
            'referensi_harga'   => 'nullable|string',
            'tanggal_pengajuan' => 'required|date',
        ]);

        $order = OrderTool::create($validated);

        return response()->json(['success' => true, 'data' => $order]);
    }

    public function update(Request $request, $id)
    {
        $order = OrderTool::findOrFail($id);

        $validated = $request->validate([
            'peminta_id'        => 'sometimes|required|exists:peminta,id',
            'tool_id'           => 'nullable|string',
            'kode_barang'       => 'nullable|string',
            'nama_barang'       => 'sometimes|required|string',
            'merek'             => 'nullable|string',
            'tipe'              => 'nullable|string',
            'er_e'              => 'nullable|string',
            'ukuran'            => 'nullable|string',
            'pekerjaan'         => 'nullable|string', // <-- TAMBAHAN FIELD PEKERJAAN
            'spesifikasi'       => 'nullable|string',
            'jumlah'            => 'sometimes|required|integer|min:1',
            'satuan'            => 'sometimes|required|string',
            'harga'             => 'sometimes|required|numeric|min:0',
            'referensi_harga'   => 'nullable|string',
            'tanggal_pengajuan' => 'sometimes|required|date',
        ]);

        $order->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data order tools berhasil diperbarui.',
            'data' => $order->fresh()->load('peminta'),
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $order = OrderTool::findOrFail($id);

        $request->validate([
            'status_pembelian'   => 'required|in:belum dibeli,on progres,sudah dibeli,ditolak',
            'tanggal_kedatangan' => 'nullable|date',
        ]);

        $updateData = [
            'status_pembelian' => $request->status_pembelian,
        ];

        if ($request->has('tanggal_kedatangan')) {
            $updateData['tanggal_kedatangan'] = $request->tanggal_kedatangan;
        }

        $order->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Status dan riwayat kedatangan berhasil diperbarui.',
        ]);
    }
}