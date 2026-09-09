<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ToolMasuk extends Model
{
    use HasFactory;

    protected $table = 'tools_masuk';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'tanggal',
        'tool_id',
        'jumlah_masuk',
        'keterangan',
        'dicatat_oleh',
    ];

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

    public function dicatatOleh(): BelongsTo
    {
        return $this->belongsTo(Peminta::class, 'dicatat_oleh');
    }
}
