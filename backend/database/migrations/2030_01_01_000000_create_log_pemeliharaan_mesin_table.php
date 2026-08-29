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
            $table->unsignedBigInteger('mesin_produksi_id');
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