<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('laporan_anggaran_disburse')) {
            Schema::create('laporan_anggaran_disburse', function (Blueprint $table) {
                $table->id();
                $table->unsignedSmallInteger('tahun');
                $table->unsignedTinyInteger('bulan');
                $table->string('uraian');
                $table->decimal('nominal', 18, 2)->default(0);
                $table->timestamps();

                $table->index(['tahun', 'bulan']);
            });
        }

        if (!Schema::hasTable('laporan_anggaran_pekerjaan')) {
            Schema::create('laporan_anggaran_pekerjaan', function (Blueprint $table) {
                $table->id();
                $table->unsignedSmallInteger('tahun');
                $table->unsignedTinyInteger('bulan');
                $table->string('nama_pekerjaan');
                $table->text('rincian')->nullable();
                $table->decimal('biaya', 18, 2)->default(0);
                $table->decimal('biaya_aktual', 18, 2)->nullable();
                $table->string('status')->default('belum_dikerjakan');
                $table->string('nama_vendor')->nullable();
                $table->string('no_po')->nullable();
                $table->string('keterangan')->nullable();
                $table->enum('jenis_anggaran', ['disburse', 'penugasan'])->default('disburse'); // <-- Kolom ditambahkan di sini
                $table->timestamps();

                $table->index(['tahun', 'bulan']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('laporan_anggaran_pekerjaan');
        Schema::dropIfExists('laporan_anggaran_disburse');
    }
};