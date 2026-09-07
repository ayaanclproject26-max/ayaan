<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class HealthController extends ApiController
{
    public function check(): JsonResponse
    {
        $dbStatus = 'ok';
        try {
            DB::connection()->getPdo();
        } catch (\Throwable $e) {
            $dbStatus = 'error: ' . $e->getMessage();
        }

        $redisStatus = 'ok';
        try {
            Redis::connection()->ping();
        } catch (\Throwable $e) {
            $redisStatus = 'error: ' . $e->getMessage();
        }

        return $this->success([
            'app_name' => config('app.name'),
            'environment' => config('app.env'),
            'api_version' => 'v1',
            'database' => $dbStatus,
            'redis' => $redisStatus,
            'timestamp' => now()->toIso8601String(),
        ], 'API v1 is healthy');
    }
}
