<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('log_pemeliharaan_mesin', function (Blueprint $table) {
            $table->id();
            
            // Menggunakan foreignId yang otomatis membuat tipe bigint unsigned 
            // dan langsung menghubungkannya ke tabel mesin_produksi
            $table->foreignId('mesin_produksi_id')
                  ->constrained('mesin_produksi')
                  ->onDelete('cascade');

            $table->text('uraian_pemeliharaan');
            $table->date('waktu_pelaksana');
            $table->text('keterangan')->nullable();
            $table->string('paraf');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('log_pemeliharaan_mesin');
    }
};