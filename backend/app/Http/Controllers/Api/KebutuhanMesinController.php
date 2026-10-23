<?php

namespace App\Http\Controllers\Api;

use App\Rules\MesinAktif;
use App\Http\Controllers\Controller;
use App\Models\KebutuhanMesin;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Kebutuhan alat & consumable untuk pemeliharaan per mesin.
 * Hanya catatan (nama, jumlah, satuan, keterangan); tidak terhubung ke stok gudang.
 * Lihat: view_pemeliharaan_mesin, tambah/ubah/hapus: manage_pemeliharaan_mesin (diatur di routes).
 */
class KebutuhanMesinController extends Controller
{
    private const PESAN = [
        'mesin_produksi_id.required' => 'Mesin wajib dipilih.',
        'mesin_produksi_id.exists'   => 'Mesin tidak ditemukan.',
        'jenis.required'             => 'Jenis wajib dipilih.',
        'jenis.in'                   => 'Jenis harus Alat atau Consumable.',
        'nama_barang.required'       => 'Nama barang wajib diisi.',
        'jumlah.required'            => 'Jumlah wajib diisi.',
        'jumlah.numeric'             => 'Jumlah harus berupa angka.',
        'jumlah.gt'                  => 'Jumlah harus lebih dari 0.',
        'satuan.required'            => 'Satuan wajib diisi.',
    ];

    // GET /kebutuhan-mesin?mesin_id=1
    public function index(Request $request)
    {
        $validated = $request->validate([
            'mesin_id' => 'required|integer',
        ]);

        $data = KebutuhanMesin::where('mesin_produksi_id', $validated['mesin_id'])
            ->orderBy('jenis')
            ->orderBy('nama_barang')
            ->get();

        return response()->json(['success' => true, 'data' => $data]);
    }

    // POST /kebutuhan-mesin
    public function store(Request $request)
    {
        $validated = $request->validate(
            ['mesin_produksi_id' => ['required', 'integer', new MesinAktif()]] + $this->aturan(),
            self::PESAN
        );

        $kebutuhan = KebutuhanMesin::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Kebutuhan berhasil ditambahkan',
            'data'    => $kebutuhan,
        ], 201);
    }

    // PUT /kebutuhan-mesin/{id}
    public function update(Request $request, string $id)
    {
        $kebutuhan = KebutuhanMesin::find($id);
        if (! $kebutuhan) {
            return response()->json(['message' => 'Data kebutuhan tidak ditemukan'], 404);
        }

        $kebutuhan->update($request->validate($this->aturan(), self::PESAN));

        return response()->json([
            'success' => true,
            'message' => 'Kebutuhan berhasil diperbarui',
            'data'    => $kebutuhan,
        ]);
    }

    // DELETE /kebutuhan-mesin/{id}
    public function destroy(string $id)
    {
        $kebutuhan = KebutuhanMesin::find($id);
        if (! $kebutuhan) {
            return response()->json(['message' => 'Data kebutuhan tidak ditemukan'], 404);
        }

        $kebutuhan->delete();

        return response()->json(['success' => true, 'message' => 'Kebutuhan berhasil dihapus']);
    }

    private function aturan(): array
    {
        return [
            'jenis'       => ['required', Rule::in(['alat', 'consumable'])],
            'nama_barang' => 'required|string|max:255',
            'jumlah'      => 'required|numeric|gt:0|max:99999999',
            'satuan'      => 'required|string|max:30',
            'keterangan'  => 'nullable|string|max:1000',
        ];
    }
}
