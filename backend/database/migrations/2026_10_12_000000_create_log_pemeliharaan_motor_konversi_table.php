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
            $table->bigInteger('motor_konversi_id');
            $table->text('uraian_pemeliharaan');
            $table->date('waktu_pelaksana');
            $table->text('keterangan')->nullable();
            $table->string('paraf');
            
            $table->string('status')->nullable();
            $table->integer('jumlah_part_diperiksa')->nullable();
            $table->integer('jumlah_part_total')->nullable();
            $table->json('hasil_checklist')->nullable();

            $table->timestamps();

            $table->foreign('motor_konversi_id')
                  ->references('id')->on('motor_konversi')
                  ->onDelete('cascade');

                  // Index kolom relasi (PostgreSQL tidak otomatis membuat index untuk foreign key)
                  $table->index('motor_konversi_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('log_pemeliharaan_motor_konversi');
    }
};