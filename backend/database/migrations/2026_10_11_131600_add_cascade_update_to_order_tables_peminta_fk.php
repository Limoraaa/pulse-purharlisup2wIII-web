<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['order_consumables', 'order_tools'] as $tabel) {
            Schema::table($tabel, function (Blueprint $table) {
                $table->dropForeign(['peminta_id']);
                $table->foreign('peminta_id')
                    ->references('id')->on('peminta')
                    ->onUpdate('cascade')
                    ->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        foreach (['order_consumables', 'order_tools'] as $tabel) {
            Schema::table($tabel, function (Blueprint $table) {
                $table->dropForeign(['peminta_id']);
                $table->foreign('peminta_id')
                    ->references('id')->on('peminta')
                    ->onDelete('cascade');
            });
        }
    }
};
