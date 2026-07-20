<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LaporanKerusakanTools extends Model
{
    use HasFactory;

    protected $table = 'laporan_kerusakan_tools';

    public $incrementing = false;
    protected $keyType = 'string';

        protected $fillable = [
        'tanggal',
        'tool_id',
        'peminjaman_id',
        'jumlah',
        'keterangan',
        'dilaporkan_oleh',
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

    public function tool(): BelongsTo
    {
        return $this->belongsTo(Tool::class);
    }

    public function dilaporkanOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dilaporkan_oleh');
    }

    public function peminjaman(): BelongsTo
    {
        return $this->belongsTo(Peminjaman::class);
    }
}
