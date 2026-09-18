<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LogPemeliharaanMotorKonversi extends Model
{
    use HasFactory;

    protected $table = 'log_pemeliharaan_motor_konversi';

    protected $fillable = [
        'motor_konversi_id',
        'uraian_pemeliharaan',
        'waktu_pelaksana',
        'keterangan',
        'paraf'
    ];

    public function motorKonversi()
    {
        return $this->belongsTo(MotorKonversi::class, 'motor_konversi_id');
    }
}