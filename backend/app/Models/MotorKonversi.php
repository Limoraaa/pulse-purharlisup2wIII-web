<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MotorKonversi extends Model
{
    use HasFactory;

    protected $table = 'motor_konversi';

    protected $fillable = [
        'nomor_polisi',
        'nama_motor',
        'merek',
        'warna',
        'lokasi_penempatan',
        'status',
    ];

    public function logPemeliharaan()
    {
        return $this->hasMany(LogPemeliharaanMotorKonversi::class, 'motor_konversi_id');
    }

    public function logAktivitas()
    {
        return $this->hasMany(LogAktivitasMotorKonversi::class, 'motor_konversi_id');
    }
}