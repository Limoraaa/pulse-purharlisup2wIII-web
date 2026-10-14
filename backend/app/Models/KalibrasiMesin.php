<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KalibrasiMesin extends Model
{
    use HasFactory;

    protected $table = 'kalibrasi_mesin';

    protected $fillable = [
        'mesin_produksi_id',
        'rencana_pemeliharaan_id',
        'tanggal_kalibrasi',
        'tanggal_jatuh_tempo',
        'nomor_sertifikat',
        'kalibrator',
        'hasil_status',
        'file_sertifikat',
        'keterangan',
    ];

    public function mesin()
    {
        return $this->belongsTo(MesinProduksi::class, 'mesin_produksi_id');
    }

    public function rencana()
    {
        // Menggunakan RencanaPemeliharaanMesin agar tidak terjadi Class Not Found
        return $this->belongsTo(RencanaPemeliharaanMesin::class, 'rencana_pemeliharaan_id');
    }
}