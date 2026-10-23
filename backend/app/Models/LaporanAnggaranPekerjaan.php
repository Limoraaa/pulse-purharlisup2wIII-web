<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LaporanAnggaranPekerjaan extends Model
{
    protected $table = 'laporan_anggaran_pekerjaan';

    protected $fillable = [
        'tahun', 
        'bulan', 
        'nama_pekerjaan', 
        'rincian', 
        'biaya', 
        'biaya_aktual',
        'status', 
        'nama_vendor', 
        'no_po', 
        'keterangan',
        'jenis_anggaran', // <-- Tambahkan di sini
    ];

    protected $casts = [
        'tahun'        => 'integer',
        'bulan'        => 'integer',
        'biaya'        => 'float',
        'biaya_aktual' => 'float',
    ];
}