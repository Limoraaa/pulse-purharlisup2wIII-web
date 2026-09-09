<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Jalankan: php artisan make:migration add_consumable_id_to_temporary_cart
    public function up()
    {
        Schema::table('temporary_cart', function (Blueprint $table) {
            $table->uuid('consumable_id')->nullable()->after('tools_id');
        });
    }

    public function down()
    {
        Schema::table('temporary_cart', function (Blueprint $table) {
            $table->dropColumn('consumable_id');
        });
    }
};