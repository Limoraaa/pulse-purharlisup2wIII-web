<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DokumenMesin extends Model
{
    protected $table = 'dokumen_mesin';

    protected $fillable = [
        'jenis',
        'mesin_produksi_id',
        'judul',
        'nomor_dokumen',
        'revisi',
        'file_path',
        'ukuran',
        'diunggah_oleh',
    ];

    // Lokasi file tidak pernah dikirim ke frontend; file hanya bisa diambil lewat endpoint /file
    protected $hidden = ['file_path'];

    public function mesin()
    {
        return $this->belongsTo(MesinProduksi::class, 'mesin_produksi_id');
    }

    public function pengunggah()
    {
        return $this->belongsTo(User::class, 'diunggah_oleh');
    }
}
