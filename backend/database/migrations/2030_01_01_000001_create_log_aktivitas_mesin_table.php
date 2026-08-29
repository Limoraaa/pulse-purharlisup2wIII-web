<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('log_aktivitas_mesin', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('mesin_produksi_id');
            $table->string('operator_pelaksana');
            $table->text('uraian_pekerjaan');
            $table->date('tanggal');
            $table->time('waktu_mulai');
            $table->time('waktu_selesai');
            $table->integer('jumlah');
            $table->string('pemeriksa');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('log_aktivitas_mesin');
    }
};