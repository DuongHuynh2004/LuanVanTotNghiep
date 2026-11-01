<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    public const STATUSES = [
        'unpaid',
        'pending_verification',
        'paid',
        'refund_pending',
        'refunded',
    ];

    public const METHODS = ['cod', 'bank_transfer'];

    protected $fillable = [
        'order_id',
        'method',
        'status',
        'transaction_reference',
        'confirmed_by_user_id',
        'paid_at',
    ];

    protected function casts(): array
    {
        return ['paid_at' => 'datetime'];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by_user_id')->withTrashed();
    }
}
