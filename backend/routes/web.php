<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CustomerOrderController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\OtpController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\ShippingController;
use App\Http\Middleware\ActiveUser;
use App\Http\Middleware\AdminOnly;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::pattern('category', '[0-9]+');
Route::pattern('customer', '[0-9]+');

Route::prefix('api')->group(function () {
    Route::get('csrf', fn () => ['token' => csrf_token()]);
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:5,1,register');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1,login');
    Route::post('otp/send', [OtpController::class, 'send'])->middleware('throttle:10,1,otp-send');
    Route::post('otp/verify', [OtpController::class, 'verify'])->middleware('throttle:10,1,otp-verify');
    Route::post('password/reset', [OtpController::class, 'resetPassword'])->middleware('throttle:5,1,password-reset');
    Route::get('products', [ProductController::class, 'index']);
    Route::get('categories', [CategoryController::class, 'options']);
    Route::get('products/{product}', [ProductController::class, 'show']);
    Route::get('promotions', [PromotionController::class, 'index']);
    Route::middleware(ActiveUser::class)->group(function () {
        Route::get('me', fn (Request $r) => $r->user());
        Route::put('me', [AuthController::class, 'update']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('my/orders', [CustomerOrderController::class, 'index']);
        Route::get('my/orders/{order}', [CustomerOrderController::class, 'show'])->whereNumber('order');
        Route::get('my/invoices/{invoice}', [CustomerOrderController::class, 'invoice'])->whereNumber('invoice');
        Route::post('shipping/quote', [ShippingController::class, 'quote'])->middleware('throttle:10,1,shipping-quote');
        Route::post('promotions/validate', [PromotionController::class, 'validateCode'])->middleware('throttle:10,1,promotion-validate');
        Route::post('checkout', [CheckoutController::class, 'store'])->middleware('throttle:5,1,checkout');
        Route::prefix('admin')->middleware(AdminOnly::class)->group(function () {
            Route::get('dashboard', [ProductController::class, 'dashboard']);
            Route::get('orders', [OrderController::class, 'index']);
            Route::get('orders/{order}', [OrderController::class, 'show'])->whereNumber('order');
            Route::patch('orders/{order}', [OrderController::class, 'update'])->whereNumber('order');
            Route::get('payments', [PaymentController::class, 'index']);
            Route::patch('payments/{payment}', [PaymentController::class, 'update'])->whereNumber('payment');
            Route::get('invoices', [InvoiceController::class, 'index']);
            Route::get('invoices/{invoice}', [InvoiceController::class, 'show'])->whereNumber('invoice');
            Route::get('promotions', [PromotionController::class, 'adminIndex']);
            Route::post('promotions', [PromotionController::class, 'save']);
            Route::put('promotions/{promotion}', [PromotionController::class, 'save'])->whereNumber('promotion');
            Route::patch('promotions/{promotion}/status', [PromotionController::class, 'toggle'])->whereNumber('promotion');
            Route::get('categories/options', [CategoryController::class, 'options']);
            Route::get('categories', [CategoryController::class, 'index']);
            Route::post('categories', [CategoryController::class, 'save']);
            Route::put('categories/{category}', [CategoryController::class, 'save']);
            Route::delete('categories/{category}', [CategoryController::class, 'destroy']);
            Route::get('customers', [CustomerController::class, 'index']);
            Route::post('customers', [CustomerController::class, 'save']);
            Route::put('customers/{customer}', [CustomerController::class, 'save']);
            Route::patch('customers/{customer}/status', [CustomerController::class, 'status']);
            Route::delete('customers/{customer}', [CustomerController::class, 'destroy']);
            Route::post('customers/{customer}/restore', [CustomerController::class, 'restore']);
            Route::post('upload', [ProductController::class, 'upload']);
            Route::get('products', [ProductController::class, 'index']);
            Route::get('products/{product}', [ProductController::class, 'show']);
            Route::post('products', [ProductController::class, 'save']);
            Route::put('products/{product}', [ProductController::class, 'save']);
            Route::delete('products/{product}', [ProductController::class, 'destroy']);
        });
    });
});

// Serve the React build on Laravel / a Wamp virtual host, including deep links.
Route::get('/{path?}', function () {
    $index = public_path('app/index.html');
    abort_unless(is_file($index), 503, 'Hãy chạy npm run build trong frontend trước.');

    return response()->file($index);
})->where('path', '^(?!api(?:/|$)|storage(?:/|$)|app(?:/|$)).*');
