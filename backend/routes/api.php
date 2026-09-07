<?php

use App\Http\Controllers\Api\V1\AddressController;
use App\Http\Controllers\Api\V1\Admin\CouponController as AdminCouponController;
use App\Http\Controllers\Api\V1\Admin\CustomerController as AdminCustomerController;
use App\Http\Controllers\Api\V1\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\InventoryController as AdminInventoryController;
use App\Http\Controllers\Api\V1\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\V1\Admin\PromotionController as AdminPromotionController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BrandController;
use App\Http\Controllers\Api\V1\CartController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\PaymentWebhookController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\RfqController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\ShippingController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\WishlistController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (v1)
|--------------------------------------------------------------------------
|
| Prefix: /api/v1/...
| Base URL: http://localhost:8000/api/v1
|
*/

Route::prefix('v1')->group(function () {

    // Health & System Info
    Route::get('/health', [HealthController::class, 'check']);

    // Authentication Endpoints
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
        
        // Password Reset Endpoints
        Route::post('/password/forgot', [AuthController::class, 'forgotPassword'])->middleware('throttle:6,1');
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:6,1');
        Route::post('/password/reset', [AuthController::class, 'resetPassword'])->middleware('throttle:6,1');
        Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:6,1');

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
        });
    });

    // User Profile
    Route::middleware('auth:sanctum')->prefix('users')->group(function () {
        Route::get('/me', [UserController::class, 'me']);
        Route::put('/me', [UserController::class, 'update']);
    });

    // Addresses
    Route::middleware('auth:sanctum')->prefix('addresses')->group(function () {
        Route::get('/', [AddressController::class, 'index']);
        Route::post('/', [AddressController::class, 'store']);
        Route::put('/{id}', [AddressController::class, 'update']);
        Route::delete('/{id}', [AddressController::class, 'destroy']);
    });

    // Search Suggestions
    Route::get('/search/suggestions', [SearchController::class, 'suggestions']);

    // Products (Public + Admin)
    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::get('/slug/{slug}', [ProductController::class, 'show']);
        Route::get('/{slugOrId}/shipping-specs', [ProductController::class, 'shippingSpecs']);
        Route::get('/{slugOrId}', [ProductController::class, 'show']);

        Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
            Route::post('/', [ProductController::class, 'store']);
            Route::put('/{id}', [ProductController::class, 'update']);
            Route::delete('/{id}', [ProductController::class, 'destroy']);
        });
    });

    // Categories
    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'index']);
        Route::get('/{slug}', [CategoryController::class, 'show']);

        Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
            Route::post('/', [CategoryController::class, 'store']);
            Route::put('/{id}', [CategoryController::class, 'update']);
            Route::delete('/{id}', [CategoryController::class, 'destroy']);
        });
    });

    // Brands
    Route::prefix('brands')->group(function () {
        Route::get('/', [BrandController::class, 'index']);
        Route::get('/{slug}', [BrandController::class, 'show']);

        Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
            Route::post('/', [BrandController::class, 'store']);
            Route::put('/{id}', [BrandController::class, 'update']);
            Route::delete('/{id}', [BrandController::class, 'destroy']);
        });
    });

    // Cart (Session / Authenticated)
    Route::prefix('cart')->group(function () {
        Route::get('/', [CartController::class, 'index']);
        Route::post('/', [CartController::class, 'addItem']);
        Route::post('/items', [CartController::class, 'addItem']);
        Route::post('/merge', [CartController::class, 'merge']);
        Route::put('/items', [CartController::class, 'updateItem']);
        Route::put('/{id}', [CartController::class, 'updateItem']);
        Route::delete('/items', [CartController::class, 'removeItem']);
        Route::delete('/{id}', [CartController::class, 'removeItem']);
        Route::delete('/', [CartController::class, 'clear']);
    });

    // Orders (Customer)
    Route::prefix('orders')->group(function () {
        Route::post('/', [OrderController::class, 'store'])->middleware('throttle:60,1');
        Route::get('/{id}/tracking', [OrderController::class, 'tracking']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/', [OrderController::class, 'index']);
            Route::get('/{id}', [OrderController::class, 'show']);
            Route::get('/{id}/documents/{docType}', [OrderController::class, 'document']);
            Route::post('/{id}/cancel', [OrderController::class, 'cancel']);
            Route::post('/{id}/payment-proof', [OrderController::class, 'uploadPaymentProof']);
        });
    });

    // Shipping & Real-time Rate Quotes
    Route::prefix('shipping')->group(function () {
        Route::post('/quote', [ShippingController::class, 'quote'])->middleware('throttle:30,1');
    });

    // Payments
    Route::prefix('payments')->group(function () {
        Route::post('/webhook', [PaymentWebhookController::class, 'handle'])->middleware('throttle:120,1');
    });


    // Wishlist
    Route::middleware('auth:sanctum')->prefix('wishlist')->group(function () {
        Route::get('/', [WishlistController::class, 'index']);
        Route::post('/', [WishlistController::class, 'store']);
        Route::post('/items', [WishlistController::class, 'store']);
        Route::delete('/{productId}', [WishlistController::class, 'destroy']);
        Route::delete('/items/{productId}', [WishlistController::class, 'destroy']);
    });

    // RFQ / Quotes
    Route::prefix('rfq')->group(function () {
        Route::post('/', [RfqController::class, 'store']);
        Route::get('/{id}', [RfqController::class, 'show']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/', [RfqController::class, 'index']);
            Route::patch('/{id}/status', [RfqController::class, 'updateStatus']);
        });
    });

    // ==========================================
    // Dedicated Admin Management Suite
    // Protected by Sanctum Auth and role:admin
    // ==========================================
    Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
        // Dashboard Metrics
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);

        // Inventory & Warehouses
        Route::get('/inventory', [AdminInventoryController::class, 'index']);
        Route::post('/inventory/adjust', [AdminInventoryController::class, 'adjust']);
        Route::get('/warehouses', [AdminInventoryController::class, 'warehouses']);
        Route::post('/warehouses', [AdminInventoryController::class, 'storeWarehouse']);

        // Customer & Account Management
        Route::get('/customers', [AdminCustomerController::class, 'index']);
        Route::get('/customers/{id}', [AdminCustomerController::class, 'show']);
        Route::put('/customers/{id}', [AdminCustomerController::class, 'update']);

        // Order Management & Transitions
        Route::get('/orders', [AdminOrderController::class, 'index']);
        Route::get('/orders/{id}', [AdminOrderController::class, 'show']);
        Route::patch('/orders/{id}/status', [AdminOrderController::class, 'updateStatus']);
        Route::patch('/orders/{id}/fulfillment', [AdminOrderController::class, 'updateFulfillment']);
        Route::patch('/orders/{id}/shipping-quote', [AdminOrderController::class, 'updateShippingQuote']);
        Route::post('/orders/{id}/payment-proof/review', [AdminOrderController::class, 'reviewPaymentProof']);
        Route::post('/orders/{id}/shipment/aramex', [AdminOrderController::class, 'createAramexShipment']);
        Route::post('/orders/{id}/tracking/refresh', [AdminOrderController::class, 'refreshTracking']);

        // Promotions & Homepage Banners
        Route::apiResource('promotions', AdminPromotionController::class);

        // Coupons
        Route::apiResource('coupons', AdminCouponController::class);
    });
});
