<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('temporary_cart', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Nullable karena satu baris cart hanya dipakai untuk salah satu:
            // tools_id ATAU consumable_id (consumable_id ditambahkan lewat
            // migration terpisah: add_consumable_id_to_temporary_cart_table).
            $table->uuid('tools_id')->nullable();

            $table->integer('qty')->default(1);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('temporary_cart');
    }
};