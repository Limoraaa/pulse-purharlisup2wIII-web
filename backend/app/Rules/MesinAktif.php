<?php

namespace App\Rules;

use App\Models\MesinProduksi;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Mesin harus ada dan belum dinonaktifkan.
 * Dipakai saat MENAMBAH data baru (log, rencana, kalibrasi, plotting, kebutuhan);
 * data lama milik mesin nonaktif tetap bisa dilihat dan dikoreksi.
 */
class MesinAktif implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $mesin = MesinProduksi::find($value);

        if (! $mesin) {
            $fail('Mesin tidak ditemukan.');
        } elseif ($mesin->status === 'Tidak Aktif') {
            $fail("Mesin {$mesin->kode_mesin} sudah tidak aktif, tidak dapat ditambah data baru.");
        }
    }
}
