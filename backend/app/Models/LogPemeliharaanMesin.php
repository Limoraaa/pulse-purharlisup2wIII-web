<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LogPemeliharaanMesin extends Model
{
    use HasFactory;

    protected $table = 'log_pemeliharaan_mesin';

    protected $fillable = [
        'mesin_produksi_id',
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
    ];

    public function mesinProduksi()
    {
        return $this->belongsTo(MesinProduksi::class, 'mesin_produksi_id');
    }
}