<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('peminjaman', function (Blueprint $table) {
            $table->uuid('id')->default(DB::raw('gen_random_uuid()'))->primary();
            $table->timestamp('tanggal');
            $table->foreignUuid('tool_id')->constrained('tools');
            $table->string('peminta_id');
            $table->integer('jumlah');
            $table->string('area_pekerjaan')->nullable();
            $table->string('nama_pekerjaan')->nullable();
            $table->string('spesifikasi')->nullable();
            $table->text('keterangan')->nullable();
            $table->timestamp('tanggal_kembali')->nullable();
            $table->foreignUuid('dicatat_oleh')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('peminjaman');
    }
};
