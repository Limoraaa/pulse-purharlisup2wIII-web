<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RencanaPemeliharaanMesin extends Model
{
    protected $table = 'rencana_pemeliharaan_mesin';

    protected $fillable = [
        'mesin_id',
        'tahun',
        'bulan',
        'minggu',
        'aksi',
        'status',
        'rab',
        'keterangan',
    ];

    protected $casts = [
        'tahun'  => 'integer',
        'bulan'  => 'integer',
        'minggu' => 'integer',
        'rab'    => 'integer',
    ];

    public function mesin(): BelongsTo
    {
        return $this->belongsTo(MesinProduksi::class, 'mesin_id');
    }
}