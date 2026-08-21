<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE order_tools DROP CONSTRAINT IF EXISTS order_tools_status_pembelian_check");
        DB::statement("ALTER TABLE order_tools ADD CONSTRAINT order_tools_status_pembelian_check CHECK (status_pembelian::text = ANY (ARRAY['belum dibeli','on progres','sudah dibeli','ditolak']::text[]))");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE order_tools DROP CONSTRAINT IF EXISTS order_tools_status_pembelian_check");
        DB::statement("ALTER TABLE order_tools ADD CONSTRAINT order_tools_status_pembelian_check CHECK (status_pembelian::text = ANY (ARRAY['belum dibeli','sudah dibeli','ditolak']::text[]))");
    }
};
