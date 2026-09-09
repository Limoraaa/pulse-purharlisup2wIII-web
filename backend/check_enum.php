<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$result = DB::select("SHOW COLUMNS FROM order_tools WHERE Field = 'status_pembelian'");
echo $result[0]->Type . "\n";
