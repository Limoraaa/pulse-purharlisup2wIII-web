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
        'consumable_id', 
        'kode_barang',        // <-- BARU
        'nama_barang', 
        'spesifikasi', 
        'merek', 
        'tipe',               // <-- BARU
        'er_e',               // <-- BARU
        'ukuran',             // <-- BARU
        'jumlah', 
        'satuan', 
        'harga',              
        'referensi_harga',    
        'tanggal_pengajuan', 
        'tanggal_kedatangan', 
        'status_pembelian'
    ];

    // Relasi ke tabel Peminta
    public function peminta()
    {
        return $this->belongsTo(Peminta::class, 'peminta_id');
    }

    public function consumable()
    {
        return $this->belongsTo(Consumable::class);
    }
}