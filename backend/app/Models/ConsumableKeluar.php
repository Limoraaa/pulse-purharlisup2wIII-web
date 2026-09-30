<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsumableKeluar extends Model
{
    use HasFactory;

    protected $table = 'consumable_keluar';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'tanggal',
        'consumable_id',
        'peminta_id',
        'jumlah_keluar',
        'pekerjaan_area',
        'nama_pekerjaan',
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
                'tanggal' => 'datetime',
            ];
        }

    public function consumable(): BelongsTo
    {
        return $this->belongsTo(Consumable::class);
    }

    public function peminta(): BelongsTo
    {
        return $this->belongsTo(Peminta::class);
    }

    public function dicatatOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }
}
