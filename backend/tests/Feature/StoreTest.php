<?php

namespace Tests\Feature;

use App\Mail\OtpMail;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class StoreTest extends TestCase
{
    use DatabaseTransactions;

    private function account(string $role = 'customer'): User
    {
        $u = User::create(['name' => 'Test LUMIQ', 'email' => uniqid().'@example.test', 'password' => 'Password123']);
        $u->role = $role;
        $u->save();

        return $u->fresh();
    }

    public function test_registration_login_profile_and_logout(): void
    {
        Mail::fake();
        $email = uniqid().'@example.test';
        $this->postJson('/api/register', ['name' => 'Khách hàng', 'email' => $email, 'phone' => '1901234567', 'password' => 'Password123', 'password_confirmation' => 'Password123'])->assertUnprocessable()->assertJsonValidationErrors('phone');
        $this->postJson('/api/register', ['name' => 'Khách hàng', 'email' => $email, 'password' => 'Password123', 'password_confirmation' => 'Password123', 'role' => 'admin'])->assertCreated()->assertJsonMissingPath('password');
        $code = Mail::sent(OtpMail::class)->last()->code;
        $this->postJson('/api/otp/verify', ['email' => $email, 'purpose' => 'register', 'otp' => $code])->assertOk();
        $this->postJson('/api/login', ['email' => $email, 'password' => 'Password123'])->assertOk();
        $this->postJson('/api/logout')->assertOk();
        $this->postJson('/api/login', ['email' => $email, 'password' => 'wrong'])->assertUnprocessable();
        $this->postJson('/api/login', ['email' => $email, 'password' => 'Password123'])->assertOk();
        $this->putJson('/api/me', ['name' => 'Tên mới', 'email' => $email, 'phone' => '0901234567'])->assertOk()->assertJsonPath('name', 'Tên mới');
        foreach (['1901234567', '090123456', '09012345678', '09012345ab', '+84901234567', '090 123456'] as $phone) {
            $this->putJson('/api/me', ['name' => 'Tên mới', 'email' => $email, 'phone' => $phone])->assertUnprocessable()->assertJsonValidationErrors('phone');
        }
        $this->assertDatabaseHas('users', ['email' => $email, 'phone' => '0901234567']);
        $this->putJson('/api/me', ['name' => 'Tên mới', 'email' => $email, 'password' => 'Changed123', 'password_confirmation' => 'Changed123', 'current_password' => 'wrong'])->assertUnprocessable();
        $this->putJson('/api/me', ['name' => 'Tên mới', 'email' => $email, 'password' => 'Changed123', 'password_confirmation' => 'Changed123', 'current_password' => 'Password123'])->assertOk();
    }

    public function test_admin_access_is_enforced(): void
    {
        $this->getJson('/api/admin/dashboard')->assertUnauthorized();
        $user = $this->account();
        $this->actingAs($user)->getJson('/api/admin/dashboard')->assertForbidden();
        $user->status = 'locked';
        $user->save();
        $this->actingAs($user)->getJson('/api/me')->assertUnauthorized();
    }

    public function test_product_crud_validation_visibility_and_cascade(): void
    {
        $this->actingAs($this->account('admin'));
        $sku = 'test-'.uniqid();
        $payload = ['name' => 'Áo kiểm thử', 'description' => 'Cotton', 'price' => 299000, 'has_size' => true, 'has_color' => true, 'status' => 'active', 'images' => [['image_path' => 'https://example.com/product.jpg']], 'variants' => [['size' => 'M', 'color' => 'Mint', 'sku' => $sku, 'stock' => 10, 'is_active' => true]]];
        $id = $this->postJson('/api/admin/products', $payload)->assertCreated()->assertJsonPath('variants.0.stock', 10)->json('id');
        $this->getJson('/api/products/'.$id)->assertOk()->assertJsonPath('images.0.is_primary', 1);
        $payload['price'] = 350000;
        $payload['variants'][0]['stock'] = 5;
        $this->putJson('/api/admin/products/'.$id, $payload)->assertOk()->assertJsonPath('price', '350000.00')->assertJsonPath('variants.0.stock', 5);
        $invalid = $payload;
        $invalid['variants'][] = $invalid['variants'][0];
        $invalid['variants'][1]['sku'] .= '-2';
        $this->putJson('/api/admin/products/'.$id, $invalid)->assertUnprocessable();
        $payload['status'] = 'inactive';
        $this->putJson('/api/admin/products/'.$id, $payload)->assertOk();
        $this->getJson('/api/products/'.$id)->assertNotFound();
        $this->getJson('/api/admin/dashboard')->assertOk()->assertJsonStructure(['products', 'active', 'stock', 'customers']);
        $this->deleteJson('/api/admin/products/'.$id)->assertOk();
        $this->assertDatabaseMissing('products', ['id' => $id]);
        $this->assertDatabaseMissing('product_variants', ['product_id' => $id]);
        $this->assertDatabaseMissing('product_images', ['product_id' => $id]);
    }
}
