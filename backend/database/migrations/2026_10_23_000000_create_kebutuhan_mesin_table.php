<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Daftar kebutuhan alat & consumable untuk pemeliharaan tiap mesin.
        // Catatan mandiri: sengaja tidak terhubung ke gudang (Data Tools / Data Consumable).
        Schema::create('kebutuhan_mesin', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mesin_produksi_id')->constrained('mesin_produksi')->cascadeOnDelete();
            $table->enum('jenis', ['alat', 'consumable']);
            $table->string('nama_barang');
            $table->decimal('jumlah', 10, 2);
            $table->string('satuan', 30);
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->index('mesin_produksi_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kebutuhan_mesin');
    }
};
