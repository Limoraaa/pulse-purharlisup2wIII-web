<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogPemeliharaanMesin extends Model
{
    use HasFactory;

    protected $table = 'log_pemeliharaan_mesin';

    protected $fillable = [
        'mesin_produksi_id',
        'rencana_id',
        'aksi',
        'uraian_pemeliharaan',
        'waktu_pelaksana',
        'keterangan',
        'paraf',
        'hasil_checklist',
        'status',
        'jumlah_part_diperiksa',
        'jumlah_part_total',
    ];

    protected $casts = [
        'hasil_checklist' => 'array',
        'waktu_pelaksana' => 'datetime',
    ];

    public function mesinProduksi(): BelongsTo
    {
        return $this->belongsTo(MesinProduksi::class, 'mesin_produksi_id');
    }

    // Plotting rencana yang diselesaikan oleh log ini (opsional).
    public function rencana(): BelongsTo
    {
        return $this->belongsTo(RencanaPemeliharaanMesin::class, 'rencana_id');
    }
}