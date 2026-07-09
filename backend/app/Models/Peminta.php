<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Peminta extends Model
{
    use HasFactory;

    protected $table = 'peminta'; // ← tambahkan baris ini

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'nama',
        'kategori',
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

    public function peminjaman(): HasMany
    {
        return $this->hasMany(Peminjaman::class);
    }

    public function consumableKeluar(): HasMany
    {
        return $this->hasMany(ConsumableKeluar::class);
    }
}
