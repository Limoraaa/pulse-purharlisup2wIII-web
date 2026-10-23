<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Oli extends Model
{
    protected $table = 'olis';

    protected $fillable = [
        'kode_oli',
        'nama_oli',
        'stok',
        'satuan',
        'batas_minimum',
    ];

    protected $casts = [
        'stok' => 'float',
        'batas_minimum' => 'float',
    ];
}