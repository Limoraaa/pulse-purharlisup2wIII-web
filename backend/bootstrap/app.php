<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Mendaftarkan alias middleware Spatie
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // Pesan bawaan Spatie berbahasa Inggris ("User does not have the right permissions.")
        $exceptions->render(function (\Spatie\Permission\Exceptions\UnauthorizedException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Akses ditolak. Akun Anda tidak memiliki izin untuk melakukan aksi ini.',
                ], 403);
            }
        });

        // Nilai dengan format salah (mis. teks pada kolom UUID/angka/jam): jangan jadi 500 berisi detail SQL.
        // GET dengan ID salah format = data tidak ada (404); input simpan yang salah format = 422.
        $exceptions->render(function (\Illuminate\Database\QueryException $e, Request $request) {
            if ($request->is('api/*') && in_array($e->getCode(), ['22P02', '22003', '22007', '22008'], true)) {
                return $request->isMethod('GET')
                    ? response()->json(['message' => 'Data tidak ditemukan.'], 404)
                    : response()->json(['message' => 'Format data tidak valid. Periksa kembali isian Anda.'], 422);
            }
        });

        // Model tidak ditemukan (route model binding) -> pesan berbahasa Indonesia
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*') && $e->getPrevious() instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                return response()->json(['message' => 'Data tidak ditemukan.'], 404);
            }
        });

        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Sesi login berakhir. Silakan login kembali.'], 401);
            }
        });
    })->create();
