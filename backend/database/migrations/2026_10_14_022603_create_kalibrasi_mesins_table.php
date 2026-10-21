<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Bersihkan tabel jika setengah jadi (mencegah error tabel already exists)
        Schema::dropIfExists('kalibrasi_mesin');

        Schema::create('kalibrasi_mesin', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mesin_produksi_id')->constrained('mesin_produksi')->cascadeOnDelete();
            
            // 2. PERBAIKAN DI SINI: Ubah 'rencana_pemeliharaan' menjadi 'rencana_pemeliharaan_mesin'
            $table->foreignId('rencana_pemeliharaan_id')
                  ->nullable()
                  ->constrained('rencana_pemeliharaan_mesin') 
                  ->nullOnDelete();
            
            $table->date('tanggal_kalibrasi');
            $table->date('tanggal_jatuh_tempo');
            $table->string('nomor_sertifikat');
            $table->string('kalibrator');
            $table->enum('hasil_status', ['Lulus', 'Perlu Penyesuaian', 'Tidak Layak']);
            $table->string('file_sertifikat')->nullable(); 
            $table->text('keterangan')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kalibrasi_mesin');
    }
};