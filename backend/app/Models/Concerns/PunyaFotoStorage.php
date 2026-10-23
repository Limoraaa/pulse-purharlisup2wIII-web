<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Kolom foto_katalog & gambar_url disimpan sebagai path relatif di disk "public"
 * (mis. "katalog-mesin/abc.jpg"), lalu diubah menjadi URL lengkap saat dibaca
 * memakai alamat server yang sedang berjalan.
 *
 * Data lama yang tersimpan sebagai URL penuh ("http://localhost:8000/storage/...")
 * tetap terbaca benar, sehingga foto tidak rusak saat aplikasi pindah domain/server.
 * URL di luar folder storage (mis. gambar statis frontend) dibiarkan apa adanya.
 */
trait PunyaFotoStorage
{
    protected function fotoKatalog(): Attribute
    {
        return $this->atributFotoStorage();
    }

    protected function gambarUrl(): Attribute
    {
        return $this->atributFotoStorage();
    }

    private function atributFotoStorage(): Attribute
    {
        return Attribute::make(
            get: fn (?string $nilai) => self::keUrlStorage($nilai),
            set: fn (?string $nilai) => self::kePathStorage($nilai),
        );
    }

    // "katalog-mesin/a.jpg" atau "http://host-lama/storage/katalog-mesin/a.jpg" -> URL di server sekarang
    public static function keUrlStorage(?string $nilai): ?string
    {
        if (! $nilai) {
            return $nilai;
        }
        $path = self::kePathStorage($nilai);

        return self::adalahPathStorage($path) ? asset('storage/' . $path) : $path;
    }

    // URL penuh menuju folder storage -> path relatif; nilai lain tidak diubah
    public static function kePathStorage(?string $nilai): ?string
    {
        if (! $nilai) {
            return $nilai;
        }
        if (str_contains($nilai, '/storage/')) {
            return ltrim(substr($nilai, strpos($nilai, '/storage/') + strlen('/storage/')), '/');
        }

        return $nilai;
    }

    /**
     * Ganti gambar peta part/komponen dengan aman.
     * - File di storage hanya boleh dari folder unggahan peta ($folder), agar URL kiriman
     *   tidak bisa menunjuk (lalu menghapus) file lain seperti foto profil.
     * - File lama di folder tersebut dihapus bila gambarnya berganti.
     */
    public function gantiGambarPeta(?string $baru, string $folder): void
    {
        $pathBaru = self::kePathStorage($baru);
        $pathLama = $this->getRawOriginal('gambar_url');

        if ($pathBaru && self::adalahPathStorage($pathBaru) && $pathBaru !== $pathLama
            && ! str_starts_with($pathBaru, rtrim($folder, '/') . '/')) {
            throw ValidationException::withMessages(['gambarUrl' => 'Gambar peta tidak valid. Unggah ulang gambarnya.']);
        }

        if ($pathLama && $pathLama !== $pathBaru && self::adalahPathStorage($pathLama)
            && str_starts_with($pathLama, rtrim($folder, '/') . '/')) {
            Storage::disk('public')->delete($pathLama);
        }

        $this->gambar_url = $pathBaru;
    }

    private static function adalahPathStorage(string $nilai): bool
    {
        // Path relatif disk public: tanpa skema (http/https/data) dan tidak diawali "/"
        return ! preg_match('#^([a-z][a-z0-9+.-]*:|/)#i', $nilai);
    }
}
