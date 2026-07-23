<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TemporaryCart extends Model
{
    use HasUuids; // Mengaktifkan UUID untuk primary key 'id'

    protected $table = 'temporary_cart';

    // Tambahkan 'consumable_id' ke dalam array fillable
    protected $fillable = [
        'id', 
        'user_id', 
        'tools_id', 
        'consumable_id', // Wajib ditambahkan
        'qty'
    ];

    /**
     * Relasi ke model Tool
     */
    public function tool()
    {
        return $this->belongsTo(Tool::class, 'tools_id');
    }

    /**
     * Relasi ke model Consumable
     */
    public function consumable()
    {
        return $this->belongsTo(Consumable::class, 'consumable_id');
    }

    /**
     * Relasi ke model User
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}