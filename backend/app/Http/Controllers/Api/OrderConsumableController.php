<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderConsumable;
use Illuminate\Http\Request;

class OrderConsumableController extends Controller
{
    public function index(Request $request)
    {
        // Gunakan with('peminta') untuk mengambil data relasi nama peminjam
        $query = OrderConsumable::with('peminta');

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
        // PERBAIKAN: Sesuaikan validasi dengan struktur database & form terbaru
        $validated = $request->validate([
            'peminta_id'        => 'required|exists:peminta,id',
            'consumable_id'     => 'nullable|integer',
            'kode_barang'       => 'nullable|string',  // Tambahan baru
            'nama_barang'       => 'required|string',
            'merek'             => 'nullable|string',  // Ubah jadi nullable agar aman jika dikosongkan
            'tipe'              => 'nullable|string',  // Tambahan baru
            'er_e'              => 'nullable|string',  // Tambahan baru
            'ukuran'            => 'nullable|string',  // Tambahan baru
            'spesifikasi'       => 'nullable|string',  // Ubah jadi nullable karena sekarang opsional
            'jumlah'            => 'required|integer|min:1',
            'satuan'            => 'required|string',
            'harga'             => 'required|numeric|min:0', 
            'referensi_harga'   => 'nullable|string',        
            'tanggal_pengajuan' => 'required|date',
        ]);

        $order = OrderConsumable::create($validated);

        return response()->json(['success' => true, 'data' => $order]);
    }

    // Update status pembelian (Tanpa otomatisasi update stok)
    public function updateStatus(Request $request, $id)
    {
        $order = OrderConsumable::findOrFail($id);
        
        $request->validate([
            'status_pembelian'   => 'required|in:belum dibeli,sudah dibeli,ditolak',
            'tanggal_kedatangan' => 'nullable|date' // Validasi untuk waktu kedatangan
        ]);

        // Siapkan data yang akan diupdate
        $updateData = [
            'status_pembelian' => $request->status_pembelian
        ];

        // Jika statusnya sudah dibeli dan ada request tanggal_kedatangan, masukkan ke update
        if ($request->has('tanggal_kedatangan')) {
            $updateData['tanggal_kedatangan'] = $request->tanggal_kedatangan;
        }

        $order->update($updateData);

        return response()->json([
            'success' => true, 
            'message' => 'Status dan riwayat kedatangan berhasil diperbarui.'
        ]);
    }
}