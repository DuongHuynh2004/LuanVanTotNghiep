<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    private const TRANSITIONS = [
        'unpaid' => ['pending_verification', 'paid'],
        'pending_verification' => ['unpaid', 'paid'],
        'paid' => ['refund_pending'],
        'refund_pending' => ['refunded'],
        'refunded' => [],
    ];

    public function index(Request $request)
    {
        $this->ensurePaymentsTable();
        $data = $request->validate([
            'q' => 'nullable|string|max:100',
            'status' => 'nullable|in:unpaid,pending_verification,paid,refund_pending,refunded',
            'method' => 'nullable|in:cod,bank_transfer',
        ]);

        return Payment::query()
            ->with('order:id,order_code,customer_name,customer_email,total,status')
            ->when($data['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($data['method'] ?? null, fn ($query, $method) => $query->where('method', $method))
            ->when($data['q'] ?? null, function ($query, $search) {
                $query->whereHas('order', fn ($order) => $order
                    ->where('order_code', 'like', '%'.$search.'%')
                    ->orWhere('customer_name', 'like', '%'.$search.'%')
                    ->orWhere('customer_email', 'like', '%'.$search.'%'));
            })
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();
    }

    public function update(Request $request, int $payment)
    {
        $this->ensurePaymentsTable();
        $data = $request->validate([
            'status' => ['required', \Illuminate\Validation\Rule::in(Payment::STATUSES)],
            'transaction_reference' => 'nullable|string|max:100',
        ]);

        $record = DB::transaction(function () use ($data, $payment, $request) {
            $record = Payment::query()->lockForUpdate()->with('order')->findOrFail($payment);
            $nextStatus = $data['status'];
            if ($nextStatus !== $record->status
                && ! in_array($nextStatus, self::TRANSITIONS[$record->status] ?? [], true)) {
                throw ValidationException::withMessages([
                    'status' => 'Không thể chuyển trạng thái thanh toán theo luồng hiện tại.',
                ]);
            }

            if ($nextStatus === 'paid' && $record->order?->status === 'cancelled') {
                throw ValidationException::withMessages([
                    'status' => 'Không thể xác nhận thanh toán cho đơn đã hủy.',
                ]);
            }
            if (in_array($nextStatus, ['refund_pending', 'refunded'], true)
                && $record->order?->status !== 'cancelled') {
                throw ValidationException::withMessages([
                    'status' => 'Chỉ xử lý hoàn tiền sau khi đơn đã bị hủy.',
                ]);
            }
            if ($nextStatus === 'refunded' && $record->status !== 'refund_pending') {
                throw ValidationException::withMessages([
                    'status' => 'Khoản thanh toán cần ở trạng thái chờ hoàn tiền trước.',
                ]);
            }

            $record->status = $nextStatus;
            if (array_key_exists('transaction_reference', $data)) {
                $record->transaction_reference = $data['transaction_reference'];
            }
            if ($nextStatus === 'paid') {
                $record->confirmed_by_user_id = $request->user()->id;
                $record->paid_at ??= now();
            } elseif ($nextStatus === 'unpaid') {
                $record->confirmed_by_user_id = null;
                $record->paid_at = null;
            }
            $record->save();

            return $record;
        });

        return $record->fresh()->load([
            'order:id,order_code,customer_name,customer_email,total,status',
            'confirmedBy:id,name',
        ]);
    }

    private function ensurePaymentsTable(): void
    {
        abort_unless(
            Schema::hasTable('payments'),
            503,
            'Chưa có bảng thanh toán payments trong cơ sở dữ liệu.',
        );
    }
}
