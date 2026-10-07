<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('log_pemeliharaan_motor_konversi', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('motor_konversi_id');
            $table->text('uraian_pemeliharaan');
            $table->date('waktu_pelaksana');
            $table->text('keterangan')->nullable();
            $table->string('paraf');
            
            // Kolom tambahan untuk fitur Checklist Visual
            $table->string('status')->nullable();
            $table->integer('jumlah_part_diperiksa')->nullable();
            $table->integer('jumlah_part_total')->nullable();

            $table->timestamps();

            // Relasi foreign key (sangat disarankan agar data log terhapus jika motor dihapus)
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