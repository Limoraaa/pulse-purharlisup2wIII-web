<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // 1. Paksa hapus tabel yang nyangkut/error terlebih dahulu
        Schema::dropIfExists('log_pemeliharaan_motor_konversi');

        // 2. Baru buat ulang dari nol dengan bersih
        Schema::create('log_pemeliharaan_motor_konversi', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('motor_konversi_id');
            $table->text('uraian_pemeliharaan');
            $table->date('waktu_pelaksana');
            $table->text('keterangan')->nullable();
            $table->string('paraf');
            
            $table->string('status')->nullable();
            $table->integer('jumlah_part_diperiksa')->nullable();
            $table->integer('jumlah_part_total')->nullable();

            $table->timestamps();

            $table->foreign('motor_konversi_id')
                  ->references('id')->on('motor_konversi')
                  ->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('log_pemeliharaan_motor_konversi');
    }
};