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
            
            // Kolom tambahan untuk foto dan fitur mapping
            $table->string('foto_katalog')->nullable()->comment('Foto profil mesin untuk tampilan katalog');
            $table->string('gambar_url')->nullable()->comment('Foto blueprint/layout untuk background part mapping');
            $table->json('part_mapping')->nullable()->comment('Data titik koordinat dan checklist part');
            
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('mesin_produksi');
    }
};