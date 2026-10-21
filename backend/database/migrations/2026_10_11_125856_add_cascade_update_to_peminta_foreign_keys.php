<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('peminjaman', function (Blueprint $table) {
            $table->foreign('peminta_id')
                ->references('id')->on('peminta')
                ->onUpdate('cascade');
        });

        Schema::table('consumable_keluar', function (Blueprint $table) {
            $table->foreign('peminta_id')
                ->references('id')->on('peminta')
                ->onUpdate('cascade');
        });

        Schema::table('consumable_masuk', function (Blueprint $table) {
            $table->foreign('dicatat_oleh')
                ->references('id')->on('peminta')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('peminjaman', function (Blueprint $table) {
            $table->dropForeign(['peminta_id']);
        });

        Schema::table('consumable_keluar', function (Blueprint $table) {
            $table->dropForeign(['peminta_id']);
        });

        Schema::table('consumable_masuk', function (Blueprint $table) {
            $table->dropForeign(['dicatat_oleh']);
        });
    }
};
