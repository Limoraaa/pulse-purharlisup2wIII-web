<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_consumables', function (Blueprint $table) {
            $table->id();
            
            // Relasi ke Peminta
            $table->string('peminta_id', 50); 
            $table->foreign('peminta_id')->references('id')->on('peminta')->onDelete('cascade');
            
            // Relasi ke Consumable (Nullable jika usulan barang baru)
            $table->unsignedBigInteger('consumable_id')->nullable();
            
            // --- FIELD YANG DISESUAIKAN DENGAN FORM BARU ---
            $table->string('kode_barang')->nullable();
            $table->string('nama_barang');
            $table->string('merek')->nullable();
            $table->string('tipe')->nullable();        
            $table->string('er_e')->nullable();        
            $table->string('ukuran')->nullable();      
            $table->string('pekerjaan')->nullable(); // <-- TAMBAHAN FIELD PEKERJAAN
            
            // Kita tetap biarkan spesifikasi (opsional) untuk berjaga-jaga jika ada detail tambahan
            $table->text('spesifikasi')->nullable(); 
            
            // --- FIELD TRANSAKSI ---
            $table->integer('jumlah');
            $table->string('satuan');
            $table->integer('harga')->default(0);
            $table->string('referensi_harga')->nullable();
            
            $table->dateTime('tanggal_pengajuan'); 
            $table->dateTime('tanggal_kedatangan')->nullable(); 
            
            // <-- TAMBAHAN STATUS 'on progres' DI ENUM
            $table->enum('status_pembelian', ['belum dibeli', 'on progres', 'sudah dibeli', 'ditolak'])->default('belum dibeli');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_consumables');
    }
};