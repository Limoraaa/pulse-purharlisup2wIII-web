<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tools_masuk', function (Blueprint $table) {
            $table->dropForeign(['dicatat_oleh']);
            $table->foreign('dicatat_oleh')
                ->references('id')->on('peminta')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('tools_masuk', function (Blueprint $table) {
            $table->dropForeign(['dicatat_oleh']);
            $table->foreign('dicatat_oleh')
                ->references('id')->on('peminta');
        });
    }
};
