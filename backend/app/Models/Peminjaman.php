<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Peminjaman extends Model
{
    use HasFactory;

    protected $table = 'peminjaman'; // ← tambahkan baris ini

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'tanggal',
        'tool_id',
        'peminta_id',
        'jumlah',
        'area_pekerjaan',
        'spesifikasi',
        'keterangan',
        'tanggal_kembali',
        'dicatat_oleh',
    ];
    

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'tanggal_kembali' => 'date',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    public function tool(): BelongsTo
    {
        return $this->belongsTo(Tool::class);
    }

    public function peminta(): BelongsTo
    {
        return $this->belongsTo(Peminta::class);
    }

    public function dicatatOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }

    public function sudahKembali(): bool
    {
        return ! is_null($this->tanggal_kembali);
    }

    public function scopeBelumKembali($query)
    {
        return $query->whereNull('tanggal_kembali');
    }
}
