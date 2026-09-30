<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

// Alter enum
DB::statement("ALTER TABLE order_tools MODIFY COLUMN status_pembelian ENUM('belum dibeli','on progres','sudah dibeli','ditolak') DEFAULT 'belum dibeli'");

// Verify
$result = DB::select("SHOW COLUMNS FROM order_tools WHERE Field = 'status_pembelian'");
file_put_contents(__DIR__ . '/enum_result.txt', $result[0]->Type . "\n");
