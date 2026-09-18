<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('mesin_produksi', function (Blueprint $table) {
            $table->id();
            $table->string('kode_mesin')->unique();
            $table->string('nama_mesin');
            $table->string('lokasi_ruang');
            $table->enum('status', ['Aktif', 'Maintenance', 'Rusak'])->default('Aktif');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('mesin_produksi');
    }
};