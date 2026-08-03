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
        'type',
        'er_e',
        'ukuran',
        'stok_awal',
        'stok_awal_asli',
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
}
