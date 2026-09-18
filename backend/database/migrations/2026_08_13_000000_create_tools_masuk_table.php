<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tools_masuk', function (Blueprint $table) {
            $table->uuid('id')->default(DB::raw('gen_random_uuid()'))->primary();
            $table->timestamp('tanggal');
            $table->uuid('tool_id');
            $table->integer('jumlah_masuk');
            $table->text('keterangan')->nullable();
            $table->string('dicatat_oleh');
            $table->timestamps();

            $table->foreign('tool_id')->references('id')->on('tools');
            $table->foreign('dicatat_oleh')->references('id')->on('peminta');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tools_masuk');
    }
};
