<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LogAktivitasMesin extends Model
{
    use HasFactory;

    protected $table = 'log_aktivitas_mesin';

    protected $fillable = [
        'mesin_produksi_id',
        'operator_pelaksana',
        'uraian_pekerjaan',
        'tanggal',
        'waktu_mulai',
        'waktu_selesai',
        'jumlah',
        'pemeriksa'
    ];

    public function mesinProduksi()
    {
        return $this->belongsTo(MesinProduksi::class, 'mesin_produksi_id');
    }
}