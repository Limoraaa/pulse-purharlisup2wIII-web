<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    return response()->json([
        'message' => 'Koneksi dari Next.js ke Laravel 13 sukses!',
        'status' => 'OK'
    ]);
});
