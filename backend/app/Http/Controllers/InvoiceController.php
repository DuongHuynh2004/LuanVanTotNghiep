<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        abort_unless(Schema::hasTable('invoices'), 503, 'Chưa có bảng phiếu mua hàng.');
        $data = $request->validate([
            'q' => 'nullable|string|max:100',
            'type' => 'nullable|in:receipt,final',
        ]);

        return Invoice::query()
            ->with(['order:id,order_code,user_id,customer_name,customer_email,total,status'])
            ->when($data['type'] ?? null, fn ($query, $type) => $query->where('document_type', $type))
            ->when($data['q'] ?? null, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('invoice_number', 'like', '%'.$search.'%')
                        ->orWhereHas('order', fn ($order) => $order
                            ->where('order_code', 'like', '%'.$search.'%')
                            ->orWhere('customer_name', 'like', '%'.$search.'%'));
                });
            })
            ->orderByDesc('issued_at')
            ->paginate(15)
            ->withQueryString();
    }

    public function show(int $invoice)
    {
        abort_unless(Schema::hasTable('invoices'), 503, 'Chưa có bảng phiếu mua hàng.');

        return Invoice::query()
            ->with(['order.customer:id,name,email,phone', 'order.items'])
            ->findOrFail($invoice);
    }
}
