<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_tools', function (Blueprint $table) {
            $table->id();

            // Relasi ke Peminta (sama seperti order_consumables)
            $table->string('peminta_id', 50);
            $table->foreign('peminta_id')->references('id')->on('peminta')->onDelete('cascade');

            // Relasi ke Tools (nullable jika usulan barang baru di luar katalog)
            $table->uuid('tool_id')->nullable();
            $table->foreign('tool_id')->references('id')->on('tools')->onDelete('set null');

            // --- FIELD BARANG ---
            $table->string('kode_barang')->nullable();
            $table->string('nama_barang');
            $table->string('merek')->nullable();
            $table->string('tipe')->nullable();
            $table->string('er_e')->nullable();
            $table->string('ukuran')->nullable();
            $table->string('pekerjaan')->nullable(); // <-- TAMBAHAN FIELD PEKERJAAN
            $table->text('spesifikasi')->nullable();

            // --- FIELD TRANSAKSI ---
            $table->integer('jumlah');
            $table->string('satuan');

            $table->dateTime('tanggal_pengajuan');
            $table->dateTime('tanggal_kedatangan')->nullable();
            
            // <-- TAMBAHAN STATUS 'on progres'
            $table->enum('status_pembelian', ['belum dibeli', 'on progres', 'sudah dibeli', 'ditolak'])->default('belum dibeli');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_tools');
    }
};