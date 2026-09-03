<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsumableMasuk extends Model
{
    use HasFactory;

    protected $table = 'consumable_masuk';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'tanggal',
        'consumable_id',
        'jumlah_masuk',
        'satuan', // <-- TAMBAHAN: Agar kolom satuan bisa diisi
        'keterangan',
        'dicatat_oleh',
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

    protected function casts(): array
    {
        return [
            // 'date' buang jamnya (jadi tengah malam terus). 'datetime' simpan jam juga.
            'tanggal' => 'datetime',
        ];
    }

    public function consumable()
    {
        return $this->belongsTo(Consumable::class, 'consumable_id');
    }

    public function dicatatOleh()
    {
        // Pastikan foreign key 'dicatat_oleh' dihubungkan ke primary key 'id' pada model Peminta
        return $this->belongsTo(Peminta::class, 'dicatat_oleh', 'id');
    }
}