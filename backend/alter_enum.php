<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

DB::statement("ALTER TABLE order_tools MODIFY COLUMN status_pembelian ENUM('belum dibeli','on progres','sudah dibeli','ditolak') DEFAULT 'belum dibeli'");
echo "Enum updated.\n";
