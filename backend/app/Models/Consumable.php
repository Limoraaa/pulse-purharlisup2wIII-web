<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Consumable extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'kode_barang',
        'nama',
        'merk',
        'er_e',
        'ukuran',
        'stok_awal',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    public function masuk(): HasMany
    {
        return $this->hasMany(ConsumableMasuk::class);
    }

    public function keluar(): HasMany
    {
        return $this->hasMany(ConsumableKeluar::class);
    }

    /**
     * Hitung stok akhir = stok_awal + total masuk - total keluar.
     * Pemakaian: $consumable->stokAkhir()
     */
    public function stokAkhir(): int
    {
        $totalMasuk = $this->masuk()->sum('jumlah_masuk');
        $totalKeluar = $this->keluar()->sum('jumlah_keluar');

        return $this->stok_awal + $totalMasuk - $totalKeluar;
    }
}
