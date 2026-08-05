<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('peminta', function (Blueprint $table) {
            $table->string('id')->primary(); // Tipe string agar bebas menerima angka RFID
            $table->string('nama');
            $table->string('divisi')->nullable();
            
            // --- TAMBAHKAN KOLOM ROLE DI SINI ---
            $table->string('role')->default('user'); 
            
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('peminta');
    }
};