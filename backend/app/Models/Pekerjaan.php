<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pekerjaan extends Model
{
    use HasFactory;

    // Mendefinisikan nama tabel secara eksplisit
    protected $table = 'pekerjaan';

    // Kolom yang diizinkan untuk diisi secara massal
    protected $fillable = [
        'nama_pekerjaan',
        'is_active',
    ];

    // Memastikan is_active selalu dikembalikan sebagai boolean
    protected $casts = [
        'is_active' => 'boolean',
    ];
}