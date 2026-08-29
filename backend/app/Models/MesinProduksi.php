<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MesinProduksi extends Model
{
    use HasFactory;

    protected $table = 'mesin_produksi';

    protected $fillable = [
        'kode_mesin', 
        'nama_mesin', 
        'lokasi_ruang', 
        'status'
    ];

    // Relasi: 1 Mesin memiliki banyak Log Pemeliharaan
    public function logPemeliharaan()
    {
        return $this->hasMany(LogPemeliharaanMesin::class, 'mesin_produksi_id');
    }
}