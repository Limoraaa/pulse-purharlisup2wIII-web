<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KebutuhanMesin extends Model
{
    protected $table = 'kebutuhan_mesin';

    protected $fillable = [
        'mesin_produksi_id',
        'jenis',
        'nama_barang',
        'jumlah',
        'satuan',
        'keterangan',
    ];

    protected function casts(): array
    {
        return [
            'jumlah' => 'float',
        ];
    }

    public function mesin()
    {
        return $this->belongsTo(MesinProduksi::class, 'mesin_produksi_id');
    }
}
