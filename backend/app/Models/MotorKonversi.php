<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MotorKonversi extends Model
{
    use HasFactory;

    protected $table = 'motor_konversi';

    protected $fillable = [
        'kode_motor',
        'nomor_polisi',
        'nama_motor',
        'merek',
        'warna',
        'lokasi_penempatan',
        'status',
        'foto_katalog',
        'gambar_url',   // <-- Tambahkan ini
        'part_mapping', // <-- Tambahkan ini
    ];

    public function logPemeliharaan()
    {
        return $this->hasMany(LogPemeliharaanMotorKonversi::class, 'motor_konversi_id');
    }

    // Motor yang sudah punya riwayat hanya boleh dinonaktifkan, bukan dihapus
    public function jumlahRiwayat(): int
    {
        return $this->logPemeliharaan()->count();
    }
}