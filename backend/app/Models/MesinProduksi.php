<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\PunyaFotoStorage;

class MesinProduksi extends Model
{
    use HasFactory, PunyaFotoStorage;

    protected $table = 'mesin_produksi';

    protected $fillable = [
        'kode_mesin',
        'nama_mesin',
        'lokasi_ruang',
        'status',
        'gambar_url', 
        'part_mapping',
        'foto_katalog', // <--- Tambahkan ini
        'oli_id',
    ];

    protected $casts = [
        'part_mapping' => 'array',
        'oli_id' => 'integer',
    ];

    // Relasi riwayat yang ikut terhapus (cascade) bila mesin dihapus permanen
    public const RELASI_RIWAYAT = ['logPemeliharaan', 'logAktivitas', 'kalibrasi', 'rencana', 'mappingPengerjaan', 'dokumen'];

    // Oli standar mesin (dari Data Oli)
    public function oli()
    {
        return $this->belongsTo(Oli::class, 'oli_id');
    }

    // Relasi: 1 Mesin memiliki banyak Log Pemeliharaan
    public function logPemeliharaan()
    {
        return $this->hasMany(LogPemeliharaanMesin::class, 'mesin_produksi_id');
    }

    public function logAktivitas()
    {
        return $this->hasMany(LogAktivitasMesin::class, 'mesin_produksi_id');
    }

    public function kalibrasi()
    {
        return $this->hasMany(KalibrasiMesin::class, 'mesin_produksi_id');
    }

    public function rencana()
    {
        return $this->hasMany(RencanaPemeliharaanMesin::class, 'mesin_id');
    }

    public function mappingPengerjaan()
    {
        return $this->hasMany(MappingPengerjaanMesin::class, 'mesin_id');
    }

    public function dokumen()
    {
        return $this->hasMany(DokumenMesin::class, 'mesin_produksi_id');
    }

    public function kebutuhan()
    {
        return $this->hasMany(KebutuhanMesin::class, 'mesin_produksi_id');
    }

    // Total catatan riwayat; mesin yang sudah punya riwayat hanya boleh dinonaktifkan, bukan dihapus
    public function jumlahRiwayat(): int
    {
        return collect(self::RELASI_RIWAYAT)->sum(fn ($relasi) => $this->{$relasi}()->count());
    }
}