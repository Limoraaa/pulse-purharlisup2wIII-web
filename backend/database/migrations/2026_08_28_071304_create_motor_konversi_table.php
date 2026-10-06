<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('motor_konversi', function (Blueprint $table) {
            $table->id();
            $table->string('kode_motor')->unique();
            $table->string('nomor_polisi')->unique();
            $table->string('nama_motor');
            $table->string('merek')->nullable();
            $table->string('warna');
            $table->string('lokasi_penempatan');
            
            // Enum status disamakan dengan mesin_produksi
            $table->enum('status', ['Aktif', 'Maintenance', 'Rusak'])->default('Aktif');
            
            // Kolom tambahan untuk foto dan fitur mapping (identik dengan mesin_produksi)
            $table->string('foto_katalog')->nullable()->comment('Foto profil motor untuk tampilan katalog');
            $table->string('gambar_url')->nullable()->comment('Foto blueprint/layout untuk background part mapping');
            $table->json('part_mapping')->nullable()->comment('Data titik koordinat dan checklist part');
            
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('motor_konversi');
    }
};