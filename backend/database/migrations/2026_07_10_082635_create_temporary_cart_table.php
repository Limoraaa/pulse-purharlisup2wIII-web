<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Pastikan kolom consumable_id ada (nullable, karena satu baris cart
        //    hanya dipakai untuk salah satu: tools_id ATAU consumable_id).
        if (!Schema::hasColumn('temporary_cart', 'consumable_id')) {
            Schema::table('temporary_cart', function (Blueprint $table) {
                $table->uuid('consumable_id')->nullable()->after('tools_id');
            });
        }

        // 2. Pastikan tools_id nullable juga, supaya baris keranjang consumable
        //    (yang tidak mengisi tools_id) tidak kena NOT NULL constraint.
        //    Raw SQL dipakai karena Laravel butuh doctrine/dbal untuk ->nullable()
        //    via change(); ini lebih aman untuk Postgres/Supabase.
        DB::statement('ALTER TABLE temporary_cart ALTER COLUMN tools_id DROP NOT NULL');
    }

    public function down(): void
    {
        // Sengaja tidak di-revert otomatis (mengembalikan NOT NULL bisa gagal
        // kalau sudah ada baris consumable dengan tools_id NULL). Revert manual
        // kalau memang diperlukan.
    }
};