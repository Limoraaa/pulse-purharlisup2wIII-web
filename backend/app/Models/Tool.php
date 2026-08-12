<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Tool extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'kode_barang',
        'nama_barang',
        'merk',
        'type',
        'warna',
        'ukuran',
        'stok',
        'keadaan',
        'is_active',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function peminjaman(): HasMany
    {
        return $this->hasMany(Peminjaman::class);
    }

    public function laporanKerusakan(): HasMany
    {
        return $this->hasMany(LaporanKerusakanTools::class, 'tool_id');
    }

    /**
     * Hitung berapa unit alat ini sedang dipinjam (belum kembali).
     * Pemakaian: $tool->sedangDipinjam()
     */
    public function sedangDipinjam(): int
    {
        return $this->peminjaman()->whereNull('tanggal_kembali')->sum('jumlah');
    }

    /**
     * Hitung stok yang benar-benar tersedia sekarang.
     * Pemakaian: $tool->tersedia()
     */
    public function tersedia(): int
    {
        return $this->stok - $this->sedangDipinjam();
    }
     public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
