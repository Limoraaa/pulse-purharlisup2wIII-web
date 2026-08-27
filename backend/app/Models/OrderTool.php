<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderTool extends Model
{
    use HasFactory;

    protected $table = 'order_tools';

    protected $fillable = [
        'peminta_id',
        'tool_id',
        'kode_barang',
        'nama_barang',
        'merek',
        'tipe',
        'er_e',
        'ukuran',
        'pekerjaan', // <-- INI TAMBAHANNYA
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

    // Relasi ke tabel Tools
    public function tool()
    {
        return $this->belongsTo(Tool::class, 'tool_id');
    }
}