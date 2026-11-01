<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Support\Facades\Schema;

class CustomerOrderController extends Controller
{
    public function index()
    {
        $this->ensureOrderTables();

        return Order::query()
            ->where('user_id', request()->user()->id)
            ->withCount('items')
            ->with('invoices:id,order_id,invoice_number,document_type,issued_at')
            ->with('promotionRedemption:id,order_id,code,discount_amount,reversed_at')
            ->orderByDesc('created_at')
            ->paginate(10);
    }

    public function show(int $order)
    {
        $this->ensureOrderTables();

        return Order::query()
            ->where('user_id', request()->user()->id)
            ->with([
                'items:id,order_id,product_name,sku,size,color,unit_price,quantity,line_total',
                'invoices:id,order_id,invoice_number,document_type,issued_at',
                'statusHistories:id,order_id,old_status,new_status,note,created_at',
                'promotionRedemption:id,order_id,code,discount_amount,reversed_at',
            ])
            ->findOrFail($order);
    }

    public function invoice(int $invoice)
    {
        abort_unless(Schema::hasTable('invoices'), 503, 'Chưa có bảng phiếu mua hàng.');

        return \App\Models\Invoice::query()
            ->whereHas('order', fn ($query) => $query->where('user_id', request()->user()->id))
            ->with(['order.items'])
            ->findOrFail($invoice);
    }

    private function ensureOrderTables(): void
    {
        abort_unless(
            Schema::hasTable('orders')
                && Schema::hasTable('order_items')
                && Schema::hasTable('order_status_histories')
                && Schema::hasTable('invoices')
                && Schema::hasTable('promotion_redemptions'),
            503,
            'Chưa đủ bảng đơn hàng theo schema lumiq.sql. Hãy kiểm tra database đã nhập đủ bảng commerce chưa.',
        );
    }
}
