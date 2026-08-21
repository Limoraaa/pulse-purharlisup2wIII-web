<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderConsumable extends Model
{
    use HasFactory;

    protected $table = 'order_consumables';

    protected $fillable = [
        'peminta_id',
        'consumable_id', // Disesuaikan dari tool_id
        'kode_barang',
        'nama_barang',
        'merek',
        'tipe',
        'er_e',
        'ukuran',
        'spesifikasi',
        'jumlah',
        'satuan',
        'harga',
        'referensi_harga',
        'tanggal_pengajuan',
        'tanggal_kedatangan',
        'status_pembelian',
    ];

    // Relasi ke tabel Peminta
    public function peminta()
    {
        return $this->belongsTo(Peminta::class, 'peminta_id');
    }

    // Relasi ke tabel Consumable
    public function consumable()
    {
        return $this->belongsTo(Consumable::class, 'consumable_id');
    }
}