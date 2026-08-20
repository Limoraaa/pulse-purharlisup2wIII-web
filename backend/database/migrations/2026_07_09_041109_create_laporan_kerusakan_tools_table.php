<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('laporan_kerusakan_tools', function (Blueprint $table) {
            $table->uuid('id')->default(DB::raw('gen_random_uuid()'))->primary();
            $table->timestamp('tanggal');
            $table->foreignUuid('tool_id')->constrained('tools');
            $table->foreignUuid('peminjaman_id')->nullable()->constrained('peminjaman'); // ← baru
            $table->integer('jumlah');
            $table->text('keterangan')->nullable();
            $table->string('status')->default('rusak'); // rusak / diperbaiki
            $table->timestamp('tanggal_diperbaiki')->nullable();
            $table->text('catatan_perbaikan')->nullable();
            $table->integer('perbaikan_ke')->nullable();
            $table->foreignUuid('dilaporkan_oleh')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('laporan_kerusakan_tools');
    }
};
