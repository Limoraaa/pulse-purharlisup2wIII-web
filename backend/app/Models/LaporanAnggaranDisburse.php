<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LaporanAnggaranDisburse extends Model
{
    protected $table = 'laporan_anggaran_disburse';

    protected $fillable = ['tahun', 'bulan', 'uraian', 'nominal'];

    protected $casts = [
        'tahun'   => 'integer',
        'bulan'   => 'integer',
        'nominal' => 'float',
    ];
}