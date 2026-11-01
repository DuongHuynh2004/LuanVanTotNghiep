<?php

namespace App\Http\Controllers;

use App\Models\Promotion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PromotionController extends Controller
{
    public function index()
    {
        $this->ensurePromotionTables();

        return Promotion::query()
            ->where('is_active', true)
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>', now())
            ->orderBy('ends_at')
            ->get([
                'id',
                'code',
                'name',
                'discount_percent',
                'minimum_subtotal',
                'ends_at',
            ]);
    }

    public function validateCode(Request $request)
    {
        $this->ensurePromotionTables();
        $data = $request->validate([
            'code' => 'required|string|max:40',
            'subtotal' => 'required|numeric|min:0|max:9999999999.99',
        ]);
        $promotion = $this->findUsablePromotion(
            strtoupper(trim($data['code'])),
            (float) $data['subtotal'],
            (int) $request->user()->id,
        );

        return [
            'code' => $promotion->code,
            'discount_percent' => (float) $promotion->discount_percent,
            'discount_amount' => $this->discount($promotion, (float) $data['subtotal']),
        ];
    }

    public function adminIndex(Request $request)
    {
        $this->ensurePromotionTables();
        $data = $request->validate([
            'q' => 'nullable|string|max:40',
            'status' => 'nullable|in:active,inactive,expired,scheduled',
        ]);

        return Promotion::query()
            ->withCount([
                'redemptions' => fn ($query) => $query->whereNull('reversed_at'),
            ])
            ->when($data['q'] ?? null, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('code', 'like', '%'.$search.'%')
                        ->orWhere('name', 'like', '%'.$search.'%');
                });
            })
            ->when($data['status'] ?? null, function ($query, $status) {
                $query->when($status === 'active', fn ($query) => $query
                    ->where('is_active', true)
                    ->where('starts_at', '<=', now())
                    ->where('ends_at', '>', now()))
                    ->when($status === 'inactive', fn ($query) => $query->where('is_active', false))
                    ->when($status === 'expired', fn ($query) => $query
                        ->where('is_active', true)
                        ->where('ends_at', '<=', now()))
                    ->when($status === 'scheduled', fn ($query) => $query
                        ->where('is_active', true)
                        ->where('starts_at', '>', now()));
            })
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();
    }

    public function save(Request $request, ?int $promotion = null)
    {
        $this->ensurePromotionTables();
        $record = $promotion ? Promotion::query()->findOrFail($promotion) : new Promotion;
        $data = $request->validate([
            'code' => [
                'required',
                'string',
                'max:40',
                'regex:/\A[A-Za-z0-9_-]+\z/',
                Rule::unique('promotions', 'code')->ignore($record->id),
            ],
            'name' => 'required|string|max:150',
            'discount_percent' => 'required|numeric|gt:0|lte:100',
            'minimum_subtotal' => 'required|numeric|min:0|max:9999999999.99',
            'per_customer_limit' => 'required|integer|min:1|max:1000',
            'starts_at' => 'required|date',
            'ends_at' => 'required|date|after:starts_at',
            'is_active' => 'required|boolean',
        ]);
        $data['code'] = strtoupper($data['code']);
        $record->fill($data)->save();

        return $record->fresh()->loadCount([
            'redemptions' => fn ($query) => $query->whereNull('reversed_at'),
        ]);
    }

    public function toggle(Request $request, int $promotion)
    {
        $this->ensurePromotionTables();
        $data = $request->validate(['is_active' => 'required|boolean']);
        $record = Promotion::query()->findOrFail($promotion);
        $record->is_active = $data['is_active'];
        $record->save();

        return $record->fresh()->loadCount([
            'redemptions' => fn ($query) => $query->whereNull('reversed_at'),
        ]);
    }

    public function findUsablePromotion(string $code, float $subtotal, int $userId, bool $lock = false): Promotion
    {
        $query = Promotion::query()->where('code', $code);
        if ($lock) {
            $query->lockForUpdate();
        }
        $promotion = $query->first();

        if (! $promotion || ! $promotion->is_active
            || now()->lt($promotion->starts_at)
            || now()->gte($promotion->ends_at)) {
            throw ValidationException::withMessages([
                'promotion_code' => 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.',
            ]);
        }
        if ($subtotal < (float) $promotion->minimum_subtotal) {
            throw ValidationException::withMessages([
                'promotion_code' => 'Đơn hàng chưa đạt giá trị tối thiểu của mã khuyến mãi.',
            ]);
        }
        $redemptions = DB::table('promotion_redemptions')
            ->where('promotion_id', $promotion->id)
            ->where('user_id', $userId)
            ->whereNull('reversed_at')
            ->count();
        if ($redemptions >= $promotion->per_customer_limit) {
            throw ValidationException::withMessages([
                'promotion_code' => 'Bạn đã sử dụng hết số lần cho phép của mã này.',
            ]);
        }

        return $promotion;
    }

    public function discount(Promotion $promotion, float $subtotal): float
    {
        return min(
            $subtotal,
            round($subtotal * (float) $promotion->discount_percent / 100, 2),
        );
    }

    private function ensurePromotionTables(): void
    {
        abort_unless(
            Schema::hasTable('promotions') && Schema::hasTable('promotion_redemptions'),
            503,
            'Chưa có bảng khuyến mãi. Hãy nhập backend/database/create_orders.sql bằng phpMyAdmin trước.',
        );
    }
}
