<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['images', 'variants'])->withSum('variants', 'stock');
        if (Category::isInstalled()) {
            $query->with('category');
            if ($request->filled('category_id')) {
                $query->where('category_id', $request->integer('category_id'));
                if (! $request->is('api/admin/*')) {
                    $query->whereHas('category', fn ($q) => $q->where('status', 'active'));
                }
            }
        }
        if (! $request->is('api/admin/*')) {
            $query->where('status', 'active')->with(['variants' => fn ($q) => $q->where('is_active', true)]);
        } elseif ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }
        if ($request->filled('q')) {
            $query->where('name', 'like', '%'.$request->string('q')->toString().'%');
        }

        return $query->orderByDesc('id')->paginate(12);
    }

    public function show(Request $request, Product $product)
    {
        if (! $request->is('api/admin/*')) {
            abort_unless($product->status === 'active', 404);
        }

        return $product->load(['images', 'variants' => fn ($q) => $request->is('api/admin/*') ? $q : $q->where('is_active', true)]);
    }

    public function save(Request $request, ?Product $product = null)
    {
        $product ??= new Product;
        $categoryRules = [];
        if ($request->has('category_id')) {
            abort_unless(Category::isInstalled(), 503, 'Hãy nhập database/add_categories.sql trước khi gán danh mục.');
            $categoryRules['category_id'] = 'nullable|integer|exists:categories,id';
        }
        $data = $request->validate([
            ...$categoryRules,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:20000', 'price' => 'required|numeric|min:0|max:9999999999.99', 'status' => 'required|in:active,inactive', 'has_size' => 'required|boolean', 'has_color' => 'required|boolean',
            'variants' => 'required|array|min:1|max:100', 'variants.*.size' => 'nullable|string|max:20', 'variants.*.color' => 'nullable|string|max:50',
            'variants.*.sku' => ['required', 'string', 'max:100', 'distinct:ignore_case', Rule::unique('product_variants', 'sku')->where(fn ($q) => $q->where('product_id', '!=', $product->id ?? 0))],
            'variants.*.stock' => 'required|integer|min:0|max:4294967295', 'variants.*.is_active' => 'required|boolean',
            'images' => 'present|array|max:12', 'images.*.image_path' => ['required', 'string', 'max:500', 'regex:~^(https?://[^\s]+|/storage/products/[a-zA-Z0-9._-]+)$~'],
        ]);
        $keys = [];
        foreach ($data['variants'] as &$variant) {
            $variant['size'] = $data['has_size'] ? ($variant['size'] ?? null) : null;
            $variant['color'] = $data['has_color'] ? ($variant['color'] ?? null) : null;
            if (($data['has_size'] && ! $variant['size']) || ($data['has_color'] && ! $variant['color'])) {
                throw ValidationException::withMessages(['variants' => 'Vui lòng nhập đủ kích thước và màu đã bật.']);
            }
            $key = mb_strtolower(($variant['size'] ?? '').'|'.($variant['color'] ?? ''));
            if (in_array($key, $keys)) {
                throw ValidationException::withMessages(['variants' => 'Các biến thể không được trùng kích thước và màu.']);
            }
            $keys[] = $key;
        }
        unset($variant);

        return DB::transaction(function () use ($data, $product) {
            $product->fill(collect($data)->except(['variants', 'images'])->all())->save();
            $product->variants()->delete();
            $product->variants()->createMany($data['variants']);
            $product->images()->delete();
            foreach ($data['images'] as $i => $image) {
                $product->images()->create(['image_path' => $image['image_path'], 'is_primary' => $i === 0, 'sort_order' => $i]);
            }

            return $product->load(['variants', 'images']);
        });
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json(['message' => 'Đã xóa sản phẩm.']);
    }

    public function upload(Request $request)
    {
        $request->validate(['image' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120']);
        $path = $request->file('image')->store('products', 'public');

        return ['image_path' => '/storage/'.$path];
    }

    public function dashboard(Request $request)
    {
        $data = $request->validate([
            'period' => 'nullable|in:day,week,month,year',
        ]);
        $period = $data['period'] ?? 'week';
        $ordersAvailable = collect([
            'orders',
            'order_items',
            'order_status_histories',
        ])->every(fn ($table) => Schema::hasTable($table));
        $ordersPending = 0;
        $ordersProcessing = 0;
        $completedValue = 0.0;
        $completedOrders = 0;
        $recentOrders = collect();
        $salesByBucket = collect();
        $now = now();
        $startDate = match ($period) {
            'day' => $now->copy()->startOfDay(),
            'week' => $now->copy()->startOfDay()->subDays(6),
            'month' => $now->copy()->startOfDay()->subDays(29),
            'year' => $now->copy()->startOfMonth()->subMonths(11),
        };

        if ($ordersAvailable) {
            $ordersPending = DB::table('orders')->where('status', 'pending')->count();
            $ordersProcessing = DB::table('orders')->where('status', 'processing')->count();
            $completedOrdersQuery = DB::table('orders')
                ->where('status', 'completed')
                ->whereBetween('created_at', [$startDate, $now]);
            $completedValue = (float) (clone $completedOrdersQuery)->sum('total');
            $completedOrders = $completedOrdersQuery->count();
            $recentOrders = DB::table('orders')
                ->select('id', 'order_code', 'customer_name', 'total', 'status', 'created_at')
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->limit(6)
                ->get();
            $salesQuery = DB::table('orders')
                ->where('status', 'completed')
                ->whereBetween('created_at', [$startDate, $now]);

            $salesByBucket = match ($period) {
                'day' => $salesQuery
                    ->selectRaw('FLOOR(HOUR(created_at) / 4) AS bucket, SUM(total) AS total')
                    ->groupBy('bucket')
                    ->pluck('total', 'bucket'),
                'week' => $salesQuery
                    ->selectRaw('DATE(created_at) AS bucket, SUM(total) AS total')
                    ->groupBy('bucket')
                    ->pluck('total', 'bucket'),
                'month' => $salesQuery
                    ->selectRaw('FLOOR(DATEDIFF(DATE(created_at), DATE(?)) / 6) AS bucket, SUM(total) AS total', [$startDate->toDateString()])
                    ->groupBy('bucket')
                    ->pluck('total', 'bucket'),
                'year' => $salesQuery
                    ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') AS bucket, SUM(total) AS total")
                    ->groupBy('bucket')
                    ->pluck('total', 'bucket'),
            };
        }

        $weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        $salesChart = match ($period) {
            'day' => collect(range(0, 5))->map(fn ($bucket) => [
                'date' => $now->toDateString().'-'.$bucket,
                'label' => str_pad((string) ($bucket * 4), 2, '0', STR_PAD_LEFT).'–'.str_pad((string) (($bucket + 1) * 4), 2, '0', STR_PAD_LEFT).'h',
                'total' => (float) ($salesByBucket[$bucket] ?? 0),
            ]),
            'week' => collect(range(6, 0))->map(function ($daysAgo) use ($salesByBucket, $weekdays, $now) {
                $date = $now->copy()->startOfDay()->subDays($daysAgo);
                $dateKey = $date->toDateString();

                return [
                    'date' => $dateKey,
                    'label' => $weekdays[$date->dayOfWeek],
                    'total' => (float) ($salesByBucket[$dateKey] ?? 0),
                ];
            }),
            'month' => collect(range(0, 4))->map(function ($bucket) use ($salesByBucket, $startDate, $now) {
                $bucketStart = $startDate->copy()->addDays($bucket * 6);
                $bucketEnd = $bucketStart->copy()->addDays(5)->min($now);

                return [
                    'date' => $bucketStart->toDateString(),
                    'label' => $bucketStart->format('d/m').'–'.$bucketEnd->format('d/m'),
                    'total' => (float) ($salesByBucket[$bucket] ?? 0),
                ];
            }),
            'year' => collect(range(11, 0))->map(function ($monthsAgo) use ($salesByBucket, $now) {
                $date = $now->copy()->startOfMonth()->subMonths($monthsAgo);
                $dateKey = $date->format('Y-m');

                return [
                    'date' => $dateKey,
                    'label' => $date->format('m/Y'),
                    'total' => (float) ($salesByBucket[$dateKey] ?? 0),
                ];
            }),
        };

        return [
            'products' => Product::count(),
            'active' => Product::where('status', 'active')->count(),
            'customers' => User::where('role', 'customer')->count(),
            'stock' => (int) DB::table('product_variants')->sum('stock'),
            'low_stock' => DB::table('product_variants')
                ->join('products', 'products.id', '=', 'product_variants.product_id')
                ->where('stock', '<=', 5)
                ->select('products.name', 'product_variants.sku', 'product_variants.stock')
                ->orderBy('stock')
                ->limit(6)
                ->get(),
            'recent' => Product::with('images')->latest()->limit(5)->get(),
            'orders_available' => $ordersAvailable,
            'orders_pending' => $ordersPending,
            'orders_processing' => $ordersProcessing,
            'completed_orders' => $completedOrders,
            'completed_value' => $completedValue,
            'period' => $period,
            'sales_chart' => $salesChart,
            'recent_orders' => $recentOrders,
        ];
    }
}
