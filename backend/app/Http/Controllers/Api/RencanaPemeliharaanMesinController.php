<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RencanaPemeliharaanMesin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RencanaPemeliharaanMesinController extends Controller
{
    // GET /rencana-pemeliharaan?tahun=2026
    public function index(Request $request): JsonResponse
    {
        $tahun = (int) $request->query('tahun', now()->year);

        $rows = RencanaPemeliharaanMesin::with('mesin:id,kode_mesin,nama_mesin')
            ->where('tahun', $tahun)
            ->orderBy('bulan')
            ->orderBy('minggu')
            ->get()
            ->map(fn ($r) => $this->transform($r));

        return response()->json(['data' => $rows]);
    }

    // POST /rencana-pemeliharaan
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules(), $this->messages());
        $this->assertUnik($data);

        $rencana = RencanaPemeliharaanMesin::create($data);

        return response()->json([
            'message' => 'Rencana pemeliharaan berhasil ditambahkan.',
            'data'    => $this->transform($rencana->load('mesin:id,kode_mesin,nama_mesin')),
        ], 201);
    }

    // PUT /rencana-pemeliharaan/{id}
    public function update(Request $request, $id): JsonResponse
    {
        $rencana = RencanaPemeliharaanMesin::findOrFail($id);

        // Mesin tidak boleh diganti saat edit (select dikunci di frontend).
        $request->merge(['mesin_id' => $rencana->mesin_id]);

        $data = $request->validate($this->rules(), $this->messages());
        $this->assertUnik($data, $rencana->id);

        $rencana->update($data);

        return response()->json([
            'message' => 'Rencana pemeliharaan berhasil diperbarui.',
            'data'    => $this->transform($rencana->load('mesin:id,kode_mesin,nama_mesin')),
        ]);
    }

    // DELETE /rencana-pemeliharaan/{id}
    public function destroy($id): JsonResponse
    {
        RencanaPemeliharaanMesin::findOrFail($id)->delete();

        return response()->json(['message' => 'Rencana pemeliharaan berhasil dihapus.']);
    }

    private function rules(): array
    {
        return [
            'mesin_id'   => ['required', 'exists:mesin_produksi,id'],
            'tahun'      => ['required', 'integer', 'between:2000,2100'],
            'bulan'      => ['required', 'integer', 'between:1,12'],
            'minggu'     => ['required', 'integer', 'between:1,4'],
            'aksi'       => ['required', Rule::in(['C', 'L', 'P', 'M', 'K'])],
            'status'     => ['sometimes', Rule::in(['Rencana', 'Selesai'])],
            'rab'        => ['sometimes', 'integer', 'min:0'],
            'keterangan' => ['nullable', 'string', 'max:1000'],

        ];
    }

    // Satu mesin tidak boleh punya tindakan yang sama di minggu yang sama.
    private function assertUnik(array $data, ?int $ignoreId = null): void
    {
        $exists = RencanaPemeliharaanMesin::query()
            ->where('mesin_id', $data['mesin_id'])
            ->where('tahun', $data['tahun'])
            ->where('bulan', $data['bulan'])
            ->where('minggu', $data['minggu'])
            ->where('aksi', $data['aksi'])
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'aksi' => 'Mesin ini sudah punya tindakan yang sama di minggu tersebut.',
            ]);
        }
    }

    private function messages(): array
    {
        return [
            'mesin_id.required' => 'Mesin wajib dipilih.',
            'mesin_id.exists'   => 'Mesin tidak ditemukan.',
            'minggu.between'    => 'Minggu harus antara 1 sampai 4.',
        ];
    }

    private function transform(RencanaPemeliharaanMesin $r): array
    {
        return [
            'id'          => $r->id,
            'mesin_id'    => $r->mesin_id,
            'kode_mesin'  => $r->mesin->kode_mesin ?? null,
            'nama_mesin'  => $r->mesin->nama_mesin ?? null,
            'tahun'       => $r->tahun,
            'bulan'       => $r->bulan,
            'minggu'      => $r->minggu,
            'aksi'        => $r->aksi,
            'status'      => $r->status,
            'rab'         => $r->rab,
            'keterangan'  => $r->keterangan,
        ];
    }
}