<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rencana_pemeliharaan_mesin', function (Blueprint $table) {
            $table->id();

            // Sesuaikan dengan tipe primary key mesin_produksi.
            // Jika mesin_produksi memakai UUID, ganti menjadi:
            // $table->foreignUuid('mesin_id')->constrained('mesin_produksi')->cascadeOnDelete();
            $table->foreignId('mesin_id')->constrained('mesin_produksi')->cascadeOnDelete();

            $table->unsignedSmallInteger('tahun');
            $table->unsignedTinyInteger('bulan');   // 1-12
            $table->unsignedTinyInteger('minggu');  // 1-4
            $table->string('aksi', 1);              // C, L, P, M, K
            $table->string('status', 20)->default('Rencana'); // Rencana | Selesai
            $table->unsignedBigInteger('rab')->default(0);
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->index(['tahun', 'mesin_id']);
            $table->unique(
                ['mesin_id', 'tahun', 'bulan', 'minggu', 'aksi'],
                'rencana_pemeliharaan_unik'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rencana_pemeliharaan_mesin');
    }
};