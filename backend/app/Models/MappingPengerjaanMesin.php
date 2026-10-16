<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MappingPengerjaanMesin extends Model
{
    use HasFactory;

    protected $table = 'mapping_pengerjaan_mesin';

    protected $fillable = [
        'mesin_id',
        'nama_pekerjaan',
        'tanggal_mulai',
        'tanggal_selesai',
        'keterangan',
    ];

    public function mesin()
    {
        return $this->belongsTo(MesinProduksi::class, 'mesin_id');
    }
}