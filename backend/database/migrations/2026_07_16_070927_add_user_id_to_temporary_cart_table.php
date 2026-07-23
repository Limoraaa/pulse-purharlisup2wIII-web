<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('temporary_cart', function (Blueprint $table) {
            if (!Schema::hasColumn('temporary_cart', 'user_id')) {
                $table->uuid('user_id')->nullable()->after('id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('temporary_cart', function (Blueprint $table) {
            if (Schema::hasColumn('temporary_cart', 'user_id')) {
                $table->dropColumn('user_id');
            }
        });
    }
};