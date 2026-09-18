<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles; // <-- 1. Tambahkan ini

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, HasRoles; // <-- 2. Sisipkan HasRoles di sini

    public $incrementing = false;
    protected $keyType = 'string';

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'full_name',
        'username',
        'email',
        'password',
        'role', // Catatan: Kolom ini nanti bisa diabaikan karena kita pakai tabel relasi Spatie
        'divisi',
        'no_hp',
        'avatar_path',
        'is_active',
        'must_change_password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'must_change_password' => 'boolean',
        ];
    }

    // FUNGSI hasRole() DAN scopeRole() MANUAL TELAH DIHAPUS 
    // AGAR TIDAK BENTROK DENGAN BAWAAN SPATIE

    public function peminjamanDicatat(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Peminjaman::class, 'dicatat_oleh');
    }

    public function consumableMasukDicatat(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ConsumableMasuk::class, 'dicatat_oleh');
    }

    public function consumableKeluarDicatat(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ConsumableKeluar::class, 'dicatat_oleh');
    }

    public function laporanKerusakanDilaporkan(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(LaporanKerusakanTools::class, 'dilaporkan_oleh');
    }
}