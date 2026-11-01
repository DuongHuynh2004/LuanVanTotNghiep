<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Invoice;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    private const NEXT_STATUSES = [
        'pending' => ['processing', 'cancelled'],
        'processing' => ['shipped', 'cancelled'],
        'shipped' => ['completed'],
        'completed' => [],
        'cancelled' => [],
    ];

    public function index(Request $request)
    {
        $this->ensureOrderTables();

        $data = $request->validate([
            'q' => 'nullable|string|max:191',
            'status' => ['nullable', Rule::in(Order::STATUSES)],
        ]);

        $orders = Order::query()
            ->with('customer:id,name,email')
            ->with('payment:id,order_id,method,status')
            ->with('promotionRedemption:id,order_id,code,discount_amount,reversed_at')
            ->withCount('items')
            ->when($data['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($data['q'] ?? null, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('order_code', 'like', '%'.$search.'%')
                        ->orWhere('customer_name', 'like', '%'.$search.'%')
                        ->orWhere('customer_email', 'like', '%'.$search.'%')
                        ->orWhere('customer_phone', 'like', '%'.$search.'%');
                });
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Order $order) => [
                ...$order->toArray(),
                'allowed_next_statuses' => self::NEXT_STATUSES[$order->status] ?? [],
            ]);

        return $orders;
    }

    public function show(int $order)
    {
        $this->ensureOrderTables();

        $record = Order::query()->findOrFail($order)->load([
            'customer:id,name,email,phone',
            'items.product:id,name',
            'payment',
            'promotionRedemption',
            'statusHistories.changedBy:id,name',
        ]);

        return $record->setAttribute(
            'allowed_next_statuses',
            self::NEXT_STATUSES[$record->status] ?? [],
        );
    }

    public function update(Request $request, int $order)
    {
        $this->ensureOrderTables();

        $data = $request->validate([
            'status' => ['required', Rule::in(Order::STATUSES)],
            'note' => 'nullable|string|max:2000',
        ]);
        if ($data['status'] === 'completed') {
            abort_unless(
                Schema::hasTable('invoices'),
                503,
                'Chưa có bảng phiếu mua hàng. Hãy nhập schema thương mại mới trước khi hoàn tất đơn.',
            );
        }
        if ($data['status'] === 'cancelled') {
            abort_unless(
                Schema::hasColumn('orders', 'stock_restored_at')
                    && Schema::hasTable('payments')
                    && Schema::hasTable('promotion_redemptions'),
                503,
                'Schema đơn hàng chưa có đủ cột/bảng để hủy và hoàn tồn kho. Hãy cập nhật schema thương mại trước.',
            );
        }

        $updated = DB::transaction(function () use ($data, $order, $request) {
            $lockedOrder = Order::query()->lockForUpdate()->findOrFail($order);
            $previousStatus = $lockedOrder->status;

            if ($data['status'] === $previousStatus) {
                return $lockedOrder;
            }

            if (! in_array($data['status'], self::NEXT_STATUSES[$previousStatus] ?? [], true)) {
                throw ValidationException::withMessages([
                    'status' => 'Không thể chuyển đơn từ trạng thái hiện tại sang trạng thái đã chọn.',
                ]);
            }

            $lockedOrder->status = $data['status'];
            if ($data['status'] === 'cancelled' && ! $lockedOrder->stock_restored_at) {
                foreach ($lockedOrder->items()->get() as $item) {
                    if ($item->product_variant_id) {
                        ProductVariant::query()
                            ->whereKey($item->product_variant_id)
                            ->increment('stock', $item->quantity);
                    } elseif ($item->product_id) {
                        ProductVariant::query()
                            ->where('product_id', $item->product_id)
                            ->where('sku', $item->sku)
                            ->increment('stock', $item->quantity);
                    }
                }
                $lockedOrder->stock_restored_at = now();
                DB::table('promotion_redemptions')
                    ->where('order_id', $lockedOrder->id)
                    ->whereNull('reversed_at')
                    ->update(['reversed_at' => now()]);
                if ($lockedOrder->payment?->status === 'paid') {
                    $lockedOrder->payment->status = 'refund_pending';
                    $lockedOrder->payment->save();
                }
            }
            $lockedOrder->save();
            $lockedOrder->statusHistories()->create([
                'changed_by_user_id' => $request->user()->id,
                'old_status' => $previousStatus,
                'new_status' => $data['status'],
                'note' => $data['note'] ?? null,
                'created_at' => now(),
            ]);
            if ($data['status'] === 'completed') {
                Invoice::query()->firstOrCreate(
                    [
                        'order_id' => $lockedOrder->id,
                        'document_type' => 'final',
                    ],
                    [
                        'invoice_number' => 'LQ-F-'.str_pad((string) $lockedOrder->id, 8, '0', STR_PAD_LEFT),
                        'issued_at' => now(),
                    ],
                );
            }

            return $lockedOrder;
        });

        return $updated->load([
            'customer:id,name,email,phone',
            'items.product:id,name',
            'payment',
            'promotionRedemption',
            'statusHistories.changedBy:id,name',
        ])->setAttribute(
            'allowed_next_statuses',
            self::NEXT_STATUSES[$updated->status] ?? [],
        );
    }

    private function ensureOrderTables(): void
    {
        abort_unless(
            Schema::hasTable('orders')
                && Schema::hasTable('order_items')
                && Schema::hasTable('order_status_histories')
                && Schema::hasTable('payments')
                && Schema::hasTable('invoices')
                && Schema::hasTable('promotion_redemptions'),
            503,
            'Chưa đủ bảng thương mại theo schema lumiq.sql. Hãy kiểm tra database đã nhập đúng bộ bảng đơn hàng/thanh toán chưa.',
        );
    }
}
