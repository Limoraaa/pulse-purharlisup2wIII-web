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
            $table->enum('status', ['Aktif', 'Maintenance', 'Rusak', 'Tidak Aktif'])->default('Aktif');
            
            // Kolom tambahan untuk foto dan fitur mapping
            $table->string('foto_katalog')->nullable()->comment('Foto profil mesin untuk tampilan katalog');
            $table->string('gambar_url')->nullable()->comment('Foto blueprint/layout untuk background part mapping (= gambar view pertama)');
            $table->json('part_mapping')->nullable()->comment('Data titik koordinat dan checklist part (tiap part punya viewId)');
            $table->json('views_peta')->nullable()->comment('Daftar view/gambar peta part: [{id, nama, gambarUrl}]');

            // Oli standar mesin (1 mesin = 1 oli), dipilih dari Data Oli
            $table->foreignId('oli_id')->nullable()->constrained('olis')->nullOnDelete();
            $table->index('oli_id');
            
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('mesin_produksi');
    }
};