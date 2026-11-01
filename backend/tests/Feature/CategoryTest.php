<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use DatabaseTransactions;

    public function test_category_lifecycle_and_product_assignment(): void
    {
        if (! Category::isInstalled()) {
            $this->markTestSkipped('Chạy php scripts/test-isolated.php để kiểm tra schema danh mục mà không sửa database lumiq.');
        }
        $admin = User::create(['name' => 'Admin test', 'email' => uniqid().'@example.test', 'password' => 'Password123']);
        $admin->role = 'admin';
        $admin->save(); $admin->refresh();
        $this->getJson('/api/admin/categories')->assertUnauthorized();
        $this->actingAs($admin);
        $data = ['name' => 'Áo thun', 'slug' => 'ao-test-'.uniqid(), 'status' => 'active', 'sort_order' => 1];
        $category = $this->postJson('/api/admin/categories', $data)->assertCreated()->json('id');
        $this->postJson('/api/admin/categories', $data)->assertUnprocessable()->assertJsonValidationErrors('slug');
        $product = Product::create(['name' => 'Áo test', 'price' => 100000, 'status' => 'active']);
        $payload = ['name' => $product->name, 'price' => 100000, 'status' => 'active', 'has_size' => false, 'has_color' => false, 'category_id' => $category, 'images' => [], 'variants' => [['sku' => uniqid(), 'stock' => 10, 'is_active' => true]]];
        $this->putJson('/api/admin/products/'.$product->id, $payload)->assertOk()->assertJsonPath('category_id', $category);
        $this->getJson('/api/products?category_id='.$category)->assertOk()->assertJsonPath('total', 1);
        $this->getJson('/api/admin/categories?q=Áo')->assertOk();
        $payload['category_id'] = 999999999;
        $this->putJson('/api/admin/products/'.$product->id, $payload)->assertUnprocessable();
        $data['status'] = 'inactive';
        $this->putJson('/api/admin/categories/'.$category, $data)->assertOk();
        $this->getJson('/api/categories')->assertOk()->assertJsonMissing(['id' => $category]);
        $this->getJson('/api/products?category_id='.$category)->assertJsonPath('total', 0);
        $this->getJson('/api/products/'.$product->id)->assertOk();
        $this->deleteJson('/api/admin/categories/'.$category)->assertOk();
        $this->assertDatabaseHas('products', ['id' => $product->id, 'category_id' => null]);
        $this->assertDatabaseMissing('categories', ['id' => $category]);
    }
}

