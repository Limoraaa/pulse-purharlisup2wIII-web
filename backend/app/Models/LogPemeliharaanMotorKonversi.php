<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LogPemeliharaanMotorKonversi extends Model
{
    use HasFactory;

    protected $table = 'log_pemeliharaan_motor_konversi';

    // Kolom-kolom yang diizinkan untuk diisi secara massal
    protected $fillable = [
        'motor_konversi_id',
        'uraian_pemeliharaan',
        'waktu_pelaksana',
        'keterangan',
        'paraf',
        // Tambahkan 3 field di bawah ini untuk mengizinkan data Checklist Visual masuk:
        'status',
        'jumlah_part_diperiksa',
        'jumlah_part_total'
    ];

    public function motorKonversi()
    {
        return $this->belongsTo(MotorKonversi::class, 'motor_konversi_id');
    }
}