<?php

use App\Http\Controllers\ProductController;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$rows = json_decode(file_get_contents(storage_path('app/product-import.json')), true, 512, JSON_THROW_ON_ERROR);
$backup = storage_path('app/products-before-import-'.date('Ymd-His').'.json');
file_put_contents($backup, json_encode([
    'products' => Product::with(['images', 'variants'])->get(),
    'categories' => Category::all(),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
$existing = [];
foreach (Product::with('images')->get() as $product) {
    foreach ($product->images as $image) {
        if (str_starts_with($image->image_path, '/storage/products/')) {
            $path = storage_path('app/public/products/'.basename($image->image_path));
            if (is_file($path)) {
                $existing[hash_file('sha256', $path)] = $product->id;
            }
        }
    }
}
foreach ($rows as $row) {
    if (! is_file($row['source']) || preg_match('/banner|logo-web/i', basename($row['source']))) {
        throw new RuntimeException('Invalid source image');
    }
    $destination = storage_path('app/public/products/'.basename($row['image_path']));
    if (is_file($destination) && hash_file('sha256', $destination) !== hash_file('sha256', $row['source'])) {
        throw new RuntimeException('Destination conflict');
    }
    if (! isset($existing[hash_file('sha256', $row['source'])]) && ! is_file($destination)) {
        if (! copy($row['source'], $destination)) {
            throw new RuntimeException('Image copy failed');
        }
    }
}
$result = DB::transaction(function () use ($rows, $existing): array {
    $categories = Category::pluck('id', 'slug')->all();
    foreach (['phu-kien' => 'Phụ kiện', 'ao-khoac' => 'Áo khoác'] as $slug => $name) {
        if (! isset($categories[$slug])) {
            $categories[$slug] = Category::create(['name' => $name, 'slug' => $slug, 'status' => 'active', 'sort_order' => count($categories)])->id;
        }
    }
    $result = ['created' => [], 'updated' => [], 'images' => count($rows)];
    foreach ($rows as $row) {
        $variants = [];
        foreach ($row['color'] as $colorIndex => $color) {
            foreach ($row['sizes'] as $size) {
                $variants[] = ['size' => $size, 'color' => $color, 'sku' => 'LVTN-'.($row['index'] + 1).'-'.($colorIndex + 1).'-'.$size, 'stock' => 0, 'is_active' => true];
            }
        }
        $existingId = $existing[hash_file('sha256', $row['source'])] ?? null;
        if ($existingId) {
            $product = Product::findOrFail($existingId);
            $product->update(['name' => $row['name'], 'description' => $row['description'], 'category_id' => $categories[$row['category']]]);
            foreach ($variants as $variant) {
                if (! $product->variants()->where('size', $variant['size'])->where('color', $variant['color'])->exists()) {
                    $product->variants()->create($variant);
                }
            }
            $result['updated'][] = $product->id;
            continue;
        }
        $data = [
            'name' => $row['name'],
            'description' => $row['description'], 'price' => $row['price'],
            'category_id' => $categories[$row['category']], 'has_size' => true, 'has_color' => true,
            'status' => 'active', 'variants' => $variants, 'images' => [['image_path' => $row['image_path']]],
        ];
        $request = Request::create('/api/admin/products', 'POST', $data);
        $product = app(ProductController::class)->save($request);
        $result['created'][] = $product->id;
    }
    return $result;
});
file_put_contents(storage_path('app/product-import-result.json'), json_encode($result, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
echo json_encode($result, JSON_THROW_ON_ERROR).PHP_EOL;
