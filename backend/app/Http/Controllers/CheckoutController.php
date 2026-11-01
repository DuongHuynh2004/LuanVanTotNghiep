<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\PromotionRedemption;
use App\Services\RouteDistanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    public function store(Request $request, RouteDistanceService $routes, PromotionController $promotions)
    {
        $this->ensureCommerceTables();
        $data = $request->validate([
            'items' => 'required|array|min:1|max:50',
            'items.*.variant_id' => 'required|integer|distinct|min:1',
            'items.*.quantity' => 'required|integer|min:1|max:50',
            'customer_phone' => ['required', 'string', 'regex:/\A0[0-9]{9}\z/'],
            'shipping_address' => 'required|string|min:10|max:1000',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'customer_note' => 'nullable|string|max:2000',
            'promotion_code' => 'nullable|string|max:40',
        ]);
        $shipping = $routes->quote((float) $data['latitude'], (float) $data['longitude']);
        $user = $request->user();
        $promotionCode = strtoupper(trim($data['promotion_code'] ?? ''));

        $order = DB::transaction(function () use ($data, $shipping, $user, $promotionCode, $promotions) {
            $requested = collect($data['items'])->keyBy('variant_id');
            $variants = ProductVariant::query()
                ->whereIn('id', $requested->keys())
                ->orderBy('id')
                ->lockForUpdate()
                ->with('product')
                ->get()
                ->keyBy('id');

            if ($variants->count() !== $requested->count()) {
                throw ValidationException::withMessages([
                    'items' => 'Một hoặc nhiều sản phẩm không còn tồn tại.',
                ]);
            }

            $subtotalCents = 0;
            foreach ($requested as $variantId => $item) {
                $variant = $variants->get($variantId);
                $product = $variant->product;
                if (! $variant->is_active || ! $product || $product->status !== 'active') {
                    throw ValidationException::withMessages([
                        'items' => 'Một hoặc nhiều sản phẩm hiện không còn được bán.',
                    ]);
                }
                if ($variant->stock < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => 'Sản phẩm '.$product->name.' không đủ tồn kho.',
                    ]);
                }
                $subtotalCents += (int) round((float) $product->price * 100) * (int) $item['quantity'];
                if ($subtotalCents > 999999999999) {
                    throw ValidationException::withMessages([
                        'items' => 'Tổng giá trị hàng vượt giới hạn lưu trữ của bảng đơn hàng.',
                    ]);
                }
            }

            $subtotal = $subtotalCents / 100;
            $promotion = $promotionCode
                ? $promotions->findUsablePromotion($promotionCode, $subtotal, $user->id, true)
                : null;
            $discount = $promotion
                ? $promotions->discount($promotion, $subtotal)
                : 0;
            $total = $subtotal + $shipping['shipping_fee'] - $discount;
            if ($total > 9999999999.99) {
                throw ValidationException::withMessages([
                    'items' => 'Tổng thanh toán vượt giới hạn lưu trữ của bảng đơn hàng.',
                ]);
            }

            $order = Order::query()->create([
                'order_code' => 'LQ-'.now()->format('ymd').'-'.strtoupper(bin2hex(random_bytes(4))),
                'user_id' => $user->id,
                'customer_name' => $user->name,
                'customer_email' => $user->email,
                'customer_phone' => $data['customer_phone'],
                'shipping_address' => $data['shipping_address'].' | Vị trí giao: '.$shipping['latitude'].', '.$shipping['longitude'],
                'subtotal' => $subtotal,
                'shipping_fee' => $shipping['shipping_fee'],
                'shipping_distance_meters' => $shipping['distance_meters'],
                'discount_amount' => $discount,
                'total' => $total,
                'status' => 'pending',
                'customer_note' => $data['customer_note'] ?? null,
            ]);
            $order->payment()->create([
                'method' => 'cod',
                'status' => 'unpaid',
            ]);

            foreach ($requested as $variantId => $item) {
                $variant = $variants->get($variantId);
                $product = $variant->product;
                $quantity = (int) $item['quantity'];
                $unitCents = (int) round((float) $product->price * 100);
                $order->items()->create([
                    'product_id' => $product->id,
                    'product_variant_id' => $variant->id,
                    'product_name' => $product->name,
                    'sku' => $variant->sku,
                    'size' => $variant->size,
                    'color' => $variant->color,
                    'unit_price' => $unitCents / 100,
                    'quantity' => $quantity,
                    'line_total' => ($unitCents * $quantity) / 100,
                ]);
                $variant->decrement('stock', $quantity);
            }

            $order->statusHistories()->create([
                'changed_by_user_id' => $user->id,
                'old_status' => null,
                'new_status' => 'pending',
                'note' => 'Khách hàng vừa đặt đơn COD.',
                'created_at' => now(),
            ]);
            Invoice::query()->create([
                'order_id' => $order->id,
                'invoice_number' => 'LQ-R-'.str_pad((string) $order->id, 8, '0', STR_PAD_LEFT),
                'document_type' => 'receipt',
                'issued_at' => now(),
            ]);

            if ($promotion) {
                PromotionRedemption::query()->create([
                    'promotion_id' => $promotion->id,
                    'order_id' => $order->id,
                    'user_id' => $user->id,
                    'code' => $promotion->code,
                    'discount_amount' => $discount,
                    'created_at' => now(),
                ]);
            }

            return $order;
        }, 3);

        return response()->json(
            $order->load(['items', 'invoices']),
            201,
        );
    }

    private function ensureCommerceTables(): void
    {
        $tables = [
            'orders',
            'order_items',
            'order_status_histories',
            'promotions',
            'promotion_redemptions',
            'invoices',
            'payments',
        ];
        abort_unless(
            collect($tables)->every(fn ($table) => Schema::hasTable($table)),
            503,
            'Chưa có đủ bảng đặt hàng. Hãy nhập backend/database/create_orders.sql bằng phpMyAdmin trước.',
        );
        $columns = [
            'orders' => [
                'shipping_distance_meters',
                'stock_restored_at',
            ],
            'order_items' => [
                'product_variant_id',
                'product_name',
                'sku',
                'unit_price',
                'line_total',
            ],
        ];
        foreach ($columns as $table => $required) {
            abort_unless(
                collect($required)->every(fn ($column) => Schema::hasColumn($table, $column)),
                503,
                'Bảng đơn hàng hiện có thuộc schema cũ. Hãy cập nhật schema thương mại; CREATE TABLE IF NOT EXISTS không tự thêm cột.',
            );
        }
    }
}
